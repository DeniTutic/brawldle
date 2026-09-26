"use client";

import { getSettings } from "./settings";

// Tiny synthesized sound effects (no audio files) plus haptics on phones that support them.

let ctx: AudioContext | null = null;

function audio() {
  if (!getSettings().sound) return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, at: number, dur: number, { type = "square" as OscillatorType, vol = 0.06, slide = 0 } = {}) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function buzz(pattern: number | number[]) {
  if (getSettings().sound) navigator.vibrate?.(pattern);
}

export const sfx = {
  tap() {
    tone(660, 0, 0.05, { type: "triangle", vol: 0.04 });
  },
  wrong() {
    tone(220, 0, 0.16, { type: "sawtooth", vol: 0.05, slide: 0.7 });
    tone(165, 0.1, 0.2, { type: "sawtooth", vol: 0.04, slide: 0.7 });
    buzz(60);
  },
  heart() {
    tone(140, 0, 0.25, { type: "triangle", vol: 0.09, slide: 0.5 });
    buzz([40, 40, 80]);
  },
  correct() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.18, { vol: 0.05 }));
    buzz([30, 40, 30]);
  },
  record() {
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, i === 6 ? 0.5 : 0.14, { vol: 0.05 }));
    buzz([50, 50, 50, 50, 120]);
  },
  badge() {
    [988, 1319].forEach((f, i) => tone(f, i * 0.1, 0.25, { type: "triangle", vol: 0.06 }));
  },
};
