import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Rubik, Unbounded } from "next/font/google";
import Link from "next/link";
import { BottomNav, Header } from "@/components/Header";
import { Toaster } from "@/components/Toast";
import { googleEnabled } from "@/lib/auth";
import "./globals.css";

const unbounded = Unbounded({ subsets: ["latin"], variable: "--font-unbounded" });
const rubik = Rubik({ subsets: ["latin"], variable: "--font-rubik" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Brawldle — the daily Brawl Stars guessing game", template: "%s · Brawldle" },
  description:
    "Guess the Brawl Stars brawler of the day! Four daily modes — Classic, Silhouette, Emoji and Ability — plus Endless mode, streaks and global leaderboards.",
  keywords: ["Brawldle", "Brawl Stars", "brawler", "guess the brawler", "daily puzzle", "wordle", "loldle"],
  openGraph: { type: "website", siteName: "Brawldle", url: siteUrl },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#1a3aca", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${unbounded.variable} ${rubik.variable}`}>
      <body className="flex min-h-dvh flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] antialiased md:pb-0">
        <Header googleEnabled={googleEnabled} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-4">{children}</main>
        <footer className="mx-auto w-full max-w-5xl px-4 pb-8 text-center text-xs leading-relaxed text-white/55">
          <nav className="mb-2 flex justify-center gap-4 font-bold text-white/75">
            <Link href="/about" className="hover:text-white">How to play</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
          </nav>
          This material is unofficial and is not endorsed by Supercell. For more information see{" "}
          <a className="underline hover:text-white" href="https://supercell.com/en/fan-content-policy/" target="_blank" rel="noreferrer">
            Supercell&apos;s Fan Content Policy
          </a>
          . Brawler data: Brawlify &amp; the Brawl Stars Wiki.
        </footer>
        <BottomNav />
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
