import { LAUNCH_DAY } from "./constants";

/** Puzzles roll over at 00:00 UTC. Days are "YYYY-MM-DD" strings. */
export const dayOf = (d = new Date()) => d.toISOString().slice(0, 10);

export const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return dayOf(d);
};

export const puzzleNumber = (day: string) =>
  Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${LAUNCH_DAY}T00:00:00Z`)) / 86_400_000) + 1;

export const nextPuzzleAt = (day: string) => `${addDays(day, 1)}T00:00:00.000Z`;
