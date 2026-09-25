// Builds src/data/brawlers.json + image assets from the raw sources in .cache/.
// Run `npm run data:fetch` first. Safe to re-run: images that already exist are skipped.
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

const ROOT = path.resolve(".");
const CACHE = path.join(ROOT, ".cache");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = { "User-Agent": "Mozilla/5.0 (Brawldle fan project data sync)" };

// Not permanent / not released yet. Anything the wiki marks as a future update is skipped too.
const EXCLUDE = new Set(["Buzz Lightyear"]);

const RARITY_ORDER = ["Common", "Rare", "Super Rare", "Epic", "Mythic", "Legendary", "Ultra Legendary"];
const ROLES = ["Damage Dealer", "Tank", "Assassin", "Support", "Controller", "Marksman", "Artillery"];

// Hand checks for brawlers whose wiki infobox has no single attack range.
const RANGE_OVERRIDE = { Bolt: "Short", Kaze: "Short", Alli: "Short", Hank: "Short", Janet: "Long", Bonnie: "Long", Nori: "Long" };
const SPEED_OVERRIDE = { Bonnie: "Slow", Kaze: "Very Fast" };
const GENDER_OVERRIDE = { "Larry & Lawrie": "Male", Trunk: "Other", Meeple: "Other", Shade: "Other", Sprout: "Other", Angelo: "Male", "Starr Nova": "Female" };

const slugify = (n) => n.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const field = (w, k) => w.match(new RegExp(`\\|\\s*${k}\\s*=\\s*([^|}]*)`))?.[1].trim() ?? null;
const clean = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

function speedLabel(raw) {
  const n = parseFloat(raw);
  if (n < 600) return "Very Slow";
  if (n < 700) return "Slow";
  if (n < 780) return "Normal";
  if (n < 830) return "Fast";
  return "Very Fast";
}

function rangeLabel(raw) {
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return null;
  if (n < 5) return "Short";
  if (n < 7) return "Normal";
  if (n < 9.33) return "Long";
  return "Very Long";
}

function gender(intro) {
  const count = (re) => (intro.match(re) || []).length;
  const she = count(/\b(she|her|hers|herself)\b/gi);
  const he = count(/\b(he|him|his|himself)\b/gi);
  if (she > he * 2 && she > 2) return "Female";
  if (he > she * 2 && he > 2) return "Male";
  return "Other";
}

function releaseYear(w) {
  const i = w.search(/==\s*History\s*==/);
  const m = i >= 0 ? w.slice(i).match(/\*\s*\d\d\/\d\d\/(\d\d)/) : null;
  return m ? 2000 + Number(m[1]) : null;
}

// Images go through curl: the wiki CDN rejects Node's fetch (TLS fingerprint) but serves curl fine.
async function download(url, dest, transform, headers = UA) {
  try { await fs.access(dest); return true; } catch {}
  const args = ["-sfL", "--max-time", "30", "--retry", "3", "--retry-delay", "2"];
  for (const [k, v] of Object.entries(headers)) args.push("-H", `${k}: ${v}`);
  try {
    const { stdout } = await run("curl", [...args, url], { encoding: "buffer", maxBuffer: 64 * 1024 * 1024 });
    if (stdout.length < 100) return false;
    await fs.writeFile(dest, transform ? await transform(stdout) : stdout);
    return true;
  } catch {
    return false;
  }
}

async function wikiImageUrls(titles) {
  const out = {};
  for (let i = 0; i < titles.length; i += 40) {
    const q = new URLSearchParams({ action: "query", titles: titles.slice(i, i + 40).join("|"), prop: "imageinfo", iiprop: "url", format: "json" });
    const d = await (await fetch(`https://brawlstars.fandom.com/api.php?${q}`, { headers: UA })).json();
    const norm = Object.fromEntries((d.query.normalized || []).map((n) => [n.to, n.from]));
    for (const p of Object.values(d.query.pages)) {
      const url = p.imageinfo?.[0]?.url;
      if (url) out[norm[p.title] ?? p.title] = url;
    }
  }
  return out;
}

const api = JSON.parse(await fs.readFile(path.join(CACHE, "brawlapi.json"), "utf8")).list;
const emojis = JSON.parse(await fs.readFile(path.join(ROOT, "src/data/emoji-clues.json"), "utf8"));
await fs.mkdir(path.join(ROOT, "public/brawlers"), { recursive: true });
await fs.mkdir(path.join(ROOT, "assets/renders"), { recursive: true });
await fs.mkdir(path.join(ROOT, "assets/abilities"), { recursive: true });

