"use client";

import { useEffect, useState } from "react";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

export default function TimePicker({
  value,
  onChange,
  label,
  ariaLabel,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  ariaLabel?: string;
  compact?: boolean;
}) {
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");

  // Re-sync local selections whenever the parent supplies a new complete value.
  useEffect(() => {
    const [h, m] = (value || ":").split(":");
    setHour(h || "");
    setMinute(m || "");
  }, [value]);

  const selectCls = compact
    ? "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-1.5 py-1.5 text-[11px] outline-none transition-all focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/10"
    : "w-full rounded-xl border-2 border-slate-100 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-[#E91E63] focus:ring-4 focus:ring-[#E91E63]/10";
  const rowCls = compact ? "flex items-center gap-1" : "flex items-center gap-1.5";
  const labelCls = compact
    ? "text-[9px] font-semibold text-slate-400 uppercase tracking-wider"
    : "text-[10px] font-medium text-slate-400 uppercase tracking-widest";

  return (
    <div>
      {label && <label className={labelCls}>{label}</label>}
      <div className={rowCls}>
        <select
          aria-label={ariaLabel ? `${ariaLabel} hour` : "Hour"}
          value={hour}
          onChange={(e) => {
            const h = e.target.value;
            setHour(h);
            if (h && minute) onChange(`${h}:${minute}`);
          }}
          className={selectCls}
        >
          <option value="">HH</option>
          {HOURS.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span className={`font-bold text-slate-400 ${compact ? "text-[10px]" : ""}`}>:</span>
        <select
          aria-label={ariaLabel ? `${ariaLabel} minute` : "Minute"}
          value={minute}
          onChange={(e) => {
            const m = e.target.value;
            setMinute(m);
            if (hour && m) onChange(`${hour}:${m}`);
          }}
          className={selectCls}
        >
          <option value="">MM</option>
          {MINUTES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
