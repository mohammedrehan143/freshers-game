"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Connection } from "@/components/Connection";
import { useRealtime } from "@/components/useRealtime";

async function responseData(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {
      error: `Server returned ${response.status}. Check your Supabase environment variables and restart the server.`,
    };
  }
}

export default function Admin() {
  const [data, setData] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<"checking" | "unauthenticated" | "authenticated">("checking");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/state");
      if (response.status === 401) {
        setData(null);
        setAuthStatus("unauthenticated");
        return;
      }
      const body = await responseData(response);
      if (!response.ok) {
        setData(null);
        setError(body.error || "Unable to load the host dashboard.");
        setAuthStatus("unauthenticated");
        return;
      }
      setError("");
      setData(body);
      setAuthStatus("authenticated");
    } catch {
      setData(null);
      setError("Unable to reach the server. Check network connection.");
      setAuthStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const live = useRealtime(data?.game?.id, load);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setData(null);
    setPassword("");
    setAuthStatus("unauthenticated");
  };

  // Live Timer for Host
  useEffect(() => {
    if (!data?.game?.question_ends_at || data.game.status !== "QUESTION_ACTIVE") {
      setRemaining(null);
      return;
    }
    const update = () => {
      const ends = new Date(data.game.question_ends_at).getTime();
      const diff = Math.max(0, Math.ceil((ends - Date.now()) / 1000));
      setRemaining(diff);
    };
    update();
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [data]);

  async function act(action: string, payload?: object) {
    const response = await fetch("/api/admin/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    const body = await responseData(response);
    if (!response.ok) setError(body.error || "Action failed.");
    else {
      setError("");
      void load();
    }
  }

  // 1. Loading / Checking Credentials State (Prevents flash of login screen)
  if (authStatus === "checking") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#090a0f] overflow-x-hidden">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 rounded-sm bg-[#d4ff00] animate-spin" />
          <p className="font-mono text-xs uppercase tracking-widest text-slate-400 text-center">
            VERIFYING HOST CREDENTIALS…
          </p>
        </div>
      </main>
    );
  }

  // 2. Unauthenticated Passcode Entry Form
  if (authStatus === "unauthenticated" || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#090a0f] overflow-x-hidden">
        <form
          className="glass max-w-md w-full p-6 sm:p-10 space-y-5 border-white/10 relative overflow-hidden rounded-2xl text-center"
          onSubmit={async (e) => {
            e.preventDefault();
            setIsLoggingIn(true);
            setError("");

            try {
              const response = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
              });
              const body = await responseData(response);
              setIsLoggingIn(false);

              if (response.ok) {
                setPassword("");
                void load();
              } else {
                setError(body.error || "Incorrect host password.");
              }
            } catch {
              setIsLoggingIn(false);
              setError("Network error. Please try again.");
            }
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#d4ff00] rounded-sm transform rotate-45" />
            <span className="font-mono text-xs text-[#d4ff00] uppercase font-bold tracking-wider">
              HOST SECURITY GATEWAY
            </span>
          </div>

          <h1 className="font-display font-black text-3xl text-white uppercase tracking-tight">
            Control <span className="text-[#d4ff00]">Room.</span>
          </h1>

          <div className="text-left">
            <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1.5">
              Host Password
            </label>
            <input
              required
              className="field font-mono text-center text-base py-3"
              type="password"
              placeholder="Enter host password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-rose-300 text-xs font-mono font-semibold bg-rose-950/40 p-2.5 rounded border border-rose-500/30 text-center">
              ⚠ {error}
            </p>
          )}

          <button
            disabled={isLoggingIn}
            className="btn w-full py-3.5 text-xs font-mono font-black tracking-wider text-center"
          >
            {isLoggingIn ? "AUTHENTICATING…" : "AUTHENTICATE & UNLOCK →"}
          </button>
        </form>
      </main>
    );
  }



  if (!data.game) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-[#090a0f]">
        <div className="glass max-w-md w-full p-8 text-center border-white/10">
          <span className="font-mono text-xs text-[#d4ff00] font-bold block mb-2">✦ INITIALIZE PROTOCOL</span>
          <h1 className="font-display font-black text-3xl text-white uppercase tracking-tight">
            Create Live Game
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-light">
            Generate an event code for student participation.
          </p>
          <button onClick={() => act("create_game")} className="btn w-full mt-6 py-3.5 text-xs font-mono font-black">
            CREATE GAME & CODE →
          </button>
          {error && <p className="text-rose-300 mt-3 text-xs font-mono">{error}</p>}
        </div>
      </main>
    );
  }

  const game = data.game;
  const isRunning = game.status === "QUESTION_ACTIVE";
  const timerMins = remaining !== null ? Math.floor(remaining / 60) : 5;
  const timerSecs = remaining !== null ? remaining % 60 : 0;
  const timerFormatted = `${String(timerMins).padStart(2, "0")}:${String(timerSecs).padStart(2, "0")}`;

  return (
    <main className="min-h-screen py-6 sm:py-8 px-4 sm:px-6 w-full flex flex-col items-center justify-between overflow-x-hidden">
      <div className="w-full max-w-5xl mx-auto flex flex-col">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5 sm:pb-6">

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 bg-[#d4ff00] rounded-sm transform rotate-45" />
              <span className="font-mono text-[11px] sm:text-xs text-[#d4ff00] font-bold uppercase tracking-wider">
                EPOCH COMMAND CENTER · 10 Qs / 05:00 MINS
              </span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight uppercase">
              {game.name}
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[#00f0ff] font-bold mt-1">
              QUIZ CODE: <span className="underline underline-offset-4">{game.game_code}</span>
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 sm:gap-3 flex-wrap">
            <Link
              href="/leaderboard"
              target="_blank"
              className="text-xs font-mono font-bold text-slate-300 hover:text-white px-3.5 py-1.5 rounded-full border border-white/15 bg-white/5 transition-all"
            >
              PROJECTOR ↗
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs font-mono font-bold text-rose-300 hover:text-rose-200 px-3.5 py-1.5 rounded-full border border-rose-500/30 bg-rose-950/40 hover:bg-rose-950/70 transition-all flex items-center gap-1.5"
              title="Lock host control room"
            >
              <span>🔒</span>
              <span>LOCK</span>
            </button>
            <Connection connected={live} />
          </div>
        </header>


        {/* Live Metrics Row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
          <div className="glass p-4 sm:p-5 border-white/10 rounded-2xl">
            <span className="font-mono text-[11px] sm:text-xs text-slate-400 font-bold block mb-1">STATUS</span>
            <strong className="font-mono text-base sm:text-xl text-white">{game.status}</strong>
          </div>
          <div className="glass p-4 sm:p-5 border-white/10 rounded-2xl">
            <span className="font-mono text-[11px] sm:text-xs text-slate-400 font-bold block mb-1">5-MIN TIMER</span>
            <strong
              className={`font-mono text-base sm:text-xl ${
                isRunning ? "text-[#d4ff00] animate-pulse font-black" : "text-slate-400"
              }`}
            >
              {isRunning ? timerFormatted : "05:00"}
            </strong>
          </div>
          <div className="glass p-4 sm:p-5 border-white/10 rounded-2xl">
            <span className="font-mono text-[11px] sm:text-xs text-slate-400 font-bold block mb-1">ROSTER</span>
            <strong className="font-mono text-base sm:text-xl text-white">{data.players.length} Players</strong>
          </div>
          <div className="glass p-4 sm:p-5 border-white/10 rounded-2xl">
            <span className="font-mono text-[11px] sm:text-xs text-slate-400 font-bold block mb-1">CHALLENGE</span>
            <strong className="font-mono text-base sm:text-xl text-white">{data.questions.length} Questions</strong>
          </div>
        </section>

        {/* Primary Controls Center */}
        <section className="glass p-5 sm:p-8 mt-5 sm:mt-6 border-white/10 rounded-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
            <div>
              <h2 className="font-display font-black text-lg sm:text-xl text-white uppercase tracking-tight">
                Challenge Operations
              </h2>
              <p className="text-slate-400 text-xs font-mono mt-0.5 sm:mt-1">
                Synchronized 5-minute countdown for all 10 questions with instant results.
              </p>
            </div>
            {isRunning && (
              <div className="px-3.5 py-1 bg-[#d4ff00]/10 border border-[#d4ff00]/40 rounded-full text-[#d4ff00] font-mono font-bold text-xs">
                ⏱ RUNNING: {timerFormatted}
              </div>
            )}
          </div>

          <div className="flex gap-2.5 sm:gap-3 flex-wrap mt-5 sm:mt-6">
            {!isRunning ? (
              <button
                onClick={() => act("start_quiz", { durationSeconds: 300 })}
                className="btn text-xs font-mono font-black px-6 sm:px-8 py-3 sm:py-3.5 shadow-xl shadow-[#d4ff00]/25 w-full sm:w-auto"
              >
                ▶ START 5-MINUTE QUIZ (10 QUESTIONS)
              </button>
            ) : (
              <>
                <button
                  onClick={() => act("extend_time")}
                  className="btn-secondary btn text-xs font-mono px-4 sm:px-5 py-2.5 sm:py-3"
                >
                  +1 MINUTE
                </button>
                <button
                  onClick={() => act("end_question")}
                  className="btn text-xs font-mono px-4 sm:px-5 py-2.5 sm:py-3 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-200 shadow-none"
                >
                  ⏹ END QUIZ
                </button>
              </>
            )}

            <button
              onClick={() => act("show_leaderboard")}
              className="btn text-xs font-mono px-4 sm:px-6 py-2.5 sm:py-3 bg-violet-900/60 hover:bg-violet-800 text-violet-200 border border-violet-700/50 shadow-none"
            >
              🏆 SHOW LEADERBOARD
            </button>
            <button
              onClick={() => act("hide_leaderboard")}
              className="btn-secondary btn text-xs font-mono px-4 sm:px-5 py-2.5 sm:py-3"
            >
              HIDE BOARD
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Reset game? This will wipe all registered players, teams, and answers from the database to start completely fresh. The 10 questions will be preserved."
                  )
                ) {
                  act("reset_quiz");
                }
              }}
              className="btn text-xs font-mono px-4 sm:px-5 py-2.5 sm:py-3 bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 border border-rose-800/40 shadow-none sm:ml-auto"
            >
              ↺ RESET GAME
            </button>
          </div>

          {error && (
            <p className="text-rose-300 mt-4 text-xs font-mono bg-rose-950/40 p-2.5 rounded border border-rose-500/30">
              ⚠ {error}
            </p>
          )}
        </section>

        {/* Players & Squads Grid */}
        <section className="grid lg:grid-cols-2 gap-4 sm:gap-6 mt-5 sm:mt-6">
          <div className="glass p-5 sm:p-6 border-white/10 rounded-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h2 className="font-display font-black text-base sm:text-lg text-white uppercase">
                Candidates ({data.players.length})
              </h2>
              <Link href="/admin/players" className="text-xs font-mono text-[#d4ff00] hover:underline font-bold">
                VIEW ALL →
              </Link>
            </div>

            <div className="mt-4 space-y-2 max-h-72 overflow-auto pr-1">
              {data.players.length === 0 ? (
                <p className="text-slate-500 text-xs font-mono py-8 text-center">
                  No candidates joined yet. Code: {game.game_code}
                </p>
              ) : (
                data.players.map((player: any) => (
                  <div
                    key={player.id}
                    className="flex justify-between items-center bg-black/40 border border-white/5 rounded-lg p-2.5 sm:p-3 text-xs"
                  >
                    <div>
                      <strong className="text-white font-sans block">{player.full_name}</strong>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {player.branch} · {player.hobby}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] sm:text-xs font-bold text-[#d4ff00] bg-white/5 px-2.5 py-1 rounded border border-white/10">
                      {player.teams?.name || "Unassigned"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass p-5 sm:p-6 border-white/10 rounded-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h2 className="font-display font-black text-base sm:text-lg text-white uppercase">
                Squads ({data.teams.length})
              </h2>
              <button
                className="btn text-[11px] font-mono py-1.5 px-3 font-bold"
                onClick={() => act("randomize_teams")}
              >
                🎲 RANDOMIZE
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-4 max-h-72 overflow-auto pr-1">
              {data.teams.map((team: any) => {
                const count = data.players.filter((p: any) => p.team_id === team.id).length;
                return (
                  <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 sm:p-3" key={team.id}>
                    <strong className="text-white text-xs font-display uppercase block truncate">{team.name}</strong>
                    <span className="text-[#00f0ff] text-[11px] font-mono font-bold mt-1 block">
                      {count} / 4 MEMBERS
                    </span>
                  </div>
                );
              })}
            </div>
            <Link href="/admin/teams" className="text-xs font-mono text-slate-400 hover:text-white inline-block mt-4">
              Manage squad rosters →
            </Link>
          </div>
        </section>

        {/* Question Bank Link Bar */}
        <div className="mt-5 sm:mt-6 glass p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-white/10 rounded-2xl">
          <div>
            <h3 className="font-display font-black text-white uppercase text-sm sm:text-base">
              Question Bank ({data.questions.length} Questions)
            </h3>
            <p className="text-slate-400 text-xs font-mono">10 Curated questions across tech & logic.</p>
          </div>
          <Link href="/admin/questions" className="btn text-xs font-mono px-5 py-2.5 font-bold w-full sm:w-auto text-center">
            EDIT QUESTIONS →
          </Link>
        </div>
      </div>

      <footer className="text-center py-6 text-[11px] font-mono text-slate-500 border-t border-white/10 mt-10 sm:mt-12">
        EPOCH 2026 · WE DRIVE EMOTIONS
      </footer>
    </main>
  );
}



