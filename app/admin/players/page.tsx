"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Players() {
  const router = useRouter();
  const [data, setData] = useState<any>();

  useEffect(() => {
    fetch("/api/admin/state")
      .then((r) => {
        if (r.status === 401) {
          router.push("/admin");
          return null;
        }
        return r.json();
      })
      .then((d) => d && setData(d));
  }, [router]);


  return (
    <main className="min-h-screen py-6 sm:py-8 px-4 sm:px-6 w-full flex flex-col items-center overflow-x-hidden">
      <div className="w-full max-w-5xl mx-auto">
        <header className="flex justify-between items-center border-b border-white/10 pb-4 mb-6 sm:mb-8">

        <Link
          className="text-xs font-mono font-bold text-slate-400 hover:text-white transition-colors"
          href="/admin"
        >
          ← CONTROL ROOM
        </Link>
        <span className="font-mono text-xs font-bold text-[#d4ff00]">
          ROSTER ({data?.players?.length || 0})
        </span>
      </header>

      <h1 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight uppercase mb-5 sm:mb-6">
        Registered <span className="text-[#d4ff00]">Players.</span>
      </h1>

      <div className="glass overflow-hidden border-white/10 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="text-[11px] font-mono font-bold text-slate-400 uppercase bg-black/40 border-b border-white/10">
              <tr>
                <th className="py-3 px-3 sm:px-4">Name</th>
                <th className="py-3 px-3 sm:px-4">Branch</th>
                <th className="py-3 px-3 sm:px-4">Hobby</th>
                <th className="py-3 px-3 sm:px-4">Assigned Squad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[11px] sm:text-xs">
              {!data?.players || data.players.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 font-sans">
                    No players registered yet.
                  </td>
                </tr>
              ) : (
                data.players.map((p: any) => (
                  <tr className="hover:bg-white/[0.02] transition-colors" key={p.id}>
                    <td className="py-3 px-3 sm:px-4 font-sans font-bold text-white whitespace-nowrap">
                      {p.full_name}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-slate-300 whitespace-nowrap">{p.branch}</td>
                    <td className="py-3 px-3 sm:px-4 text-slate-400 whitespace-nowrap">{p.hobby}</td>
                    <td className="py-3 px-3 sm:px-4 text-[#d4ff00] font-bold whitespace-nowrap">
                      {p.teams?.name || "Unassigned"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </main>
  );
}




