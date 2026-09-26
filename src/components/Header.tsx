"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { MODES } from "@/lib/constants";
import { Logo } from "./Logo";
import { SettingsButton } from "./Settings";

const NAV = [
  { href: "/", label: "Play", icon: "🎮" },
  { href: "/endless", label: "Endless", icon: "♾️" },
  { href: "/leaderboard", label: "Ranks", icon: "🏆" },
  { href: "/profile", label: "Stats", icon: "📊" },
];

const PLAY_PATHS = ["/", ...MODES.map((m) => `/${m}`)];
const isActive = (href: string, pathname: string) => (href === "/" ? PLAY_PATHS.includes(pathname) : pathname.startsWith(href));

const BAR = "border-ink bg-[linear-gradient(108deg,rgb(255_255_255/0.07)_0_22%,transparent_22.3%),linear-gradient(180deg,#2349e0,#1631a8)]";

export function Header({ googleEnabled }: { googleEnabled: boolean }) {
  const pathname = usePathname();
  return (
    <header className={`sticky top-0 z-30 border-b-4 shadow-[0_5px_0_rgb(5_7_26/0.5)] ${BAR}`}>
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2 sm:px-4 md:gap-3">
        <Link href="/" aria-label="Brawldle home" className="shrink-0">
          <Logo className="text-xl sm:text-2xl" />
        </Link>
        <nav className="ml-auto hidden items-center gap-1 md:flex lg:gap-2" aria-label="Main">
          {NAV.map((n) => {
            const active = isActive(n.href, pathname);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`slant stroke-text-sm rounded-lg px-4 py-1.5 text-lg ${active ? "skin-gold" : "slant-ghost text-white/90 hover:text-white"}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <SettingsButton />
          <AuthButton googleEnabled={googleEnabled} />
        </div>
      </div>
    </header>
  );
}

/** Thumb-friendly tab bar on phones and small tablets. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className={`fixed inset-x-0 bottom-0 z-30 border-t-4 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_0_rgb(5_7_26/0.35)] md:hidden ${BAR}`}
    >
      <ul className="mx-auto grid max-w-md grid-cols-4 gap-1 px-2 py-1.5">
        {NAV.map((n) => {
          const active = isActive(n.href, pathname);
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`slant flex flex-col items-center rounded-xl py-1 ${active ? "skin-gold" : "slant-ghost"}`}
                style={{ "--drop": "3px", "--bw": "3px" } as React.CSSProperties}
              >
                <span aria-hidden className={`text-2xl leading-tight transition-transform ${active ? "scale-110" : ""}`}>
                  {n.icon}
                </span>
                <span className={`stroke-text-sm text-xs ${active ? "" : "text-white/85"}`}>{n.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function AuthButton({ googleEnabled }: { googleEnabled: boolean }) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !menu.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  // Without Google sign-in there is never a session, so don't reserve space (avoids a layout jump).
  if (!googleEnabled) return null;
  if (isPending) return <div className="size-10 shrink-0" />;

  if (!session) {
    return (
      <button
        className="btn btn-sm shrink-0"
        onClick={() => authClient.signIn.social({ provider: "google", callbackURL: window.location.pathname })}
      >
        Sign in
      </button>
    );
  }

  const { user } = session;
  return (
    <div ref={menu} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Account menu"
        className="block size-10 overflow-hidden rounded-[10px] border-4 border-ink bg-navy shadow-[0_3px_0_var(--color-ink)]"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="stroke-text-sm grid size-full place-items-center text-lg">{user.name?.[0] ?? "?"}</span>
        )}
      </button>
      {open && (
        <div className="panel-dark absolute right-0 top-12 z-40 w-52 animate-pop p-2 text-sm font-bold !bg-[#0c1450]">
          <p className="truncate px-2 pb-2 text-white/70">{user.name}</p>
          <Link href="/profile" onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2 hover:bg-white/10">
            My stats
          </Link>
          <button
            onClick={async () => {
              await authClient.signOut();
              setOpen(false);
              router.push("/");
              router.refresh();
            }}
            className="block w-full rounded-lg px-2 py-2 text-left text-lose hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
