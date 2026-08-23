import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { serviceSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";


const singleAnswerSchema = z.object({
  playerId: z.string().uuid(),
  token: z.string().uuid(),
  questionId: z.string().uuid(),
  selectedOption: z.number().int().min(0).max(3),
  complete: z.boolean().optional(),
});

const batchAnswerSchema = z.object({
  playerId: z.string().uuid(),
  token: z.string().uuid(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      selectedOption: z.number().int().min(0).max(3),
    })
  ),
  complete: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = serviceSupabase();

  let playerId = body.playerId;
  let token = body.token;
  let answerList: { questionId: string; selectedOption: number }[] = [];

  if (body.answers && Array.isArray(body.answers)) {
    const parsed = batchAnswerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid answers format" }, { status: 400 });
    }
    playerId = parsed.data.playerId;
    token = parsed.data.token;
    answerList = parsed.data.answers;
  } else {
    const parsed = singleAnswerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid answer format" }, { status: 400 });
    }
    playerId = parsed.data.playerId;
    token = parsed.data.token;
    answerList = [
      {
        questionId: parsed.data.questionId,
        selectedOption: parsed.data.selectedOption,
      },
    ];
  }

  const { data: player } = await db
    .from("epoch_players")
    .select("epoch_player_id, epoch_game_id, full_name, epoch_team_id")
    .eq("epoch_player_id", playerId)
    .eq("session_token", token)
    .maybeSingle();

  if (!player) {
    return NextResponse.json({ error: "Invalid player session" }, { status: 401 });
  }

  const { data: game } = await db
    .from("epoch_games")
    .select("*")
    .eq("epoch_game_id", player.epoch_game_id)
    .single();

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const { data: questions } = await db
    .from("epoch_questions")
    .select("*")
    .eq("epoch_game_id", game.epoch_game_id)
    .order("round_number")
    .order("question_number");

  const qMap = new Map((questions || []).map((q: any) => [q.epoch_question_id, q]));

  for (const item of answerList) {
    const q = qMap.get(item.questionId);
    if (!q) continue;

    const isCorrect = q.correct_option === item.selectedOption;
    const points = isCorrect ? q.points : 0;

    await db.from("epoch_answers").upsert(
      {
        epoch_game_id: game.epoch_game_id,
        epoch_question_id: q.epoch_question_id,
        epoch_player_id: player.epoch_player_id,
        selected_option: item.selectedOption,
        is_correct: isCorrect,
        points_awarded: points,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "epoch_question_id,epoch_player_id" }
    );
  }

  return NextResponse.json({ ok: true });
}


