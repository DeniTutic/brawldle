import { CLASSIC_COLUMNS, RARITY_COLORS, type GuessView } from "@/lib/constants";
import { BrawlerPortrait } from "./BrawlerPortrait";

export function ClassicBoard({ guesses, animateLatest }: { guesses: GuessView[]; animateLatest: boolean }) {
  if (!guesses.length) return null;
  const rows = [...guesses].reverse(); // newest on top
  return (
    <div className="-mx-4 min-w-0 self-stretch overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
      <div className="mx-auto w-max">
        <div className="mb-2 grid grid-cols-[repeat(7,4.5rem)] gap-1.5 sm:grid-cols-[repeat(7,5.25rem)] sm:gap-2">
          {["Brawler", ...CLASSIC_COLUMNS.map((c) => c.label)].map((l) => (
            <div key={l} className="slant chip skin-ink stroke-text-sm justify-center !px-1 text-xs sm:text-sm">
              {l}
            </div>
          ))}
        </div>
        <ol className="flex flex-col gap-1.5 sm:gap-2">
          {rows.map((g, r) => (
            <li key={g.brawler.id} className="grid grid-cols-[repeat(7,4.5rem)] gap-1.5 [perspective:600px] sm:grid-cols-[repeat(7,5.25rem)] sm:gap-2">
              <div className="grid aspect-square place-items-center" title={g.brawler.name}>
                <BrawlerPortrait brawler={g.brawler} size={84} className="size-full! animate-pop" />
              </div>
              {g.cells!.map((c, i) => (
                <div
                  key={c.key}
                  className={`tile aspect-square px-0.5 text-[0.69rem] hyphens-auto sm:text-[0.8rem] ${c.correct ? "tile-win" : "tile-lose"} ${r === 0 && animateLatest ? "animate-flip" : ""}`}
                  style={r === 0 && animateLatest ? { animationDelay: `${(i + 1) * 0.28}s` } : undefined}
                >
                  {c.dir && <span className="tile-arrow">{c.dir === "up" ? "▲" : "▼"}</span>}
                  <span
                    className="stroke-text-sm relative break-words"
                    style={c.key === "rarity" ? { color: RARITY_COLORS[String(c.value)] } : undefined}
                  >
                    {c.value}
                  </span>
                </div>
              ))}
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
