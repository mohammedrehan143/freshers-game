"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Teams() {
  const [data, setData] = useState<any>();

  const load = () =>
    fetch("/api/admin/state")
      .then((r) => r.json())
      .then(setData);

  useEffect(() => {
    void load();
  }, []);

  const move = async (playerId: string, teamId: string) => {
    await fetch("/api/admin/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "move_player", payload: { playerId, teamId } }),
    });
    void load();
  };

  return (
    <main className="min-h-screen py-6 sm:py-8 px-4 sm:px-6 w-full flex flex-col items-center overflow-x-hidden">
      <div className="w-full max-w-6xl mx-auto">
        <header className="flex justify-between items-center border-b border-white/10 pb-4 mb-6 sm:mb-8">

        <Link
          className="text-xs font-mono font-bold text-slate-400 hover:text-white transition-colors"
          href="/admin"
        >
          ← CONTROL ROOM
        </Link>
        <span className="font-mono text-xs font-bold text-[#d4ff00]">
          SQUADS ({data?.teams?.length || 0})
        </span>
      </header>

      <h1 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight uppercase mb-5 sm:mb-6">
        Squad <span className="text-[#d4ff00]">Assignments.</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.teams?.map((t: any) => {
          const members = data.players.filter((p: any) => p.team_id === t.id);

          return (
            <section key={t.id} className="glass p-4 sm:p-5 border-white/10 space-y-3 rounded-2xl">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h2 className="font-display font-black text-lg sm:text-xl text-white uppercase truncate">
                  {t.name}
                </h2>
                <span className="font-mono text-[11px] sm:text-xs text-[#00f0ff] font-bold shrink-0 ml-2">
                  {members.length} / 4 MEMBERS
                </span>
              </div>

              {members.length === 0 ? (
                <p className="text-xs font-mono text-slate-500 py-3">No members assigned.</p>
              ) : (
                <div className="space-y-2">
                  {members.map((p: any) => (
                    <div
                      className="flex justify-between items-center bg-black/40 border border-white/5 rounded-xl p-2.5 text-xs font-mono gap-2"
                      key={p.id}
                    >
                      <span className="font-sans font-bold text-slate-200 truncate">{p.full_name}</span>
                      <select
                        className="bg-slate-900 border border-white/15 text-[#d4ff00] text-[11px] rounded px-2 py-1 outline-none shrink-0"
                        value={t.id}
                        onChange={(e) => move(p.id, e.target.value)}
                      >
                        {data.teams.map((x: any) => (
                          <option key={x.id} value={x.id}>
                            {x.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  </main>
  );
}



