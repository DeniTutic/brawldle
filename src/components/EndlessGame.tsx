"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ENDLESS_HEARTS, ENDLESS_MODES, MODE_INFO, type BrawlerRef, type EndlessMode, type EndlessState } from "@/lib/constants";
import { BrawlerPortrait } from "./BrawlerPortrait";
import { ClassicBoard, ClassicLegend } from "./ClassicBoard";
import { Clue } from "./Clue";
import { GuessList } from "./GameBits";
import { GuessInput } from "./GuessInput";

export function EndlessGame({ brawlers }: { brawlers: BrawlerRef[] }) {
  const [run, setRun] = useState<EndlessState | null | undefined>(undefined);
  const [best, setBest] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [picking, setPicking] = useState(false);

  const loadBest = useCallback(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((s) => setBest(s.endlessBest ?? {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/endless", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setRun(d.run))
      .catch(() => setRun(null));
    loadBest();
  }, [loadBest]);

  async function act(body: object) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/endless", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data.run as EndlessState;
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Something went wrong");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function start(mode: EndlessMode) {
    const r = await act({ action: "start", mode });
    if (r) {
      setRun(r);
      setPicking(false);
    }
  }

  async function guess(b: BrawlerRef) {
    const r = await act({ action: "guess", brawlerId: b.id });
    if (!r) return;
    if (!r.round.solved) setShake((s) => s + 1);
    if (r.over) loadBest();
    setRun(r);
  }

  const guessed = useMemo(() => new Set(run?.round.guesses.map((g) => g.brawler.id)), [run]);

  if (run === undefined) return <div className="panel mx-auto h-64 w-full max-w-md animate-pulse" aria-busy="true" />;

  if (!run || picking || (run.over && run.round.solved)) {
    return <ModePicker onStart={start} best={best} busy={busy} last={run?.over ? run : null} />;
  }

  const info = MODE_INFO[run.mode];
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="panel-dark flex w-full max-w-md items-center gap-3 px-4 py-2">
        <span className="stroke-text-sm text-lg" style={{ color: info.color }}>
          {info.icon} {info.name}
        </span>
        <span className="stroke-text-sm ml-auto text-lg text-gold" aria-label={`Score ${run.score}`}>
          🏆 {run.score}
        </span>
        <span className="stroke-text-sm text-lg" aria-label={`${run.hearts} hearts left`}>
          ❤️ {run.hearts}
        </span>
      </div>
      <div className="flex w-full max-w-md flex-wrap justify-center gap-0.5 text-lg" aria-hidden>
        {Array.from({ length: run.maxHearts }, (_, i) => (
          <span key={i} className={i < run.hearts ? "" : "opacity-25 grayscale"}>
            ❤️
          </span>
        ))}
      </div>

      {run.over ? (
        <section className="panel mx-auto w-full max-w-md animate-pop p-5 text-center">
          <p className="stroke-text text-4xl text-lose">Out of hearts!</p>
          {run.round.answer && (
            <div className="mt-3 flex items-center justify-center gap-3">
              <BrawlerPortrait brawler={run.round.answer} size={64} />
              <p className="font-bold text-white/85">
                It was <span className="stroke-text-sm text-xl text-white">{run.round.answer.name}</span>
              </p>
            </div>
          )}
          <p className="stroke-text mt-4 text-2xl">
            Final score: <span className="text-gold">{run.score}</span>
          </p>
          <p className="font-bold text-white/75">
            Best {info.name}: {Math.max(run.best, run.score)}
            {run.score > 0 && run.score >= run.best ? " — new record! 🎉" : ""}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button className="btn btn-green" disabled={busy} onClick={() => start(run.mode)}>
              Play again
            </button>
            <button className="btn btn-blue" onClick={() => setPicking(true)}>
              Change mode
            </button>
          </div>
        </section>
      ) : (
        <>
          <Clue clue={run.round.clue} shakeKey={shake} solved={run.round.solved} />
          {run.round.solved && run.round.answer ? (
            <section className="panel mx-auto flex w-full max-w-md animate-pop items-center gap-4 p-4">
              <BrawlerPortrait brawler={run.round.answer} size={64} className="animate-float" />
              <div>
                <p className="stroke-text text-2xl text-win">Correct!</p>
                <p className="font-bold text-white/85">{run.round.answer.name} · +1 point</p>
              </div>
              <button
                className="btn btn-green ml-auto"
                disabled={busy}
                autoFocus
                onClick={async () => {
                  const r = await act({ action: "next" });
                  if (r) setRun(r);
                }}
              >
                Next ▶
              </button>
            </section>
          ) : (
            <GuessInput brawlers={brawlers} exclude={guessed} onGuess={guess} disabled={busy} />
          )}
        </>
      )}

      {error && <p className="stroke-text-sm text-lose" role="alert">{error}</p>}

      {run.round.mode === "classic" ? (
        <>
          <ClassicBoard guesses={run.round.guesses} animateLatest />
          {run.round.guesses.length > 0 && <ClassicLegend />}
        </>
      ) : (
        <GuessList guesses={run.round.guesses} />
      )}

      {!run.over && (
        <button
          className="text-sm font-bold text-white/60 underline hover:text-white"
          onClick={async () => {
            if (!confirm("End this run? Your score will be saved.")) return;
            const r = await act({ action: "quit" });
            if (r !== null) {
              setRun(r);
              loadBest();
            }
          }}
        >
          End run
        </button>
      )}
    </div>
  );
}

function ModePicker({ onStart, best, busy, last }: { onStart: (m: EndlessMode) => void; best: Record<string, number>; busy: boolean; last: EndlessState | null }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <section className="text-center">
        <h1 className="stroke-text text-4xl text-gold sm:text-5xl">♾️ Endless</h1>
        <p className="mt-2 max-w-md font-bold text-white/85">
          Guess brawler after brawler. Every wrong guess costs a ❤️ — how far can you go?
        </p>
        {last && (
          <p className="stroke-text-sm mt-2 text-lg">
            Last run: <span className="text-gold">{last.score}</span> in {MODE_INFO[last.mode].name}
          </p>
        )}
      </section>
      <ul className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {ENDLESS_MODES.map((m) => {
          const info = MODE_INFO[m];
          return (
            <li key={m} className={m === "mixed" ? "sm:col-span-2" : ""}>
              <button
                disabled={busy}
                onClick={() => onStart(m)}
                className="group flex w-full items-center gap-4 rounded-3xl border-[3px] border-ink p-4 text-left shadow-[inset_0_4px_0_rgb(255_255_255/0.3),inset_0_-6px_0_rgb(0_0_0/0.25),0_6px_0_var(--color-ink)] transition hover:-translate-y-1 active:translate-y-1 disabled:opacity-60"
                style={{ background: `linear-gradient(160deg, ${info.color}, color-mix(in oklab, ${info.color} 55%, #0b1240))` }}
              >
                <span className="text-4xl transition group-hover:scale-110" aria-hidden>
                  {info.icon}
                </span>
                <span>
                  <span className="stroke-text block text-2xl">{info.name}</span>
                  <span className="text-sm font-bold text-white/90">
                    {ENDLESS_HEARTS[m]} ❤️ · Best: {best[m] ?? 0}
                  </span>
                </span>
                <span className="stroke-text ml-auto text-2xl">▶</span>
              </button>
            </li>
          );
        })}
      </ul>
      <Link href="/leaderboard?board=endless" className="btn btn-sm btn-blue">
        Endless leaderboard
      </Link>
    </div>
  );
}
