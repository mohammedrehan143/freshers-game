import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { serviceSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";


export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, payload = {} } = await req.json();
  const db = serviceSupabase();

  let { data: game } = await db
    .from("epoch_games")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (action === "create_game") {
    const code = (
      payload.gameCode ||
      `EPOCH${Math.floor(1000 + Math.random() * 9000)}`
    ).toUpperCase();

    const result = await db
      .from("epoch_games")
      .insert({
        game_name: payload.name || "EPOCH FRESHERS CHALLENGE 2026",
        quiz_code: code,
        game_status: "LOBBY",
      })
      .select()
      .single();

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({
      game: {
        id: result.data.epoch_game_id,
        name: result.data.game_name,
        game_code: result.data.quiz_code,
        status: result.data.game_status,
      },
    });
  }

  if (!game) {
    return NextResponse.json({ error: "Create a game first" }, { status: 400 });
  }

  if (action === "randomize_teams") {
    const { data: players } = await db
      .from("epoch_players")
      .select("epoch_player_id")
      .eq("epoch_game_id", game.epoch_game_id);

    if (!players || players.length === 0) {
      return NextResponse.json({ ok: true });
    }

    // Number of teams dynamically calculated: max 4 players per team, split equally
    const numTeams = Math.max(1, Math.ceil(players.length / 4));

    let { data: teams } = await db
      .from("epoch_teams")
      .select("*")
      .eq("epoch_game_id", game.epoch_game_id)
      .order("team_number");

    teams = teams || [];

    if (teams.length < numTeams) {
      const newTeamsToInsert = [];
      for (let i = teams.length + 1; i <= numTeams; i++) {
        newTeamsToInsert.push({
          epoch_game_id: game.epoch_game_id,
          team_name: `TEAM ${i}`,
          team_number: i,
        });
      }
      const { data: createdTeams, error: createError } = await db
        .from("epoch_teams")
        .insert(newTeamsToInsert)
        .select();

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }
      if (createdTeams) {
        teams = [...teams, ...createdTeams];
      }
    }

    // Active teams to distribute across (first numTeams)
    const activeTeams = teams.slice(0, numTeams);
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const updates = shuffled.map((p, idx) => {
      const targetTeam = activeTeams[idx % activeTeams.length];
      return db
        .from("epoch_players")
        .update({ epoch_team_id: targetTeam.epoch_team_id })
        .eq("epoch_player_id", p.epoch_player_id);
    });

    await Promise.all(updates);
    return NextResponse.json({ ok: true });
  }

  if (action === "move_player") {
    if (payload.teamId) {
      const { count } = await db
        .from("epoch_players")
        .select("epoch_player_id", { count: "exact", head: true })
        .eq("epoch_team_id", payload.teamId);

      if ((count || 0) >= 4 && !payload.override) {
        return NextResponse.json(
          { error: "That team already has four members." },
          { status: 409 }
        );
      }
    }

    await db
      .from("epoch_players")
      .update({ epoch_team_id: payload.teamId || null })
      .eq("epoch_player_id", payload.playerId)
      .eq("epoch_game_id", game.epoch_game_id);

    return NextResponse.json({ ok: true });
  }


  if (action === "save_question") {
    const q = {
      epoch_game_id: game.epoch_game_id,
      round_number: +payload.roundNumber,
      question_number: +payload.questionNumber,
      question_text: payload.questionText,
      options: payload.options,
      correct_option: +payload.correctOption,
      time_limit_seconds: +payload.timeLimitSeconds,
      points: +payload.points,
      scoring_config: payload.scoringConfig || null,
    };

    const r = payload.id
      ? await db
          .from("epoch_questions")
          .update(q)
          .eq("epoch_question_id", payload.id)
          .eq("epoch_game_id", game.epoch_game_id)
      : await db.from("epoch_questions").insert(q);

    return r.error
      ? NextResponse.json({ error: r.error.message }, { status: 400 })
      : NextResponse.json({ ok: true });
  }

  if (action === "delete_question") {
    await db
      .from("epoch_questions")
      .delete()
      .eq("epoch_question_id", payload.id)
      .eq("epoch_game_id", game.epoch_game_id);

    return NextResponse.json({ ok: true });
  }

  if (action === "start_question" || action === "next_question") {
    const round = payload.round || game.current_round;
    const number = payload.questionNumber || game.current_question + 1;

    const { data: q } = await db
      .from("epoch_questions")
      .select("*")
      .eq("epoch_game_id", game.epoch_game_id)
      .eq("round_number", round)
      .eq("question_number", number)
      .maybeSingle();

    if (!q) {
      return NextResponse.json(
        { error: `No question found for Round ${round}, Question ${number}.` },
        { status: 404 }
      );
    }

    const now = new Date();
    const ends = new Date(now.getTime() + q.time_limit_seconds * 1000);

    await db
      .from("epoch_games")
      .update({
        game_status: "QUESTION_ACTIVE",
        current_round: round,
        current_question: number,
        current_question_id: q.epoch_question_id,
        question_started_at: now.toISOString(),
        question_ends_at: ends.toISOString(),
      })
      .eq("epoch_game_id", game.epoch_game_id);

    return NextResponse.json({ ok: true });
  }

  if (action === "start_quiz" || action === "start_game") {
    const now = new Date();
    const duration = payload.durationSeconds || 300; // 5 minutes default
    const ends = new Date(now.getTime() + duration * 1000);
    await db
      .from("epoch_games")
      .update({
        game_status: "QUESTION_ACTIVE",
        current_round: 1,
        current_question: 1,
        question_started_at: now.toISOString(),
        question_ends_at: ends.toISOString(),
        leaderboard_visible: false,
      })
      .eq("epoch_game_id", game.epoch_game_id);
    return NextResponse.json({ ok: true });
  }

  if (action === "reset_quiz" || action === "reset_game") {
    // 1. Delete all answers
    await db.from("epoch_answers").delete().eq("epoch_game_id", game.epoch_game_id);
    // 2. Delete all players
    await db.from("epoch_players").delete().eq("epoch_game_id", game.epoch_game_id);
    // 3. Delete all teams
    await db.from("epoch_teams").delete().eq("epoch_game_id", game.epoch_game_id);
    // 4. Reset game state to LOBBY
    await db
      .from("epoch_games")
      .update({
        game_status: "LOBBY",
        current_round: 1,
        current_question: 0,
        current_question_id: null,
        question_started_at: null,
        question_ends_at: null,
        leaderboard_visible: false,
      })
      .eq("epoch_game_id", game.epoch_game_id);

    return NextResponse.json({ ok: true });
  }


  if (action === "extend_time") {
    const currentEnds = game.question_ends_at
      ? new Date(game.question_ends_at).getTime()
      : Date.now();
    const newEnds = new Date(Math.max(Date.now(), currentEnds) + 60 * 1000);
    await db
      .from("epoch_games")
      .update({ question_ends_at: newEnds.toISOString() })
      .eq("epoch_game_id", game.epoch_game_id);
    return NextResponse.json({ ok: true });
  }

  const u: Record<string, unknown> = {};
  if (action === "end_question" || action === "pause") u.game_status = "QUESTION_ENDED";
  if (action === "end_round") u.game_status = "ROUND_ENDED";
  if (action === "show_leaderboard") {
    u.game_status = "LEADERBOARD";
    u.leaderboard_visible = true;
  }
  if (action === "hide_leaderboard") {
    u.game_status = "ROUND_ENDED";
    u.leaderboard_visible = false;
  }
  if (action === "start_next_round") {
    u.game_status = "ROUND_ENDED";
    u.current_round = Math.min(3, game.current_round + 1);
    u.current_question = 0;
    u.current_question_id = null;
  }
  if (action === "end_game") {
    u.game_status = "GAME_COMPLETED";
    u.leaderboard_visible = true;
  }

  if (Object.keys(u).length) {
    await db
      .from("epoch_games")
      .update(u)
      .eq("epoch_game_id", game.epoch_game_id);

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}


