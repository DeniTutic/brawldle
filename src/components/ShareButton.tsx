"use client";

import { shareText } from "@/lib/share";
import { toast } from "./Toast";

export function ShareButton({ text, label = "Share", className = "btn" }: { text: () => string; label?: string; className?: string }) {
  return (
    <button
      className={className}
      onClick={async () => {
        const res = await shareText(text());
        if (res === "copied") toast("Result copied — paste it anywhere!", "📋");
        else if (res === "failed") toast("Couldn't share, sorry", "😵");
      }}
    >
      <svg viewBox="0 0 24 24" className="size-5 drop-shadow-[0_2px_0_#05071a]" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
      </svg>
      {label}
    </button>
  );
}