const brawlers = [];
const problems = [];
for (const b of api) {
  if (EXCLUDE.has(b.name)) continue;
  const w = JSON.parse(await fs.readFile(path.join(CACHE, "wiki", `${b.id}.json`), "utf8")).wikitext;
  const intro = w.split(/\n==/)[0].replace(/\{\{[^}]*\}\}/g, "");
  if (w.includes("{{FutureUpdate}}") || /will be the \d+/.test(intro)) continue;

  const slug = slugify(b.name);
  const rarity = b.rarity.name;
  const role = field(w, "Class");
  const speed = SPEED_OVERRIDE[b.name] ?? speedLabel(field(w, "MovementSpeed") ?? "");
  const range = RANGE_OVERRIDE[b.name] ?? rangeLabel(field(w, "AttackRange") ?? "");
  const year = releaseYear(w);
  const g = GENDER_OVERRIDE[b.name] ?? gender(intro);
  const hypercharge = intro.match(/Hypercharge,\s*([^,.]+)[,.]/)?.[1]?.trim() ?? null;

  if (!RARITY_ORDER.includes(rarity)) problems.push(`${b.name}: rarity ${rarity}`);
  if (!ROLES.includes(role)) problems.push(`${b.name}: role ${role}`);
  if (!range) problems.push(`${b.name}: range`);
  if (!year) problems.push(`${b.name}: release year`);
  if (!emojis[b.name] || emojis[b.name].length !== 5) problems.push(`${b.name}: emoji clues`);

  const hasPortrait = await download(b.imageUrl2, path.join(ROOT, "public/brawlers", `${slug}.png`));
  if (!hasPortrait) { problems.push(`${b.name}: no portrait (unreleased?) — skipped`); continue; }

  const abilities = [];
  for (const [kind, list] of [["Gadget", b.gadgets], ["Star Power", b.starPowers]]) {
    for (const a of list.filter((x) => x.released !== false)) {
      const ok = await download(a.imageUrl, path.join(ROOT, "assets/abilities", `${a.id}.png`));
      if (ok) abilities.push({ id: a.id, kind, name: a.name, description: clean(a.descriptionHtml ?? a.description) });
    }
  }

  brawlers.push({
    id: b.id, name: b.name, slug, rarity, role, gender: g, speed, range, releaseYear: year,
    hypercharge, emojis: emojis[b.name] ?? [], abilities,
  });
}

// Full-body renders for Silhouette mode (default skin), downscaled to keep runtime rendering fast.
const WIKI_NAME = { "Jae-Yong": "Jae-yong" }; // wiki file names that differ from the in-game name
const wikiName = (b) => WIKI_NAME[b.name] ?? b.name;
const renderTitles = brawlers.map((b) => `File:${wikiName(b)} Skin-Default.png`);
const portraitTitles = brawlers.map((b) => `File:${wikiName(b)} Portrait.png`);
const urls = { ...(await wikiImageUrls(portraitTitles)), ...(await wikiImageUrls(renderTitles)) };
const shrink = (buf) => sharp(buf).trim().resize({ height: 700, width: 700, fit: "inside", withoutEnlargement: true }).png({ palette: true, quality: 90, effort: 8 }).toBuffer();
for (const b of brawlers) {
  const url = urls[`File:${wikiName(b)} Skin-Default.png`] ?? urls[`File:${wikiName(b)} Portrait.png`];
  const dest = path.join(ROOT, "assets/renders", `${b.id}.png`);
  // The wiki CDN only serves images with a wiki Referer; ask it for a pre-scaled copy.
  const scaled = url?.replace("/revision/latest", "/revision/latest/scale-to-width-down/900");
  const ok = url && (await download(scaled, dest, shrink, { ...UA, Referer: "https://brawlstars.fandom.com/" }));
  if (!ok) problems.push(`${b.name}: no render`);
  await sleep(300);
}

brawlers.sort((a, b) => a.name.localeCompare(b.name));
await fs.writeFile(path.join(ROOT, "src/data/brawlers.json"), JSON.stringify(brawlers, null, 1));
console.log(`wrote ${brawlers.length} brawlers`);
if (problems.length) console.log("PROBLEMS:\n  " + problems.join("\n  "));
