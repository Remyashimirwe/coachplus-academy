"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCalendar,
  FiFlag,
  FiArrowRight,
  FiTrendingUp,
  FiUser,
} from "react-icons/fi";

interface AttendanceRow {
  id: number;
  status: string;
  date: string;
}

export default function StudentPage() {
  const [attendances, setAttendances] = useState<AttendanceRow[]>([]);
  const [reportsCount, setReportsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [attRes, repRes] = await Promise.all([
          fetch("/api/student/attendance"),
          fetch("/api/student/reports"),
        ]);
        const attData = await attRes.json();
        const repData = await repRes.json();
        if (!cancelled) {
          setAttendances(Array.isArray(attData) ? attData : []);
          setReportsCount(Array.isArray(repData?.reports) ? repData.reports.length : 0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back!</h1>
        <p className="text-slate-500 mt-1">Here's a snapshot of your attendance and activity.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="size-10 rounded-xl bg-gradient-to-br from-[#7B1FA2] to-[#6A1B9A] text-white flex items-center justify-center mb-3">
            <FiTrendingUp className="size-5" />
          </div>
          <p className="text-2xl font-black text-slate-900">{loading ? "-" : `${stats.rate}%`}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Attendance Rate</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center mb-3">
            <FiCheckCircle className="size-5" />
          </div>
          <p className="text-2xl font-black text-slate-900">{loading ? "-" : stats.present}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Present</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="size-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center mb-3">
            <FiClock className="size-5" />
          </div>
          <p className="text-2xl font-black text-slate-900">{loading ? "-" : stats.late}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Late</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="size-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center mb-3">
            <FiXCircle className="size-5" />
          </div>
          <p className="text-2xl font-black text-slate-900">{loading ? "-" : stats.absent}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Absent</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/student/attendance"
          className="group rounded-2xl bg-white border border-slate-100 shadow-sm p-6 flex items-center justify-between hover:border-[#E91E63]/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-[#fff0f3] text-[#E91E63] flex items-center justify-center shrink-0">
              <FiCalendar className="size-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900">My Attendance</p>
              <p className="text-xs text-slate-500 mt-0.5">View your full attendance history</p>
            </div>
          </div>
          <FiArrowRight className="size-5 text-slate-300 group-hover:text-[#E91E63] group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/student/report"
          className="group rounded-2xl bg-white border border-slate-100 shadow-sm p-6 flex items-center justify-between hover:border-[#E91E63]/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <FiFlag className="size-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Report a Teacher</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {reportsCount ? `${reportsCount} report(s) submitted` : "Share a concern with the admin team"}
              </p>
            </div>
          </div>
          <FiArrowRight className="size-5 text-slate-300 group-hover:text-[#E91E63] group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Recent Attendance</h2>
          <Link href="/student/attendance" className="text-xs font-bold text-[#E91E63] hover:text-[#7B1FA2]">
            View all
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            <p className="p-6 text-center text-slate-400 text-sm">Loading...</p>
          ) : attendances.length === 0 ? (
            <div className="p-8 text-center">
              <FiUser className="size-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-semibold text-sm">No attendance records yet.</p>
            </div>
          ) : (
            attendances.slice(0, 6).map((record) => (
              <div key={record.id} className="p-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  {new Date(record.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1 ${
                    record.status === "PRESENT"
                      ? "bg-emerald-100 text-emerald-700"
                      : record.status === "LATE"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {record.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
