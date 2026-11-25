"use client";

import { useEffect, useState } from "react";

// Two hours from the countdown restart (13:59 Kigali on 25 Nov 2026).
const AVAILABLE_AT = new Date("2026-11-25T11:59:15Z").getTime();

function remainingTime() {
  const seconds = Math.max(0, Math.floor((AVAILABLE_AT - Date.now()) / 1000));
  return {
    hours: Math.floor(seconds / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}

export default function MaintenancePage() {
  const [remaining, setRemaining] = useState(remainingTime);

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(remainingTime()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const units = [
    ["Hours", remaining.hours],
    ["Minutes", remaining.minutes],
    ["Seconds", remaining.seconds],
  ] as const;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-white">
      <section className="w-full max-w-2xl text-center">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/15 text-3xl text-blue-300">
          ✦
        </div>
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
          CoachPlus Academy
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          We’ll be back soon
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-300">
          We’re fixing an issue and updating our website. We expect to be
          available again in about two hours. Thank you for your patience.
        </p>
        <div className="mt-10 flex justify-center gap-3 sm:gap-5" aria-label="Time until we expect to be back">
          {units.map(([label, value]) => (
            <div key={label} className="min-w-24 rounded-2xl border border-white/10 bg-white/5 px-4 py-5 sm:min-w-32 sm:px-6">
              <div className="text-4xl font-bold tabular-nums sm:text-5xl">
                {String(value).padStart(2, "0")}
              </div>
              <div className="mt-2 text-xs font-medium uppercase tracking-widest text-slate-400">
                {label}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-slate-400">
          We appreciate you bearing with us while we make things better.
        </p>
      </section>
    </main>
  );
}
