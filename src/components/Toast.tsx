"use client";

import { useEffect, useState } from "react";

const EVENT = "bd-toast";

/** Shows a short message at the top of the screen. Callable from anywhere on the client. */
export function toast(message: string, icon = "✨") {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, icon } }));
}

type Item = { id: number; message: string; icon: string };

export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let id = 0;
    const onToast = (e: Event) => {
      const item = { id: ++id, ...(e as CustomEvent<Omit<Item, "id">>).detail };
      setItems((xs) => [...xs.slice(-2), item]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== item.id)), 2600);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-20 z-50 flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <p key={t.id} className="slant skin-white animate-pop flex items-center gap-2 rounded-xl px-4 py-2 font-extrabold text-ink">
          <span aria-hidden className="text-xl">{t.icon}</span>
          {t.message}
        </p>
      ))}
    </div>
  );
}
