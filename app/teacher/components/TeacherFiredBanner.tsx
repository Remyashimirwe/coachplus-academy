"use client";

import { useEffect, useState } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";

export default function TeacherFiredBanner() {
  const [status, setStatus] = useState<{ isFired: boolean; fireMessage?: string | null } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/teacher/fire-status");
        const data = await res.json();
        if (!cancelled && res.ok) setStatus(data);
      } catch {
        // ignore, banner is non-critical
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status?.isFired || dismissed) return null;

  return (
    <div className="mb-6 rounded-2xl border-2 border-rose-200 bg-rose-50 p-5">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
          <FiAlertTriangle className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-rose-700">Your teaching role has ended</h2>
          {status.fireMessage && (
            <p className="mt-1.5 text-[13px] text-rose-700/90 leading-relaxed whitespace-pre-wrap">{status.fireMessage}</p>
          )}
          <p className="mt-3 text-[11px] text-rose-500">
            If you believe this is a mistake or have any questions, please contact the admin team.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 size-8 rounded-lg bg-white text-rose-400 hover:text-rose-600 flex items-center justify-center transition-colors"
          aria-label="Dismiss"
        >
          <FiX className="size-4" />
        </button>
      </div>
    </div>
  );
}