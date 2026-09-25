import { dailySummary } from "@/lib/daily";
import { getPlayer } from "@/lib/player";

export async function GET() {
  return Response.json(await dailySummary(await getPlayer()));
}
