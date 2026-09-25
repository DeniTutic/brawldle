import Image from "next/image";
import type { BrawlerRef } from "@/lib/constants";

export function BrawlerPortrait({ brawler, size = 56, className = "" }: { brawler: BrawlerRef; size?: number; className?: string }) {
  return (
    <Image
      src={`/brawlers/${brawler.slug}.png`}
      alt={brawler.name}
      width={size}
      height={size}
      className={`${size >= 56 ? "rounded-xl border-4" : "rounded-[10px] border-[3px]"} border-ink bg-[#3a58d6] object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
