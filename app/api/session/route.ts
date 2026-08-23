import { NextRequest, NextResponse } from "next/server";
import { serviceSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { playerId, token } = await req.json();
  const db = serviceSupabase();

  await db
    .from("epoch_players")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("epoch_player_id", playerId)
    .eq("session_token", token);

  const { data } = await db
    .from("epoch_players")
    .select(
      "epoch_player_id, epoch_game_id, full_name, branch, hobby, epoch_team_id, epoch_teams(team_name), epoch_games(epoch_game_id, game_name, quiz_code, game_status, current_round, current_question, current_question_id, question_started_at, question_ends_at)"
    )
    .eq("epoch_player_id", playerId)
    .eq("session_token", token)
    .maybeSingle();

  if (!data) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const game = data.epoch_games as any;
  const team = data.epoch_teams as any;

  return NextResponse.json({
    player: {
      id: data.epoch_player_id,
      game_id: data.epoch_game_id,
      full_name: data.full_name,
      branch: data.branch,
      hobby: data.hobby,
      team_id: data.epoch_team_id,
      teams: team ? { name: team.team_name } : null,
      games: game
        ? {
            id: game.epoch_game_id,
            name: game.game_name,
            game_code: game.quiz_code,
            status: game.game_status,
            current_round: game.current_round,
            current_question: game.current_question,
            current_question_id: game.current_question_id,
            question_started_at: game.question_started_at,
            question_ends_at: game.question_ends_at,
          }
        : null,
    },
  });
}

