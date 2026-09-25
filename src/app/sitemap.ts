import type { MetadataRoute } from "next";
import { MODES } from "@/lib/constants";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...MODES.map((m) => ({ url: `${base}/${m}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.9 })),
    { url: `${base}/endless`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/leaderboard`, changeFrequency: "hourly", priority: 0.6 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.4 },
  ];
}
