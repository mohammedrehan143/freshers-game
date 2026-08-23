import { NextRequest, NextResponse } from "next/server";
import { serviceSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get("playerId");
  const token = req.nextUrl.searchParams.get("token");

  if (!playerId || !token) {
    return NextResponse.json({ error: "Missing session" }, { status: 400 });
  }

  const db = serviceSupabase();
  const { data: player } = await db
    .from("epoch_players")
    .select(
      "epoch_player_id, epoch_game_id, full_name, branch, hobby, epoch_team_id, epoch_teams(team_name)"
    )
    .eq("epoch_player_id", playerId)
    .eq("session_token", token)
    .maybeSingle();

  if (!player) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: game } = await db
    .from("epoch_games")
    .select("*")
    .eq("epoch_game_id", player.epoch_game_id)
    .single();

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Fetch all questions for this game (10 questions)
  const { data: rawQuestions } = await db
    .from("epoch_questions")
    .select("*")
    .eq("epoch_game_id", game.epoch_game_id)
    .order("round_number")
    .order("question_number");

  // Fetch player's submitted answers
  const { data: playerAnswers } = await db
    .from("epoch_answers")
    .select("*")
    .eq("epoch_game_id", game.epoch_game_id)
    .eq("epoch_player_id", player.epoch_player_id);

  const answersMap: Record<string, number> = {};
  (playerAnswers || []).forEach((a: any) => {
    answersMap[a.epoch_question_id] = a.selected_option;
  });

  const now = new Date();
  const isTimeUp =
    game.question_ends_at && now.getTime() >= new Date(game.question_ends_at).getTime();
  const isGameOver =
    game.game_status === "GAME_COMPLETED" ||
    game.game_status === "LEADERBOARD" ||
    game.game_status === "QUESTION_ENDED" ||
    game.game_status === "ROUND_ENDED";

  // Check if all questions were answered or time is up or game is over
  const totalQuestions = (rawQuestions || []).length;
  const answeredCount = Object.keys(answersMap).length;
  const isCompleted =
    (answeredCount >= totalQuestions && totalQuestions > 0) ||
    Boolean(isTimeUp) ||
    isGameOver;

  const formattedQuestions = (rawQuestions || []).map((q: any, idx: number) => ({
    id: q.epoch_question_id,
    question_number: idx + 1,
    round_number: q.round_number,
    question_text: q.question_text,
    options: q.options,
    time_limit_seconds: q.time_limit_seconds,
    points: q.points,
  }));

  let results = null;
  if (isCompleted && rawQuestions && rawQuestions.length > 0) {
    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const breakdown = rawQuestions.map((q: any, idx: number) => {
      const ans = (playerAnswers || []).find(
        (a: any) => a.epoch_question_id === q.epoch_question_id
      );
      const selected = ans !== undefined ? ans.selected_option : null;
      const isCorrect = selected === q.correct_option;
      const points = isCorrect ? (ans ? Number(ans.points_awarded) : q.points) : 0;

      if (selected === null) {
        unansweredCount++;
      } else if (isCorrect) {
        correctCount++;
        totalScore += points;
      } else {
        incorrectCount++;
      }

      return {
        id: q.epoch_question_id,
        question_number: idx + 1,
        question_text: q.question_text,
        options: q.options,
        selected_option: selected,
        correct_option: q.correct_option,
        is_correct: isCorrect,
        points_awarded: points,
      };
    });

    results = {
      totalScore,
      totalPossible: rawQuestions.reduce((acc: number, q: any) => acc + q.points, 0),
      correctCount,
      incorrectCount,
      unansweredCount,
      accuracy: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
      breakdown,
    };
  }

  return NextResponse.json({
    player: {
      id: player.epoch_player_id,
      game_id: player.epoch_game_id,
      full_name: player.full_name,
      branch: player.branch,
      hobby: player.hobby,
      team_id: player.epoch_team_id,
      teams: player.epoch_teams
        ? { name: (player.epoch_teams as any).team_name }
        : null,
    },
    game: {
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
      duration_seconds: 300,
    },
    questions: formattedQuestions,
    answers: answersMap,
    answeredCount,
    totalQuestions,
    isCompleted,
    results,
    serverTime: new Date().toISOString(),
  });
}


