import { SILHOUETTE_MAX_LEVEL } from "@/lib/constants";
import { col } from "@/lib/db";
import { abilityPng, pngResponse, silhouettePng } from "@/lib/images";
import { getPlayer } from "@/lib/player";

export async function GET() {
  const player = await getPlayer();
  const run = (await col.runs().findOne({ playerKey: player.key, status: "active" })) ?? (await col.runs().findOne({ playerKey: player.key }, { sort: { startedAt: -1 } }));
  const round = run?.round;
  if (!round || (round.mode !== "silhouette" && round.mode !== "ability")) return new Response("Not found", { status: 404 });
  if (round.mode === "ability") return pngResponse(await abilityPng(round.abilityId!));
  const reveal = round.solved || !!round.skipped || run.status === "over";
  const wrong = round.guesses.filter((g) => g !== round.brawlerId).length;
  return pngResponse(await silhouettePng(round.brawlerId, round.focus!, reveal ? SILHOUETTE_MAX_LEVEL : Math.min(wrong, SILHOUETTE_MAX_LEVEL)));
}
