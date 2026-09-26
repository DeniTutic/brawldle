"use client";

import { useSyncExternalStore } from "react";

// Per-device preferences, kept in localStorage. Storage can be unavailable (private mode), so every access is guarded.

export type Settings = { sound: boolean; contrast: boolean };

const KEY = "bd_settings";
const DEFAULTS: Settings = { sound: true, contrast: false };
const listeners = new Set<() => void>();
let cache: Settings | null = null;

export function getSettings(): Settings {
  if (cache) return cache;
  try {
    cache = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache!;
}

export function setSettings(patch: Partial<Settings>) {
  cache = { ...getSettings(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {}
  applySettings();
  listeners.forEach((l) => l());
}

/** Mirrors settings that affect CSS onto <html>. */
export function applySettings() {
  document.documentElement.dataset.contrast = getSettings().contrast ? "high" : "normal";
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useSettings = () => useSyncExternalStore(subscribe, getSettings, () => DEFAULTS);

/** Small JSON helpers for other per-device flags (seen tips, seen badges). */
export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
