import { isEndlessMode } from "@/lib/constants";
import { getEndless, guessEndless, nextEndless, quitEndless, skipEndless, startEndless } from "@/lib/endless";
import { getPlayer } from "@/lib/player";

export async function GET() {
  return Response.json({ run: await getEndless(await getPlayer()) });
}

export async function POST(req: Request) {
  const player = await getPlayer();
  const body = await req.json().catch(() => ({}));
  switch (body.action) {
    case "start":
      if (!isEndlessMode(body.mode)) return Response.json({ error: "Unknown mode" }, { status: 400 });
      return Response.json({ run: await startEndless(player, body.mode) });
    case "guess": {
      const res = await guessEndless(player, body.brawlerId);
      return res.ok ? Response.json({ run: res.state }) : Response.json({ error: res.error }, { status: res.status });
    }
    case "skip": {
      const res = await skipEndless(player);
      return res.ok ? Response.json({ run: res.state }) : Response.json({ error: res.error }, { status: res.status });
    }
    case "next": {
      const res = await nextEndless(player);
      return res.ok ? Response.json({ run: res.state }) : Response.json({ error: res.error }, { status: res.status });
    }
    case "quit":
      return Response.json({ run: await quitEndless(player) });
    default:
      return Response.json({ error: "Unknown action" }, { status: 400 });
  }
}
