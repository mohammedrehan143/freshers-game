import { NextResponse } from "next/server";
import { serviceSupabase } from "@/lib/supabase/server";

export async function GET() {
  const db = serviceSupabase();
  const { data: game } = await db
    .from("epoch_games")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!game) return NextResponse.json({ game: null, teams: [] });

  const { data: teams } = await db
    .from("epoch_teams")
    .select("epoch_team_id, team_name, epoch_players(epoch_player_id, full_name)")
    .eq("epoch_game_id", game.epoch_game_id)
    .order("team_number");

  const { data: answers } = await db
    .from("epoch_answers")
    .select("epoch_player_id, points_awarded, epoch_questions(round_number)")
    .eq("epoch_game_id", game.epoch_game_id);

  const rows = (teams || [])
    .map((t: any) => {
      const members = t.epoch_players || [];
      const scores = [1, 2, 3].map((round) => {
        const sum = members.reduce(
          (x: number, p: any) =>
            x +
            (answers || [])
              .filter(
                (a: any) =>
                  a.epoch_player_id === p.epoch_player_id &&
                  a.epoch_questions?.round_number === round
              )
              .reduce((y: number, a: any) => y + Number(a.points_awarded), 0),
          0
        );
        return members.length ? sum / members.length : 0;
      });
      return {
        team_id: t.epoch_team_id,
        team_name: t.team_name,
        members: members.map((p: any) => p.full_name),
        round1: scores[0],
        round2: scores[1],
        round3: scores[2],
        overall: scores.reduce((a, b) => a + b, 0),
      };
    })
    .sort((a, b) => b.overall - a.overall);

  return NextResponse.json({
    game: {
      id: game.epoch_game_id,
      name: game.game_name,
      game_code: game.quiz_code,
      status: game.game_status,
      leaderboard_visible: game.leaderboard_visible,
      current_round: game.current_round,
      current_question: game.current_question,
    },
    teams: rows,
  });
}

