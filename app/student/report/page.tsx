"use client";

import { useEffect, useState } from "react";
import {
  FiFlag,
  FiSend,
  FiLoader,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiClock,
  FiMessageSquare,
} from "react-icons/fi";

interface ReportRow {
  id: number;
  category: string;
  message: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
  teacher: { user: { name: string } } | null;
}

const CATEGORIES = ["Teaching Quality", "Behavior / Conduct", "Attendance Issue", "Communication", "Other"];

const STATUS_STYLES: Record<string, string> = {
  new: "bg-amber-100 text-amber-700",
  reviewed: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
};

export default function ReportTeacherPage() {
  const [teacher, setTeacher] = useState<{ id: number; name: string; email: string } | null>(null);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; text: string } | null>(null);

  const loadReports = async () => {
    const res = await fetch("/api/student/reports");
    const data = await res.json();
    setTeacher(data.teacher || null);
    setReports(Array.isArray(data.reports) ? data.reports : []);
  };

  useEffect(() => {
    loadReports().finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || submitting) return;
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/student/reports", {
        method: "POST",
        body: JSON.stringify({ category, message }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        // Update the list immediately, no page refresh needed.
        setReports((prev) => [data.report, ...prev]);
        setMessage("");
        setCategory(CATEGORIES[0]);
        setStatus({ success: true, text: data.message || "Report submitted!" });
      } else {
        setStatus({ success: false, text: data.message || "Failed to submit report" });
      }
    } catch {
      setStatus({ success: false, text: "Failed to submit report" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Report a Teacher</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Let the admin team know about any issue, mistake, or concern — it goes straight to Coach Plus admins.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-100 shadow-sm p-6 h-fit">
          <div className="flex items-center gap-3 mb-5">
            <div className="size-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <FiFlag className="size-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900">New Report</p>
              {teacher ? (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <FiUser className="size-3" /> About {teacher.name}
                </p>
              ) : (
                <p className="text-xs text-slate-500">General / no teacher assigned yet</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]/40 transition-all"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">What happened?</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                placeholder="Describe the issue, mistake, or concern in detail..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]/40 transition-all resize-none"
              />
            </div>

            {status && (
              <p className={`text-xs font-bold flex items-center gap-1.5 ${status.success ? "text-emerald-600" : "text-rose-600"}`}>
                {status.success ? <FiCheckCircle /> : <FiAlertCircle />}
                {status.text}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#E91E63] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/20 hover:bg-[#7B1FA2] transition-all disabled:opacity-50"
            >
              {submitting ? <FiLoader className="size-4 animate-spin" /> : <FiSend className="size-4" />}
              Submit Report
            </button>
          </form>
        </div>

        <div className="lg:col-span-3 rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">My Reports</h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {loading ? (
              <p className="p-8 text-center text-slate-400 text-sm">Loading...</p>
            ) : reports.length === 0 ? (
              <div className="p-10 text-center">
                <FiMessageSquare className="size-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-semibold text-sm">You haven't submitted any reports yet.</p>
              </div>
            ) : (
              reports.map((r) => (
                <div key={r.id} className="p-5 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{r.category}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <FiClock className="size-3" /> {new Date(r.createdAt).toLocaleDateString()}
                        {r.teacher ? ` • about ${r.teacher.user.name}` : ""}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${STATUS_STYLES[r.status] || "bg-slate-100 text-slate-500"}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{r.message}</p>
                  {r.adminReply && (
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 mt-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Admin Response</p>
                      <p className="text-xs text-slate-600 whitespace-pre-wrap">{r.adminReply}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
