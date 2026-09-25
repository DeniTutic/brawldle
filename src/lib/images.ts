import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import { SILHOUETTE_MAX_LEVEL } from "./constants";

const ASSETS = path.join(process.cwd(), "assets");
const OUT = 480;
const FILL = [14, 20, 64]; // silhouette colour (deep Brawl blue)
// Zoom per wrong-guess level. Level 7 is the full brawler in colour.
const ZOOMS = [3.4, 2.8, 2.3, 1.9, 1.55, 1.25, 1.0, 1.0];

type Raw = { data: Buffer; width: number; height: number };
const renders = new Map<number, Promise<{ color: Raw; shadow: Raw }>>();
const output = new Map<string, Promise<Buffer>>();

function loadRender(brawlerId: number) {
  let p = renders.get(brawlerId);
  if (!p) {
    p = (async () => {
      const { data, info } = await sharp(path.join(ASSETS, "renders", `${brawlerId}.png`))
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const shadow = Buffer.from(data);
      for (let i = 0; i < shadow.length; i += 4) {
        shadow[i] = FILL[0];
        shadow[i + 1] = FILL[1];
        shadow[i + 2] = FILL[2];
        shadow[i + 3] = shadow[i + 3] > 24 ? 255 : 0;
      }
      const dims = { width: info.width, height: info.height };
      return { color: { data, ...dims }, shadow: { data: shadow, ...dims } };
    })();
    renders.set(brawlerId, p);
    p.catch(() => renders.delete(brawlerId));
  }
  return p;
}

/** Pick a random opaque point in the upper body so the zoomed-in start isn't empty space. */
export async function pickFocus(brawlerId: number): Promise<{ x: number; y: number }> {
  const { shadow } = await loadRender(brawlerId);
  const { data, width, height } = shadow;
  let minY = height;
  let maxY = 0;
  for (let y = 0; y < height; y += 4)
    for (let x = 0; x < width; x += 4)
      if (data[(y * width + x) * 4 + 3]) {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
  const limitY = minY + (maxY - minY) * 0.6;
  for (let tries = 0; tries < 2000; tries++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(minY + Math.random() * (limitY - minY));
    if (data[(y * width + x) * 4 + 3]) return { x: x / width, y: y / height };
  }
  return { x: 0.5, y: 0.35 };
}

async function renderSilhouette(brawlerId: number, focus: { x: number; y: number }, level: number): Promise<Buffer> {
  const { color, shadow } = await loadRender(brawlerId);
  const src = level >= SILHOUETTE_MAX_LEVEL ? color : shadow;
  const { width: W, height: H } = src;
  const z = ZOOMS[Math.min(level, ZOOMS.length - 1)];
  const S = Math.max(W, H) * 1.08;
  const view = S / z;
  const t = (ZOOMS[0] - z) / (ZOOMS[0] - 1); // 0 = centred on focus, 1 = centred on the image
  const cx = focus.x * W + (W / 2 - focus.x * W) * t;
  const cy = focus.y * H + (H / 2 - focus.y * H) * t;
  const size = Math.round(view);
  const left = Math.round(cx - view / 2);
  const top = Math.round(cy - view / 2);

  // The square viewport may hang off the image edges: crop the overlap, then pad back to a square.
  // (sharp always runs extract before extend, so this has to be two explicit steps.)
  const x0 = Math.max(0, left);
  const y0 = Math.max(0, top);
  const x1 = Math.min(W, left + size);
  const y1 = Math.min(H, top + size);
  const cropped = await sharp(src.data, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: x0, top: y0, width: Math.max(1, x1 - x0), height: Math.max(1, y1 - y0) })
    .extend({ left: x0 - left, top: y0 - top, right: left + size - x1, bottom: top + size - y1, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return sharp(cropped.data, { raw: { width: cropped.info.width, height: cropped.info.height, channels: 4 } })
    .resize(OUT, OUT)
    .png({ compressionLevel: 8 })
    .toBuffer();
}

function remember(key: string, make: () => Promise<Buffer>) {
  let p = output.get(key);
  if (!p) {
    if (output.size > 300) output.delete(output.keys().next().value!);
    p = make();
    output.set(key, p);
    p.catch(() => output.delete(key));
  }
  return p;
}

export const silhouettePng = (brawlerId: number, focus: { x: number; y: number }, level: number) =>
  remember(`s:${brawlerId}:${focus.x.toFixed(4)}:${focus.y.toFixed(4)}:${level}`, () => renderSilhouette(brawlerId, focus, level));

export const abilityPng = (abilityId: number) =>
  remember(`a:${abilityId}`, async () =>
    sharp(await fs.readFile(path.join(ASSETS, "abilities", `${abilityId}.png`))).resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
  );

export function pngResponse(buf: Buffer) {
  return new Response(new Uint8Array(buf), {
    headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=86400" },
  });
}
