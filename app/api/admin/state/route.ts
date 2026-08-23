import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { serviceSupabase } from "@/lib/supabase/server";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = serviceSupabase();
  const { data: games, error: gameError } = await db
    .from("epoch_games")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (gameError) {
    return NextResponse.json({ error: gameError.message }, { status: 500 });
  }

  const game = games?.[0];
  if (!game) {
    return NextResponse.json({
      game: null,
      players: [],
      teams: [],
      questions: [],
      answered: 0,
    });
  }

  const [{ data: players }, { data: teams }, { data: questions }, countRes] =
    await Promise.all([
      db
        .from("epoch_players")
        .select("*, epoch_teams(team_name)")
        .eq("epoch_game_id", game.epoch_game_id)
        .order("created_at"),
      db
        .from("epoch_teams")
        .select("*")
        .eq("epoch_game_id", game.epoch_game_id)
        .order("team_number"),
      db
        .from("epoch_questions")
        .select(
          "epoch_question_id, epoch_game_id, round_number, question_number, question_text, options, correct_option, time_limit_seconds, points, scoring_config"
        )
        .eq("epoch_game_id", game.epoch_game_id)
        .order("round_number")
        .order("question_number"),
      game.current_question_id
        ? db
            .from("epoch_answers")
            .select("epoch_answer_id", { count: "exact", head: true })
            .eq("epoch_question_id", game.current_question_id)
        : Promise.resolve({ count: 0 }),
    ]);

  const formattedGame = {
    id: game.epoch_game_id,
    name: game.game_name,
    game_code: game.quiz_code,
    status: game.game_status,
    current_round: game.current_round,
    current_question: game.current_question,
    current_question_id: game.current_question_id,
    question_started_at: game.question_started_at,
    question_ends_at: game.question_ends_at,
    leaderboard_visible: game.leaderboard_visible,
    created_at: game.created_at,
    updated_at: game.updated_at,
  };

  const formattedPlayers = (players || []).map((p: any) => ({
    id: p.epoch_player_id,
    game_id: p.epoch_game_id,
    full_name: p.full_name,
    branch: p.branch,
    fun_fact: p.fun_fact,
    favorite_food: p.favorite_food,
    hobby: p.hobby,
    team_id: p.epoch_team_id,
    teams: p.epoch_teams ? { name: p.epoch_teams.team_name } : null,
    session_token: p.session_token,
    last_seen_at: p.last_seen_at,
    created_at: p.created_at,
  }));

  const formattedTeams = (teams || []).map((t: any) => ({
    id: t.epoch_team_id,
    game_id: t.epoch_game_id,
    name: t.team_name,
    sort_order: t.team_number,
  }));

  const formattedQuestions = (questions || []).map((q: any) => ({
    id: q.epoch_question_id,
    game_id: q.epoch_game_id,
    round_number: q.round_number,
    question_number: q.question_number,
    question_text: q.question_text,
    options: q.options,
    correct_option: q.correct_option,
    time_limit_seconds: q.time_limit_seconds,
    points: q.points,
    scoring_config: q.scoring_config,
  }));

  return NextResponse.json({
    game: formattedGame,
    players: formattedPlayers,
    teams: formattedTeams,
    questions: formattedQuestions,
    answered: countRes?.count || 0,
  });
}

