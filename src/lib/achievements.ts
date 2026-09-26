// Badges are derived from a player's stats, so nothing extra is stored. Shared by server and client.

export type BadgeStats = {
  solves: number; // daily solves, all modes
  oneShots: number; // daily solves on the first guess
  fullClears: number;
  bestStreak: number; // best streak in any mode, or across modes
  endlessBest: number; // best Endless score in any mode
  points: number;
};

export type Badge = { id: string; icon: string; name: string; desc: string; test: (s: BadgeStats) => boolean };

export const BADGES: Badge[] = [
  { id: "first", icon: "🎉", name: "First Win", desc: "Solve your first daily puzzle", test: (s) => s.solves >= 1 },
  { id: "oneshot", icon: "🎯", name: "One Shot", desc: "Solve a daily puzzle on the first guess", test: (s) => s.oneShots >= 1 },
  { id: "fullclear", icon: "🌟", name: "Full Clear", desc: "Solve all 4 modes in one day", test: (s) => s.fullClears >= 1 },
  { id: "streak3", icon: "🔥", name: "On Fire", desc: "Reach a 3-day streak", test: (s) => s.bestStreak >= 3 },
  { id: "streak7", icon: "🚀", name: "Unstoppable", desc: "Reach a 7-day streak", test: (s) => s.bestStreak >= 7 },
  { id: "streak30", icon: "👑", name: "Legendary", desc: "Reach a 30-day streak", test: (s) => s.bestStreak >= 30 },
  { id: "endless10", icon: "🛡️", name: "Survivor", desc: "Score 10 in an Endless run", test: (s) => s.endlessBest >= 10 },
  { id: "endless25", icon: "🏃", name: "Marathon", desc: "Score 25 in an Endless run", test: (s) => s.endlessBest >= 25 },
  { id: "endless50", icon: "💀", name: "Immortal", desc: "Score 50 in an Endless run", test: (s) => s.endlessBest >= 50 },
  { id: "points1k", icon: "💰", name: "Stacked", desc: "Earn 1,000 points", test: (s) => s.points >= 1000 },
  { id: "points5k", icon: "💎", name: "Gem Hoarder", desc: "Earn 5,000 points", test: (s) => s.points >= 5000 },
  { id: "points10k", icon: "🏅", name: "Hall of Fame", desc: "Earn 10,000 points", test: (s) => s.points >= 10000 },
  { id: "scholar", icon: "📚", name: "Brawl Scholar", desc: "Solve 50 daily puzzles", test: (s) => s.solves >= 50 },
];

export const unlockedBadges = (s: BadgeStats) => BADGES.filter((b) => b.test(s)).map((b) => b.id);
export const badgeById = (id: string) => BADGES.find((b) => b.id === id);
