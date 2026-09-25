import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DailyGame } from "@/components/DailyGame";
import { BRAWLER_INDEX } from "@/lib/brawlers";
import { MODES, MODE_INFO, isMode } from "@/lib/constants";

export function generateStaticParams() {
  return MODES.map((mode) => ({ mode }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/[mode]">): Promise<Metadata> {
  const { mode } = await params;
  if (!isMode(mode)) return {};
  const info = MODE_INFO[mode];
  return {
    title: `${info.name} — guess today's brawler`,
    description: `Brawldle ${info.name} mode: ${info.tagline.toLowerCase()}. A new Brawl Stars brawler to guess every day.`,
    alternates: { canonical: `/${mode}` },
  };
}

export default async function ModePage({ params }: PageProps<"/[mode]">) {
  const { mode } = await params;
  if (!isMode(mode)) notFound();
  return <DailyGame mode={mode} brawlers={BRAWLER_INDEX} />;
}
