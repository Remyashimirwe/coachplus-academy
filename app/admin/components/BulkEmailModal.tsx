"use client";

import { useState, type FormEvent } from "react";
import { FiAlertCircle, FiLoader, FiMail, FiX } from "react-icons/fi";

type RecipientType = "requests" | "applications";

export default function BulkEmailModal({
  recipientType,
  recipientIds,
  onClose,
}: {
  recipientType: RecipientType;
  recipientIds: number[];
  onClose: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const label = recipientType === "requests" ? "request" : "teacher application";

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || result) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/bulk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientType, recipientIds, subject, message }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.message || "Could not send the emails. Please try again.");
        return;
      }
      setResult({ sent: data.sent ?? 0, failed: data.failed ?? 0 });
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !sending) onClose(); }}>
      <form onSubmit={handleSend} className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#E91E63]"><FiMail className="size-5" /></div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Email filtered {label}s</h2>
              <p className="mt-1 text-xs text-slate-500">This message will be sent separately to {recipientIds.length} recipient{recipientIds.length === 1 ? "" : "s"}.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={sending} aria-label="Close email composer" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"><FiX className="size-5" /></button>
        </div>

        {result ? (
          <div className="space-y-4 px-5 py-6 sm:px-6">
            <div className={`flex items-start gap-3 rounded-xl border p-4 ${result.failed ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
              {result.failed > 0 && <FiAlertCircle className="mt-0.5 size-4 shrink-0" />}
              <p className="text-sm">Sent to {result.sent} recipient{result.sent === 1 ? "" : "s"}{result.failed ? `; ${result.failed} failed.` : "."}</p>
            </div>
            <div className="flex justify-end"><button type="button" onClick={onClose} className="rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#E91E63]">Done</button></div>
          </div>
        ) : (
          <div className="space-y-4 px-5 py-5 sm:px-6">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">Subject</span>
              <input required maxLength={180} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Write an email subject" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/15" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">Message</span>
              <textarea required maxLength={12000} rows={8} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write your message..." className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/15" />
            </label>
            {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-slate-400">Recipients will not see one another’s email addresses.</p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} disabled={sending} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={sending || recipientIds.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E91E63] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d31655] disabled:cursor-not-allowed disabled:opacity-60">
                  {sending ? <FiLoader className="size-4 animate-spin" /> : <FiMail className="size-4" />}
                  {sending ? "Sending..." : `Send to ${recipientIds.length}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
