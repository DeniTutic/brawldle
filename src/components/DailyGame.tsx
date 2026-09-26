"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MODES, MODE_INFO, starsFor, type BrawlerRef, type DailyState, type Mode } from "@/lib/constants";
import type { PlayerStats } from "@/lib/leaderboard";
import { dailyShareText } from "@/lib/share";
import { sfx } from "@/lib/sfx";
import { ClassicBoard, ClassicLegend } from "./ClassicBoard";
import { Clue } from "./Clue";
import { Countdown, Distribution, GuessList, ModeTabs, WinPanel, announceNewBadges } from "./GameBits";
import { GuessInput } from "./GuessInput";
import { ShareButton } from "./ShareButton";

export function DailyGame({ mode, brawlers }: { mode: Mode; brawlers: BrawlerRef[] }) {
  const [state, setState] = useState<DailyState | null>(null);
  const [solvedModes, setSolvedModes] = useState<Partial<Record<Mode, boolean>>>({});
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [pending, setPending] = useState<BrawlerRef | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [announce, setAnnounce] = useState("");

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

  const solved = !!state?.solved;
  useEffect(() => {
    if (!solved) return;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: PlayerStats) => {
        setStats(s);
        announceNewBadges(s.badges);
      })
      .catch(() => {});
  }, [solved]);

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
      if (next.solved) {
        sfx.correct();
        setSolvedModes((s) => ({ ...s, [mode]: true }));
        setAnnounce(`${b.name} — correct! Solved in ${next.guesses.length}.`);
      } else {
        sfx.wrong();
        setShake((s) => s + 1);
        setAnnounce(`${b.name} — wrong.`);
      }
      setState(next);
    } catch {
      setError("Network error — check your connection");
    } finally {
      setPending(null);
    }
  }

  const nextMode = MODES.find((m) => m !== mode && !solvedModes[m]);
  const modeStats = stats?.modes.find((m) => m.mode === mode);

  return (
    <div className="flex flex-col items-center gap-4">
      <ModeTabs current={mode} solved={solvedModes} />
      <p className="sr-only" aria-live="polite">{announce}</p>
      {!state ? (
        <div className="panel mx-auto h-64 w-full max-w-md animate-pulse" aria-busy="true" />
      ) : (
        <>
          <p className="stroke-text-sm -mb-2 text-sm text-white/80">
            Puzzle #{state.puzzleNo} ·{" "}
            {state.solvers === 0
              ? "Be the first to find it today! 🚀"
              : `${state.solvers.toLocaleString()} ${state.solvers === 1 ? "player has" : "players have"} found it`}
          </p>
          <Clue clue={state.clue} shakeKey={shake} solved={state.solved} />

          {state.solved && state.answer ? (
            <WinPanel answer={state.answer} info={state.answerInfo} guesses={state.guesses.length} stars={starsFor(state.guesses.length)} celebrate={animate}>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                {state.pointsEarned ? <p className="stroke-text text-xl text-win">+{state.pointsEarned} pts</p> : null}
                {state.bonus ? <p className="stroke-text animate-pop text-xl text-gold">🌟 Full clear +{state.bonus}!</p> : null}
              </div>
              <p className="mt-1 text-sm font-bold text-white/85">
                {state.solvers <= 1
                  ? "You're the first to crack it today! 🥇"
                  : state.percentile != null && state.percentile > 0
                    ? `Better than ${state.percentile}% of players today`
                    : `${state.solvers.toLocaleString()} players solved it today`}
                {modeStats && modeStats.streak > 1 ? ` · 🔥 ${modeStats.streak}-day streak` : ""}
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <ShareButton className="btn btn-blue" text={() => dailyShareText(state, stats?.streak)} />
                {nextMode && (
                  <Link href={`/${nextMode}`} className="btn btn-green">
                    Next: {MODE_INFO[nextMode].icon} {MODE_INFO[nextMode].name}
                  </Link>
                )}
              </div>
              {!nextMode && <p className="stroke-text-sm mt-3 text-lg text-gold">All 4 modes cleared today! 🏆</p>}

              {modeStats && modeStats.solves > 1 && (
                <div className="panel-dark mt-4 p-3 text-left">
                  <p className="stroke-text-sm mb-2 text-sm">Your {MODE_INFO[mode].name} guesses</p>
                  <Distribution dist={modeStats.dist} highlight={Math.min(state.guesses.length, modeStats.dist.length) - 1} color={MODE_INFO[mode].color} compact />
                </div>
              )}

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link href="/endless" className="btn btn-sm btn-red">Play Endless</Link>
                <Link href="/leaderboard" className="btn btn-sm btn-dark">Leaderboard</Link>
              </div>
              <p className="mt-3 text-sm font-bold text-white/75">
                Next brawler in <Countdown to={state.nextPuzzleAt} className="stroke-text-sm text-base text-white" />
              </p>
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
