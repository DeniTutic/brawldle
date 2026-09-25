import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Brawldle — the daily Brawl Stars guessing game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FEATURED = ["shelly", "spike", "leon", "mortis", "crow"];

export default async function Image() {
  const font = await readFile(path.join(process.cwd(), "assets/fonts/LilitaOne-Regular.ttf"));
  const portraits = await Promise.all(
    FEATURED.map(async (slug) => `data:image/png;base64,${(await readFile(path.join(process.cwd(), "public/brawlers", `${slug}.png`))).toString("base64")}`),
  );
  const outline = "0 6px 0 #05071a, 4px 4px 0 #05071a, -4px 4px 0 #05071a, 4px -3px 0 #05071a, -4px -3px 0 #05071a";
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
          background: "linear-gradient(180deg, #2f5cff 0%, #1631a8 60%, #0b1240 100%)",
          fontFamily: "Lilita",
          color: "white",
        }}
      >
        <div style={{ display: "flex", fontSize: 150, letterSpacing: 2, textShadow: outline }}>
          <span style={{ color: "#ffc61a" }}>BRAWL</span>
          <span>DLE</span>
        </div>
        <div style={{ fontSize: 48, marginTop: 10, textShadow: "0 4px 0 #05071a" }}>Guess the brawler of the day!</div>
        <div style={{ display: "flex", gap: 24, marginTop: 44 }}>
          {portraits.map((src, i) =>
            i === 2 ? (
              <div
                key={i}
                style={{ width: 130, height: 130, borderRadius: 24, border: "6px solid #05071a", background: "#ffc61a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 96, textShadow: outline }}
              >
                ?
              </div>
            ) : (
              <img key={i} src={src} width={130} height={130} alt="" style={{ borderRadius: 24, border: "6px solid #05071a" }} />
            ),
          )}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Lilita", data: font, style: "normal", weight: 400 }] },
  );
}
