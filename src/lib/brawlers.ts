import "server-only";
import data from "@/data/brawlers.json";
import type { BrawlerRef } from "./constants";

export type Ability = { id: number; kind: "Gadget" | "Star Power"; name: string; description: string };
export type Brawler = BrawlerRef & {
  rarity: string;
  role: string;
  gender: string;
  speed: string;
  range: string;
  releaseYear: number;
  hypercharge: string | null;
  emojis: string[];
  abilities: Ability[];
};

export const BRAWLERS = data as Brawler[];
const byId = new Map(BRAWLERS.map((b) => [b.id, b]));

export const getBrawler = (id: number) => byId.get(id);
export const toRef = (b: Brawler): BrawlerRef => ({ id: b.id, name: b.name, slug: b.slug });

/** The only brawler data the browser ever receives up front: names for the guess picker. */
export const BRAWLER_INDEX: BrawlerRef[] = BRAWLERS.map(toRef);

export function findAbility(abilityId: number) {
  for (const b of BRAWLERS) {
    const a = b.abilities.find((x) => x.id === abilityId);
    if (a) return { brawler: b, ability: a };
  }
  return undefined;
}
