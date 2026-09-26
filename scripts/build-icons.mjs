// Renders the Brawldle star logo into the favicon, the Apple touch icon and the PWA icons.
// Run with `npm run icons` after changing the logo (Logo.tsx uses the same star path).
import fs from "node:fs/promises";
import sharp from "sharp";

const STAR = "M20 2.5l5.3 11 12 1.7-8.7 8.5 2 12-10.6-5.7-10.6 5.7 2-12-8.7-8.5 12-1.7z";
const INK = "#05071a";

const star = (transform = "") => `
  <g transform="${transform}">
    <path d="${STAR}" fill="#ffc61a" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <circle cx="15.5" cy="19" r="2.3" fill="${INK}"/>
    <circle cx="24.5" cy="19" r="2.3" fill="${INK}"/>
  </g>`;

// Browser tab icon: just the star, which reads on light and dark tabs thanks to the ink outline.
const tabIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">${star("rotate(-6 20 20)")}</svg>`;

// App icon: the star on a Brawl-blue tile. `bleed` fills the whole square (maskable / Apple), otherwise rounded.
const appIcon = (bleed) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d6bff"/><stop offset="1" stop-color="#1631a8"/></linearGradient>
    <clipPath id="tile">${bleed ? `<rect width="512" height="512"/>` : `<rect x="16" y="16" width="480" height="480" rx="110"/>`}</clipPath>
  </defs>
  <g clip-path="url(#tile)">
    <rect width="512" height="512" fill="url(#bg)"/>
    <path d="M0 0 L300 0 L170 512 L0 512 Z" fill="#fff" opacity="0.08"/>
  </g>
  ${bleed ? "" : `<rect x="16" y="16" width="480" height="480" rx="110" fill="none" stroke="${INK}" stroke-width="22"/>`}
  ${star(bleed ? "translate(106 104) scale(7.5) rotate(-6 20 20)" : "translate(76 72) scale(9) rotate(-6 20 20)")}
</svg>`;

const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

/** Minimal .ico container holding PNG images (supported by every current browser). */
function ico(images) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4); // colour planes
    header.writeUInt16LE(32, e + 6); // bits per pixel
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((x) => x.data)]);
}

await fs.writeFile("src/app/icon.svg", tabIcon);
await fs.writeFile("src/app/favicon.ico", ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(tabIcon, size) })))));
await fs.writeFile("src/app/apple-icon.png", await png(appIcon(true), 180));
await fs.writeFile("public/icon-192.png", await png(appIcon(false), 192));
await fs.writeFile("public/icon-512.png", await png(appIcon(false), 512));
await fs.writeFile("public/icon-maskable-512.png", await png(appIcon(true), 512));
console.log("icons written");
