# Brawldle

A daily Brawl Stars guessing game, in the style of Wordle and Loldle. Every day at 00:00 UTC there's a new brawler to find in four modes:

| Mode | How it works |
| --- | --- |
| 🏆 **Classic** | Every guess shows rarity, class, gender, speed, range and release year: green or red, with ▲▼ hints. |
| 👤 **Silhouette** | A zoomed-in shadow that zooms out with every miss. Colors appear after 7 misses. |
| 😎 **Emoji** | Five emoji clues, revealed one per miss. |
| ⚡ **Ability** | Whose gadget or star power is this? The name is revealed after 3 misses, the description after 6. |
| ♾️ **Endless** | Back-to-back brawlers in any mode or Mixed. A wrong guess costs a ❤️. |

Players can also sign in with Google. Leaderboards cover today's fewest guesses, streaks, Endless high scores and all-time points. Guests can play without an account, and their progress merges into their account when they sign in.

## Stack

- **Next.js 16** (App Router, route handlers) + **React 19** + **Tailwind CSS 4**
- **MongoDB** for puzzles, games, runs and players
- **Better Auth** for Google sign-in (MongoDB adapter)
- **sharp** renders silhouettes on the server

### Anti-cheat design
The answer never reaches the browser before it is revealed. Guesses are checked on the server. Silhouette and ability images are rendered from the player's server-side progress, so the image URL has no brawler ID and a player can't request a clearer level than they've earned. The browser only receives brawler names for the autocomplete.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

This needs a MongoDB instance. The default is `mongodb://127.0.0.1:27017/brawldle`.

### Google sign-in
1. In [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials), create an **OAuth client ID** of type *Web application*.
2. Add these authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` and `https://<your-domain>/api/auth/callback/google`.
3. Put the client ID and secret into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, then restart the dev server.
4. On the OAuth consent screen, use `https://<your-domain>/privacy` as the privacy policy URL.

Until both variables are set, the "Sign in" button is hidden and everyone plays as a guest.

## Brawler data

`src/data/brawlers.json`, `public/brawlers/*` (portraits) and `assets/*` (renders and ability icons, served only through the API) are generated and committed. When new brawlers are released:

```bash
npm run data:fetch   # Brawlify API + Brawl Stars Wiki → .cache/
npm run data:build   # → src/data/brawlers.json + images
```

After that:
- Add 5 emoji clues for each new brawler to `src/data/emoji-clues.json`, ordered from vague to obvious. The build script lists any that are missing.
- Check the `PROBLEMS` list the build prints. Brawlers without a portrait yet (not released) are skipped automatically.
- Attribute overrides for tricky brawlers are at the top of `scripts/build-data.mjs`.

## Deploying

The app runs anywhere Next.js does. The simplest path is **Vercel + MongoDB Atlas (free tier)**:

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | Atlas connection string, including the database name (`.../brawldle`) |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `https://<your-domain>` |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` (used for SEO, the sitemap and OG images) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | from Google Cloud |

`next.config.ts` traces `assets/**` into the API route bundles, so the renders are available in serverless functions.

---

This material is unofficial and is not endorsed by Supercell. For more information see [Supercell's Fan Content Policy](https://supercell.com/en/fan-content-policy/). Brawler data comes from [Brawlify](https://brawlify.com) and the [Brawl Stars Wiki](https://brawlstars.fandom.com).
