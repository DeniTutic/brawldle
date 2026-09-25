import Link from "next/link";
import { BrawlerPortrait } from "@/components/BrawlerPortrait";
import { Countdown } from "@/components/GameBits";
import { Logo } from "@/components/Logo";
import { MODE_INFO } from "@/lib/constants";
import { dailySummary } from "@/lib/daily";
import { peekPlayer } from "@/lib/player";

export default async function Home() {
  const player = await peekPlayer();
  const summary = await dailySummary(player ?? { key: "anonymous" });
  const cleared = summary.modes.filter((m) => m.solved).length;

  return (
    <div className="flex flex-col items-center gap-6">
      <section className="mt-4 text-center">
        <Logo className="animate-float text-6xl sm:text-7xl" />
        <p className="stroke-text-sm mt-4 text-lg sm:text-xl">Guess the Brawl Stars brawler of the day!</p>
        <p className="mt-1 font-bold text-white/75">
          Puzzle #{summary.puzzleNo} · New brawlers in <Countdown to={summary.nextPuzzleAt} className="text-white" />
        </p>
      </section>

      <section className="grid w-full max-w-2xl grid-cols-2 gap-3 sm:gap-4" aria-label="Daily modes">
        {summary.modes.map(({ mode, solved, guesses }) => {
          const info = MODE_INFO[mode];
          return (
            <Link
              key={mode}
              href={`/${mode}`}
              className="group relative overflow-hidden rounded-3xl border-[3px] border-ink p-4 shadow-[inset_0_4px_0_rgb(255_255_255/0.35),inset_0_-6px_0_rgb(0_0_0/0.25),0_6px_0_var(--color-ink)] transition hover:-translate-y-1 active:translate-y-1 active:shadow-[inset_0_4px_0_rgb(255_255_255/0.35),0_1px_0_var(--color-ink)] sm:p-5"
              style={{ background: `linear-gradient(160deg, ${info.color}, color-mix(in oklab, ${info.color} 55%, #0b1240))` }}
            >
              <span aria-hidden className="absolute -bottom-3 -right-2 text-7xl opacity-30 transition group-hover:scale-110 sm:text-8xl">
                {info.icon}
              </span>
              <p className="stroke-text text-2xl sm:text-3xl">{info.name}</p>
              <p className="relative mt-1 text-sm font-bold leading-snug text-white/90 sm:text-base">{info.tagline}</p>
              <p className="stroke-text-sm relative mt-3 text-sm">
                {solved ? (
                  <span className="rounded-lg border-2 border-ink bg-win px-2 py-0.5">✓ Solved in {guesses}</span>
                ) : guesses ? (
                  <span className="rounded-lg border-2 border-ink bg-ink/40 px-2 py-0.5">{guesses} guesses so far</span>
                ) : (
                  <span className="rounded-lg border-2 border-ink bg-ink/40 px-2 py-0.5">Play ▶</span>
                )}
              </p>
            </Link>
          );
        })}
      </section>

      {cleared === 4 && <p className="stroke-text animate-pop text-2xl text-gold">🏆 All modes cleared today!</p>}

      <Link
        href="/endless"
        className="group relative flex w-full max-w-2xl items-center gap-4 overflow-hidden rounded-3xl border-[3px] border-ink bg-gradient-to-r from-[#ff5a36] to-[#c2185b] p-4 shadow-[inset_0_4px_0_rgb(255_255_255/0.3),inset_0_-6px_0_rgb(0_0_0/0.25),0_6px_0_var(--color-ink)] transition hover:-translate-y-1 sm:p-5"
      >
        <span aria-hidden className="text-5xl transition group-hover:rotate-12">♾️</span>
        <div>
          <p className="stroke-text text-2xl sm:text-3xl">Endless mode</p>
          <p className="font-bold text-white/90">Unlimited brawlers. Don&apos;t run out of hearts!</p>
        </div>
        <span className="btn btn-sm ml-auto hidden sm:inline-flex">Play</span>
      </Link>

      {summary.yesterday.length > 0 && (
        <section className="panel-dark w-full max-w-2xl p-4 text-center">
          <h2 className="stroke-text-sm text-lg">Yesterday&apos;s brawlers</h2>
          <ul className="mt-3 flex flex-wrap justify-center gap-4">
            {summary.yesterday.map(({ mode, brawler }) => (
              <li key={mode} className="flex flex-col items-center gap-1">
                <BrawlerPortrait brawler={brawler} size={56} />
                <span className="text-xs font-bold text-white/70">
                  {MODE_INFO[mode].icon} {brawler.name}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="w-full max-w-2xl text-center text-sm font-semibold leading-relaxed text-white/70">
        <h2 className="stroke-text-sm mb-1 text-base text-white">What is Brawldle?</h2>
        Brawldle is a free daily guessing game for Brawl Stars fans, inspired by Wordle. Every day at 00:00 UTC there&apos;s a new
        brawler to find in four modes. Keep your streak alive, climb the global leaderboards and test your knowledge of all{" "}
        {`${"100+"}`} brawlers in Endless mode.
      </section>
    </div>
  );
}
