"use client";

import { useEffect, useState } from "react";
import { ENDLESS_MODES, MODES, MODE_INFO } from "@/lib/constants";

type Row = { rank: number; key: string; name: string; image: string | null; value: number; sub?: string; me?: boolean };
type Board = "today" | "streak" | "endless" | "points";

const BOARDS: { id: Board; label: string; unit: (v: number) => string; hint: string }[] = [
  { id: "today", label: "Today", unit: (v) => `${v} ${v === 1 ? "guess" : "guesses"}`, hint: "Fewest guesses today (time breaks ties)" },
  { id: "streak", label: "Streaks", unit: (v) => `🔥 ${v}`, hint: "Consecutive days solved" },
  { id: "endless", label: "Endless", unit: (v) => `🏆 ${v}`, hint: "Best Endless run" },
  { id: "points", label: "Points", unit: (v) => `${v.toLocaleString()} pts`, hint: "All-time points from every mode" },
];

export function Leaderboard({ initialBoard, signedIn, googleEnabled }: { initialBoard: Board; signedIn: boolean; googleEnabled: boolean }) {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [mode, setMode] = useState<string>(initialBoard === "endless" ? "mixed" : "classic");
  const [data, setData] = useState<{ query: string; rows: Row[] } | null>(null);
  const query = `board=${board}&mode=${mode}`;
  const rows = data?.query === query ? data.rows : null;

  useEffect(() => {
    fetch(`/api/leaderboard?${query}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setData({ query, rows: d.rows }))
      .catch(() => setData({ query, rows: [] }));
  }, [query]);

  const meta = BOARDS.find((b) => b.id === board)!;
  const modes = board === "points" ? [] : board === "endless" ? ENDLESS_MODES : MODES;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4">
      <h1 className="stroke-text text-3xl text-gold sm:text-5xl">🏆 Leaderboards</h1>
      <div role="tablist" className="panel-dark flex w-full gap-1.5 p-2">
        {BOARDS.map((b) => (
          <button
            key={b.id}
            role="tab"
            aria-selected={board === b.id}
            onClick={() => {
              setBoard(b.id);
              if (b.id === "endless") setMode("mixed");
              else if (mode === "mixed") setMode("classic");
            }}
            className={`slant stroke-text-sm flex-1 rounded-lg py-2 text-base sm:text-lg ${board === b.id ? "skin-gold" : "slant-ghost text-white/85"}`}
          >
            {b.label}
          </button>
        ))}
      </div>
      {modes.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {modes.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`slant chip skin-mode pressable stroke-text-sm text-sm ${mode === m ? "scale-105" : "opacity-60 hover:opacity-100"}`}
              style={{ "--c": MODE_INFO[m].color } as React.CSSProperties}
            >
              <span aria-hidden>{MODE_INFO[m].icon}</span>
              {MODE_INFO[m].name}
            </button>
          ))}
        </div>
      )}
      <p className="text-sm font-bold text-white/70">{meta.hint}</p>

      {!signedIn && (
        <p className="panel-dark w-full px-4 py-3 text-center text-sm font-bold text-white/85">
          {googleEnabled ? "Sign in with Google to appear on the leaderboards — your guest progress comes with you." : "Leaderboards show signed-in players."}
        </p>
      )}

      <ol className="panel w-full divide-y-[3px] divide-ink/40 overflow-hidden p-0">
        {rows === null ? (
          <li className="h-40 animate-pulse" aria-busy="true" />
        ) : rows.length === 0 ? (
          <li className="px-4 py-10 text-center font-bold text-white/75">No one here yet — be the first! 🚀</li>
        ) : (
          rows.map((r) => (
            <li key={r.key} className={`flex items-center gap-3 px-3 py-2.5 sm:px-4 ${r.me ? "bg-gold/25" : ""}`}>
              <span className="stroke-text w-9 text-center text-xl">{r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank}</span>
              {r.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.image} alt="" className="size-10 rounded-xl border-[3px] border-ink object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="stroke-text-sm grid size-10 place-items-center rounded-xl border-[3px] border-ink bg-royal">{r.name[0]}</span>
              )}
              <span className="min-w-0 flex-1 truncate font-extrabold">
                {r.name}
                {r.me && <span className="ml-2 text-xs text-gold">(you)</span>}
              </span>
              <span className="text-right">
                <span className="stroke-text-sm block text-lg">{meta.unit(r.value)}</span>
                {r.sub && <span className="block text-xs font-bold text-white/60">{r.sub}</span>}
              </span>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}
