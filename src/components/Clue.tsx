"use client";

import type { ClueView } from "@/lib/constants";
import { MODE_INFO } from "@/lib/constants";

/** The puzzle prompt for each mode. `shakeKey` changes on every wrong guess to replay the shake. */
export function Clue({ clue, shakeKey, solved }: { clue: ClueView; shakeKey: number; solved: boolean }) {
  const info = MODE_INFO[clue.mode];
  return (
    <section className="panel relative mx-auto w-full max-w-md overflow-hidden p-4 text-center sm:p-5">
      <h1 className="stroke-text text-2xl sm:text-3xl" style={{ color: info.color }}>
        {info.icon} {info.name}
      </h1>
      <p className="mt-1 font-bold text-white/85">{prompt(clue)}</p>
      <div key={shakeKey} className={shakeKey ? "animate-shake" : ""}>
        {clue.mode === "silhouette" && <SilhouetteClue clue={clue} solved={solved} />}
        {clue.mode === "emoji" && <EmojiClue clue={clue} />}
        {clue.mode === "ability" && <AbilityClue clue={clue} />}
      </div>
    </section>
  );
}

function prompt(clue: ClueView) {
  switch (clue.mode) {
    case "classic":
      return "Guess today's brawler. Each guess reveals how close its attributes are!";
    case "silhouette":
      return "Which brawler is hiding in the shadows? Every miss zooms out.";
    case "emoji":
      return "Which brawler do these emojis describe? Every miss adds an emoji.";
    case "ability":
      return `Which brawler has this ${clue.kind}?`;
  }
}

function SilhouetteClue({ clue, solved }: { clue: Extract<ClueView, { mode: "silhouette" }>; solved: boolean }) {
  return (
    <div className="mt-4">
      <div className="relative mx-auto aspect-square w-full max-w-72 overflow-hidden rounded-2xl border-[3px] border-ink bg-[radial-gradient(circle,#fff6c8_0%,#ffd84a_55%,#f5a300_100%)] shadow-[inset_0_0_30px_rgb(0_0_0/0.25)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={clue.image} src={clue.image} alt="Mystery brawler silhouette" className="size-full animate-pop object-contain" draggable={false} />
      </div>
      {!solved && (
        <div className="mt-3 flex items-center justify-center gap-1.5" aria-label={`Zoom level ${clue.level} of ${clue.maxLevel}`}>
          {Array.from({ length: clue.maxLevel }, (_, i) => (
            <span key={i} className={`h-2.5 w-6 rounded-full border-2 border-ink ${i < clue.level ? "bg-gold" : "bg-white/20"}`} />
          ))}
        </div>
      )}
      {!solved && clue.level < clue.maxLevel && (
        <p className="mt-2 text-sm font-bold text-white/70">Colours revealed after {clue.maxLevel - clue.level} more misses</p>
      )}
    </div>
  );
}

function EmojiClue({ clue }: { clue: Extract<ClueView, { mode: "emoji" }> }) {
  return (
    <div className="mt-4 flex justify-center gap-2 sm:gap-3">
      {Array.from({ length: clue.total }, (_, i) => {
        const e = clue.emojis[i];
        return (
          <div
            key={i}
            className={`grid aspect-square w-14 place-items-center rounded-2xl border-[3px] border-ink text-3xl sm:w-16 sm:text-4xl ${e ? "animate-pop bg-white/95 shadow-[inset_0_-4px_0_rgb(0_0_0/0.15)]" : "bg-ink/40"}`}
          >
            {e ?? <span className="stroke-text-sm text-2xl text-white/40">?</span>}
          </div>
        );
      })}
    </div>
  );
}

function AbilityClue({ clue }: { clue: Extract<ClueView, { mode: "ability" }> }) {
  const isGadget = clue.kind === "Gadget";
  return (
    <div className="mt-4">
      <div
        className={`mx-auto grid aspect-square w-40 place-items-center rounded-3xl border-[3px] border-ink shadow-[inset_0_-6px_0_rgb(0_0_0/0.2)] ${isGadget ? "bg-[radial-gradient(circle,#6ff28a,#1c9e3b)]" : "bg-[radial-gradient(circle,#ffe97a,#f0a000)]"}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={clue.image} alt={`Mystery ${clue.kind}`} className="size-28 object-contain drop-shadow-[0_4px_0_rgb(0_0_0/0.35)]" draggable={false} />
      </div>
      <div className="mt-3 space-y-2">
        {clue.name ? (
          <p className="stroke-text animate-pop text-xl text-gold">&ldquo;{clue.name}&rdquo;</p>
        ) : null}
        {clue.description ? <p className="panel-dark animate-pop px-3 py-2 text-sm font-semibold text-white/90">{clue.description}</p> : null}
        {clue.nextHintIn ? (
          <p className="text-sm font-bold text-white/70">
            Next hint in {clue.nextHintIn} {clue.nextHintIn === 1 ? "miss" : "misses"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
