"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiUsers, FiCheckCircle, FiXCircle, FiClock, FiArrowRight, FiCheckSquare, FiBookOpen, FiCalendar } from "react-icons/fi";

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
  student: { user: { name: string } };
}

export default function TeacherPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [recent, setRecent] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [studentsRes, attendanceRes] = await Promise.all([
          fetch("/api/teacher/students"),
          fetch("/api/teacher/attendance"),
        ]);
        const studentsData = await studentsRes.json();
        const attendanceData = await attendanceRes.json();
        if (!cancelled) {
          setStudents(Array.isArray(studentsData) ? studentsData : []);
          setRecent(Array.isArray(attendanceData) ? attendanceData.slice(0, 6) : []);
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

  const today = new Date().toDateString();
  const markedTodayCount = recent.filter((r) => new Date(r.date).toDateString() === today).length;

  const stats = [
    { label: "My Students", value: students.length, icon: FiUsers, color: "from-[#7B1FA2] to-[#6A1B9A]" },
    { label: "Marked Today", value: markedTodayCount, icon: FiCheckSquare, color: "from-emerald-500 to-emerald-600" },
    { label: "Present (recent)", value: recent.filter((r) => r.status === "PRESENT").length, icon: FiCheckCircle, color: "from-[#E91E63] to-[#C2185B]" },
    { label: "Absent (recent)", value: recent.filter((r) => r.status === "ABSENT").length, icon: FiXCircle, color: "from-rose-500 to-rose-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back!</h1>
        <p className="text-slate-500 mt-1">Here's an overview of your students and attendance activity.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
            <div className={`size-10 rounded-xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center mb-3`}>
              <s.icon className="size-5" />
            </div>
            <p className="text-2xl font-black text-slate-900">{loading ? "-" : s.value}</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">My Students</h2>
          <Link
            href="/teacher/attendance"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#E91E63] hover:text-[#7B1FA2] transition-colors"
          >
            Mark Attendance <FiArrowRight className="size-4" />
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            <p className="p-6 text-center text-slate-400 text-sm">Loading...</p>
          ) : students.length === 0 ? (
            <p className="p-6 text-center text-slate-400 text-sm">No students assigned to you yet.</p>
          ) : (
            students.slice(0, 6).map((s) => (
              <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="size-10 rounded-full bg-gradient-to-tr from-[#FF5733] to-[#E91E63] text-white flex items-center justify-center font-bold shrink-0">
                    {s.user.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{s.user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{s.user.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                  {(s.program || s.subjects) && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 text-indigo-700 px-2.5 py-1 truncate max-w-[220px]">
                      <FiBookOpen className="size-3.5 shrink-0" />
                      <span className="truncate">{[s.program, s.subjects].filter(Boolean).join(" · ")}</span>
                    </span>
                  )}
                  {s.preferredTime && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 text-rose-600 px-2.5 py-1 truncate max-w-[260px]">
                      <FiCalendar className="size-3.5 shrink-0" />
                      <span className="truncate">{s.preferredTime}</span>
                    </span>
                  )}
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
          ) : recent.length === 0 ? (
            <p className="p-6 text-center text-slate-400 text-sm">No attendance records yet.</p>
          ) : (
            recent.map((r) => (
              <div key={r.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{r.student.user.name}</p>
                  <p className="text-xs text-slate-500">{new Date(r.date).toLocaleDateString()}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1 ${
                    r.status === "PRESENT"
                      ? "bg-emerald-100 text-emerald-700"
                      : r.status === "LATE"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {r.status === "PRESENT" ? <FiCheckCircle className="size-3.5" /> : r.status === "LATE" ? <FiClock className="size-3.5" /> : <FiXCircle className="size-3.5" />}
                  {r.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
