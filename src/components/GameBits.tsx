"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { MODES, MODE_INFO, type BrawlerRef, type GuessView, type Mode } from "@/lib/constants";
import { BrawlerPortrait } from "./BrawlerPortrait";

/** Guess history for the non-classic modes. */
export function GuessList({ guesses }: { guesses: GuessView[] }) {
  if (!guesses.length) return null;
  return (
    <ol className="mx-auto flex w-full max-w-md flex-col gap-2">
      {[...guesses].reverse().map((g) => (
        <li
          key={g.brawler.id}
          className={`tile animate-pop !flex-row !justify-start gap-3 px-2 py-1.5 ${g.correct ? "tile-win" : "tile-lose"}`}
        >
          <BrawlerPortrait brawler={g.brawler} size={44} className="!border-2" />
          <span className="stroke-text-sm text-xl">{g.brawler.name}</span>
          <span className="stroke-text-sm ml-auto pr-2 text-2xl">{g.correct ? "✓" : "✗"}</span>
        </li>
      ))}
    </ol>
  );
}

const subscribeClock = (cb: () => void) => {
  const t = setInterval(cb, 1000);
  return () => clearInterval(t);
};
const clockSeconds = () => Math.floor(Date.now() / 1000) * 1000;

export function Countdown({ to, className = "" }: { to: string; className?: string }) {
  const now = useSyncExternalStore(subscribeClock, clockSeconds, () => null);
  useEffect(() => {
    if (now != null && now >= Date.parse(to)) window.location.reload();
  }, [now, to]);
  if (now == null) return <span className={className}>--:--:--</span>;
  const s = Math.max(0, Math.floor((Date.parse(to) - now) / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className={`tabular-nums ${className}`} suppressHydrationWarning>
      {pad(Math.floor(s / 3600))}:{pad(Math.floor((s % 3600) / 60))}:{pad(s % 60)}
    </span>
  );
}

export function ModeTabs({ current, solved = {} }: { current: Mode; solved?: Partial<Record<Mode, boolean>> }) {
  return (
    <nav className="mx-auto mb-4 flex w-full max-w-md justify-center gap-2" aria-label="Daily modes">
      {MODES.map((m) => {
        const info = MODE_INFO[m];
        const active = m === current;
        return (
          <Link
            key={m}
            href={`/${m}`}
            aria-current={active ? "page" : undefined}
            title={info.name}
            className={`relative grid size-14 place-items-center rounded-2xl border-[3px] border-ink text-2xl shadow-[0_4px_0_var(--color-ink)] transition active:translate-y-1 active:shadow-none sm:size-16 sm:text-3xl ${active ? "scale-110" : "opacity-80 hover:opacity-100"}`}
            style={{ background: `linear-gradient(180deg, ${info.color}, color-mix(in oklab, ${info.color} 60%, black))` }}
          >
            <span aria-hidden>{info.icon}</span>
            <span className="sr-only">{info.name}</span>
            {solved[m] && (
              <span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full border-2 border-ink bg-win text-xs font-black" aria-label="solved">
                ✓
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function WinPanel({
  answer,
  guesses,
  children,
  title = "GG!",
}: {
  answer: BrawlerRef;
  guesses: number;
  children?: React.ReactNode;
  title?: string;
}) {
  return (
    <section className="panel relative mx-auto w-full max-w-md animate-pop overflow-hidden p-5 text-center">
      <Confetti />
      <p className="stroke-text text-4xl text-gold">{title}</p>
      <div className="mt-3 flex items-center justify-center gap-4">
        <BrawlerPortrait brawler={answer} size={96} className="animate-float" />
        <div className="text-left">
          <p className="font-bold text-white/80">You found</p>
          <p className="stroke-text text-3xl">{answer.name}</p>
          <p className="font-bold text-white/80">
            in <span className="text-gold">{guesses}</span> {guesses === 1 ? "guess" : "guesses"}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Confetti() {
  const colors = ["#ffc61a", "#3fd14a", "#37a6ff", "#ff5fa2", "#a45cff", "#fff"];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={i}
          className="absolute top-0 block h-3 w-2 rounded-sm"
          style={{
            left: `${(i * 37) % 100}%`,
            background: colors[i % colors.length],
            animation: `confetti ${1.4 + (i % 5) * 0.25}s ${(i % 7) * 0.08}s ease-in both`,
          }}
        />
      ))}
      <style>{`@keyframes confetti { from { transform: translateY(-20px) rotate(0); opacity: 1 } to { transform: translateY(420px) rotate(720deg); opacity: 0 } }`}</style>
    </div>
  );
}
