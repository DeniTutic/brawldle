import type { Metadata } from "next";
import { Leaderboard } from "@/components/Leaderboard";
import { googleEnabled } from "@/lib/auth";
import { peekPlayer } from "@/lib/player";

export const metadata: Metadata = {
  title: "Leaderboards",
  description: "Brawldle global leaderboards: today's fastest solvers, longest streaks, Endless high scores and all-time points.",
  alternates: { canonical: "/leaderboard" },
};

export default async function LeaderboardPage({ searchParams }: PageProps<"/leaderboard">) {
  const { board } = await searchParams;
  const initial = board === "streak" || board === "endless" || board === "points" ? board : "today";
  const player = await peekPlayer();
  return <Leaderboard initialBoard={initial} signedIn={!!player?.userId} googleEnabled={googleEnabled} />;
}
