import "server-only";
import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { auth } from "./auth";
import { col, ensureIndexes, type PlayerDoc, type StreakDoc } from "./db";

const COOKIE = "bd_pid";

export type Player = { key: string; userId?: string; name?: string; image?: string | null };

/**
 * Resolves who is playing: a signed-in user, or an anonymous guest identified by a cookie.
 * Must be called from a Route Handler (it may set the guest cookie).
 */
export async function getPlayer(): Promise<Player> {
  void ensureIndexes();
  const jar = await cookies();
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  let pid = jar.get(COOKIE)?.value;

  if (session) {
    const player: Player = { key: `u:${session.user.id}`, userId: session.user.id, name: session.user.name, image: session.user.image };
    await col.players().updateOne(
      { _id: player.key },
      { $set: { userId: player.userId, name: player.name, image: player.image ?? null, updatedAt: new Date() }, $setOnInsert: newStats() },
      { upsert: true },
    );
    if (pid) {
      await mergeGuest(`g:${pid}`, player);
      jar.delete(COOKIE);
    }
    return player;
  }

  if (!pid || !/^[a-f0-9]{32}$/.test(pid)) {
    pid = randomBytes(16).toString("hex");
    jar.set(COOKIE, pid, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 400, path: "/" });
  }
  return { key: `g:${pid}` };
}

/** Read-only identity for server components (never sets cookies). */
export async function peekPlayer(): Promise<Player | null> {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (session) return { key: `u:${session.user.id}`, userId: session.user.id, name: session.user.name, image: session.user.image };
  const pid = (await cookies()).get(COOKIE)?.value;
  return pid ? { key: `g:${pid}` } : null;
}

const newStats = () => ({ points: 0, streaks: {}, endlessBest: {}, solves: {}, totalGuesses: {}, createdAt: new Date() });

export async function ensurePlayer(p: Player) {
  await col.players().updateOne({ _id: p.key }, { $setOnInsert: { ...newStats(), updatedAt: new Date() } }, { upsert: true });
}

/** Moves a guest's games, runs and stats onto their account the first time they sign in. */
async function mergeGuest(guestKey: string, user: Player) {
  const guest = await col.players().findOne({ _id: guestKey, mergedInto: { $exists: false } });
  if (!guest) return;
  const claimed = await col.players().updateOne({ _id: guestKey, mergedInto: { $exists: false } }, { $set: { mergedInto: user.key } });
  if (!claimed.modifiedCount) return;

  for await (const game of col.games().find({ playerKey: guestKey })) {
    const id = `${user.key}:${game.day}:${game.mode}`;
    const moved = { ...game, _id: id, playerKey: user.key, userId: user.userId, name: user.name, image: user.image };
    await col.games().insertOne(moved).catch(() => {}); // user already played that puzzle: keep theirs
  }
  await col.games().deleteMany({ playerKey: guestKey });

  const hasActiveRun = await col.runs().countDocuments({ playerKey: user.key, status: "active" });
  if (!hasActiveRun) await col.runs().updateMany({ playerKey: guestKey, status: "active" }, { $set: { playerKey: user.key, userId: user.userId, name: user.name, image: user.image } });
  await col.runs().updateMany({ playerKey: guestKey }, { $set: { status: "over" } });

  const u = (await col.players().findOne({ _id: user.key }))!;
  const set: Partial<PlayerDoc> = { points: (u.points ?? 0) + (guest.points ?? 0) };
  const streaks: Record<string, StreakDoc> = { ...u.streaks };
  for (const [mode, s] of Object.entries(guest.streaks ?? {})) {
    const mine = streaks[mode];
    if (!mine || s.lastDay > mine.lastDay || (s.lastDay === mine.lastDay && s.current > mine.current)) streaks[mode] = { ...s, best: Math.max(s.best, mine?.best ?? 0) };
    else streaks[mode] = { ...mine, best: Math.max(mine.best, s.best) };
  }
  set.streaks = streaks;
  set.endlessBest = { ...u.endlessBest };
  for (const [m, v] of Object.entries(guest.endlessBest ?? {})) set.endlessBest[m] = Math.max(v, u.endlessBest?.[m] ?? 0);
  set.solves = { ...u.solves };
  set.totalGuesses = { ...u.totalGuesses };
  for (const [m, v] of Object.entries(guest.solves ?? {})) set.solves[m] = (u.solves?.[m] ?? 0) + v;
  for (const [m, v] of Object.entries(guest.totalGuesses ?? {})) set.totalGuesses[m] = (u.totalGuesses?.[m] ?? 0) + v;
  await col.players().updateOne({ _id: user.key }, { $set: set });
}
