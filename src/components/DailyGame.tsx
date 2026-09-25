"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MODES, MODE_INFO, type BrawlerRef, type DailyState, type Mode } from "@/lib/constants";
import { ClassicBoard, ClassicLegend } from "./ClassicBoard";
import { Clue } from "./Clue";
import { Countdown, GuessList, ModeTabs, WinPanel } from "./GameBits";
import { GuessInput } from "./GuessInput";

export function DailyGame({ mode, brawlers }: { mode: Mode; brawlers: BrawlerRef[] }) {
  const [state, setState] = useState<DailyState | null>(null);
  const [solvedModes, setSolvedModes] = useState<Partial<Record<Mode, boolean>>>({});
  const [pending, setPending] = useState<BrawlerRef | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [animate, setAnimate] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/daily/${mode}`, { cache: "no-store" });
    if (res.ok) setState(await res.json());
    else setError("Couldn't load today's puzzle. Try refreshing.");
  }, [mode]);

  useEffect(() => {
    fetch(`/api/daily/${mode}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setState)
      .catch(() => setError("Couldn't load today's puzzle. Try refreshing."));
    fetch("/api/summary", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: { modes: { mode: Mode; solved: boolean }[] }) => setSolvedModes(Object.fromEntries(s.modes.map((m) => [m.mode, m.solved]))))
      .catch(() => {});
  }, [mode]);

  const guessed = useMemo(() => new Set(state?.guesses.map((g) => g.brawler.id)), [state]);

  async function guess(b: BrawlerRef) {
    if (!state || pending) return;
    setPending(b);
    setError(null);
    try {
      const res = await fetch(`/api/daily/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brawlerId: b.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        await load();
        return;
      }
      const next = data as DailyState;
      setAnimate(true);
      if (!next.solved) setShake((s) => s + 1);
      else setSolvedModes((s) => ({ ...s, [mode]: true }));
      setState(next);
    } catch {
      setError("Network error — check your connection");
    } finally {
      setPending(null);
    }
  }

  const nextMode = MODES.find((m) => m !== mode && !solvedModes[m]);

  return (
    <div className="flex flex-col items-center gap-4">
      <ModeTabs current={mode} solved={solvedModes} />
      {!state ? (
        <div className="panel mx-auto h-64 w-full max-w-md animate-pulse" aria-busy="true" />
      ) : (
        <>
          <p className="stroke-text-sm -mb-2 text-sm text-white/80">
            Puzzle #{state.puzzleNo} · {state.solvers.toLocaleString()} {state.solvers === 1 ? "player has" : "players have"} found it
          </p>
          <Clue clue={state.clue} shakeKey={shake} solved={state.solved} />

          {state.solved && state.answer ? (
            <WinPanel answer={state.answer} guesses={state.guesses.length}>
              {state.pointsEarned ? <p className="stroke-text mt-3 text-xl text-win">+{state.pointsEarned} points</p> : null}
              <div className="mt-4 flex flex-col items-center gap-3">
                {nextMode ? (
                  <Link href={`/${nextMode}`} className="btn btn-green">
                    Next: {MODE_INFO[nextMode].icon} {MODE_INFO[nextMode].name}
                  </Link>
                ) : (
                  <p className="stroke-text-sm text-lg text-gold">All 4 modes cleared today! 🏆</p>
                )}
                <div className="flex flex-wrap justify-center gap-2">
                  <Link href="/endless" className="btn btn-sm btn-red">Play Endless</Link>
                  <Link href="/leaderboard" className="btn btn-sm btn-blue">Leaderboard</Link>
                </div>
                <p className="text-sm font-bold text-white/75">
                  Next brawler in <Countdown to={state.nextPuzzleAt} className="stroke-text-sm text-base text-white" />
                </p>
              </div>
            </WinPanel>
          ) : (
            <GuessInput brawlers={brawlers} exclude={guessed} onGuess={guess} disabled={!!pending} />
          )}

          {error && <p className="stroke-text-sm text-lose" role="alert">{error}</p>}
          {pending && <p className="text-sm font-bold text-white/70">Checking {pending.name}…</p>}

          {mode === "classic" ? (
            <>
              <ClassicBoard guesses={state.guesses} animateLatest={animate} />
              {state.guesses.length > 0 && <ClassicLegend />}
            </>
          ) : (
            <GuessList guesses={state.guesses} />
          )}
        </>
      )}
    </div>
  );
}
