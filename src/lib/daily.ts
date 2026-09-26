import "server-only";
import { FULL_CLEAR_BONUS, MODES, dailyPoints, type DailyState, type Mode } from "./constants";
import { col, type DailyPuzzleDoc, type GameDoc, type StreakDoc } from "./db";
import { addDays, dayOf, nextPuzzleAt, puzzleNumber } from "./day";
import { applyGuess, newRound, roundView, type Round } from "./game";
import { getBrawler, toRef } from "./brawlers";
import { ensurePlayer, type Player } from "./player";

const NO_REPEAT_DAYS = 60;

/** Gets (or creates, exactly once) the puzzle for a day + mode. */
export async function getDailyPuzzle(day: string, mode: Mode): Promise<DailyPuzzleDoc> {
  const _id = `${day}:${mode}`;
  const existing = await col.puzzles().findOne({ _id });
  if (existing) return existing;

  const recent = await col.puzzles().find({ mode, day: { $gte: addDays(day, -NO_REPEAT_DAYS) } }, { projection: { brawlerId: 1 } }).toArray();
  const sameDay = await col.puzzles().find({ day }, { projection: { brawlerId: 1 } }).toArray();
  const round = await newRound(mode, [...recent, ...sameDay].map((p) => p.brawlerId));
  const doc: DailyPuzzleDoc = { _id, day, mode, brawlerId: round.brawlerId, abilityId: round.abilityId, focus: round.focus, createdAt: new Date() };
  await col.puzzles().updateOne({ _id }, { $setOnInsert: doc }, { upsert: true }); // race-safe
  return (await col.puzzles().findOne({ _id }))!;
}

const toRound = (p: DailyPuzzleDoc, g: GameDoc | null): Round => ({
  mode: p.mode as Mode,
  brawlerId: p.brawlerId,
  abilityId: p.abilityId,
  focus: p.focus,
  guesses: [...(g?.guesses ?? [])], // copy: applyGuess mutates, and the stored length guards concurrent writes
  solved: g?.solved ?? false,
});

async function stateFor(day: string, puzzle: DailyPuzzleDoc, game: GameDoc | null): Promise<DailyState> {
  const mode = puzzle.mode as Mode;
  const solvers = await col.games().countDocuments({ day, mode, solved: true });
  const view = roundView(toRound(puzzle, game), (level) => `/api/daily/${mode}/image?d=${day}&l=${level}`);
  let percentile: number | undefined;
  if (game?.solved && game.guessCount && solvers > 1) {
    const beat = await col.games().countDocuments({ day, mode, solved: true, guessCount: { $gt: game.guessCount } });
    percentile = Math.round((100 * beat) / (solvers - 1));
  }
  return {
    ...view,
    day,
    puzzleNo: puzzleNumber(day),
    pointsEarned: game?.points,
    bonus: game?.bonus,
    solvers,
    percentile,
    nextPuzzleAt: nextPuzzleAt(day),
  };
}

export async function getDailyState(player: Player, mode: Mode) {
  const day = dayOf();
  const puzzle = await getDailyPuzzle(day, mode);
  const game = await col.games().findOne({ _id: `${player.key}:${day}:${mode}` });
  return stateFor(day, puzzle, game);
}

export async function getDailyRound(player: Player, mode: Mode, day = dayOf()) {
  const puzzle = await getDailyPuzzle(day, mode);
  const game = await col.games().findOne({ _id: `${player.key}:${day}:${mode}` });
  return toRound(puzzle, game);
}

