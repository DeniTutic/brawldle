"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { badgeById } from "@/lib/achievements";
import { MODES, MODE_INFO, RARITY_COLORS, type BrawlerRef, type GuessView, type Mode, type RoundView } from "@/lib/constants";
import { readLocal, writeLocal } from "@/lib/settings";
import { sfx } from "@/lib/sfx";
import { BrawlerPortrait } from "./BrawlerPortrait";
import { toast } from "./Toast";

/** Guess history for the non-classic modes. */
export function GuessList({ guesses }: { guesses: GuessView[] }) {
  if (!guesses.length) return null;
  return (
    <ol className="mx-auto flex w-full max-w-md flex-col gap-2">
      {[...guesses].reverse().map((g) => (
        <li
          key={g.brawler.id}
          className={`slant animate-pop flex items-center gap-3 rounded-xl py-1.5 pl-3 pr-4 ${g.correct ? "skin-win" : "skin-lose"}`}
          style={{ "--drop": "4px" } as React.CSSProperties}
        >
          <BrawlerPortrait brawler={g.brawler} size={44} />
          <span className="stroke-text-sm text-xl">{g.brawler.name}</span>
          <span className="stroke-text-sm ml-auto text-2xl">{g.correct ? "✓" : "✗"}</span>
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
    <nav className="mx-auto mb-2 flex w-full max-w-md justify-center gap-3 sm:gap-4" aria-label="Daily modes">
      {MODES.map((m) => {
        const info = MODE_INFO[m];
        const active = m === current;
        return (
          <Link key={m} href={`/${m}`} aria-current={active ? "page" : undefined} className="flex flex-col items-center gap-1.5">
            <span
              className={`slant skin-mode pressable grid size-14 place-items-center rounded-xl text-2xl sm:size-16 sm:text-3xl ${active ? "scale-110" : "opacity-75 hover:opacity-100"}`}
              style={{ "--c": info.color } as React.CSSProperties}
            >
              <span aria-hidden>{info.icon}</span>
              {solved[m] && (
                <span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full border-[3px] border-ink bg-win text-xs font-black" aria-label="solved">
                  ✓
                </span>
              )}
            </span>
            <span className={`stroke-text-sm text-xs sm:text-sm ${active ? "" : "text-white/70"}`}>{info.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <p className="mt-1 flex items-end justify-center gap-1" aria-label={`${n} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className={`stroke-text animate-pop leading-none ${i === 1 ? "-translate-y-2 text-6xl" : "text-5xl"} ${i < n ? "text-gold" : "text-white/15"}`}
          style={{ animationDelay: `${0.25 + i * 0.18}s` }}
        >
          ★
        </span>
      ))}
    </p>
  );
}

export function WinPanel({
  answer,
  info,
  guesses,
  stars,
  celebrate = false,
  children,
  title = "GG!",
}: {
  answer: BrawlerRef;
  info?: RoundView["answerInfo"];
  guesses: number;
  stars?: number;
  celebrate?: boolean;
  children?: React.ReactNode;
  title?: string;
}) {
  return (
    <section className="panel relative mx-auto w-full max-w-md animate-pop overflow-hidden p-5 text-center">
      {celebrate && <Confetti />}
      <p className="stroke-text text-4xl text-gold sm:text-5xl">{title}</p>
      {stars ? <Stars n={stars} /> : null}
      <div className="mt-3 flex items-center justify-center gap-4">
        <BrawlerPortrait brawler={answer} size={96} className="animate-float" />
        <div className="text-left">
          <p className="font-bold text-white/80">You found</p>
          <p className="stroke-text text-2xl sm:text-3xl">{answer.name}</p>
          {info && <BrawlerTags info={info} />}
          <p className="mt-1 font-bold text-white/80">
            in <span className="text-gold">{guesses}</span> {guesses === 1 ? "guess" : "guesses"}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function BrawlerTags({ info }: { info: NonNullable<RoundView["answerInfo"]> }) {
  return (
    <p className="mt-1 flex flex-wrap gap-1.5 text-xs">
      <span className="slant chip skin-ink stroke-text-sm" style={{ color: RARITY_COLORS[info.rarity] }}>
        {info.rarity}
      </span>
      <span className="slant chip skin-ink stroke-text-sm">{info.role}</span>
    </p>
  );
}

const CONFETTI_COLORS = ["#ffc61a", "#3fd14a", "#37a6ff", "#ff5fa2", "#a45cff", "#fff", "#ff5a36"];

/** A one-off full-screen confetti burst. Portalled so transformed parents can't trap the fixed layer. */
export function Confetti({ count = 70 }: { count?: number }) {
  const [alive, setAlive] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setAlive(false), 4200);
    return () => clearTimeout(t);
  }, []);
  if (!alive || typeof document === "undefined") return null;
  return createPortal(
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="absolute top-0 block rounded-[3px] border-2 border-ink"
          style={
            {
              left: `${(i * 37) % 100}%`,
              width: i % 3 ? 10 : 14,
              height: i % 2 ? 16 : 10,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              "--dx": `${((i * 53) % 40) - 20}vw`,
              "--spin": `${360 + ((i * 97) % 900)}deg`,
              animation: `confetti ${1.9 + (i % 6) * 0.25}s ${(i % 10) * 0.07}s cubic-bezier(0.3, 0.6, 0.6, 1) both`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>,
    document.body,
  );
}

/** Wordle-style guess histogram. `highlight` is the bucket index of today's result. */
export function Distribution({ dist, highlight, color = "#ffc61a", compact = false }: { dist: number[]; highlight?: number; color?: string; compact?: boolean }) {
  const lastUsed = dist.reduce((last, n, i) => (n ? i : last), 0);
  const rows = compact ? dist.slice(0, Math.max(6, lastUsed + 1, (highlight ?? 0) + 1)) : dist;
  const max = Math.max(1, ...dist);
  return (
    <ol className="space-y-1" aria-label="Guess distribution">
      {rows.map((n, i) => (
        <li key={i} className="flex items-center gap-2 text-sm font-extrabold">
          <span className="w-7 shrink-0 text-right text-white/75">{i === dist.length - 1 ? `${i + 1}+` : i + 1}</span>
          <span className="min-w-0 flex-1">
            <span
              className={`block rounded-md border-[3px] border-ink px-1.5 text-right leading-tight ${highlight === i ? "stroke-text-sm text-white" : "bg-white/15"}`}
              style={{
                width: `max(2rem, ${(n / max) * 100}%)`,
                background: highlight === i ? color : n ? `color-mix(in oklab, ${color} 45%, #1a2878)` : undefined,
              }}
            >
              {n}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Pops a toast for each badge the player hasn't seen on this device yet. */
export function announceNewBadges(unlocked: string[]) {
  const seen = readLocal<string[]>("bd_badges", []);
  const fresh = unlocked.filter((id) => !seen.includes(id));
  if (!fresh.length) return;
  writeLocal("bd_badges", unlocked);
  fresh.slice(0, 3).forEach((id, i) =>
    setTimeout(() => {
      const b = badgeById(id);
      if (!b) return;
      toast(`New badge: ${b.name}!`, b.icon);
      if (i === 0) sfx.badge();
    }, 1400 + i * 1000),
  );
}
