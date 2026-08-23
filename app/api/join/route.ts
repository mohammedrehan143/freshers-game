import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { serviceSupabase } from "@/lib/supabase/server";

const schema = z.object({
  gameCode: z.string().trim().min(4).max(20),
  fullName: z.string().trim().min(2).max(80),
  branch: z.string().trim().min(2).max(80),
  funFact: z.string().trim().min(2).max(240),
  favoriteFood: z.string().trim().min(2).max(80),
  hobby: z.string().trim().min(2).max(80),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Please complete every field." },
      { status: 400 }
    );
  const d = parsed.data;
  const db = serviceSupabase();
  const { data: game } = await db
    .from("epoch_games")
    .select("epoch_game_id, game_status")
    .eq("quiz_code", d.gameCode.toUpperCase())
    .maybeSingle();

  if (!game)
    return NextResponse.json({ error: "Game code not found." }, { status: 404 });
  if (game.game_status !== "WAITING" && game.game_status !== "LOBBY")
    return NextResponse.json({ error: "Joining has closed." }, { status: 409 });

  // 1. Calculate dynamic team requirement: max 4 players per team, split equally
  const { count: playerCount } = await db
    .from("epoch_players")
    .select("epoch_player_id", { count: "exact", head: true })
    .eq("epoch_game_id", game.epoch_game_id);

  const totalPlayers = (playerCount || 0) + 1;
  const targetTeams = Math.max(1, Math.ceil(totalPlayers / 4));

  // 2. Fetch existing teams
  let { data: teams } = await db
    .from("epoch_teams")
    .select("*")
    .eq("epoch_game_id", game.epoch_game_id)
    .order("team_number");

  teams = teams || [];

  // If more teams are needed, create them
  if (teams.length < targetTeams) {
    const toAdd = [];
    for (let t = teams.length + 1; t <= targetTeams; t++) {
      toAdd.push({
        epoch_game_id: game.epoch_game_id,
        team_name: `TEAM ${t}`,
        team_number: t,
      });
    }
    const { data: created } = await db.from("epoch_teams").insert(toAdd).select();
    if (created) teams = [...teams, ...created];
  }

  // 3. Find the team with the fewest members that has < 4 members
  const { data: existingMembers } = await db
    .from("epoch_players")
    .select("epoch_team_id")
    .eq("epoch_game_id", game.epoch_game_id);

  const teamCounts: Record<string, number> = {};
  teams.forEach((t: any) => {
    teamCounts[t.epoch_team_id] = 0;
  });
  (existingMembers || []).forEach((m: any) => {
    if (m.epoch_team_id && teamCounts[m.epoch_team_id] !== undefined) {
      teamCounts[m.epoch_team_id]++;
    }
  });

  const sortedTeams = [...teams].sort(
    (a: any, b: any) => (teamCounts[a.epoch_team_id] || 0) - (teamCounts[b.epoch_team_id] || 0)
  );
  const targetTeam = sortedTeams[0];

  // 4. Insert the new player
  const { data, error } = await db
    .from("epoch_players")
    .insert({
      epoch_game_id: game.epoch_game_id,
      full_name: d.fullName,
      branch: d.branch,
      fun_fact: d.funFact,
      favorite_food: d.favoriteFood,
      hobby: d.hobby,
      epoch_team_id: targetTeam ? targetTeam.epoch_team_id : null,
    })
    .select("epoch_player_id, epoch_game_id, session_token, full_name, epoch_team_id")
    .single();

  if (error)
    return NextResponse.json(
      { error: "Unable to join. Please try again." },
      { status: 400 }
    );

  // Guarantee team assignment matches targetTeam
  if (targetTeam && data.epoch_team_id !== targetTeam.epoch_team_id) {
    await db
      .from("epoch_players")
      .update({ epoch_team_id: targetTeam.epoch_team_id })
      .eq("epoch_player_id", data.epoch_player_id);
    data.epoch_team_id = targetTeam.epoch_team_id;
  }

  return NextResponse.json({
    player: {
      id: data.epoch_player_id,
      game_id: data.epoch_game_id,
      session_token: data.session_token,
      full_name: data.full_name,
      team_id: data.epoch_team_id,
    },
  });
}


