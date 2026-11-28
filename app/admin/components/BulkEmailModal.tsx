"use client";

import { useState, type FormEvent } from "react";
import { FiAlertCircle, FiCheck, FiLoader, FiMail, FiSearch, FiX } from "react-icons/fi";

type RecipientType = "requests" | "applications";
type BulkEmailRecipient = { id: number; name: string; email: string };
type FailedEmailRecipient = BulkEmailRecipient & { reason: string };
type BulkEmailResult = {
  sent: number;
  failed: number;
  failedRecipients: FailedEmailRecipient[];
};

export default function BulkEmailModal({
  recipientType,
  recipients,
  onClose,
}: {
  recipientType: RecipientType;
  recipients: BulkEmailRecipient[];
  onClose: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>(
    () => recipients.map((recipient) => recipient.id),
  );
  const [result, setResult] = useState<BulkEmailResult | null>(null);
  const label = recipientType === "requests" ? "request" : "teacher application";
  const selectedIdSet = new Set(selectedIds);
  const matchingRecipients = recipients.filter((recipient) => {
    const query = recipientSearch.trim().toLowerCase();
    return !query || recipient.name.toLowerCase().includes(query) || recipient.email.toLowerCase().includes(query);
  });

  function selectMatchingRecipients(checked: boolean) {
    const matchingIds = new Set(matchingRecipients.map((recipient) => recipient.id));
    setSelectedIds((current) => checked
      ? [...new Set([...current, ...matchingIds])]
      : current.filter((id) => !matchingIds.has(id)));
  }

  function toggleRecipient(id: number) {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((recipientId) => recipientId !== id)
      : [...current, id]);
  }

  async function sendRecipients(recipientIds: number[]) {
    if (sending || recipientIds.length === 0) return;
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
      setResult((previous) => ({
        sent: (previous?.sent ?? 0) + (data.sent ?? 0),
        failed: data.failed ?? 0,
        failedRecipients: data.failedRecipients ?? [],
      }));
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (result) return;
    await sendRecipients(selectedIds);
  }

  async function handleRetryFailed() {
    if (!result) return;
    await sendRecipients(result.failedRecipients.map((recipient) => recipient.id));
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !sending) onClose(); }}>
      <form onSubmit={handleSend} className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#E91E63]"><FiMail className="size-5" /></div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Email filtered {label}s</h2>
              <p className="mt-1 text-xs text-slate-500">{selectedIds.length} of {recipients.length} recipient{recipients.length === 1 ? "" : "s"} selected. Each email is sent separately.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={sending} aria-label="Close email composer" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"><FiX className="size-5" /></button>
        </div>

        {result ? (
          <div className="space-y-4 overflow-y-auto px-5 py-6 sm:px-6">
            <div className={`flex items-start gap-3 rounded-xl border p-4 ${result.failed ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
              {result.failed > 0 && <FiAlertCircle className="mt-0.5 size-4 shrink-0" />}
              <p className="text-sm">Sent to {result.sent} recipient{result.sent === 1 ? "" : "s"}{result.failed ? `; ${result.failed} still need attention.` : "."}</p>
            </div>
            {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
            {result.failedRecipients.length > 0 && (
              <section className="overflow-hidden rounded-xl border border-slate-200">
                <div className="border-b border-slate-100 bg-slate-50 px-3.5 py-2.5">
                  <h3 className="text-xs font-semibold text-slate-700">Failed recipients ({result.failedRecipients.length})</h3>
                </div>
                <div className="max-h-56 divide-y divide-slate-100 overflow-y-auto">
                  {result.failedRecipients.map((recipient) => (
                    <div key={recipient.id} className="px-3.5 py-2.5">
                      <p className="truncate text-xs font-semibold text-slate-700">{recipient.name || "Applicant"}</p>
                      <p className="truncate text-[10px] text-slate-500">{recipient.email || "No email address"}</p>
                      <p className="mt-1 break-words text-[10px] text-rose-600">{recipient.reason}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
              {result.failedRecipients.length > 0 && (
                <button type="button" onClick={handleRetryFailed} disabled={sending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E91E63] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d31655] disabled:cursor-not-allowed disabled:opacity-60">
                  {sending && <FiLoader className="size-4 animate-spin" />}
                  {sending ? "Retrying..." : `Retry failed (${result.failedRecipients.length})`}
                </button>
              )}
              <button type="button" onClick={onClose} disabled={sending} className="rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#E91E63] disabled:opacity-60">Done</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-700">Recipients <span className="font-medium text-slate-400">({selectedIds.length} selected)</span></p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setSelectedIds(matchingRecipients.map((recipient) => recipient.id))} disabled={!matchingRecipients.length || sending} className="text-[11px] font-semibold text-[#E91E63] hover:underline disabled:text-slate-400">Only shown</button>
                  <button type="button" onClick={() => selectMatchingRecipients(true)} disabled={!matchingRecipients.length || sending} className="text-[11px] font-semibold text-[#E91E63] hover:underline disabled:text-slate-400">Select shown</button>
                  <button type="button" onClick={() => selectMatchingRecipients(false)} disabled={!matchingRecipients.length || sending} className="text-[11px] font-semibold text-slate-500 hover:underline disabled:text-slate-300">Clear shown</button>
                </div>
              </div>
              <label className="relative block">
                <FiSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={recipientSearch}
                  onChange={(event) => setRecipientSearch(event.target.value)}
                  placeholder="Search by applicant name or email"
                  aria-label="Search email recipients"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/15"
                />
              </label>
              <div className="mt-2 max-h-36 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                {matchingRecipients.length ? matchingRecipients.map((recipient) => (
                  <label key={recipient.id} className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selectedIdSet.has(recipient.id)}
                      onChange={() => toggleRecipient(recipient.id)}
                      disabled={sending}
                      className="size-4 shrink-0 accent-[#E91E63]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-slate-700">{recipient.name || "Applicant"}</span>
                      <span className="block truncate text-[10px] text-slate-400">{recipient.email}</span>
                    </span>
                    {selectedIdSet.has(recipient.id) && <FiCheck className="size-3.5 shrink-0 text-emerald-600" />}
                  </label>
                )) : (
                  <p className="px-3 py-4 text-center text-xs text-slate-400">No recipients match that search.</p>
                )}
              </div>
            </section>
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
                <button type="submit" disabled={sending || selectedIds.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E91E63] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d31655] disabled:cursor-not-allowed disabled:opacity-60">
                  {sending ? <FiLoader className="size-4 animate-spin" /> : <FiMail className="size-4" />}
                  {sending ? "Sending..." : `Send to ${selectedIds.length}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
