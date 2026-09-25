import "server-only";
import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/brawldle";

// Reuse one client across hot reloads in dev and across invocations in serverless.
const g = globalThis as unknown as { _mongo?: MongoClient; _indexes?: Promise<unknown> };
export const client = (g._mongo ??= new MongoClient(uri, { ignoreUndefined: true }));
export const db: Db = client.db();

export type DailyPuzzleDoc = {
  _id: string; // `${day}:${mode}`
  day: string;
  mode: string;
  brawlerId: number;
  abilityId?: number;
  focus?: { x: number; y: number };
  createdAt: Date;
};

export type GameDoc = {
  _id: string; // `${playerKey}:${day}:${mode}`
  playerKey: string;
  userId?: string;
  name?: string;
  image?: string | null;
  day: string;
  mode: string;
  guesses: number[];
  solved: boolean;
  guessCount?: number;
  durationMs?: number;
  points?: number;
  startedAt: Date;
  solvedAt?: Date;
};

export type RoundDoc = { mode: string; brawlerId: number; abilityId?: number; focus?: { x: number; y: number }; guesses: number[]; solved: boolean };

export type RunDoc = {
  _id: string;
  playerKey: string;
  userId?: string;
  name?: string;
  image?: string | null;
  mode: string;
  hearts: number;
  maxHearts: number;
  score: number;
  status: "active" | "over";
  round: RoundDoc;
  recent: number[];
  startedAt: Date;
  endedAt?: Date;
};

export type StreakDoc = { current: number; best: number; lastDay: string };
export type PlayerDoc = {
  _id: string; // playerKey: "u:<userId>" or "g:<cookie id>"
  userId?: string;
  name?: string;
  image?: string | null;
  points: number;
  streaks: Record<string, StreakDoc>;
  endlessBest: Record<string, number>;
  solves: Record<string, number>;
  totalGuesses: Record<string, number>;
  mergedInto?: string;
  createdAt: Date;
  updatedAt: Date;
};

export const col = {
  puzzles: () => db.collection<DailyPuzzleDoc>("daily_puzzles"),
  games: () => db.collection<GameDoc>("games"),
  runs: () => db.collection<RunDoc>("endless_runs"),
  players: () => db.collection<PlayerDoc>("players"),
};

export function ensureIndexes() {
  g._indexes ??= Promise.all([
    col.games().createIndex({ day: 1, mode: 1, solved: 1, guessCount: 1, durationMs: 1 }),
    col.games().createIndex({ playerKey: 1 }),
    col.runs().createIndex({ playerKey: 1, status: 1 }),
    col.runs().createIndex({ mode: 1, status: 1, score: -1 }),
    col.players().createIndex({ userId: 1 }, { sparse: true }),
    col.players().createIndex({ points: -1 }),
    col.puzzles().createIndex({ mode: 1, day: -1 }),
  ]).catch((e) => {
    g._indexes = undefined;
    console.error("index creation failed", e);
  });
  return g._indexes;
}
