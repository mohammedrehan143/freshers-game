# EPOCH FRESHERS CHALLENGE 2026

Production-oriented Next.js + Supabase live quiz show for 100+ concurrent students.

## Setup

1. Create a Supabase project and in **SQL Editor** run `supabase/migrations/001_epoch_schema.sql`, then `supabase/migrations/002_automatic_teams.sql`, then `supabase/seed.sql`.
2. Copy `.env.example` to `.env.local` and set the project URL, anon key, service-role key, and a strong `ADMIN_PASSWORD`. The service key is server-only: never prefix it with `NEXT_PUBLIC_`.
3. Run `cmd /c npm run dev`, then visit `http://localhost:3000`.
4. Open `/admin`, authenticate, and select **CREATE GAME & GENERATE QUIZ CODE**. Share its generated code with students at `/join`.
5. Students receive 10 questions with a synchronized 5-minute countdown. Teams are dynamically calculated ($T = \lceil N/4 \rceil$) so that every team has at most 4 members and players are split equally.
6. Run `/leaderboard` on the projector.

## Database model

`epoch_games` is the synchronized source of truth. `epoch_players` own opaque local session tokens and receive dynamic automatic team assignments ($T = \lceil N/4 \rceil$, max 4 members per team, split equally). `epoch_teams` belong to games. `epoch_questions` retains correct options privately. `epoch_answers` has a unique `(question_id, player_id)` constraint and records server-calculated points. Team rankings use the **average of member totals**, never a sum.

RLS permits only the minimal public reads used by Realtime. All joins, game payloads, answers, and host operations use server route handlers with the service key; correct answers are never included in player payloads until completion.

