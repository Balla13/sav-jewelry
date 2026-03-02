"use client";

import { useState, useEffect } from "react";

function getTimeLeft(end: Date) {
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return { minutes: 0, seconds: 0, done: true };
  return {
    minutes: Math.floor(diff / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    done: false,
  };
}

export default function UrgencyBanner() {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ minutes: 20, seconds: 0, done: false });

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    const end = new Date(now.getTime() + 20 * 60 * 1000);

    const tick = () => {
      const next = getTimeLeft(end);
      setTimeLeft(next);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) {
    return (
      <div className="bg-noir-900 px-3 py-2 text-center text-sm text-champagne-100">
        Special Offer: 10% OFF with code WELCOME10 — Ends in 20:00
      </div>
    );
  }

  if (timeLeft.done) {
    return (
      <div className="bg-noir-800 px-3 py-2 text-center text-sm text-champagne-200">
        Offer ended. Use code WELCOME10 on your next order.
      </div>
    );
  }

  const m = String(timeLeft.minutes).padStart(2, "0");
  const s = String(timeLeft.seconds).padStart(2, "0");

  return (
    <div className="bg-noir-900 px-3 py-2 text-center text-sm text-champagne-100">
      <span className="font-medium">Special Offer: 10% OFF with code WELCOME10</span>
      <span className="mx-2">—</span>
      <span>Ends in </span>
      <span className="font-mono font-semibold tabular-nums">{m}:{s}</span>
    </div>
  );
}
