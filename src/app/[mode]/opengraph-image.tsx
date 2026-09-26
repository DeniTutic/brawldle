import { MODES, MODE_INFO, isMode } from "@/lib/constants";
import { OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Brawldle daily mode — guess today's Brawl Stars brawler";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return MODES.map((mode) => ({ mode }));
}

const FEATURED: Record<string, string[]> = {
  classic: ["colt", "bull", "leon", "frank", "piper"],
  silhouette: ["el-primo", "poco", "leon", "spike", "crow"],
  emoji: ["barley", "rosa", "leon", "mico", "gale"],
  ability: ["edgar", "brock", "leon", "nita", "jessie"],
};

export default async function Image({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  const m = isMode(mode) ? mode : "classic";
  const info = MODE_INFO[m];
  return ogImage({ heading: info.name, headingColor: info.color, tagline: info.tagline, accent: info.color, slugs: FEATURED[m] });
}
