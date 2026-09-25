"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Logo } from "./Logo";

const NAV = [
  { href: "/", label: "Play" },
  { href: "/endless", label: "Endless" },
  { href: "/leaderboard", label: "Ranks" },
];

export function Header({ googleEnabled }: { googleEnabled: boolean }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b-[3px] border-ink bg-gradient-to-b from-[#2349e0] to-[#1631a8] shadow-[0_4px_0_rgb(5_7_26/0.5)]">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2 sm:gap-4 sm:px-4">
        <Link href="/" aria-label="Brawldle home" className="shrink-0">
          <Logo className="text-2xl sm:text-3xl" />
        </Link>
        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          {NAV.map((n) => {
            const active = n.href === "/" ? ["/", "/classic", "/silhouette", "/emoji", "/ability"].includes(pathname) : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`stroke-text-sm rounded-xl px-2.5 py-1.5 text-base transition sm:px-3 sm:text-lg ${n.href === "/" ? "hidden sm:block" : ""} ${active ? "bg-ink/40 text-gold" : "text-white hover:bg-ink/25"}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <AuthButton googleEnabled={googleEnabled} />
      </div>
    </header>
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

  if (isPending) return <div className="size-10 shrink-0" />;

  if (!session) {
    if (!googleEnabled) return null;
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
        className="block size-10 overflow-hidden rounded-xl border-[3px] border-ink bg-navy shadow-[0_3px_0_var(--color-ink)]"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="stroke-text-sm grid size-full place-items-center text-lg">{user.name?.[0] ?? "?"}</span>
        )}
      </button>
      {open && (
        <div className="panel-dark absolute right-0 top-12 w-52 animate-pop p-2 text-sm font-bold">
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
