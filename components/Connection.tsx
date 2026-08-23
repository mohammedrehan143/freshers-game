"use client";

export function Connection({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border transition-colors shrink-0 ${
        connected
          ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
          : "border-amber-500/30 bg-amber-950/40 text-amber-300 animate-pulse"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          connected ? "bg-emerald-400" : "bg-amber-400"
        }`}
      />
      <span>{connected ? "LIVE" : "SYNCING"}</span>
    </span>
  );
}

