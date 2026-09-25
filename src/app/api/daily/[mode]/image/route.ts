import { SILHOUETTE_MAX_LEVEL, isMode } from "@/lib/constants";
import { getDailyRound } from "@/lib/daily";
import { abilityPng, pngResponse, silhouettePng } from "@/lib/images";
import { getPlayer } from "@/lib/player";

// The image level is derived from the player's own server-side progress, never from the URL,
// so nobody can skip ahead to the unobscured picture.
export async function GET(_req: Request, ctx: { params: Promise<{ mode: string }> }) {
  const { mode } = await ctx.params;
  if (mode !== "silhouette" && mode !== "ability") return new Response("Not found", { status: 404 });
  if (!isMode(mode)) return new Response("Not found", { status: 404 });
  const round = await getDailyRound(await getPlayer(), mode);
  if (mode === "ability") return pngResponse(await abilityPng(round.abilityId!));
  const wrong = round.guesses.filter((g) => g !== round.brawlerId).length;
  const level = round.solved ? SILHOUETTE_MAX_LEVEL : Math.min(wrong, SILHOUETTE_MAX_LEVEL);
  return pngResponse(await silhouettePng(round.brawlerId, round.focus!, level));
}
