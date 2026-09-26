import { OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Brawldle — the daily Brawl Stars guessing game";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogImage({ tagline: "Guess the brawler of the day!" });
}
