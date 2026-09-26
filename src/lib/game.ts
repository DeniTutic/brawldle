import "server-only";
import {
  ABILITY_DESC_AFTER,
  ABILITY_NAME_AFTER,
  CLASSIC_COLUMNS,
  CLASSIC_HINT_AFTER,
  EMOJI_COUNT,
  RANGE_ORDER,
  RARITY_ORDER,
  SILHOUETTE_MAX_LEVEL,
  SPEED_ORDER,
  type ClassicCell,
  type ClueView,
  type Mode,
  type RoundView,
} from "./constants";
import { BRAWLERS, getBrawler, toRef, type Brawler } from "./brawlers";
import { pickFocus } from "./images";

export type Round = {
  mode: Mode;
  brawlerId: number;
  abilityId?: number;
  focus?: { x: number; y: number };
  guesses: number[];
  solved: boolean;
  skipped?: boolean; // Endless: given up for a heart, answer revealed
};

const ORDERS: Partial<Record<string, string[]>> = { rarity: RARITY_ORDER, speed: SPEED_ORDER, range: RANGE_ORDER };

function rank(key: string, v: string | number) {
  const order = ORDERS[key];
  return order ? order.indexOf(String(v)) : Number(v);
}

export function classicCells(guess: Brawler, answer: Brawler): ClassicCell[] {
  return CLASSIC_COLUMNS.map(({ key }) => {
    const value = guess[key];
    const correct = value === answer[key];
    const ordinal = key === "rarity" || key === "speed" || key === "range" || key === "releaseYear";
    const dir = !correct && ordinal ? (rank(key, answer[key]) > rank(key, value) ? "up" : "down") : undefined;
    return { key, value, correct, dir };
  });
}

const wrongCount = (r: Round) => r.guesses.filter((g) => g !== r.brawlerId).length;

/** Builds what the player is allowed to see for a round. The answer is only included once revealed. */
export function roundView(r: Round, imageUrl: (level: number) => string, reveal = r.solved || !!r.skipped): RoundView {
  const answer = getBrawler(r.brawlerId)!;
  const wrong = wrongCount(r);
  const guesses = r.guesses.map((id) => {
    const b = getBrawler(id)!;
    const correct = id === r.brawlerId;
    return { brawler: toRef(b), correct, cells: r.mode === "classic" ? classicCells(b, answer) : undefined };
  });

  let clue: ClueView;
  switch (r.mode) {
    case "classic":
      clue = reveal
        ? { mode: "classic" }
        : wrong >= CLASSIC_HINT_AFTER
          ? { mode: "classic", hint: `Starts with "${answer.name[0]}"` }
          : { mode: "classic", nextHintIn: CLASSIC_HINT_AFTER - wrong };
      break;
    case "silhouette": {
      const level = reveal ? SILHOUETTE_MAX_LEVEL : Math.min(wrong, SILHOUETTE_MAX_LEVEL);
      clue = { mode: "silhouette", level, maxLevel: SILHOUETTE_MAX_LEVEL, image: imageUrl(level) };
      break;
    }
    case "emoji": {
      const shown = reveal ? EMOJI_COUNT : Math.min(1 + wrong, EMOJI_COUNT);
      clue = { mode: "emoji", emojis: answer.emojis.slice(0, shown), total: EMOJI_COUNT };
      break;
    }
    case "ability": {
      const ability = answer.abilities.find((a) => a.id === r.abilityId)!;
      const redacted = ability.description.replace(new RegExp(answer.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "???");
      clue = {
        mode: "ability",
        image: imageUrl(0),
        kind: ability.kind,
        name: reveal || wrong >= ABILITY_NAME_AFTER ? ability.name : undefined,
        description: reveal || wrong >= ABILITY_DESC_AFTER ? redacted : undefined,
        nextHintIn: reveal ? undefined : wrong < ABILITY_NAME_AFTER ? ABILITY_NAME_AFTER - wrong : wrong < ABILITY_DESC_AFTER ? ABILITY_DESC_AFTER - wrong : undefined,
      };
      break;
    }
  }
  return {
    mode: r.mode,
    guesses,
    solved: r.solved,
    skipped: r.skipped || undefined,
    clue,
    answer: reveal ? toRef(answer) : undefined,
    answerInfo: reveal ? { rarity: answer.rarity, role: answer.role } : undefined,
  };
}

/** Picks a fresh answer for a mode, avoiding recently used brawlers where possible. */
export async function newRound(mode: Mode, avoid: Iterable<number> = []): Promise<Round> {
  const avoidSet = new Set(avoid);
  let pool = BRAWLERS.filter((b) => !avoidSet.has(b.id));
  if (mode === "ability") pool = pool.filter((b) => b.abilities.length);
  if (!pool.length) pool = BRAWLERS.filter((b) => mode !== "ability" || b.abilities.length);
  const b = pool[Math.floor(Math.random() * pool.length)];
  const round: Round = { mode, brawlerId: b.id, guesses: [], solved: false };
  if (mode === "ability") round.abilityId = b.abilities[Math.floor(Math.random() * b.abilities.length)].id;
  if (mode === "silhouette") round.focus = await pickFocus(b.id);
  return round;
}

export type GuessResult = { ok: true; correct: boolean } | { ok: false; error: string; status: number };

/** Applies a guess to a round in place. */
export function applyGuess(r: Round, brawlerId: unknown): GuessResult {
  if (r.solved) return { ok: false, error: "Already solved", status: 409 };
  if (r.skipped) return { ok: false, error: "Round is over", status: 409 };
  if (typeof brawlerId !== "number" || !getBrawler(brawlerId)) return { ok: false, error: "Unknown brawler", status: 400 };
  if (r.guesses.includes(brawlerId)) return { ok: false, error: "Already guessed", status: 409 };
  r.guesses.push(brawlerId);
  const correct = brawlerId === r.brawlerId;
  if (correct) r.solved = true;
  return { ok: true, correct };
}
