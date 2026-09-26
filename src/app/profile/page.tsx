import type { Metadata } from "next";
import Link from "next/link";
import { Distribution } from "@/components/GameBits";
import { BADGES } from "@/lib/achievements";
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
        <p className="mt-2 font-bold text-white/80">Play a puzzle and your stats, streaks and badges will show up here.</p>
        <Link href="/classic" className="btn mt-4">Play Classic</Link>
      </div>
    );
  }
  const unlocked = new Set(stats.badges);
  const tiles = [
    { value: stats.points.toLocaleString(), label: "points", gold: true },
    stats.pointsRank ? { value: `#${stats.pointsRank}`, label: "global rank" } : { value: stats.solves, label: "puzzles solved" },
    { value: `🔥 ${stats.streak}`, label: `day streak · best ${stats.bestStreak}` },
    { value: `🌟 ${stats.fullClears}`, label: "full clears" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h1 className="stroke-text text-center text-3xl text-gold sm:text-4xl">{stats.name ?? "Guest"}&apos;s stats</h1>
      <section className="panel grid grid-cols-2 gap-y-4 p-4 text-center sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label}>
            <p className={`stroke-text text-3xl ${t.gold ? "text-gold" : ""}`}>{t.value}</p>
            <p className="text-sm font-bold text-white/80">{t.label}</p>
          </div>
        ))}
      </section>
      {!stats.signedIn && (
        <p className="panel-dark px-4 py-3 text-center text-sm font-bold text-white/85">
          You&apos;re playing as a guest. Sign in to save progress across devices and join the leaderboards.
        </p>
      )}

      <section className="panel-dark p-4">
        <p className="stroke-text-sm text-xl">
          🏅 Badges <span className="text-base text-white/60">{unlocked.size}/{BADGES.length}</span>
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BADGES.map((b) => {
            const has = unlocked.has(b.id);
            return (
              <li
                key={b.id}
                className={`slant slant-card flex items-center gap-3 rounded-xl p-3 ${has ? "skin-gold" : "skin-ink opacity-60"}`}
                style={{ "--bw": "3px", "--drop": has ? "4px" : "0px" } as React.CSSProperties}
                aria-label={`${b.name}: ${b.desc}${has ? " (unlocked)" : " (locked)"}`}
              >
                <span aria-hidden className={`text-3xl ${has ? "" : "grayscale"}`}>{has ? b.icon : "🔒"}</span>
                <span className="min-w-0">
                  <span className={`stroke-text-sm block text-sm ${has ? "" : "text-white/80"}`}>{b.name}</span>
                  <span className={`block text-xs font-bold leading-tight ${has ? "text-ink/80" : "text-white/60"}`}>{b.desc}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
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
            {m.solves > 0 && (
              <div className="mt-3">
                <Distribution dist={m.dist} color={MODE_INFO[m.mode].color} compact />
              </div>
            )}
          </div>
        ))}
      </section>
      <section className="panel-dark p-4">
        <p className="stroke-text-sm text-xl">♾️ Endless bests</p>
        <ul className="mt-3 flex flex-wrap gap-3">
          {ENDLESS_MODES.map((m) => (
            <li key={m} className="slant chip skin-mode text-sm" style={{ "--c": MODE_INFO[m].color } as React.CSSProperties}>
              <span aria-hidden>{MODE_INFO[m].icon}</span>
              <span className="stroke-text-sm">{MODE_INFO[m].name}: {stats.endlessBest[m] ?? 0}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
