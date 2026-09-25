import { playerStats } from "@/lib/leaderboard";
import { getPlayer } from "@/lib/player";

export async function GET() {
  return Response.json(await playerStats(await getPlayer()));
}
