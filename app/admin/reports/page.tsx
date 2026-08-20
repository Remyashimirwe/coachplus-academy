"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiFlag,
  FiSearch,
  FiClock,
  FiUser,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiLoader,
  FiSend,
  FiMessageSquare,
} from "react-icons/fi";

interface ReportRow {
  id: number;
  category: string;
  message: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
  student: { user: { name: string; email: string } };
  teacher: { user: { name: string } } | null;
}

const STATUS_STYLES: Record<string, string> = {
  new: "bg-amber-100 text-amber-700 border-amber-200",
  reviewed: "bg-blue-100 text-blue-700 border-blue-200",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function ReportModal({
  report,
  onClose,
  onUpdated,
}: {
  report: ReportRow;
  onClose: () => void;
  onUpdated: (id: number, patch: Partial<ReportRow>) => void;
}) {
  const [reply, setReply] = useState(report.adminReply || "");
  const [saving, setSaving] = useState<string | null>(null);
  const [status, setStatus] = useState<{ success: boolean; text: string } | null>(null);

  const updateStatus = async (newStatus: string) => {
    setSaving(newStatus);
    setStatus(null);
    try {
      const res = await fetch(`/api/admin/reports/${report.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus, adminReply: reply || undefined }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        onUpdated(report.id, { status: newStatus, adminReply: reply || report.adminReply });
        setStatus({ success: true, text: data.message || "Updated!" });
      } else {
        setStatus({ success: false, text: data.message || "Failed to update" });
      }
    } catch {
      setStatus({ success: false, text: "Failed to update" });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-5 border-b border-slate-100 flex items-center justify-between z-10">
          <div>
            <h3 className="font-semibold text-slate-900">{report.category}</h3>
            <p className="text-xs text-slate-500 mt-0.5">by {report.student.user.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
            <FiX className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-gradient-to-tr from-[#FF5733] to-[#E91E63] text-white flex items-center justify-center font-semibold shrink-0">
              {report.student.user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-900 truncate">{report.student.user.name}</p>
              <p className="text-xs text-slate-500 truncate">{report.student.user.email}</p>
            </div>
          </div>

          {report.teacher && (
            <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
              <FiUser className="size-3.5" /> Reporting about: <span className="text-slate-800">{report.teacher.user.name}</span>
            </p>
          )}

          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase mb-1.5">Message</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{report.message}</p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Reply to student (optional)</label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={4}
              placeholder="Write a response that will be emailed to the student..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]/40 transition-all resize-none"
            />
          </div>

          {status && (
            <p className={`text-[11px] font-semibold flex items-center gap-1.5 ${status.success ? "text-emerald-600" : "text-rose-600"}`}>
              {status.success ? <FiCheckCircle /> : <FiAlertCircle />}
              {status.text}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => updateStatus("reviewed")}
              disabled={!!saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 text-blue-700 border-2 border-blue-200 px-4 py-2.5 text-[13px] font-semibold hover:bg-blue-100 transition-all disabled:opacity-50"
            >
              {saving === "reviewed" ? <FiLoader className="size-4 animate-spin" /> : <FiMessageSquare className="size-4" />}
              Mark Reviewed
            </button>
            <button
              onClick={() => updateStatus("resolved")}
              disabled={!!saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-white px-4 py-2.5 text-[13px] font-semibold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-50"
            >
              {saving === "resolved" ? <FiLoader className="size-4 animate-spin" /> : <FiSend className="size-4" />}
              Resolve &amp; Notify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ReportRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/admin/reports");
      const data = await res.json();
      if (!cancelled) {
        setReports(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    }
    load();
    // Poll so newly-submitted student reports appear without a manual reload.
    const interval = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const updateReport = (id: number, patch: Partial<ReportRow>) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  };

  const stats = useMemo(() => {
    const total = reports.length;
    const newCount = reports.filter((r) => r.status === "new").length;
    const reviewed = reports.filter((r) => r.status === "reviewed").length;
    const resolved = reports.filter((r) => r.status === "resolved").length;
    return { total, newCount, reviewed, resolved };
  }, [reports]);

  const filtered = reports.filter((r) => {
    const matchesFilter = filter === "ALL" || r.status === filter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      r.student.user.name.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      (r.teacher?.user.name.toLowerCase().includes(q) ?? false);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-slate-900">Student Reports</h1>
        <p className="text-slate-500 mt-1 text-sm">Concerns and issues reported by students about their teachers.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
          <p className="text-base font-bold text-slate-900">{stats.total}</p>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Total</p>
        </div>
        <div className="rounded-2xl bg-amber-50 border border-amber-100 shadow-sm p-4">
          <p className="text-base font-bold text-amber-700">{stats.newCount}</p>
          <p className="text-[11px] font-semibold text-amber-600 mt-0.5">New</p>
        </div>
        <div className="rounded-2xl bg-blue-50 border border-blue-100 shadow-sm p-4">
          <p className="text-base font-bold text-blue-700">{stats.reviewed}</p>
          <p className="text-[11px] font-semibold text-blue-600 mt-0.5">Reviewed</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm p-4">
          <p className="text-base font-bold text-emerald-700">{stats.resolved}</p>
          <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">Resolved</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, teacher, or category..."
            className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]/40 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["ALL", "new", "reviewed", "resolved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-4 py-2 text-[11px] font-semibold capitalize transition-all ${
                filter === f ? "bg-[#E91E63] text-white shadow-lg shadow-rose-500/20" : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {f === "ALL" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="p-8 text-center text-slate-400 text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-10 text-center">
          <FiFlag className="size-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-medium text-[13px]">No reports found.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className="text-left rounded-2xl bg-white border border-slate-100 shadow-sm p-5 hover:border-[#E91E63]/30 hover:shadow-md transition-all flex flex-col h-full"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <p className="font-semibold text-slate-900 text-[13px]">{r.category}</p>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase border ${STATUS_STYLES[r.status] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
                  {r.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-3 flex-1">{r.message}</p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 truncate">{r.student.user.name}</p>
                <p className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                  <FiClock className="size-3" /> {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <ReportModal report={selected} onClose={() => setSelected(null)} onUpdated={updateReport} />
      )}
    </div>
  );
}
