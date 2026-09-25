import { BOARDS, leaderboard, type Board } from "@/lib/leaderboard";
import { peekPlayer } from "@/lib/player";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const board = (BOARDS as readonly string[]).includes(url.searchParams.get("board") ?? "") ? (url.searchParams.get("board") as Board) : "today";
  const rows = await leaderboard(board, url.searchParams.get("mode") ?? "", await peekPlayer());
  return Response.json({ board, rows });
}
