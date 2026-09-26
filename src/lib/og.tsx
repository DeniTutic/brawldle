import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

// Shared artwork for link previews (root and per-mode opengraph-image routes).

export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#05071a";
const outline = (w: number) => `0 ${w + 2}px 0 ${INK}, ${w}px ${w}px 0 ${INK}, -${w}px ${w}px 0 ${INK}, ${w}px -${w}px 0 ${INK}, -${w}px -${w}px 0 ${INK}, 0 -${w}px 0 ${INK}, ${w}px 0 0 ${INK}, -${w}px 0 0 ${INK}`;
const font = (file: string) => readFile(path.join(process.cwd(), "assets/fonts", file));
const portrait = async (slug: string) =>
  `data:image/png;base64,${(await readFile(path.join(process.cwd(), "public/brawlers", `${slug}.png`))).toString("base64")}`;

function Star({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ transform: "rotate(-6deg)" }}>
      <path d="M20 2.5l5.3 11 12 1.7-8.7 8.5 2 12-10.6-5.7-10.6 5.7 2-12-8.7-8.5 12-1.7z" fill="#ffc61a" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <circle cx="15.5" cy="19" r="2.3" fill={INK} />
      <circle cx="24.5" cy="19" r="2.3" fill={INK} />
    </svg>
  );
}

export async function ogImage({
  heading,
  headingColor = "#ffc61a",
  tagline,
  accent = "#ffc61a",
  slugs = ["shelly", "spike", "leon", "mortis", "crow"],
}: {
  heading?: string; // a mode name; the logo is shown big when omitted
  headingColor?: string;
  tagline: string;
  accent?: string;
  slugs?: string[];
}) {
  const [display, body, portraits] = await Promise.all([font("Unbounded-ExtraBold.ttf"), font("Rubik-ExtraBold.ttf"), Promise.all(slugs.map(portrait))]);
  const logoSize = heading ? 56 : 118;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(108deg, rgba(255,255,255,0.08) 0 32%, transparent 32.2%), linear-gradient(180deg, #3d6bff 0%, #1a3aca 45%, #0b1240 100%)",
          fontFamily: "Unbounded",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: heading ? 12 : 22, fontSize: logoSize, letterSpacing: -1, textShadow: outline(heading ? 4 : 6) }}>
          <Star size={logoSize * 1.1} />
          <span style={{ color: "#ffc61a" }}>BRAWL</span>
          <span style={{ marginLeft: -logoSize * 0.2 }}>DLE</span>
        </div>
        {heading && (
          <div style={{ display: "flex", marginTop: 12, fontSize: 112, color: headingColor, textShadow: outline(7), letterSpacing: -2 }}>{heading.toUpperCase()}</div>
        )}
        <div style={{ display: "flex", marginTop: heading ? 8 : 18, fontFamily: "Rubik", fontSize: 46, textShadow: outline(3) }}>{tagline}</div>
        <div style={{ display: "flex", gap: 24, marginTop: 40 }}>
          {portraits.map((src, i) =>
            i === 2 ? (
              <div
                key={i}
                style={{
                  width: 136,
                  height: 136,
                  borderRadius: 26,
                  border: `7px solid ${INK}`,
                  background: accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 88,
                  textShadow: outline(5),
                  transform: "rotate(-4deg) translateY(-10px)",
                  boxShadow: `0 8px 0 ${INK}`,
                }}
              >
                ?
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} width={130} height={130} alt="" style={{ borderRadius: 24, border: `6px solid ${INK}`, boxShadow: `0 6px 0 ${INK}` }} />
            ),
          )}
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Unbounded", data: display, style: "normal", weight: 800 },
        { name: "Rubik", data: body, style: "normal", weight: 800 },
      ],
    },
  );
}
