"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="panel mx-auto mt-6 flex max-w-md flex-col items-center p-6 text-center">
      <p className="stroke-text text-6xl" aria-hidden>💥</p>
      <h1 className="stroke-text mt-3 text-2xl text-gold">Something exploded!</h1>
      <p className="mt-2 font-bold text-white/80">A wild bug appeared. Give it another go.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button className="btn btn-green" onClick={() => retry()}>Try again</button>
        <Link href="/" className="btn btn-dark">Home</Link>
      </div>
    </div>
  );
}
