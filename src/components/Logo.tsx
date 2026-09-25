export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`stroke-text inline-flex items-center gap-1 leading-none ${className}`}>
      <svg viewBox="0 0 40 40" className="h-[1.1em] w-[1.1em] -rotate-6 drop-shadow-[0_3px_0_#05071a]" aria-hidden>
        <path
          d="M20 2.5l5.3 11 12 1.7-8.7 8.5 2 12-10.6-5.7-10.6 5.7 2-12-8.7-8.5 12-1.7z"
          fill="#ffc61a"
          stroke="#05071a"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <circle cx="15.5" cy="19" r="2.3" fill="#05071a" />
        <circle cx="24.5" cy="19" r="2.3" fill="#05071a" />
      </svg>
      <span className="text-gold">BRAWL</span>
      <span className="-ml-0.5 text-white">DLE</span>
    </span>
  );
}
