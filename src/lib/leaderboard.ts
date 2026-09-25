import "server-only";
import { MODES, isEndlessMode, isMode, type Mode } from "./constants";
import { col } from "./db";
import { addDays, dayOf } from "./day";
import type { Player } from "./player";

export const BOARDS = ["today", "streak", "endless", "points"] as const;
export type Board = (typeof BOARDS)[number];

export type LeaderRow = { rank: number; key: string; name: string; image: string | null; value: number; sub?: string; me?: boolean };

const LIMIT = 50;
const nameOf = (n?: string) => n || "Brawler";

function fmtDuration(ms?: number) {
  if (ms == null) return undefined;
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

export async function leaderboard(board: Board, mode: string, me: Player | null): Promise<LeaderRow[]> {
  const mark = (rows: LeaderRow[]) => rows.map((r) => ({ ...r, me: r.key === me?.key }));

  if (board === "today") {
    const m: Mode = isMode(mode) ? mode : "classic";
    const games = await col.games()
      .find({ day: dayOf(), mode: m, solved: true, userId: { $type: "string" } })
      .sort({ guessCount: 1, durationMs: 1 })
      .limit(LIMIT)
      .toArray();
    return mark(games.map((g, i) => ({ rank: i + 1, key: g.playerKey, name: nameOf(g.name), image: g.image ?? null, value: g.guessCount!, sub: fmtDuration(g.durationMs) })));
  }

  if (board === "streak") {
    const m: Mode = isMode(mode) ? mode : "classic";
    const players = await col.players()
      .find({ userId: { $type: "string" }, [`streaks.${m}.lastDay`]: { $gte: addDays(dayOf(), -1) } })
      .sort({ [`streaks.${m}.current`]: -1, [`streaks.${m}.best`]: -1 })
      .limit(LIMIT)
      .toArray();
    return mark(players.map((p, i) => ({ rank: i + 1, key: p._id, name: nameOf(p.name), image: p.image ?? null, value: p.streaks[m].current, sub: `best ${p.streaks[m].best}` })));
  }

  if (board === "endless") {
    const m = isEndlessMode(mode) ? mode : "mixed";
    const players = await col.players()
      .find({ userId: { $type: "string" }, [`endlessBest.${m}`]: { $gt: 0 } })
      .sort({ [`endlessBest.${m}`]: -1 })
      .limit(LIMIT)
      .toArray();
    return mark(players.map((p, i) => ({ rank: i + 1, key: p._id, name: nameOf(p.name), image: p.image ?? null, value: p.endlessBest[m] })));
  }

  const players = await col.players().find({ userId: { $type: "string" }, points: { $gt: 0 } }).sort({ points: -1 }).limit(LIMIT).toArray();
  return mark(players.map((p, i) => ({ rank: i + 1, key: p._id, name: nameOf(p.name), image: p.image ?? null, value: p.points })));
}

export async function playerStats(player: Player) {
  const p = await col.players().findOne({ _id: player.key });
  const yesterday = addDays(dayOf(), -1);
  const rankAbove = p?.userId && p.points > 0 ? await col.players().countDocuments({ userId: { $type: "string" }, points: { $gt: p.points } }) : null;
  return {
    signedIn: !!player.userId,
    name: player.name ?? null,
    image: player.image ?? null,
    points: p?.points ?? 0,
    pointsRank: rankAbove == null ? null : rankAbove + 1,
    modes: MODES.map((mode) => {
      const s = p?.streaks?.[mode];
      const solves = p?.solves?.[mode] ?? 0;
      return {
        mode,
        solves,
        avgGuesses: solves ? Math.round(((p?.totalGuesses?.[mode] ?? 0) / solves) * 10) / 10 : null,
        streak: s && s.lastDay >= yesterday ? s.current : 0,
        bestStreak: s?.best ?? 0,
      };
    }),
    endlessBest: p?.endlessBest ?? {},
  };
}
