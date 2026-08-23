"use client";

import { useCallback, useEffect, useState } from "react";
import { useRealtime } from "@/components/useRealtime";
import { Connection } from "@/components/Connection";
import Link from "next/link";

export default function Leaderboard() {
  const [data, setData] = useState<any>();

  const load = useCallback(
    () =>
      fetch("/api/leaderboard")
        .then((r) => r.json())
        .then(setData),
    []
  );

  useEffect(() => {
    void load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const live = useRealtime(data?.game?.id, load);

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#090a0f] p-4">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 rounded-sm bg-[#d4ff00] animate-spin" />
          <p className="font-mono text-xs uppercase tracking-widest text-slate-400 text-center">
            CONNECTING TO BROADCAST FEED…
          </p>
        </div>
      </main>
    );
  }

  const visible = data.game?.leaderboard_visible;


  return (
    <main className="min-h-screen py-6 sm:py-8 px-4 sm:px-6 w-full flex flex-col items-center justify-between overflow-x-hidden">

      <div className="w-full max-w-4xl mx-auto flex flex-col">
        <header className="w-full flex justify-between items-center border-b border-white/10 pb-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400 hover:text-white transition-colors"
          >
            <span>←</span> <span>HOME</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="font-mono text-[11px] sm:text-xs font-bold text-[#d4ff00]">BROADCAST</span>
            <Connection connected={live} />
          </div>
        </header>

        <div className="text-center mt-6 sm:mt-10 mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#d4ff00]/30 bg-[#d4ff00]/10 text-[#d4ff00] text-[11px] sm:text-xs font-mono font-bold uppercase mb-3">
            <span>✦</span> EPOCH FRESHERS 2026
          </div>

          <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-white tracking-tight uppercase">
            {data.game?.status === "GAME_COMPLETED" ? (
              <>
                Final <span className="text-[#d4ff00]">Standings.</span>
              </>
            ) : (
              <>
                Live <span className="text-[#00f0ff]">Leaderboard.</span>
              </>
            )}
          </h1>
          <p className="font-mono text-[11px] sm:text-xs text-slate-400 mt-2 uppercase tracking-widest px-2">
            SYNCHRONIZED SQUAD POINT TOTALS (AVERAGE SCORE / 4 PLAYERS)
          </p>
        </div>

        {visible ? (
          <section className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
            {data.teams.length === 0 ? (
              <div className="glass text-center py-16 px-4 text-slate-400 font-mono text-xs uppercase tracking-wider border-white/10 rounded-2xl">
                No squad scores recorded yet. Stand by for submissions.
              </div>
            ) : (
              data.teams.map((t: any, i: number) => {
                const isFirst = i === 0;
                const isSecond = i === 1;
                const isThird = i === 2;

                return (
                  <article
                    key={t.team_id}
                    className={`glass p-4 sm:p-6 transition-all flex items-center justify-between border rounded-2xl ${
                      isFirst
                        ? "border-[#d4ff00]/60 bg-[#d4ff00]/[0.08] ring-1 ring-[#d4ff00]/40 py-5 sm:py-8"
                        : isSecond
                        ? "border-[#00f0ff]/50 bg-[#00f0ff]/[0.05] py-4.5 sm:py-7"
                        : isThird
                        ? "border-violet-500/40 bg-violet-950/20 py-4 sm:py-6"
                        : "border-white/10 py-3.5 sm:py-5"
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-6 min-w-0 pr-2">
                      <span
                        className={`font-display text-2xl sm:text-4xl md:text-5xl font-black w-8 sm:w-14 text-center shrink-0 ${
                          isFirst
                            ? "text-[#d4ff00]"
                            : isSecond
                            ? "text-[#00f0ff]"
                            : isThird
                            ? "text-violet-400"
                            : "text-slate-600"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      <div className="min-w-0">
                        <h2 className="font-display font-black text-base sm:text-2xl md:text-3xl text-white uppercase tracking-tight truncate">
                          {t.team_name}
                        </h2>
                        {t.members && t.members.length > 0 && (
                          <p className="text-slate-400 text-[11px] sm:text-xs font-mono mt-0.5 sm:mt-1 truncate">
                            {t.members.join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <strong
                        className={`font-display text-2xl sm:text-4xl md:text-5xl font-black block tracking-tight ${
                          isFirst
                            ? "text-[#d4ff00]"
                            : isSecond
                            ? "text-[#00f0ff]"
                            : "text-white"
                        }`}
                      >
                        {t.overall.toFixed(0)}
                      </strong>
                      <span className="font-mono text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">
                        AVG PTS
                      </span>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        ) : (
          <div className="text-center my-12 sm:my-20 glass max-w-lg mx-auto py-12 sm:py-16 px-6 sm:px-8 border-white/10 rounded-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-[#d4ff00] font-bold block mb-2">
              ✦ QUIZ IN PROGRESS
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
              Stand By for Reveal.
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-3 font-light">
              Scores are being calculated across all 10 questions. The host will broadcast the standings shortly.
            </p>
          </div>
        )}
      </div>

      <footer className="text-center py-6 text-[11px] font-mono text-slate-500 border-t border-white/10 mt-10 sm:mt-12">
        EPOCH 2026 · WE DRIVE EMOTIONS
      </footer>
    </main>
  );
}



