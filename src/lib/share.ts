"use client";

import { MODES, MODE_INFO, type DailyState, type EndlessState, type Mode } from "./constants";

// Spoiler-free result text, Wordle style. Never includes the answer.

const MAX_ROWS = 6;

export const shareUrl = () => `${(process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "")}/?s=share`;

const squares = (guesses: number, solved: boolean) =>
  (solved ? "🟥".repeat(Math.max(0, guesses - 1)) + "🟩" : "🟥".repeat(guesses)).replace(/(🟥{8})🟥+/u, "$1…");

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "es"}`;

export function dailyShareText(s: DailyState, streak = 0) {
  const info = MODE_INFO[s.mode];
  const lines = [`Brawldle #${s.puzzleNo} ${info.icon} ${info.name} — ${plural(s.guesses.length, "guess")}`];
  if (s.mode === "classic") {
    const rows = s.guesses.map((g) => (g.cells ?? []).map((c) => (c.correct ? "🟩" : "🟥")).join(""));
    lines.push(...(rows.length > MAX_ROWS ? [...rows.slice(0, MAX_ROWS - 2), `⋯ +${rows.length - MAX_ROWS + 1}`, rows.at(-1)!] : rows));
  } else {
    lines.push(squares(s.guesses.length, s.solved));
  }
  if (streak > 1) lines.push(`🔥 ${streak}-day streak`);
  lines.push(shareUrl());
  return lines.join("\n");
}

export function dayShareText(puzzleNo: number, modes: { mode: Mode; solved: boolean; guesses: number }[], streak = 0) {
  const lines = [`Brawldle #${puzzleNo} — ${modes.filter((m) => m.solved).length}/${MODES.length} cleared`];
  for (const m of modes) {
    const info = MODE_INFO[m.mode];
    lines.push(`${info.icon} ${m.solved ? `${squares(m.guesses, true)} ${m.guesses}` : m.guesses ? "⏳" : "—"}`);
  }
  if (streak > 1) lines.push(`🔥 ${streak}-day streak`);
  lines.push(shareUrl());
  return lines.join("\n");
}

export function endlessShareText(run: EndlessState) {
  const info = MODE_INFO[run.mode];
  return [
    `♾️ Brawldle Endless ${info.icon} ${info.name}`,
    `I found ${run.score} brawler${run.score === 1 ? "" : "s"} in a row! 🏆 Can you beat me?`,
    shareUrl(),
  ].join("\n");
}

/** Opens the share sheet on phones, copies to the clipboard elsewhere. */
export async function shareText(text: string): Promise<"shared" | "copied" | "failed"> {
  if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "shared";
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
