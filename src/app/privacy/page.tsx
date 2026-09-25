import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy policy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <article className="panel mx-auto max-w-2xl space-y-4 p-6 font-medium leading-relaxed text-white/90 sm:p-8">
      <h1 className="stroke-text text-3xl sm:text-4xl">Privacy policy</h1>
      <p>Brawldle is a free, non-commercial fan game. We collect as little as we can.</p>
      <h2 className="stroke-text pt-2 text-xl text-gold">What we store</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li><b>Guests:</b> a random identifier in a cookie, plus your guesses, scores and streaks.</li>
        <li>
          <b>Signed-in players:</b> your Google account&apos;s name, email address and profile picture, plus the same game data. Your name and
          picture are shown on the public leaderboards. Your email is never shown or shared.
        </li>
        <li>Session cookies needed to keep you signed in.</li>
      </ul>
      <h2 className="stroke-text pt-2 text-xl text-gold">What we don&apos;t do</h2>
      <p>No ads, no third-party trackers, no selling or sharing of your data.</p>
      <h2 className="stroke-text pt-2 text-xl text-gold">Deleting your data</h2>
      <p>Clearing your cookies removes the link to guest progress. Signed-in players can ask for their account and data to be deleted by contacting the site owner.</p>
    </article>
  );
}
