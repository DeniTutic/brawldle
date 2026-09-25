import type { Metadata } from "next";
import { EndlessGame } from "@/components/EndlessGame";
import { BRAWLER_INDEX } from "@/lib/brawlers";

export const metadata: Metadata = {
  title: "Endless mode",
  description: "Guess Brawl Stars brawlers back to back until you run out of hearts. Classic, Silhouette, Emoji, Ability or Mixed.",
  alternates: { canonical: "/endless" },
};

export default function EndlessPage() {
  return <EndlessGame brawlers={BRAWLER_INDEX} />;
}
