"use client";

import { FormEvent, useEffect, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiFileText, FiUploadCloud } from "react-icons/fi";

type ReuploadRequest = {
  id: number;
  firstName: string;
  document: string;
  documentKind: string;
  reason: string;
};

export default function DocumentReuploadForm({ token }: { token: string }) {
  const [request, setRequest] = useState<ReuploadRequest | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    if (!token) {
      setError("This upload link is missing. Ask the academy for a new link.");
      setLoading(false);
      return;
    }

    fetch(`/api/teacher-applications/reupload?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "This upload link is invalid or expired.");
        if (active) setRequest(data);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load this link.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!request || !file) {
      setError("Choose the requested document to upload.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("The file must be 4 MB or smaller.");
      return;
    }

    const form = new FormData();
    form.append("token", token);
    form.append("kind", request.documentKind);
    form.append("files", file);

    setSending(true);
    try {
      const response = await fetch(`/api/admin/teacher-applications/${request.id}/reupload-documents`, {
        method: "POST",
        body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.message || "Upload failed. Please try again.");
      setSuccess("Your document was received. The academy will review it soon.");
      setRequest(null);
      setFile(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 sm:px-6">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-orange-500 to-rose-600 px-6 py-7 text-white sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">CoachPlus Academy</p>
          <h1 className="mt-2 text-2xl font-bold">Upload a document</h1>
          <p className="mt-1 text-sm text-white/85">Use this secure link to update your application.</p>
        </div>

        <div className="p-6 sm:p-8">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading your request…</div>
          ) : success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
              <FiCheckCircle className="mb-3 size-6" />
              <p className="font-semibold">Upload complete</p>
              <p className="mt-1 text-sm">{success}</p>
            </div>
          ) : request ? (
            <>
              <p className="text-sm text-slate-600">Hello {request.firstName}, please send the document below.</p>
              <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <div className="flex items-start gap-3">
                  <FiFileText className="mt-0.5 size-5 shrink-0 text-orange-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Document needed</p>
                    <p className="mt-1 font-semibold text-slate-900">{request.document}</p>
                    {request.reason && <p className="mt-2 text-sm text-slate-600">{request.reason}</p>}
                  </div>
                </div>
              </div>

              <form className="mt-6 space-y-5" onSubmit={submit}>
                <div>
                  <label htmlFor="document-type" className="mb-2 block text-sm font-semibold text-slate-700">Document type</label>
                  <select
                    id="document-type"
                    value={request.documentKind}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700"
                  >
                    <option value={request.documentKind}>{request.document}</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">The academy selected the document needed for your application.</p>
                </div>

                <div>
                  <label htmlFor="document-file" className="mb-2 block text-sm font-semibold text-slate-700">Choose the file</label>
                  <input
                    id="document-file"
                    type="file"
                    required
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                    className="block w-full rounded-xl border border-slate-200 bg-white text-sm text-slate-600 file:mr-4 file:border-0 file:bg-orange-50 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-orange-700 hover:file:bg-orange-100"
                  />
                  <p className="mt-1 text-xs text-slate-500">PDF, Word or image · max 4 MB</p>
                </div>

                {file && <p className="break-all text-xs text-slate-500">Selected: {file.name}</p>}
                {error && <p className="flex gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"><FiAlertCircle className="mt-0.5 shrink-0" />{error}</p>}

                <button
                  type="submit"
                  disabled={sending || !file}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiUploadCloud className="size-4" />
                  {sending ? "Uploading…" : "Send document"}
                </button>
              </form>
            </>
          ) : (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
              <FiAlertCircle className="mb-3 size-6" />
              <p className="font-semibold">Upload link unavailable</p>
              <p className="mt-1 text-sm">{error || "Ask the academy to send you a new link."}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
