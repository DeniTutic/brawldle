"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { BrawlerRef } from "@/lib/constants";
import { BrawlerPortrait } from "./BrawlerPortrait";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");

export function GuessInput({
  brawlers,
  exclude,
  onGuess,
  disabled,
}: {
  brawlers: BrawlerRef[];
  exclude: Set<number>;
  onGuess: (b: BrawlerRef) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  const matches = useMemo(() => {
    const q = norm(query);
    if (!q) return [];
    const pool = brawlers.filter((b) => !exclude.has(b.id));
    const starts = pool.filter((b) => norm(b.name).startsWith(q));
    const contains = pool.filter((b) => !norm(b.name).startsWith(q) && norm(b.name).includes(q));
    return [...starts, ...contains].slice(0, 8);
  }, [query, brawlers, exclude]);

  const choose = (b?: BrawlerRef) => {
    if (!b || disabled) return;
    onGuess(b);
    setQuery("");
    setOpen(false);
    setActive(0);
    input.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(matches[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && matches.length > 0;

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="flex gap-2">
        <input
          ref={input}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList ? `${listId}-${active}` : undefined}
          aria-label="Type a brawler name"
          placeholder="Type a brawler name..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          disabled={disabled}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 rounded-2xl border-[3px] border-ink bg-white px-4 py-3 text-lg font-extrabold text-ink shadow-[inset_0_3px_0_rgb(0_0_0/0.12),0_4px_0_var(--color-ink)] outline-none placeholder:font-bold placeholder:text-ink/40 focus:ring-4 focus:ring-gold disabled:opacity-60"
        />
        <button className="btn btn-green" disabled={disabled || !matches.length} onClick={() => choose(matches[active])} aria-label="Submit guess">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      {showList && (
        <ul id={listId} role="listbox" className="panel-dark absolute inset-x-0 top-full z-20 mt-2 max-h-80 overflow-auto p-1.5 !bg-[#0c1450]">
          {matches.map((b, i) => (
            <li
              key={b.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(b)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 ${i === active ? "bg-royal" : ""}`}
            >
              <BrawlerPortrait brawler={b} size={40} className="!border-2" />
              <span className="stroke-text-sm text-lg">{b.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
