// Downloads raw brawler sources (Brawlify API + Brawl Stars wiki) into .cache/.
// Re-run when new brawlers release: `npm run data:fetch && npm run data:build`.
import fs from "node:fs/promises";
import path from "node:path";

const CACHE = path.resolve(".cache");
const UA = { "User-Agent": "Mozilla/5.0 (Brawldle fan project data sync)" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

await fs.mkdir(path.join(CACHE, "wiki"), { recursive: true });
const api = await getJson("https://api.brawlapi.com/v1/brawlers");
await fs.writeFile(path.join(CACHE, "brawlapi.json"), JSON.stringify(api));
console.log(`brawlapi: ${api.list.length} brawlers`);

for (const b of api.list) {
  const file = path.join(CACHE, "wiki", `${b.id}.json`);
  try { await fs.access(file); continue; } catch {}
  const q = new URLSearchParams({ action: "parse", page: b.name, prop: "wikitext", format: "json", redirects: "1" });
  try {
    const d = await getJson(`https://brawlstars.fandom.com/api.php?${q}`);
    await fs.writeFile(file, JSON.stringify({ name: b.name, wikitext: d.parse.wikitext["*"] }));
  } catch (e) {
    console.warn("wiki fail", b.name, e.message);
  }
  await sleep(250);
}
console.log("done");
