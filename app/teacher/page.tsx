"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiArrowRight,
  FiCheckSquare,
  FiAlertCircle,
} from "react-icons/fi";
import { DAYS_OF_WEEK, parsePreferredDays, toISODate, weekRange } from "@/app/lib/schedule";

interface StudentRow {
  id: number;
  user: { name: string; email: string };
  program?: string;
  subjects?: string;
  preferredTime?: string;
  preferredDays?: string;
}

interface AttendanceRow {
  id: number;
  status: string;
  date: string;
  remarks: string | null;
}

export default function TeacherPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [studentsRes, attendanceRes] = await Promise.all([
          fetch("/api/teacher/students"),
          fetch("/api/teacher/my-attendance"),
        ]);
        const studentsData = await studentsRes.json();
        const attendanceData = await attendanceRes.json();
        if (!cancelled) {
          setStudents(Array.isArray(studentsData) ? studentsData : []);
          setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
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

  const { start, end, days } = useMemo(() => weekRange(new Date()), []);
  const weekMarks = useMemo(
    () =>
      attendance.filter((a) => {
        const iso = toISODate(new Date(a.date));
        return iso >= toISODate(start) && iso <= toISODate(end);
      }),
    [attendance, start, end]
  );

  const stats = useMemo(() => {
    const expectedDays = new Set<string>();
    students.forEach((s) => {
      parsePreferredDays(s.preferredDays).forEach((d) => expectedDays.add(d));
    });
    const present = weekMarks.filter((m) => m.status === "PRESENT").length;
    const absent = weekMarks.filter((m) => m.status === "ABSENT").length;
    const rate = weekMarks.length > 0 ? Math.round((present / weekMarks.length) * 100) : 0;
    return { expectedDays: expectedDays.size, marked: weekMarks.length, present, absent, rate };
  }, [students, weekMarks]);

  const weekMap = useMemo(() => {
    const map = new Map<string, AttendanceRow>();
    weekMarks.forEach((m) => map.set(toISODate(new Date(m.date)), m));
    return map;
  }, [weekMarks]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back!</h1>
        <p className="text-slate-500 mt-1">Here&apos;s an overview of your week and attendance activity.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="size-10 rounded-xl bg-gradient-to-br from-[#7B1FA2] to-[#6A1B9A] text-white flex items-center justify-center mb-3">
            <FiUsers className="size-5" />
          </div>
          <p className="text-2xl font-black text-slate-900">{loading ? "-" : stats.expectedDays}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Scheduled Days / Week</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center mb-3">
            <FiCheckSquare className="size-5" />
          </div>
          <p className="text-2xl font-black text-slate-900">{loading ? "-" : stats.marked}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Marked This Week</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm p-5">
          <div className="size-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-3">
            <FiCheckCircle className="size-5" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{loading ? "-" : stats.present}</p>
          <p className="text-xs font-semibold text-emerald-600 mt-1">Present</p>
        </div>
        <div className="rounded-2xl bg-rose-50 border border-rose-100 shadow-sm p-5">
          <div className="size-10 rounded-xl bg-rose-500 text-white flex items-center justify-center mb-3">
            <FiXCircle className="size-5" />
          </div>
          <p className="text-2xl font-black text-rose-700">{loading ? "-" : stats.absent}</p>
          <p className="text-xs font-semibold text-rose-600 mt-1">Absent</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">This Week</h2>
          <Link
            href="/teacher/attendance"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#E91E63] hover:text-[#7B1FA2] transition-colors"
          >
            Mark Attendance <FiArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 divide-x divide-y sm:divide-y-0 divide-slate-100">
          {days.map((day, i) => {
            const iso = toISODate(day);
            const mark = weekMap.get(iso);
            const isToday = iso === toISODate(new Date());
            return (
              <div key={iso} className={`p-4 text-center ${isToday ? "bg-rose-50/40" : ""}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? "text-[#E91E63]" : "text-slate-400"}`}>
                  {DAYS_OF_WEEK[i].slice(0, 3)}
                </p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">{day.getDate()}</p>
                {loading ? (
                  <span className="text-[10px] text-slate-300">…</span>
                ) : mark ? (
                  <span
                    className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                      mark.status === "PRESENT"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {mark.status === "PRESENT" ? (
                      <FiCheckCircle className="size-3" />
                    ) : (
                      <FiXCircle className="size-3" />
                    )}
                    {mark.status}
                  </span>
                ) : (
                  <span className="mt-1.5 inline-block rounded-full bg-slate-100 text-slate-400 px-2 py-0.5 text-[9px] font-bold">
                    Not marked
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">My Students</h2>
            <Link href="/teacher/students" className="text-xs font-bold text-[#E91E63] hover:text-[#7B1FA2]">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? (
              <p className="p-6 text-center text-slate-400 text-sm">Loading...</p>
            ) : students.length === 0 ? (
              <p className="p-6 text-center text-slate-400 text-sm">No students assigned to you yet.</p>
            ) : (
              students.slice(0, 6).map((s) => (
                <div key={s.id} className="p-4 flex items-center gap-3 min-w-0">
                  <div className="size-10 rounded-full bg-gradient-to-tr from-[#FF5733] to-[#E91E63] text-white flex items-center justify-center font-bold shrink-0">
                    {s.user.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{s.user.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {(s.program || s.subjects) && [s.program, s.subjects].filter(Boolean).join(" · ")}
                      {s.preferredTime && ` • ${s.preferredTime}`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Recent Attendance</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? (
              <p className="p-6 text-center text-slate-400 text-sm">Loading...</p>
            ) : attendance.length === 0 ? (
              <p className="p-6 text-center text-slate-400 text-sm">No attendance records yet.</p>
            ) : (
              attendance.slice(0, 6).map((r) => (
                <div key={r.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      {new Date(r.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                    </p>
                    {r.remarks && (
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                        <FiAlertCircle className="size-3 text-amber-500" /> {r.remarks}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1 ${
                      r.status === "PRESENT"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {r.status === "PRESENT" ? (
                      <FiCheckCircle className="size-3.5" />
                    ) : (
                      <FiXCircle className="size-3.5" />
                    )}
                    {r.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}