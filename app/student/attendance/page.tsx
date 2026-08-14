"use client";

import { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiXCircle, FiClock, FiCalendar, FiTrendingUp } from "react-icons/fi";

interface AttendanceRow {
  id: number;
  status: string;
  date: string;
  remarks: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-700",
  LATE: "bg-amber-100 text-amber-700",
  ABSENT: "bg-rose-100 text-rose-700",
};

const STATUS_ICONS: Record<string, any> = {
  PRESENT: FiCheckCircle,
  LATE: FiClock,
  ABSENT: FiXCircle,
};

export default function StudentAttendancePage() {
  const [attendances, setAttendances] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/student/attendance");
      const data = await res.json();
      if (!cancelled) {
        setAttendances(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    }
    load();
    // Refresh periodically so a newly-marked record shows up without a manual reload.
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
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, late, absent, rate };
  }, [attendances]);

  const filtered = filter === "ALL" ? attendances : attendances.filter((a) => a.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Attendance</h1>
        <p className="text-slate-500 mt-1 text-sm">Track your session history and attendance rate.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
          <div className="size-9 rounded-xl bg-gradient-to-br from-[#7B1FA2] to-[#6A1B9A] text-white flex items-center justify-center mb-2">
            <FiTrendingUp className="size-4" />
          </div>
          <p className="text-xl font-black text-slate-900">{stats.rate}%</p>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Attendance Rate</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
          <p className="text-xl font-black text-slate-900">{stats.total}</p>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Total Sessions</p>
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

      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-slate-400 text-sm">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <FiCalendar className="size-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-semibold text-sm">No attendance records found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((record) => {
              const Icon = STATUS_ICONS[record.status] || FiCalendar;
              return (
                <div key={record.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${STATUS_STYLES[record.status] || "bg-slate-100 text-slate-500"}`}>
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">
                        {new Date(record.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                      </p>
                      {record.remarks && <p className="text-xs text-slate-500 truncate mt-0.5">{record.remarks}</p>}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[record.status] || "bg-slate-100 text-slate-500"}`}>
                    {record.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
