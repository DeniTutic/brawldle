// Shared (client + server) game constants. Nothing in here may reveal an answer.

export const MODES = ["classic", "silhouette", "emoji", "ability"] as const;
export type Mode = (typeof MODES)[number];
export const ENDLESS_MODES = [...MODES, "mixed"] as const;
export type EndlessMode = (typeof ENDLESS_MODES)[number];

export const isMode = (m: unknown): m is Mode => MODES.includes(m as Mode);
export const isEndlessMode = (m: unknown): m is EndlessMode => ENDLESS_MODES.includes(m as EndlessMode);

export const MODE_INFO: Record<EndlessMode, { name: string; tagline: string; icon: string; color: string }> = {
  classic: { name: "Classic", tagline: "Guess the brawler from its attributes", icon: "🏆", color: "#ffc61a" },
  silhouette: { name: "Silhouette", tagline: "Who's hiding in the shadows?", icon: "👤", color: "#a45cff" },
  emoji: { name: "Emoji", tagline: "Decode the emoji clues", icon: "😎", color: "#ff5fa2" },
  ability: { name: "Ability", tagline: "Whose gadget or star power is this?", icon: "⚡", color: "#3ddc5a" },
  mixed: { name: "Mixed", tagline: "A random mode every round", icon: "🎲", color: "#ff5a36" },
};

export const RARITY_ORDER = ["Common", "Rare", "Super Rare", "Epic", "Mythic", "Legendary", "Ultra Legendary"];
export const SPEED_ORDER = ["Very Slow", "Slow", "Normal", "Fast", "Very Fast"];
export const RANGE_ORDER = ["Short", "Normal", "Long", "Very Long"];

export const RARITY_COLORS: Record<string, string> = {
  Common: "#b9eaff",
  Rare: "#68fd58",
  "Super Rare": "#5ab3ff",
  Epic: "#d850ff",
  Mythic: "#fe5e72",
  Legendary: "#fff11e",
  "Ultra Legendary": "#ff9d2e",
};

/** Day #1 of Brawldle (UTC). */
export const LAUNCH_DAY = "2026-09-24";

export const SILHOUETTE_MAX_LEVEL = 7; // level 7 = full-size, in colour
export const EMOJI_COUNT = 5;
export const ABILITY_NAME_AFTER = 3; // wrong guesses before the ability name is revealed
export const ABILITY_DESC_AFTER = 6;
export const CLASSIC_HINT_AFTER = 6; // wrong guesses before Classic reveals the first letter

export const ENDLESS_HEARTS: Record<EndlessMode, number> = { classic: 15, silhouette: 10, emoji: 10, ability: 10, mixed: 12 };
export const ENDLESS_POINTS_PER_SOLVE = 5;
export const FULL_CLEAR_BONUS = 50;

/** Points for a daily solve: 100 for a first-try guess, -10 per extra guess, minimum 10. */
export const dailyPoints = (guessCount: number) => Math.max(10, 110 - 10 * guessCount);

/** 1-3 star rating for a solve. */
export const starsFor = (guessCount: number) => (guessCount <= 3 ? 3 : guessCount <= 6 ? 2 : 1);

export type BrawlerRef = { id: number; name: string; slug: string };

export type ClassicKey = "rarity" | "role" | "gender" | "speed" | "range" | "releaseYear";
export const CLASSIC_COLUMNS: { key: ClassicKey; label: string }[] = [
  { key: "rarity", label: "Rarity" },
  { key: "role", label: "Class" },
  { key: "gender", label: "Gender" },
  { key: "speed", label: "Speed" },
  { key: "range", label: "Range" },
  { key: "releaseYear", label: "Released" },
];
export type ClassicCell = { key: ClassicKey; value: string | number; correct: boolean; dir?: "up" | "down" };

export type GuessView = { brawler: BrawlerRef; correct: boolean; cells?: ClassicCell[] };

export type ClueView =
  | { mode: "classic"; hint?: string; nextHintIn?: number }
  | { mode: "silhouette"; level: number; maxLevel: number; image: string }
  | { mode: "emoji"; emojis: string[]; total: number }
  | { mode: "ability"; image: string; kind: string; name?: string; description?: string; nextHintIn?: number };

export type RoundView = {
  mode: Mode;
  guesses: GuessView[]; // oldest first
  solved: boolean;
  clue: ClueView;
  answer?: BrawlerRef;
  answerInfo?: { rarity: string; role: string };
  skipped?: boolean;
};

export type DailyState = RoundView & {
  day: string;
  puzzleNo: number;
  pointsEarned?: number;
  bonus?: number; // full-clear bonus, on the puzzle that completed the day
  solvers: number;
  percentile?: number; // share of other solvers who needed more guesses, once solved
  nextPuzzleAt: string;
};

export type EndlessState = {
  id: string;
  mode: EndlessMode;
  hearts: number;
  maxHearts: number;
  score: number;
  over: boolean;
  best: number;
  roundNo: number;
  round: RoundView;
};
