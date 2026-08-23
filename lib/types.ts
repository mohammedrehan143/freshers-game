export type GameStatus = "WAITING" | "LOBBY" | "QUESTION_ACTIVE" | "QUESTION_ENDED" | "ROUND_ENDED" | "LEADERBOARD" | "GAME_COMPLETED";
export type Game = { id:string; name:string; game_code:string; status:GameStatus; current_round:number; current_question:number; current_question_id:string|null; question_started_at:string|null; question_ends_at:string|null };
export type Player = { id:string; game_id:string; full_name:string; branch:string; fun_fact:string; favorite_food:string; hobby:string; team_id:string|null; session_token:string; created_at:string; last_seen_at:string };
export type SafeQuestion = { id:string; game_id:string; round_number:number; question_number:number; question_text:string; options:string[]; time_limit_seconds:number; points:number; scoring_config:{tiers?:{seconds:number;points:number}[]}|null };
export type TeamScore = { team_id:string; team_name:string; round1:number; round2:number; round3:number; overall:number; members:string[] };
