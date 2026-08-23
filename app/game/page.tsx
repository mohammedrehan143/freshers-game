"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSession } from "@/lib/game/session";
import { useRouter } from "next/navigation";
import { useRealtime } from "@/components/useRealtime";
import { Connection } from "@/components/Connection";
import Link from "next/link";

export default function Game() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [remaining, setRemaining] = useState(300);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLocally, setSubmittedLocally] = useState(false);
  const autoSubmittedRef = useRef(false);

  const load = useCallback(async () => {
    const session = getSession();
    if (!session) {
      router.replace("/join");
      return;
    }
    try {
      const res = await fetch(`/api/game?playerId=${session.playerId}&token=${session.token}`);
      const json = await res.json();
      if (json.error) {
        router.replace("/join");
        return;
      }
      setData(json);
      if (json.answers && Object.keys(json.answers).length > 0) {
        setSelectedAnswers((prev) => ({ ...json.answers, ...prev }));
      }
    } catch {
      // Network retry handled by effects
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const live = useRealtime(data?.game?.id, load);

  // 5-Minute Timer Countdown
  useEffect(() => {
    if (!data?.game?.question_ends_at || data.game.status !== "QUESTION_ACTIVE") {
      return;
    }

    const updateTimer = () => {
      const endsAt = new Date(data.game.question_ends_at).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((endsAt - now) / 1000));
      setRemaining(diff);

      // Auto-submit when time reaches 0
      if (diff <= 0 && !autoSubmittedRef.current && !submittedLocally && !data.isCompleted) {
        autoSubmittedRef.current = true;
        void handleAutoSubmit();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 250);
    return () => clearInterval(interval);
  }, [data, submittedLocally]);

  const handleSelectOption = async (questionId: string, optionIndex: number) => {
    if (data?.isCompleted || submittedLocally || remaining <= 0) return;

    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));

    const session = getSession();
    if (!session) return;

    try {
      await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: session.playerId,
          token: session.token,
          questionId,
          selectedOption: optionIndex,
        }),
      });
    } catch {
      // Offline fallback: will be included on final submit
    }
  };

  const handleAutoSubmit = async () => {
    const session = getSession();
    if (!session || !data?.questions) return;
    setIsSubmitting(true);

    const answersPayload = data.questions
      .map((q: any) => ({
        questionId: q.id,
        selectedOption: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1,
      }))
      .filter((a: any) => a.selectedOption >= 0);

    try {
      await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: session.playerId,
          token: session.token,
          answers: answersPayload,
          complete: true,
        }),
      });
    } catch {
      // Best effort
    }
    setSubmittedLocally(true);
    setIsSubmitting(false);
    void load();
  };

  const handleSubmitQuiz = async () => {
    const totalQ = data?.questions?.length || 10;
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < totalQ) {
      const confirmSubmit = window.confirm(
        `You have answered ${answeredCount} of ${totalQ} questions. Are you sure you want to submit your quiz now?`
      );
      if (!confirmSubmit) return;
    }
    await handleAutoSubmit();
  };

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#090a0f]">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 rounded-sm bg-[#d4ff00] animate-spin" />
          <p className="font-mono text-xs uppercase tracking-widest text-slate-400">
            CONNECTING TO EPOCH LIVE PROTOCOL…
          </p>
        </div>
      </main>
    );
  }

  const { game, player, questions = [], results } = data;
  const isQuizActive =
    game.status === "QUESTION_ACTIVE" && remaining > 0 && !data.isCompleted && !submittedLocally;
  const isShowResults = data.isCompleted || submittedLocally || remaining <= 0 || !!results;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // ================= RESULTS / OUTPUT VIEW =================
  if (isShowResults && results) {
    return (
      <main className="min-h-screen py-6 sm:py-10 px-4 sm:px-6 max-w-4xl mx-auto flex flex-col justify-between overflow-x-hidden">
        <div>
          {/* Centered Results Header */}
          <header className="flex flex-col items-center text-center border-b border-white/10 pb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 bg-[#d4ff00] rounded-sm transform rotate-45" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#d4ff00] font-bold">
                EPOCH 2026 // RESULTS DISCLOSURE
              </span>
              <Connection connected={live} />
            </div>
            <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight uppercase">
              Challenge <span className="text-[#d4ff00]">Completed.</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-2 font-mono">
              CANDIDATE: <strong className="text-white">{player.full_name}</strong> · SQUAD:{" "}
              <strong className="text-[#00f0ff]">{player.teams?.name || "Assigned"}</strong>
            </p>
          </header>

          {/* Hero Score Box */}
          <section className="glass p-6 sm:p-10 my-6 sm:my-8 text-center relative overflow-hidden border-white/10 rounded-2xl">
            <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-[#d4ff00]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-[#00f0ff]/10 rounded-full blur-3xl pointer-events-none" />

            <span className="font-mono text-xs uppercase tracking-widest font-bold text-[#d4ff00] block mb-1.5">
              {results.accuracy >= 70 ? "✦ OUTSTANDING PERFORMANCE" : "✦ FINAL SCORE TALLY"}
            </span>

            <div className="my-3 sm:my-4">
              <span className="font-display text-6xl sm:text-8xl md:text-9xl font-black text-white tracking-tight">
                {results.totalScore}
              </span>
              <span className="font-mono text-lg sm:text-2xl text-slate-500 font-bold ml-2 sm:ml-3">
                / {results.totalPossible} PTS
              </span>
            </div>

            <p className="font-mono text-xs sm:text-sm text-slate-300">
              ACCURACY RATING: <strong className="text-[#d4ff00]">{results.accuracy}%</strong>
            </p>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-lg mx-auto mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/10">
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 sm:p-4 text-center">
                <span className="font-display font-black text-2xl sm:text-3xl text-emerald-300 block">
                  {results.correctCount}
                </span>
                <span className="font-mono text-[10px] sm:text-xs uppercase font-bold text-emerald-400/80">
                  Correct
                </span>
              </div>
              <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3 sm:p-4 text-center">
                <span className="font-display font-black text-2xl sm:text-3xl text-rose-300 block">
                  {results.incorrectCount}
                </span>
                <span className="font-mono text-[10px] sm:text-xs uppercase font-bold text-rose-400/80">
                  Incorrect
                </span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-center">
                <span className="font-display font-black text-2xl sm:text-3xl text-slate-300 block">
                  {results.unansweredCount}
                </span>
                <span className="font-mono text-[10px] sm:text-xs uppercase font-bold text-slate-400">
                  Skipped
                </span>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 flex justify-center">
              <Link href="/leaderboard" className="btn w-full sm:w-auto px-8 py-3.5 text-xs font-mono font-black text-center">
                🏆 VIEW SQUAD STANDINGS BOARD →
              </Link>
            </div>
          </section>

          {/* Detailed 10-Question Breakdown */}
          <section className="space-y-3.5 sm:space-y-4 my-6 sm:my-8">
            <div className="text-center pb-2">
              <h2 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-tight">
                Question Review (10 Qs)
              </h2>
              <span className="font-mono text-[11px] text-slate-400">COMPLETE AUDIT LOG</span>
            </div>

            {results.breakdown.map((item: any) => {
              const isCorrect = item.is_correct;
              const isSkipped = item.selected_option === null;

              return (
                <article
                  key={item.id}
                  className={`glass p-4 sm:p-6 border transition-all rounded-2xl ${
                    isCorrect
                      ? "border-emerald-500/40 bg-emerald-950/10"
                      : isSkipped
                      ? "border-white/10 bg-white/[0.02]"
                      : "border-rose-500/40 bg-rose-950/10"
                  }`}
                >
                  <div className="flex justify-between items-center gap-2 mb-2.5">
                    <span className="font-mono text-[11px] font-bold text-slate-400 uppercase bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      Q{item.question_number} OF 10
                    </span>
                    <span
                      className={`font-mono text-[11px] font-black uppercase px-2 py-0.5 rounded ${
                        isCorrect
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : isSkipped
                          ? "bg-white/10 text-slate-300 border border-white/15"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      }`}
                    >
                      {isCorrect ? "✓ Correct (+100)" : isSkipped ? "— Skipped" : "✗ Incorrect"}
                    </span>
                  </div>

                  <h3 className="font-bold text-base sm:text-lg text-white mb-3 sm:mb-4 leading-snug">
                    {item.question_text}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.options.map((optText: string, oIdx: number) => {
                      const isSelected = item.selected_option === oIdx;
                      const isRightOption = item.correct_option === oIdx;

                      let optBadge = "border-white/10 bg-black/40 text-slate-400";
                      if (isRightOption) {
                        optBadge = "border-emerald-400/80 bg-emerald-950/60 text-emerald-200 font-bold";
                      } else if (isSelected && !isCorrect) {
                        optBadge = "border-rose-500/80 bg-rose-950/60 text-rose-200 line-through";
                      }

                      return (
                        <div
                          key={oIdx}
                          className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between transition-all ${optBadge}`}
                        >
                          <span className="flex items-center gap-2">
                            <strong className="font-mono text-xs">{"ABCD"[oIdx]}.</strong>
                            <span>{optText}</span>
                          </span>
                          {isRightOption && (
                            <span className="font-mono text-[10px] uppercase font-bold text-emerald-300 shrink-0 ml-2">
                              ✓ Correct
                            </span>
                          )}
                          {isSelected && !isRightOption && (
                            <span className="font-mono text-[10px] uppercase font-bold text-rose-300 shrink-0 ml-2">
                              Your Pick
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </section>
        </div>

        <footer className="text-center py-5 text-[11px] font-mono text-slate-500 border-t border-white/10">
          EPOCH 2026 · WE DRIVE EMOTIONS
        </footer>
      </main>
    );
  }

  // ================= LOBBY / WAITING VIEW =================
  if (!isQuizActive) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#090a0f] overflow-x-hidden">
        <section className="glass max-w-lg w-full p-6 sm:p-10 text-center border-white/10 relative overflow-hidden rounded-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#00f0ff]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00f0ff]/30 bg-[#00f0ff]/10 text-[#00f0ff] text-[11px] sm:text-xs font-mono font-bold uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
            STAND BY FOR BROADCAST
          </div>

          <h1 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight uppercase">
            Hi, {player.full_name}!
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#d4ff00] font-bold mt-1">
            ASSIGNED SQUAD: {player.teams?.name || "Waiting for Squad Allocation"}
          </p>

          <div className="bg-black/50 border border-white/10 rounded-2xl p-5 sm:p-6 mt-6 space-y-3 text-left">
            <h2 className="font-mono font-bold text-xs uppercase text-slate-400 tracking-wider text-center sm:text-left">
              PROTOCOL SPECIFICATIONS:
            </h2>
            <ul className="text-slate-300 text-xs sm:text-sm space-y-2 font-light">
              <li className="flex items-start gap-2">
                <span className="text-[#d4ff00] font-mono font-bold">01.</span>
                <span>
                  <strong>10 Questions total:</strong> Speed, reasoning, tech logic, and trivia.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00f0ff] font-mono font-bold">02.</span>
                <span>
                  <strong>05:00 Live Countdown:</strong> Synchronized timer begins when host starts.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#d4ff00] font-mono font-bold">03.</span>
                <span>
                  <strong>Instant Results:</strong> Automatically calculates and reveals scores.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-6 sm:mt-8 flex items-center justify-center gap-2.5 font-mono text-xs text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d4ff00] animate-ping" />
            Waiting for host to trigger start…
          </div>
        </section>
      </main>
    );
  }

  // ================= ACTIVE 10-QUESTION 5-MIN QUIZ VIEW =================
  const activeQ = questions[currentIdx] || questions[0];
  const selectedChoice = activeQ ? selectedAnswers[activeQ.id] : undefined;
  const answeredCount = Object.keys(selectedAnswers).length;
  const isTimeCritical = remaining <= 60;

  return (
    <main className="min-h-screen py-4 sm:py-6 px-4 sm:px-6 max-w-3xl mx-auto flex flex-col justify-between overflow-x-hidden">
      {/* Top Header & 5-Min Timer Bar */}
      <div>
        <header className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-3 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="w-2 h-2 bg-[#d4ff00] rounded-sm transform rotate-45" />
              <span className="font-mono text-[11px] text-[#d4ff00] font-bold uppercase tracking-wider">
                {game.name}
              </span>
            </div>
            <h1 className="font-display font-black text-lg sm:text-xl text-white mt-0.5">
              {player.full_name} <span className="text-slate-400 font-normal text-sm">({player.teams?.name})</span>
            </h1>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-3">
            <Connection connected={live} />
            <div
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border flex items-center gap-2 font-mono font-black text-lg sm:text-xl transition-all ${
                isTimeCritical
                  ? "border-rose-500 bg-rose-950/90 text-rose-300 animate-pulse shadow-lg shadow-rose-950"
                  : "border-[#d4ff00]/40 bg-[#d4ff00]/10 text-[#d4ff00]"
              }`}
            >
              <span className="text-xs">⏱</span>
              <span>{timeFormatted}</span>
            </div>
          </div>
        </header>

        {/* 10-Question Progress Nav Selector */}
        <nav className="mt-4 sm:mt-6">
          <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-400 mb-2">
            <span>
              QUESTION {currentIdx + 1} OF {questions.length}
            </span>
            <span className="text-[#00f0ff]">
              {answeredCount} / {questions.length} ANSWERED
            </span>
          </div>

          {/* 5 columns on mobile = 2 rows of 5 pills; 10 columns on desktop */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {questions.map((q: any, idx: number) => {
              const isAnswered = selectedAnswers[q.id] !== undefined;
              const isCurrent = currentIdx === idx;

              let btnStyle = "bg-white/5 border-white/10 text-slate-400 hover:border-white/30";
              if (isCurrent) {
                btnStyle = "bg-[#d4ff00] border-[#d4ff00] text-black font-black ring-2 ring-[#d4ff00]/50";
              } else if (isAnswered) {
                btnStyle = "bg-emerald-950/70 border-emerald-500/60 text-emerald-300 font-bold";
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-9 sm:h-10 rounded-xl border flex items-center justify-center text-xs font-mono transition-all active:scale-95 ${btnStyle}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Active Question Card */}
        {activeQ && (
          <section className="glass mt-5 sm:mt-6 p-5 sm:p-8 border-white/10 relative rounded-2xl">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#d4ff00] bg-[#d4ff00]/10 border border-[#d4ff00]/30 px-2.5 sm:px-3 py-1 rounded-full">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span className="font-mono text-[11px] sm:text-xs font-bold text-slate-400">100 PTS</span>
            </div>

            <h2 className="font-display font-bold text-lg sm:text-2xl text-white mt-3.5 sm:mt-4 mb-5 sm:mb-6 leading-snug text-left">
              {activeQ.question_text}
            </h2>

            <div className="grid gap-2.5 sm:gap-3">
              {activeQ.options.map((optText: string, oIdx: number) => {
                const isSelected = selectedChoice === oIdx;

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(activeQ.id, oIdx)}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-center justify-between active:scale-[0.99] ${
                      isSelected
                        ? "border-[#00f0ff] bg-[#00f0ff]/15 text-white ring-1 ring-[#00f0ff] shadow-lg shadow-[#00f0ff]/20"
                        : "border-white/10 bg-black/40 text-slate-300 hover:border-white/30 hover:bg-white/[0.03]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                          isSelected ? "bg-[#00f0ff] text-slate-950" : "bg-white/10 text-slate-300"
                        }`}
                      >
                        {"ABCD"[oIdx]}
                      </span>
                      <span className="font-medium text-xs sm:text-base leading-snug">{optText}</span>
                    </span>
                    {isSelected && (
                      <span className="font-mono text-[11px] text-[#00f0ff] font-bold shrink-0 ml-2">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Centered Footer Navigation Bar */}
      <footer className="mt-6 sm:mt-8 pt-4 border-t border-white/10 flex flex-col-reverse sm:flex-row justify-center sm:justify-between items-center gap-3 sm:gap-4">
        <button
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
          className="btn-secondary btn text-xs font-mono py-3 px-5 text-center w-full sm:w-auto"
        >
          ← PREVIOUS
        </button>

        <div className="flex gap-2 w-full sm:w-auto justify-center">
          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
              className="btn text-xs font-mono py-3 px-6 w-full sm:w-auto text-center"
            >
              NEXT QUESTION →
            </button>
          ) : (
            <button
              disabled={isSubmitting}
              onClick={handleSubmitQuiz}
              className="btn bg-[#d4ff00] text-black font-black text-xs font-mono py-3 px-6 shadow-lg shadow-[#d4ff00]/25 w-full sm:w-auto text-center"
            >
              {isSubmitting ? "RECORDING ANSWERS…" : "FINISH & SUBMIT QUIZ ✓"}
            </button>
          )}
        </div>
      </footer>
    </main>
  );
}




