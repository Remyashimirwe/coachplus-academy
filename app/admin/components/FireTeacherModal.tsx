"use client";

import { useState } from "react";
import {
  FiX,
  FiAlertTriangle,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import { useToast } from "@/app/components/ToastProvider";

export default function FireTeacherModal({ teacher, onClose, onFired }: any) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const toast = useToast();

  const canFire = message.trim().length > 0;

  async function handleFire() {
    if (!canFire) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/teachers/${teacher.id}/fire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || "Teacher dismissed.");
        // The modal closes itself after a moment, so the inline confirmation
        // below would be gone before it could be read — the toast outlives it.
        toast.success(data.message || "Teacher dismissed.");
        onFired?.();
        setTimeout(onClose, 1400);
      } else {
        setError(data.message || "Failed to dismiss the teacher.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <FiAlertTriangle className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                Dismiss {teacher.user.name}
              </h2>
              <p className="text-[11px] text-slate-400 truncate">{teacher.user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 size-9 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <FiX className="size-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-[13px] text-slate-600 leading-relaxed">
            Write a message explaining why this teacher is being dismissed. The teacher will see this
            message when they log in and receive it by email.
          </p>

          <label className="block">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Reason / Message *</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="e.g. Unfortunately, we are ending your role because..."
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all resize-none"
            />
          </label>

          {error && (
            <div className="rounded-2xl p-3.5 border flex items-center gap-2 text-[13px] font-semibold bg-rose-50 border-rose-100 text-rose-600">
              <FiAlertCircle className="shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="rounded-2xl p-3.5 border flex items-center gap-2 text-[13px] font-semibold bg-emerald-50 border-emerald-100 text-emerald-700">
              <FiCheckCircle className="shrink-0" /> {success}
            </div>
          )}

          <div className="flex items-center gap-3 justify-end pt-2">
            <button
              onClick={onClose}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-100 px-5 py-2.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleFire}
              disabled={!canFire || busy}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-500 text-white px-5 py-2.5 text-[13px] font-semibold hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? <FiLoader className="size-4 animate-spin" /> : <FiAlertTriangle className="size-4" />}
              {busy ? "Dismissing..." : "Dismiss Teacher"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}