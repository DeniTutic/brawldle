import type { Metadata } from "next";
import Link from "next/link";
import { BrawlerPortrait } from "@/components/BrawlerPortrait";
import { BRAWLER_INDEX } from "@/lib/brawlers";

export const metadata: Metadata = { title: "Lost in the bushes", robots: { index: false } };

// Picked once per server start: any brawler will do, it only has to be lost.
const lost = BRAWLER_INDEX[Math.floor(Math.random() * BRAWLER_INDEX.length)];

export default function NotFound() {
  return (
    <div className="panel mx-auto mt-6 flex max-w-md flex-col items-center p-6 text-center">
      <p className="stroke-text text-6xl text-gold">404</p>
      <BrawlerPortrait brawler={lost} size={112} className="mt-4 -rotate-6 animate-float" />
      <h1 className="stroke-text mt-4 text-2xl">{lost.name} got lost in the bushes</h1>
      <p className="mt-2 font-bold text-white/80">This page doesn&apos;t exist, but today&apos;s brawlers do.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-green">Play today</Link>
        <Link href="/endless" className="btn btn-red">Endless</Link>
      </div>
    </div>
  );
}
