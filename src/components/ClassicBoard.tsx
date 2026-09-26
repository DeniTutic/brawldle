"use client";

import { useEffect, useRef, useState } from "react";
import { CLASSIC_COLUMNS, RARITY_COLORS, type GuessView } from "@/lib/constants";
import { BrawlerPortrait } from "./BrawlerPortrait";

const COLS = "grid-cols-[repeat(7,4rem)] gap-1.5 sm:grid-cols-[repeat(7,5.25rem)] sm:gap-2";
// The pinned portrait column stays put while the attributes scroll under it on narrow screens.
const PINNED = "sticky left-0 z-10 drop-shadow-[4px_0_0_rgb(5_7_26/0.45)]";

export function ClassicBoard({ guesses, animateLatest }: { guesses: GuessView[]; animateLatest: boolean }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [moreRight, setMoreRight] = useState(false);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => setMoreRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [guesses.length]);

  if (!guesses.length) return null;
  const rows = [...guesses].reverse(); // newest on top
  return (
    <div
      ref={scroller}
      className={`-mx-4 min-w-0 self-stretch overflow-x-auto pb-2 [scrollbar-width:thin] ${moreRight ? "[mask-image:linear-gradient(to_right,#000_82%,transparent)]" : ""}`}
    >
      {/* Padding lives inside the scroller so the pinned column sticks flush to its edge. */}
      <div className="mx-auto w-max px-4">
        <div className={`mb-2 grid ${COLS}`}>
          {["Brawler", ...CLASSIC_COLUMNS.map((c) => c.label)].map((l, i) => (
            <div
              key={l}
              className={`slant chip skin-ink stroke-text-sm justify-center !px-1 text-[0.7rem] sm:text-sm ${i === 0 ? PINNED : ""}`}
              style={i === 0 ? ({ "--skin": "#131c5e" } as React.CSSProperties) : undefined}
            >
              {l}
            </div>
          ))}
        </div>
        <ol className="flex flex-col gap-1.5 sm:gap-2">
          {rows.map((g, r) => (
            <li key={g.brawler.id} className={`grid ${COLS} [perspective:600px]`}>
              <div className={`grid aspect-square place-items-center ${PINNED}`} title={g.brawler.name}>
                <BrawlerPortrait brawler={g.brawler} size={84} className="size-full! animate-pop" />
              </div>
              {g.cells!.map((c, i) => {
                const label = CLASSIC_COLUMNS.find((col) => col.key === c.key)!.label;
                const hint = c.correct ? "correct" : c.dir === "up" ? "wrong, answer is higher" : c.dir === "down" ? "wrong, answer is lower" : "wrong";
                return (
                  <div
                    key={c.key}
                    aria-label={`${label}: ${c.value}, ${hint}`}
                    className={`tile aspect-square px-0.5 text-[0.62rem] hyphens-auto sm:text-[0.8rem] ${c.correct ? "tile-win" : "tile-lose"} ${r === 0 && animateLatest ? "animate-flip" : ""}`}
                    style={r === 0 && animateLatest ? { animationDelay: `${(i + 1) * 0.28}s` } : undefined}
                  >
                    {c.dir && <span className="tile-arrow" aria-hidden>{c.dir === "up" ? "▲" : "▼"}</span>}
                    <span
                      aria-hidden
                      className="stroke-text-sm relative break-words"
                      style={c.key === "rarity" ? { color: RARITY_COLORS[String(c.value)] } : undefined}
                    >
                      {c.value}
                    </span>
                  </div>
                );
              })}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function ClassicLegend() {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm font-bold text-white/80">
      <span className="flex items-center gap-1.5"><i className="tile tile-win size-5 !rounded-md !border-[3px]" /> Correct</span>
      <span className="flex items-center gap-1.5"><i className="tile tile-lose size-5 !rounded-md !border-[3px]" /> Wrong</span>
      <span>▲ higher / newer</span>
      <span>▼ lower / older</span>
    </div>
  );
}