export async function guessDaily(player: Player, mode: Mode, brawlerId: unknown) {
  const day = dayOf();
  const puzzle = await getDailyPuzzle(day, mode);
  const _id = `${player.key}:${day}:${mode}`;
  await col.games().updateOne(
    { _id },
    { $setOnInsert: { playerKey: player.key, day, mode, guesses: [], solved: false, startedAt: new Date() } },
    { upsert: true },
  );
  const game = (await col.games().findOne({ _id }))!;
  const round = toRound(puzzle, game);
  const result = applyGuess(round, brawlerId);
  if (!result.ok) return result;

  const update: Partial<GameDoc> = { guesses: round.guesses, solved: round.solved, userId: player.userId, name: player.name, image: player.image ?? null };
  if (round.solved) {
    const now = new Date();
    update.solvedAt = now;
    update.guessCount = round.guesses.length;
    update.durationMs = now.getTime() - game.startedAt.getTime();
    update.points = dailyPoints(round.guesses.length);
  }
  // Guard on the guess count so two concurrent requests can't both apply.
  const res = await col.games().updateOne({ _id, guesses: { $size: game.guesses.length }, solved: false }, { $set: update });
  if (!res.modifiedCount) return { ok: false as const, error: "Try again", status: 409 };
  if (round.solved) {
    const bonus = await recordDailySolve(player, mode, day, round.guesses.length, update.points!);
    if (bonus) {
      update.bonus = bonus;
      await col.games().updateOne({ _id }, { $set: { bonus } });
    }
  }

  return { ok: true as const, state: await stateFor(day, puzzle, { ...game, ...update } as GameDoc) };
}

const nextStreak = (s: StreakDoc | undefined, day: string): StreakDoc => {
  const current = s?.lastDay === addDays(day, -1) ? s.current + 1 : s?.lastDay === day ? s.current : 1;
  return { current, best: Math.max(current, s?.best ?? 0), lastDay: day };
};

/** Updates streaks, points and solve stats. Returns the full-clear bonus if this solve completed the day. */
async function recordDailySolve(player: Player, mode: Mode, day: string, guessCount: number, points: number) {
  await ensurePlayer(player);
  const p = (await col.players().findOne({ _id: player.key }))!;
  await col.players().updateOne(
    { _id: player.key },
    {
      $set: { [`streaks.${mode}`]: nextStreak(p.streaks?.[mode], day), "streaks.any": nextStreak(p.streaks?.any, day), updatedAt: new Date() },
      $inc: { points, [`solves.${mode}`]: 1, [`totalGuesses.${mode}`]: guessCount },
    },
  );
  const solvedToday = await col.games().countDocuments({ playerKey: player.key, day, solved: true });
  if (solvedToday < MODES.length) return 0;
  // The lastFullClear guard makes the bonus race-safe when two final solves land together.
  const res = await col.players().updateOne(
    { _id: player.key, lastFullClear: { $ne: day } },
    { $set: { lastFullClear: day }, $inc: { points: FULL_CLEAR_BONUS, fullClears: 1 } },
  );
  return res.modifiedCount ? FULL_CLEAR_BONUS : 0;
}

/** Home page summary: status of each mode today + yesterday's answers. */
export async function dailySummary(player: Player) {
  const day = dayOf();
  const yesterday = addDays(day, -1);
  const [games, yPuzzles, p, solvesToday] = await Promise.all([
    col.games().find({ playerKey: player.key, day }).toArray(),
    col.puzzles().find({ day: yesterday }).toArray(),
    col.players().findOne({ _id: player.key }, { projection: { streaks: 1 } }),
    col.games().countDocuments({ day, solved: true }),
  ]);
  const any = p?.streaks?.any;
  return {
    day,
    puzzleNo: puzzleNumber(day),
    nextPuzzleAt: nextPuzzleAt(day),
    streak: any && any.lastDay >= yesterday ? any.current : 0,
    solvesToday,
    modes: MODES.map((mode) => {
      const g = games.find((x) => x.mode === mode);
      return { mode, solved: !!g?.solved, guesses: g?.guesses.length ?? 0 };
    }),
    yesterday: MODES.flatMap((mode) => {
      const p = yPuzzles.find((x) => x.mode === mode);
      const b = p && getBrawler(p.brawlerId);
      return b ? [{ mode, brawler: toRef(b) }] : [];
    }),
  };
}
