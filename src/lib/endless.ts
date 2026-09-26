import "server-only";
import { randomBytes } from "node:crypto";
import { ENDLESS_HEARTS, ENDLESS_POINTS_PER_SOLVE, MODES, type EndlessMode, type EndlessState, type Mode } from "./constants";
import { col, type RunDoc } from "./db";
import { applyGuess, newRound, roundView, type Round } from "./game";
import { ensurePlayer, type Player } from "./player";

const RECENT = 40;

async function roundFor(mode: EndlessMode, recent: number[]) {
  const m: Mode = mode === "mixed" ? MODES[Math.floor(Math.random() * MODES.length)] : mode;
  return newRound(m, recent);
}

async function bestFor(player: Player, mode: string) {
  const p = await col.players().findOne({ _id: player.key }, { projection: { endlessBest: 1 } });
  return p?.endlessBest?.[mode] ?? 0;
}

async function view(run: RunDoc, player: Player): Promise<EndlessState> {
  const round = run.round as Round;
  const tag = `${run._id}-${run.score}-${run.hearts}`;
  return {
    id: run._id,
    mode: run.mode as EndlessMode,
    hearts: run.hearts,
    maxHearts: run.maxHearts,
    score: run.score,
    over: run.status === "over",
    best: await bestFor(player, run.mode),
    roundNo: run.rounds ?? 1,
    round: roundView(round, (level) => `/api/endless/image?r=${tag}&l=${level}`, round.solved || !!round.skipped || run.status === "over"),
  };
}

export const activeRun = (player: Player) => col.runs().findOne({ playerKey: player.key, status: "active" });

export async function getEndless(player: Player) {
  const run = (await activeRun(player)) ?? (await col.runs().findOne({ playerKey: player.key }, { sort: { startedAt: -1 } }));
  return run ? view(run, player) : null;
}

export async function startEndless(player: Player, mode: EndlessMode) {
  await col.runs().updateMany({ playerKey: player.key, status: "active" }, { $set: { status: "over", endedAt: new Date() } });
  const round = await roundFor(mode, []);
  const run: RunDoc = {
    _id: randomBytes(12).toString("hex"),
    playerKey: player.key,
    userId: player.userId,
    name: player.name,
    image: player.image ?? null,
    mode,
    hearts: ENDLESS_HEARTS[mode],
    maxHearts: ENDLESS_HEARTS[mode],
    score: 0,
    rounds: 1,
    status: "active",
    round,
    recent: [round.brawlerId],
    startedAt: new Date(),
  };
  await col.runs().insertOne(run);
  return view(run, player);
}

/** Stores points and the Endless best after a solve or when a run ends. */
async function recordEndless(player: Player, run: RunDoc, solved: boolean) {
  if (!solved && run.status !== "over") return;
  await ensurePlayer(player);
  const best = await bestFor(player, run.mode);
  await col.players().updateOne(
    { _id: player.key },
    {
      $inc: { points: solved ? ENDLESS_POINTS_PER_SOLVE : 0 },
      $set: { [`endlessBest.${run.mode}`]: Math.max(best, run.score), updatedAt: new Date() },
    },
  );
}

function loseHeart(run: RunDoc) {
  run.hearts -= 1;
  if (run.hearts <= 0) {
    run.status = "over";
    run.endedAt = new Date();
  }
}

export async function guessEndless(player: Player, brawlerId: unknown) {
  const run = await activeRun(player);
  if (!run) return { ok: false as const, error: "No active run", status: 404 };
  const round = run.round as Round;
  const prevGuesses = round.guesses.length;
  const result = applyGuess(round, brawlerId);
  if (!result.ok) return result;

  if (result.correct) {
    run.score += 1;
    if (round.guesses.length === 1) run.hearts = Math.min(run.maxHearts, run.hearts + 1); // first-try refund
  } else loseHeart(run);
  const res = await col.runs().updateOne(
    { _id: run._id, status: "active", "round.guesses": { $size: prevGuesses } },
    { $set: { round, score: run.score, hearts: run.hearts, status: run.status, endedAt: run.endedAt, userId: player.userId, name: player.name, image: player.image ?? null } },
  );
  if (!res.modifiedCount) return { ok: false as const, error: "Try again", status: 409 };
  await recordEndless(player, run, result.correct);
  return { ok: true as const, state: await view(run, player) };
}

/** Gives up on the current round for a heart and reveals the answer. */
export async function skipEndless(player: Player) {
  const run = await activeRun(player);
  if (!run) return { ok: false as const, error: "No active run", status: 404 };
  if (run.round.solved || run.round.skipped) return { ok: false as const, error: "Round is over", status: 409 };
  run.round.skipped = true;
  loseHeart(run);
  const res = await col.runs().updateOne(
    { _id: run._id, status: "active", "round.solved": false, "round.skipped": { $ne: true } },
    { $set: { "round.skipped": true, hearts: run.hearts, status: run.status, endedAt: run.endedAt } },
  );
  if (!res.modifiedCount) return { ok: false as const, error: "Try again", status: 409 };
  await recordEndless(player, run, false);
  return { ok: true as const, state: await view(run, player) };
}

export async function nextEndless(player: Player) {
  const run = await activeRun(player);
  if (!run) return { ok: false as const, error: "No active run", status: 404 };
  if (!run.round.solved && !run.round.skipped) return { ok: false as const, error: "Round not finished", status: 409 };
  const round = await roundFor(run.mode as EndlessMode, run.recent);
  const recent = [...run.recent, round.brawlerId].slice(-RECENT);
  const rounds = (run.rounds ?? 1) + 1;
  const res = await col.runs().updateOne(
    { _id: run._id, $or: [{ "round.solved": true }, { "round.skipped": true }] },
    { $set: { round, recent, rounds } },
  );
  if (!res.modifiedCount) return { ok: false as const, error: "Try again", status: 409 };
  return { ok: true as const, state: await view({ ...run, round, recent, rounds }, player) };
}

export async function quitEndless(player: Player) {
  await col.runs().updateMany({ playerKey: player.key, status: "active" }, { $set: { status: "over", endedAt: new Date() } });
  return getEndless(player);
}
