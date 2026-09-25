import type { Metadata } from "next";
import Link from "next/link";
import { ENDLESS_MODES, MODE_INFO } from "@/lib/constants";
import { playerStats } from "@/lib/leaderboard";
import { peekPlayer } from "@/lib/player";

export const metadata: Metadata = { title: "My stats", robots: { index: false } };

export default async function ProfilePage() {
  const player = await peekPlayer();
  const stats = player ? await playerStats(player) : null;
  if (!stats) {
    return (
      <div className="panel mx-auto mt-6 max-w-md p-6 text-center">
        <p className="stroke-text text-2xl">No stats yet</p>
        <p className="mt-2 font-bold text-white/80">Play a puzzle and your stats will show up here.</p>
        <Link href="/classic" className="btn mt-4">Play Classic</Link>
      </div>
    );
  }
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h1 className="stroke-text text-center text-4xl text-gold">{stats.name ?? "Guest"}&apos;s stats</h1>
      <section className="panel flex items-center justify-around p-4 text-center">
        <div>
          <p className="stroke-text text-4xl text-gold">{stats.points.toLocaleString()}</p>
          <p className="font-bold text-white/80">points</p>
        </div>
        {stats.pointsRank && (
          <div>
            <p className="stroke-text text-4xl">#{stats.pointsRank}</p>
            <p className="font-bold text-white/80">global rank</p>
          </div>
        )}
      </section>
      {!stats.signedIn && (
        <p className="panel-dark px-4 py-3 text-center text-sm font-bold text-white/85">
          You&apos;re playing as a guest. Sign in to save progress across devices and join the leaderboards.
        </p>
      )}
      <section className="grid grid-cols-2 gap-3">
        {stats.modes.map((m) => (
          <div key={m.mode} className="panel-dark p-4">
            <p className="stroke-text-sm text-xl" style={{ color: MODE_INFO[m.mode].color }}>
              {MODE_INFO[m.mode].icon} {MODE_INFO[m.mode].name}
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm font-bold">
              <dt className="text-white/70">Solved</dt><dd className="text-right">{m.solves}</dd>
              <dt className="text-white/70">Avg guesses</dt><dd className="text-right">{m.avgGuesses ?? "—"}</dd>
              <dt className="text-white/70">Streak</dt><dd className="text-right">🔥 {m.streak}</dd>
              <dt className="text-white/70">Best streak</dt><dd className="text-right">{m.bestStreak}</dd>
            </dl>
          </div>
        ))}
      </section>
      <section className="panel-dark p-4">
        <p className="stroke-text-sm text-xl">♾️ Endless bests</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {ENDLESS_MODES.map((m) => (
            <li key={m} className="rounded-xl border-2 border-ink px-3 py-1 text-sm font-extrabold" style={{ background: MODE_INFO[m].color }}>
              <span className="stroke-text-sm">{MODE_INFO[m].icon} {MODE_INFO[m].name}: {stats.endlessBest[m] ?? 0}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
