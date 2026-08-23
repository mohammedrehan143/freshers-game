-- Compatibility aliases for the existing Next.js API while the database remains
-- cleanly namespaced with epoch_* tables. Do not write directly to these views.
create or replace view public.games as
select epoch_game_id as id, game_name as name, quiz_code as game_code, game_status as status,
current_round, current_question, current_question_id, question_started_at, question_ends_at,
leaderboard_visible, created_at, updated_at from public.epoch_games;

create or replace view public.teams as
select epoch_team_id as id, epoch_game_id as game_id, team_name as name, team_number as sort_order from public.epoch_teams;

create or replace view public.players as
select epoch_player_id as id, epoch_game_id as game_id, full_name, branch, fun_fact, favorite_food,
hobby, epoch_team_id as team_id, session_token, last_seen_at, created_at from public.epoch_players;

create or replace view public.questions as
select epoch_question_id as id, epoch_game_id as game_id, round_number, question_number,
question_text, options, correct_option, time_limit_seconds, points, scoring_config, created_at, updated_at from public.epoch_questions;

create or replace view public.answers as
select epoch_answer_id as id, epoch_game_id as game_id, epoch_question_id as question_id,
epoch_player_id as player_id, selected_option, is_correct, points_awarded, submitted_at from public.epoch_answers;

grant select, insert, update, delete on public.games, public.teams, public.players, public.questions, public.answers to anon, authenticated, service_role;
