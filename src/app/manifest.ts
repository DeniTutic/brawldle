import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Brawldle — the daily Brawl Stars guessing game",
    short_name: "Brawldle",
    description: "Guess the Brawl Stars brawler of the day in four modes, plus Endless.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1240",
    theme_color: "#1a3aca",
    categories: ["games", "entertainment"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Classic", url: "/classic" },
      { name: "Endless", url: "/endless" },
      { name: "Leaderboards", url: "/leaderboard" },
    ],
  };
}
