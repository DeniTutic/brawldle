"use client";

import { MODES, MODE_INFO, type Mode } from "@/lib/constants";
import { dayShareText } from "@/lib/share";
import { ShareButton } from "./ShareButton";

type ModeStatus = { mode: Mode; solved: boolean; guesses: number };

/** Home page strip: how much of today's set is done, plus a share button once something is solved. */
export function TodayProgress({ puzzleNo, modes, streak }: { puzzleNo: number; modes: ModeStatus[]; streak: number }) {
  const cleared = modes.filter((m) => m.solved).length;
  return (
    <section className="panel-dark flex w-full max-w-2xl flex-wrap items-center gap-3 px-4 py-3" aria-label="Today's progress">
      <p className="stroke-text-sm shrink-0 text-lg">
        {cleared}/{MODES.length}
        <span className="ml-1.5 text-sm text-white/70">today</span>
      </p>
      <ol className="flex min-w-36 flex-1 gap-1.5" aria-hidden>
        {modes.map((m) => (
          <li
            key={m.mode}
            className="h-4 flex-1 -skew-x-12 rounded-[5px] border-[3px] border-ink"
            style={{ background: m.solved ? MODE_INFO[m.mode].color : m.guesses ? "rgb(255 255 255 / 0.3)" : "rgb(255 255 255 / 0.1)" }}
            title={MODE_INFO[m.mode].name}
          />
        ))}
      </ol>
      {cleared > 0 && <ShareButton className="btn btn-sm btn-blue shrink-0 max-sm:w-full" text={() => dayShareText(puzzleNo, modes, streak)} />}
    </section>
  );
}
