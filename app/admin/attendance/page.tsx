"use client";

import { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiXCircle, FiCalendar, FiSearch, FiUsers, FiClock } from "react-icons/fi";

const STATUS_STYLES: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-700",
  ABSENT: "bg-rose-100 text-rose-700",
};

type Tab = "student" | "self" | "teacher";

const TABS: { id: Tab; label: string; description: string }[] = [
  { id: "student", label: "Student Records", description: "Attendance teachers recorded for students" },
  { id: "self", label: "Student Self-Reported", description: "Attendance students marked for themselves" },
  { id: "teacher", label: "Teacher Attendance", description: "Attendance teachers marked for themselves" },
];

interface BaseRow {
  id: number;
  status: string;
  date: string;
  remarks: string | null;
  timeUsed?: string | null;
  student?: { user: { name: string; email: string } };
  teacher?: { user: { name: string } };
}

export default function AdminAttendancePage() {
  const [tab, setTab] = useState<Tab>("student");
  const [rows, setRows] = useState<BaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/attendance?type=${tab}`);
        const data = await res.json();
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const stats = useMemo(() => {
    const total = rows.length;
    const present = rows.filter((r) => r.status === "PRESENT").length;
    const absent = rows.filter((r) => r.status === "ABSENT").length;
    return { total, present, absent };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "ALL" && r.status !== filter) return false;
      if (!q) return true;
      const names = [r.student?.user.name, r.teacher?.user.name].filter(Boolean).join(" ").toLowerCase();
      return names.includes(q);
    });
  }, [rows, search, filter]);

  const activeTab = TABS.find((t) => t.id === tab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance Records</h1>
        <p className="text-slate-500 mt-1 text-sm">All attendance across the platform, including teacher and student self-reporting.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-2xl border-2 p-4 text-left transition-all ${
              tab === t.id
                ? "border-[#E91E63] bg-rose-50/50 shadow-md shadow-rose-500/10"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <p className={`text-sm font-bold ${tab === t.id ? "text-[#E91E63]" : "text-slate-700"}`}>{t.label}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{t.description}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
          <p className="text-xl font-black text-slate-900">{stats.total}</p>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Total Records</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm p-4">
          <p className="text-xl font-black text-emerald-700">{stats.present}</p>
          <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">Present</p>
        </div>
        <div className="rounded-2xl bg-rose-50 border border-rose-100 shadow-sm p-4">
          <p className="text-xl font-black text-rose-700">{stats.absent}</p>
          <p className="text-[11px] font-semibold text-rose-600 mt-0.5">Absent</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search by ${tab === "teacher" ? "teacher" : "student"} name...`}
            className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]/40 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["ALL", "PRESENT", "ABSENT"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                filter === f ? "bg-[#E91E63] text-white shadow-lg shadow-rose-500/20" : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-slate-400 text-sm">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <FiUsers className="size-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-semibold text-sm">No {activeTab?.label.toLowerCase()} found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500">Date</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500">{tab === "teacher" ? "Teacher" : "Student"}</th>
                  {tab === "student" && <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500">Assigned Teacher</th>}
                  <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500">Time Used</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500">Remarks</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap flex items-center gap-1.5">
                      <FiCalendar className="size-3.5 text-slate-300" />
                      {new Date(record.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      {record.student?.user.name || record.teacher?.user.name || "—"}
                    </td>
                    {tab === "student" && (
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {record.teacher?.user.name || "—"}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-slate-600 flex items-center gap-1.5">
                      <FiClock className="size-3.5 text-slate-300" />
                      {record.timeUsed || "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-[220px] truncate">{record.remarks || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1 ${STATUS_STYLES[record.status] || "bg-slate-100 text-slate-500"}`}>
                        {record.status === "PRESENT" ? <FiCheckCircle className="size-3.5" /> : <FiXCircle className="size-3.5" />}
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
