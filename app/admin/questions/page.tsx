"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Questions() {
  const router = useRouter();
  const [data, setData] = useState<any>();
  const [form, setForm] = useState<any>({
    roundNumber: 1,
    questionNumber: 1,
    questionText: "",
    options: ["", "", "", ""],
    correctOption: 0,
    timeLimitSeconds: 30,
    points: 100,
  });
  const [message, setMessage] = useState("");

  const load = () =>
    fetch("/api/admin/state")
      .then((r) => {
        if (r.status === 401) {
          router.push("/admin");
          return null;
        }
        return r.json();
      })
      .then((d) => d && setData(d));

  useEffect(() => {
    void load();
  }, []);


  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const x = await fetch("/api/admin/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_question", payload: form }),
    });
    const res = await x.json();
    setMessage(x.ok ? "Question saved successfully ✓" : res.error);
    if (x.ok) {
      void load();
      setForm({
        ...form,
        id: undefined,
        questionText: "",
        options: ["", "", "", ""],
      });
    }
  };

  if (!data) return <main className="shell">Loading question bank…</main>;

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
          BANK ({data?.questions?.length || 0} QUESTIONS)
        </span>
      </header>

      <h1 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight uppercase mb-5 sm:mb-6">
        Question <span className="text-[#d4ff00]">Bank.</span>
      </h1>

      {/* Question Form */}
      <form onSubmit={save} className="glass p-5 sm:p-8 space-y-4 border-white/10 rounded-2xl">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <span className="font-mono text-xs text-[#d4ff00] font-bold">
            {form.id ? "EDIT QUESTION" : "ADD / CONFIGURE QUESTION"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1">
              Round (1-2)
            </label>
            <input
              className="field font-mono text-sm py-2.5"
              type="number"
              min="1"
              max="2"
              value={form.roundNumber}
              onChange={(e) => setForm({ ...form, roundNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1">
              Question Number (1-8)
            </label>
            <input
              className="field font-mono text-sm py-2.5"
              type="number"
              min="1"
              max="8"
              value={form.questionNumber}
              onChange={(e) => setForm({ ...form, questionNumber: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1">
            Question Text
          </label>
          <textarea
            required
            rows={2}
            className="field text-sm"
            placeholder="Type question prompt..."
            value={form.questionText}
            onChange={(e) => setForm({ ...form, questionText: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {form.options.map((v: string, i: number) => (
            <div key={i}>
              <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1">
                Option {"ABCD"[i]}
              </label>
              <input
                required
                className="field text-sm py-2.5"
                placeholder={`Option ${"ABCD"[i]}`}
                value={v}
                onChange={(e) => {
                  const o = [...form.options];
                  o[i] = e.target.value;
                  setForm({ ...form, options: o });
                }}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1">
              Correct Answer
            </label>
            <select
              className="field font-mono text-sm py-2.5"
              value={form.correctOption}
              onChange={(e) => setForm({ ...form, correctOption: Number(e.target.value) })}
            >
              {[0, 1, 2, 3].map((x) => (
                <option key={x} value={x}>
                  Option {"ABCD"[x]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1">
              Points
            </label>
            <input
              className="field font-mono text-sm py-2.5"
              type="number"
              value={form.points}
              onChange={(e) => setForm({ ...form, points: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1">
              Time Limit (Secs)
            </label>
            <input
              className="field font-mono text-sm py-2.5"
              type="number"
              value={form.timeLimitSeconds}
              onChange={(e) => setForm({ ...form, timeLimitSeconds: e.target.value })}
            />
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <button className="btn text-xs font-mono px-6 py-3 font-black text-center">
            {form.id ? "UPDATE QUESTION ✓" : "SAVE QUESTION →"}
          </button>
          {message && <span className="text-xs font-mono text-cyan-300 font-bold">{message}</span>}
        </div>
      </form>

      {/* Existing Questions List */}
      <section className="mt-6 sm:mt-8 space-y-3">
        <h2 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-tight">
          Current Questions ({data.questions.length})
        </h2>

        {data.questions.map((q: any) => (
          <div
            className="glass p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-white/10 rounded-2xl"
            key={q.id}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[11px] sm:text-xs font-bold text-[#d4ff00] bg-[#d4ff00]/10 px-2 py-0.5 rounded border border-[#d4ff00]/20">
                  R{q.round_number} · Q{q.question_number}
                </span>
                <span className="font-mono text-xs text-slate-400">{q.points} PTS</span>
              </div>
              <p className="font-bold text-white text-sm mt-1">{q.question_text}</p>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                className="btn-secondary btn text-xs font-mono py-1.5 px-3"
                onClick={() =>
                  setForm({
                    ...q,
                    roundNumber: q.round_number,
                    questionNumber: q.question_number,
                    questionText: q.question_text,
                    timeLimitSeconds: q.time_limit_seconds,
                    correctOption: q.correct_option ?? 0,
                  })
                }
              >
                EDIT
              </button>
              <button
                className="btn text-xs font-mono py-1.5 px-3 bg-rose-950/50 hover:bg-rose-900 border border-rose-800/40 text-rose-300 shadow-none"
                onClick={async () => {
                  if (window.confirm("Delete this question?")) {
                    await fetch("/api/admin/control", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "delete_question",
                        payload: { id: q.id },
                      }),
                    });
                    void load();
                  }
                }}
              >
                DELETE
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  </main>
  );
}




