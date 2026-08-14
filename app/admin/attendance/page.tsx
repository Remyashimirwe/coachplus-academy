"use client";

import { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiXCircle, FiClock, FiCalendar, FiSearch, FiUsers } from "react-icons/fi";

interface AttendanceRow {
  id: number;
  status: string;
  date: string;
  remarks: string | null;
  student: { user: { name: string; email: string } };
  teacher: { user: { name: string } };
}

const STATUS_STYLES: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-700",
  LATE: "bg-amber-100 text-amber-700",
  ABSENT: "bg-rose-100 text-rose-700",
};

export default function AdminAttendancePage() {
  const [attendances, setAttendances] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/admin/attendance");
      const data = await res.json();
      if (!cancelled) {
        setAttendances(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    }
    load();
    // Poll so newly-marked attendance from teachers appears without a manual reload.
    const interval = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const stats = useMemo(() => {
    const total = attendances.length;
    const present = attendances.filter((a) => a.status === "PRESENT").length;
    const late = attendances.filter((a) => a.status === "LATE").length;
    const absent = attendances.filter((a) => a.status === "ABSENT").length;
    return { total, present, late, absent };
  }, [attendances]);

  const filtered = attendances.filter((a) => {
    const matchesFilter = filter === "ALL" || a.status === filter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      a.student.user.name.toLowerCase().includes(q) ||
      a.teacher.user.name.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance Records</h1>
        <p className="text-slate-500 mt-1 text-sm">All attendance marked by teachers across the platform.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
          <p className="text-xl font-black text-slate-900">{stats.total}</p>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Total Records</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm p-4">
          <p className="text-xl font-black text-emerald-700">{stats.present}</p>
          <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">Present</p>
        </div>
        <div className="rounded-2xl bg-amber-50 border border-amber-100 shadow-sm p-4">
          <p className="text-xl font-black text-amber-700">{stats.late}</p>
          <p className="text-[11px] font-semibold text-amber-600 mt-0.5">Late</p>
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
            placeholder="Search by student or teacher name..."
            className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]/40 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["ALL", "PRESENT", "LATE", "ABSENT"].map((f) => (
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
            <p className="text-slate-500 font-semibold text-sm">No attendance records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500">Date</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500">Student</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500">Teacher</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500">Remarks</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap flex items-center gap-1.5">
                      <FiCalendar className="size-3.5 text-slate-300" />
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{record.student.user.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{record.teacher.user.name}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-[220px] truncate">{record.remarks || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1 ${STATUS_STYLES[record.status] || "bg-slate-100 text-slate-500"}`}>
                        {record.status === "PRESENT" ? <FiCheckCircle className="size-3.5" /> : record.status === "LATE" ? <FiClock className="size-3.5" /> : <FiXCircle className="size-3.5" />}
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
