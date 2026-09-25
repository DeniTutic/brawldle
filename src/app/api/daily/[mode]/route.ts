import { isMode } from "@/lib/constants";
import { getDailyState, guessDaily } from "@/lib/daily";
import { getPlayer } from "@/lib/player";

type Ctx = { params: Promise<{ mode: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { mode } = await ctx.params;
  if (!isMode(mode)) return Response.json({ error: "Unknown mode" }, { status: 404 });
  return Response.json(await getDailyState(await getPlayer(), mode));
}

export async function POST(req: Request, ctx: Ctx) {
  const { mode } = await ctx.params;
  if (!isMode(mode)) return Response.json({ error: "Unknown mode" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const res = await guessDaily(await getPlayer(), mode, body.brawlerId);
  return res.ok ? Response.json(res.state) : Response.json({ error: res.error }, { status: res.status });
}
