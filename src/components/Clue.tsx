"use client";

import { useEffect, useState } from "react";
import {
  ABILITY_DESC_AFTER,
  ABILITY_NAME_AFTER,
  CLASSIC_HINT_AFTER,
  MODE_INFO,
  SILHOUETTE_MAX_LEVEL,
  type ClueView,
  type Mode,
} from "@/lib/constants";
import { readLocal, writeLocal } from "@/lib/settings";

const RULES: Record<Mode, string[]> = {
  classic: [
    "Type any brawler's name to guess.",
    "Each tile shows whether that attribute matches today's brawler.",
    "▲ / ▼ tell you if the answer is higher (rarer, faster, newer…) or lower.",
    `Stuck? After ${CLASSIC_HINT_AFTER} misses you get a letter hint.`,
  ],
  silhouette: [
    "Guess who's hiding in the shadow.",
    "Every miss zooms out a little.",
    `After ${SILHOUETTE_MAX_LEVEL} misses the colours come back.`,
  ],
  emoji: ["These emojis describe one brawler.", "Every miss reveals one more emoji.", "The first ones are the trickiest!"],
  ability: [
    "Whose gadget or star power is this icon?",
    `After ${ABILITY_NAME_AFTER} misses you see its name.`,
    `After ${ABILITY_DESC_AFTER} misses you see what it does.`,
  ],
};

/** The puzzle prompt for each mode. `shakeKey` changes on every wrong guess to replay the shake. */
export function Clue({ clue, shakeKey, solved }: { clue: ClueView; shakeKey: number; solved: boolean }) {
  const info = MODE_INFO[clue.mode];
  const seenKey = `bd_seen_${clue.mode}`;
  // Tips open on a player's first visit to a mode and fold away after their next guess.
  // (Clues only render after the puzzle is fetched on the client, so reading storage here can't mismatch hydration.)
  const [tipsAt, setTipsAt] = useState<{ shake: number; solved: boolean } | null>(() =>
    !solved && !readLocal(seenKey, false) ? { shake: shakeKey, solved } : null,
  );
  const tips = tipsAt?.shake === shakeKey && tipsAt.solved === solved;
  const setTips = (open: boolean) => setTipsAt(open ? { shake: shakeKey, solved } : null);
  useEffect(() => writeLocal(seenKey, true), [seenKey]);

  return (
    <section className="panel relative mx-auto w-full max-w-md overflow-hidden p-4 text-center sm:p-5">
      <button
        onClick={() => setTips(!tips)}
        aria-expanded={tips}
        aria-label="How to play this mode"
        className="slant skin-ink pressable stroke-text-sm absolute right-3 top-3 grid size-9 place-items-center rounded-lg text-lg"
        style={{ "--drop": "3px", "--bw": "3px" } as React.CSSProperties}
      >
        ?
      </button>
      <h1 className="stroke-text px-10 text-2xl sm:text-3xl" style={{ color: info.color }}>
        {info.icon} {info.name}
      </h1>
      <p className="mt-2 font-semibold text-white/85">{prompt(clue)}</p>
      {tips && (
        <ul className="panel-dark animate-pop mt-3 space-y-1 px-4 py-3 text-left text-sm font-bold text-white/90">
          {[...RULES[clue.mode], "Fewer guesses = more points and more ⭐!"].map((r) => (
            <li key={r} className="flex gap-2">
              <span aria-hidden className="text-gold">▸</span>
              {r}
            </li>
          ))}
        </ul>
      )}
      <div key={shakeKey} className={shakeKey ? "animate-shake" : ""}>
        {clue.mode === "classic" && <ClassicClue clue={clue} />}
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

function ClassicClue({ clue }: { clue: Extract<ClueView, { mode: "classic" }> }) {
  if (clue.hint) return <p className="stroke-text animate-pop mt-3 text-xl text-gold">💡 {clue.hint}</p>;
  if (!clue.nextHintIn) return null;
  return (
    <p className="mt-2 text-sm font-bold text-white/70">
      💡 Letter hint in {clue.nextHintIn} {clue.nextHintIn === 1 ? "miss" : "misses"}
    </p>
  );
}

function SilhouetteClue({ clue, solved }: { clue: Extract<ClueView, { mode: "silhouette" }>; solved: boolean }) {
  return (
    <div className="mt-4">
      <div className="relative mx-auto aspect-square w-full max-w-[min(18rem,40dvh)] overflow-hidden rounded-2xl border-4 border-ink bg-[radial-gradient(circle,#fff6c8_0%,#ffd84a_55%,#f5a300_100%)] shadow-[inset_0_0_30px_rgb(0_0_0/0.25),0_5px_0_var(--color-ink)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={clue.image} src={clue.image} alt="Mystery brawler silhouette" className="size-full animate-pop object-contain" draggable={false} />
      </div>
      {!solved && (
        <div className="mt-3 flex items-center justify-center gap-1.5" aria-label={`Zoom level ${clue.level} of ${clue.maxLevel}`}>
          {Array.from({ length: clue.maxLevel }, (_, i) => (
            <span key={i} className={`h-3 w-7 -skew-x-12 rounded-[4px] border-[3px] border-ink ${i < clue.level ? "bg-gold" : "bg-white/20"}`} />
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
            className={`slant grid aspect-square w-14 place-items-center rounded-xl text-3xl sm:w-16 sm:text-4xl ${e ? "skin-white animate-pop" : "skin-ink"}`}
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
        className={`mx-auto grid aspect-square w-40 -rotate-3 place-items-center rounded-2xl border-4 border-ink shadow-[inset_0_4px_0_rgb(255_255_255/0.35),inset_0_-6px_0_rgb(0_0_0/0.2),0_6px_0_var(--color-ink)] ${isGadget ? "bg-[radial-gradient(circle,#6ff28a,#1c9e3b)]" : "bg-[radial-gradient(circle,#ffe97a,#f0a000)]"}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={clue.image} alt={`Mystery ${clue.kind}`} className="size-28 rotate-3 object-contain drop-shadow-[0_4px_0_rgb(0_0_0/0.35)]" draggable={false} />
      </div>
      <div className="mt-3 space-y-2">
        {clue.name ? (
          <p className="stroke-text animate-pop text-xl text-gold">&ldquo;{clue.name}&rdquo;</p>
        ) : null}
        {clue.description ? <p className="panel-dark animate-pop px-3 py-2 text-sm font-medium text-white/90">{clue.description}</p> : null}
        {clue.nextHintIn ? (
          <p className="text-sm font-bold text-white/70">
            Next hint in {clue.nextHintIn} {clue.nextHintIn === 1 ? "miss" : "misses"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
