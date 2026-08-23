import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-between overflow-x-hidden">
      {/* Top Header */}
      <header className="w-full border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-[#090a0f]/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="w-3 h-3 bg-[#d4ff00] rounded-sm inline-block transform rotate-45 group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-display font-black text-lg sm:text-xl tracking-tight text-white uppercase">
              EPOCH<span className="text-[#d4ff00]">.</span>2026
            </span>
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <Link
              href="/leaderboard"
              className="text-xs font-mono font-bold text-slate-300 hover:text-white px-2.5 py-1.5 transition-colors"
            >
              LEADERBOARD ↗
            </Link>
            <Link
              href="/admin"
              className="text-xs font-mono font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-all"
            >
              HOST
            </Link>
          </div>
        </div>
      </header>

      {/* Centered Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-20 pb-12 w-full flex flex-col items-center text-center">
        {/* Live Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#d4ff00]/30 bg-[#d4ff00]/10 text-[#d4ff00] text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-[#d4ff00] animate-ping" />
          ANNUAL FRESHERS CHALLENGE 2026
        </div>

        {/* Centered Title */}
        <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight uppercase leading-[1.02] sm:leading-[0.95] text-white max-w-4xl mx-auto">
          WE DRIVE <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4ff00] via-[#00f0ff] to-white">
            EMOTIONS.
          </span>
          <span className="font-serif-italic font-normal tracking-normal text-slate-300 lowercase text-3xl sm:text-5xl md:text-6xl block mt-2 sm:mt-3">
            freshers challenge 2026
          </span>
        </h1>

        {/* Centered Description */}
        <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mt-6 sm:mt-8 font-light leading-relaxed">
          10 Questions. 5 Minutes. Live synchronized competition for up to 100+ students split equally into balanced 4-player teams.
        </p>

        {/* Centered CTA Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none">
          <Link
            href="/join"
            className="btn text-center text-sm sm:text-base px-8 py-3.5 sm:py-4 shadow-xl shadow-[#d4ff00]/20 w-full sm:w-auto font-black"
          >
            JOIN THE CHALLENGE →
          </Link>
          <Link
            href="/leaderboard"
            className="btn-secondary btn text-center text-sm sm:text-base px-6 py-3.5 sm:py-4 w-full sm:w-auto font-bold"
          >
            VIEW LIVE LEADERBOARD ↗
          </Link>
        </div>

        {/* Centered Specs Protocol Bar */}
        <div className="max-w-4xl w-full mx-auto mt-12 sm:mt-16 glass p-5 sm:p-7 border-white/10 rounded-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            <div className="pt-2 sm:pt-0">
              <span className="font-mono text-[11px] sm:text-xs text-slate-400 block mb-1">QUESTIONS</span>
              <span className="font-mono font-black text-base sm:text-xl text-white">10 QUESTIONS</span>
            </div>
            <div className="pt-2 sm:pt-0 sm:pl-4">
              <span className="font-mono text-[11px] sm:text-xs text-slate-400 block mb-1">TIME LIMIT</span>
              <span className="font-mono font-black text-base sm:text-xl text-[#00f0ff]">05:00 MINS</span>
            </div>
            <div className="pt-2 sm:pt-0 sm:pl-4">
              <span className="font-mono text-[11px] sm:text-xs text-slate-400 block mb-1">TEAM CAPACITY</span>
              <span className="font-mono font-black text-base sm:text-xl text-white">MAX 4 / SQUAD</span>
            </div>
            <div className="pt-2 sm:pt-0 sm:pl-4">
              <span className="font-mono text-[11px] sm:text-xs text-slate-400 block mb-1">MAX SCORE</span>
              <span className="font-mono font-black text-base sm:text-xl text-[#d4ff00]">1000 PTS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Continuous Marquee Ticker */}
      <section className="w-full py-3.5 border-y border-white/10 bg-white/[0.02] my-2 sm:my-6 overflow-hidden">
        <div className="marquee-container font-mono text-[11px] sm:text-xs tracking-widest uppercase font-bold text-slate-300">
          <div className="marquee-content">
            <span className="text-[#d4ff00]">✦ EPOCH 2026</span>
            <span>// 10 QUESTIONS · 5 MINUTES</span>
            <span className="text-[#00f0ff]">✦ INSTANT AUTOMATIC OUTPUT</span>
            <span>// 100+ CONCURRENT STUDENTS</span>
            <span className="text-[#d4ff00]">✦ DYNAMIC EQUAL TEAMS</span>
            <span>// LIVE LEADERBOARD BROADCAST</span>
            <span className="text-[#00f0ff]">✦ WE DRIVE EMOTIONS</span>
          </div>
          <div className="marquee-content" aria-hidden="true">
            <span className="text-[#d4ff00]">✦ EPOCH 2026</span>
            <span>// 10 QUESTIONS · 5 MINUTES</span>
            <span className="text-[#00f0ff]">✦ INSTANT AUTOMATIC OUTPUT</span>
            <span>// 100+ CONCURRENT STUDENTS</span>
            <span className="text-[#d4ff00]">✦ DYNAMIC EQUAL TEAMS</span>
            <span>// LIVE LEADERBOARD BROADCAST</span>
            <span className="text-[#00f0ff]">✦ WE DRIVE EMOTIONS</span>
          </div>
        </div>
      </section>

      {/* Centered Feature Cards Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 w-full">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <span className="font-mono text-xs uppercase tracking-widest text-[#d4ff00] font-bold block mb-1.5">
            ✦ CHALLENGE ARCHITECTURE
          </span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight uppercase">
            Designed for Speed & Squads.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="glass-card p-6 sm:p-8 group rounded-2xl text-center sm:text-left flex flex-col items-center sm:items-start">
            <span className="font-mono text-xs text-[#d4ff00] font-bold block mb-2">01 // SPEED & LOGIC</span>
            <h3 className="font-display font-black text-xl sm:text-2xl text-white group-hover:text-[#d4ff00] transition-colors">
              10 Curated Questions
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-2 sm:mt-3 leading-relaxed">
              Curated tech, logic, code, and freshers trivia questions built for lightning-fast intuition.
            </p>
          </div>

          <div className="glass-card p-6 sm:p-8 group rounded-2xl text-center sm:text-left flex flex-col items-center sm:items-start">
            <span className="font-mono text-xs text-[#00f0ff] font-bold block mb-2">02 // FIVE-MINUTE RUSH</span>
            <h3 className="font-display font-black text-xl sm:text-2xl text-white group-hover:text-[#00f0ff] transition-colors">
              Synchronized 05:00 Timer
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-2 sm:mt-3 leading-relaxed">
              Real-time countdown with automatic answer capture and instant results breakdown on completion.
            </p>
          </div>

          <div className="glass-card p-6 sm:p-8 group rounded-2xl text-center sm:text-left flex flex-col items-center sm:items-start">
            <span className="font-mono text-xs text-violet-400 font-bold block mb-2">03 // TEAM DYNAMICS</span>
            <h3 className="font-display font-black text-xl sm:text-2xl text-white group-hover:text-violet-400 transition-colors">
              Dynamic Balanced Squads
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-2 sm:mt-3 leading-relaxed">
              Automatic team generation scaling to 100+ players, capped at exactly 4 members per team.
            </p>
          </div>
        </div>
      </section>

      {/* Centered Footer */}
      <footer className="border-t border-white/10 py-6 sm:py-8 px-4 sm:px-6 bg-[#07080b]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-center gap-4 text-xs font-mono text-slate-500">
          <p>© 2026 EPOCH FRESHERS CHALLENGE. ALL RIGHTS RESERVED.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link href="/join" className="hover:text-slate-300 transition-colors">
              JOIN
            </Link>
            <Link href="/leaderboard" className="hover:text-slate-300 transition-colors">
              LEADERBOARD
            </Link>
            <Link href="/admin" className="hover:text-slate-300 transition-colors">
              HOST ACCESS
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}



