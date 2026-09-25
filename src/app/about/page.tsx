import type { Metadata } from "next";
import Link from "next/link";
import { ABILITY_DESC_AFTER, ABILITY_NAME_AFTER, ENDLESS_HEARTS, MODE_INFO, SILHOUETTE_MAX_LEVEL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "How to play",
  description: "How to play Brawldle: rules for Classic, Silhouette, Emoji, Ability and Endless modes, points and streaks.",
  alternates: { canonical: "/about" },
};

const H = ({ children }: { children: React.ReactNode }) => <h2 className="stroke-text-sm mt-6 text-2xl text-gold">{children}</h2>;

export default function AboutPage() {
  return (
    <article className="panel mx-auto max-w-2xl p-6 font-semibold leading-relaxed text-white/90 sm:p-8">
      <h1 className="stroke-text text-4xl">How to play</h1>
      <p className="mt-3">
        Every day at <b>00:00 UTC</b> Brawldle picks a new secret brawler for each of the four modes. Type a brawler&apos;s name to guess —
        there&apos;s no guess limit, but fewer guesses means more points.
      </p>
      <H>{MODE_INFO.classic.icon} Classic</H>
      <p>
        Each guess shows how its <b>rarity, class, gender, movement speed, attack range and release year</b> compare to the answer. Green is a
        match, red is not. Arrows tell you whether the answer is higher (▲) or lower (▼) — rarer, faster, longer range or newer.
      </p>
      <H>{MODE_INFO.silhouette.icon} Silhouette</H>
      <p>You start zoomed in on a shadowy part of the brawler. Each wrong guess zooms out, and after {SILHOUETTE_MAX_LEVEL} misses the colours are revealed.</p>
      <H>{MODE_INFO.emoji.icon} Emoji</H>
      <p>You get one emoji clue to start. Every wrong guess reveals another, up to five.</p>
      <H>{MODE_INFO.ability.icon} Ability</H>
      <p>
        Name the owner of a gadget or star power from its icon. After {ABILITY_NAME_AFTER} misses you see its name, after {ABILITY_DESC_AFTER} its
        description.
      </p>
      <H>♾️ Endless</H>
      <p>
        Guess brawlers back to back. Every wrong guess costs a heart ({ENDLESS_HEARTS.classic} in Classic, {ENDLESS_HEARTS.mixed} in Mixed,{" "}
        {ENDLESS_HEARTS.emoji} otherwise); your score is how many brawlers you find before they run out.
      </p>
      <H>🏆 Points &amp; streaks</H>
      <ul className="list-disc space-y-1 pl-5">
        <li>Daily solve: 100 points for a first-try guess, 10 fewer for each extra guess (minimum 10).</li>
        <li>Endless: 5 points for every brawler you find.</li>
        <li>Solve a mode on consecutive days to build its streak.</li>
        <li>Sign in with Google to appear on the leaderboards. Progress you made as a guest is kept.</li>
      </ul>
      <div className="mt-8 text-center">
        <Link href="/classic" className="btn btn-green">Start playing</Link>
      </div>
    </article>
  );
}
