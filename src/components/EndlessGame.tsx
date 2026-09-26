"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ENDLESS_HEARTS, ENDLESS_MODES, MODE_INFO, type BrawlerRef, type EndlessMode, type EndlessState } from "@/lib/constants";
import type { PlayerStats } from "@/lib/leaderboard";
import { endlessShareText } from "@/lib/share";
import { sfx } from "@/lib/sfx";
import { BrawlerPortrait } from "./BrawlerPortrait";
import { ClassicBoard, ClassicLegend } from "./ClassicBoard";
import { Clue } from "./Clue";
import { BrawlerTags, Confetti, GuessList, announceNewBadges } from "./GameBits";
import { GuessInput } from "./GuessInput";
import { ShareButton } from "./ShareButton";
import { toast } from "./Toast";

export function EndlessGame({ brawlers }: { brawlers: BrawlerRef[] }) {
  const [run, setRun] = useState<EndlessState | null | undefined>(undefined);
  const [best, setBest] = useState<Record<string, number>>({});
  const [toBeat, setToBeat] = useState<number | null>(null); // best score when this run started
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [hits, setHits] = useState(0);
  const [picking, setPicking] = useState(false);
  const [announce, setAnnounce] = useState("");

  const loadBest = useCallback(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: PlayerStats) => {
        setBest(s.endlessBest ?? {});
        announceNewBadges(s.badges);
      })
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

  const isRecord = (r: EndlessState) => r.score > 0 && (toBeat != null ? r.score > toBeat : r.score >= r.best);

  function finished(r: EndlessState) {
    loadBest();
    if (isRecord(r)) setTimeout(sfx.record, 350);
  }

  async function start(mode: EndlessMode) {
    const r = await act({ action: "start", mode });
    if (r) {
      setToBeat(best[mode] ?? 0);
      setRun(r);
      setPicking(false);
    }
  }

  async function guess(b: BrawlerRef) {
    const prevHearts = run?.hearts ?? 0;
    const r = await act({ action: "guess", brawlerId: b.id });
    if (!r) return;
    if (r.round.solved) {
      sfx.correct();
      if (r.hearts > prevHearts) toast("First try! +1 heart", "❤️");
      setAnnounce(`${b.name} — correct!`);
    } else {
      if (r.hearts < prevHearts) (r.over ? sfx.heart : sfx.wrong)();
      setShake((s) => s + 1);
      setHits((h) => h + 1);
      setAnnounce(`${b.name} — wrong. ${r.hearts} hearts left.`);
    }
    if (r.over) finished(r);
    setRun(r);
  }

  async function skip() {
    const r = await act({ action: "skip" });
    if (!r) return;
    sfx.heart();
    setHits((h) => h + 1);
    if (r.over) finished(r);
    setRun(r);
  }

  const guessed = useMemo(() => new Set(run?.round.guesses.map((g) => g.brawler.id)), [run]);

  if (run === undefined) return <div className="panel mx-auto h-64 w-full max-w-md animate-pulse" aria-busy="true" />;

  if (!run || picking) {
    return <ModePicker onStart={start} best={best} busy={busy} last={run?.over ? run : null} />;
  }

  const info = MODE_INFO[run.mode];
  const roundDone = run.round.solved || run.round.skipped;
  const record = run.over && isRecord(run);
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="sr-only" aria-live="polite">{announce}</p>
      <div className="panel-dark flex w-full max-w-md items-center gap-3 px-4 py-2">
        <span className="stroke-text-sm text-lg" style={{ color: info.color }}>
          {info.icon} {info.name}
        </span>
        <span className="text-sm font-bold text-white/60">Round {run.roundNo}</span>
        <span key={run.score} className="stroke-text-sm ml-auto inline-block animate-bump text-lg text-gold" aria-label={`Score ${run.score}`}>
          🏆 {run.score}
        </span>
        <span key={run.hearts} className="stroke-text-sm inline-block animate-bump text-lg" aria-label={`${run.hearts} hearts left`}>
          ❤️ {run.hearts}
        </span>
      </div>
      <div key={hits} className={`flex w-full max-w-md flex-wrap justify-center gap-0.5 text-lg ${hits ? "animate-shake" : ""}`} aria-hidden>
        {Array.from({ length: run.maxHearts }, (_, i) => (
          <span key={i} className={i < run.hearts ? "" : "opacity-25 grayscale"}>
            ❤️
          </span>
        ))}
      </div>

      {run.over ? (
        <section className="panel relative mx-auto w-full max-w-md animate-pop p-5 text-center">
          {record && <Confetti />}
          <p className={`stroke-text text-3xl sm:text-4xl ${run.hearts > 0 ? "text-gold" : "text-lose"}`}>{run.hearts > 0 ? "Run ended" : "Out of hearts!"}</p>
          {run.round.answer && !run.round.solved && (
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
          {record ? (
            <p className="stroke-text-sm animate-pop mt-1 text-xl text-gold">New {info.name} record! 🎉</p>
          ) : (
            <p className="font-bold text-white/75">
              Best {info.name}: {Math.max(run.best, run.score)}
            </p>
          )}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button className="btn btn-green" disabled={busy} onClick={() => start(run.mode)}>
              Play again
            </button>
            {run.score > 0 && <ShareButton className="btn btn-blue" text={() => endlessShareText(run)} />}
          </div>
          <button className="mt-3 text-sm font-bold text-white/70 underline hover:text-white" onClick={() => setPicking(true)}>
            Change mode
          </button>
        </section>
      ) : (
        <>
          <Clue clue={run.round.clue} shakeKey={shake} solved={!!roundDone} />
          {roundDone && run.round.answer ? (
            <section className="panel mx-auto flex w-full max-w-md animate-pop items-center gap-4 p-4">
              <BrawlerPortrait brawler={run.round.answer} size={64} className={run.round.solved ? "animate-float" : "grayscale-[0.4]"} />
              <div className="min-w-0">
                <p className={`stroke-text text-2xl ${run.round.solved ? "text-win" : "text-white/80"}`}>{run.round.solved ? "Correct!" : "Skipped"}</p>
                <p className="font-bold text-white/85">
                  {run.round.answer.name}
                  {run.round.solved ? " · +1 point" : ""}
                </p>
                {run.round.answerInfo && <BrawlerTags info={run.round.answerInfo} />}
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
            <>
              <GuessInput brawlers={brawlers} exclude={guessed} onGuess={guess} disabled={busy} />
              <button className="btn btn-sm btn-dark" disabled={busy} onClick={skip}>
                Skip · −1 ❤️
              </button>
            </>
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
            if (r) {
              setRun(r);
              finished(r);
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
        <h1 className="stroke-text text-3xl text-gold sm:text-5xl">♾️ Endless</h1>
        <p className="mt-2 max-w-md font-bold text-white/85">
          Guess brawler after brawler. Every miss costs a ❤️, a first-try guess wins one back. How far can you go?
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
                className="slant slant-card skin-mode pressable group flex w-full items-center gap-4 rounded-2xl p-4 text-left"
                style={{ "--c": info.color } as React.CSSProperties}
              >
                <span className="text-4xl transition group-hover:scale-110" aria-hidden>
                  {info.icon}
                </span>
                <span>
                  <span className="stroke-text block text-xl sm:text-2xl">{info.name}</span>
                  <span className="mt-1 block text-sm font-bold text-white/90">
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
