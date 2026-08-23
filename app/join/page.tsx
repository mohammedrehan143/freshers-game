"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setSession } from "@/lib/game/session";
import Link from "next/link";

const fields = [
  ["fullName", "Full Name", "e.g. Alex Chen"],
  ["branch", "Branch / Department", "e.g. Computer Science"],
  ["funFact", "One Fun Fact About You", "e.g. Built my first game at 14"],
  ["favoriteFood", "Favorite Food / Snack", "e.g. Ramen"],
  ["hobby", "Primary Hobby / Passion", "e.g. Photography & Beats"],
] as const;

export default function Join() {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({ gameCode: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Unable to join. Check the code.");
        return;
      }

      setSession({
        playerId: data.player.id,
        token: data.player.session_token,
        gameId: data.player.game_id,
      });

      router.push("/game");
    } catch {
      setLoading(false);
      setError("Network error. Please try again.");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-8 w-full overflow-x-hidden">
      {/* Centered Content Container */}
      <div className="w-full max-w-lg flex flex-col items-center mx-auto my-auto py-6">
        {/* Header Bar */}
        <header className="w-full flex justify-between items-center pb-4 mb-6 border-b border-white/10">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400 hover:text-white transition-colors"
          >
            <span>←</span> <span>HOME</span>
          </Link>
          <span className="font-mono text-xs text-[#d4ff00] font-bold">EPOCH // RECRUIT</span>
        </header>

        {/* Registration Card */}
        <form
          onSubmit={submit}
          className="w-full glass p-6 sm:p-10 space-y-6 border-white/10 relative overflow-hidden rounded-2xl"
        >
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#d4ff00]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center">
            <span className="eyebrow text-[#d4ff00]">Step 01 // Identification</span>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight uppercase mt-1">
              Join the <span className="text-[#d4ff00]">Challenge.</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-2 font-light">
              Enter your quiz code to be placed into a balanced 4-member squad.
            </p>
          </div>

          <div className="space-y-4 pt-1 text-left">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1.5">
                Quiz Code <span className="text-[#d4ff00]">*</span>
              </label>
              <input
                required
                className="field uppercase font-mono font-bold text-base sm:text-lg tracking-wider text-[#d4ff00] py-3 text-center"
                placeholder="e.g. EPOCH2026"
                value={form.gameCode || ""}
                onChange={(e) => setForm({ ...form, gameCode: e.target.value })}
              />
            </div>

            {fields.map(([key, label, placeholder]) => (
              <div key={key}>
                <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1.5">
                  {label} <span className="text-slate-500">*</span>
                </label>
                <input
                  required
                  className="field text-sm sm:text-base py-2.5 sm:py-3"
                  placeholder={placeholder}
                  value={form[key] || ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono font-semibold text-center">
              ⚠ {error}
            </div>
          )}

          <button
            disabled={loading}
            className="btn w-full py-4 text-sm sm:text-base tracking-wider font-black shadow-lg shadow-[#d4ff00]/25 mt-2 text-center"
          >
            {loading ? "CHECKING SQUAD ASSIGNMENT…" : "ENTER QUIZ ROOM →"}
          </button>
        </form>
      </div>

      {/* Centered Footer */}
      <footer className="text-center py-4 text-[11px] font-mono text-slate-500 w-full">
        EPOCH 2026 · LIVE SYNCHRONIZED PARTICIPATION
      </footer>
    </main>
  );
}




