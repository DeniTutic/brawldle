"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { applySettings, setSettings, useSettings, type Settings } from "@/lib/settings";
import { sfx } from "@/lib/sfx";

const OPTIONS: { key: keyof Settings; label: string; hint: string }[] = [
  { key: "sound", label: "Sound & vibration", hint: "Little bleeps when you guess" },
  { key: "contrast", label: "Colour-blind mode", hint: "Orange / blue instead of green / red" },
];

export function SettingsButton() {
  const settings = useSettings();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(applySettings, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={box} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Settings"
        className="slant slant-ghost grid size-10 place-items-center rounded-[10px] text-2xl"
      >
        <span aria-hidden className={`transition-transform duration-300 ${open ? "rotate-90" : ""}`}>⚙️</span>
      </button>
      {open && (
        <div className="panel-dark absolute right-0 top-12 z-40 w-72 animate-pop space-y-1 p-3 !bg-[#0c1450]">
          <p className="stroke-text-sm px-1 pb-1 text-lg">Settings</p>
          {OPTIONS.map((o) => (
            <button
              key={o.key}
              role="switch"
              aria-checked={settings[o.key]}
              onClick={() => {
                setSettings({ [o.key]: !settings[o.key] });
                if (o.key === "sound" && !settings.sound) setTimeout(sfx.tap);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/10"
            >
              <span className="flex-1">
                <span className="block font-extrabold">{o.label}</span>
                <span className="block text-xs font-bold text-white/60">{o.hint}</span>
              </span>
              <span
                aria-hidden
                className={`relative h-7 w-12 shrink-0 rounded-full border-[3px] border-ink transition-colors ${settings[o.key] ? "bg-win" : "bg-white/20"}`}
              >
                <span
                  className={`absolute top-0.5 size-4 rounded-full border-[3px] border-ink bg-white transition-all ${settings[o.key] ? "left-[1.35rem]" : "left-0.5"}`}
                />
              </span>
            </button>
          ))}
          <Link href="/about" onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2 font-extrabold text-sky hover:bg-white/10">
            📖 How to play
          </Link>
        </div>
      )}
    </div>
  );
}
