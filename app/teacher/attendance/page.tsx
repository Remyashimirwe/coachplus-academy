"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCalendar,
  FiUsers,
  FiMessageSquare,
  FiLoader,
  FiCheck,
} from "react-icons/fi";

interface StudentRow {
  id: number;
  user: { name: string; email: string };
}

interface AttendanceRow {
  id: number;
  studentId: number;
  status: string;
  remarks: string | null;
  date: string;
}

const STATUS_OPTIONS: { value: string; label: string; icon: any; activeClass: string }[] = [
  { value: "PRESENT", label: "Present", icon: FiCheckCircle, activeClass: "bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/25" },
  { value: "LATE", label: "Late", icon: FiClock, activeClass: "bg-amber-500 text-white border-amber-500 shadow-amber-500/25" },
  { value: "ABSENT", label: "Absent", icon: FiXCircle, activeClass: "bg-rose-500 text-white border-rose-500 shadow-rose-500/25" },
];

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [marks, setMarks] = useState<Record<number, AttendanceRow | undefined>>({});
  const [remarksDraft, setRemarksDraft] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState("");

  const loadStudents = useCallback(async () => {
    const res = await fetch("/api/teacher/students");
    const data = await res.json();
    if (Array.isArray(data)) setStudents(data);
  }, []);

  const loadMarks = useCallback(async (forDate: string) => {
    const res = await fetch(`/api/teacher/attendance?date=${forDate}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      const map: Record<number, AttendanceRow> = {};
      data.forEach((a: AttendanceRow) => {
        map[a.studentId] = a;
      });
      setMarks(map);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([loadStudents(), loadMarks(date)]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // Keep today's marks fresh without requiring a manual page refresh.
  useEffect(() => {
    const interval = setInterval(() => {
      loadMarks(date);
    }, 20000);
    return () => clearInterval(interval);
  }, [date, loadMarks]);

  const handleMark = async (studentId: number, status: string) => {
    setSavingId(studentId);
    setError("");
    const remarks = remarksDraft[studentId] ?? marks[studentId]?.remarks ?? "";
    const previous = marks[studentId];

    // Optimistic update so the UI feels instant.
    setMarks((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || { id: -1, studentId, date }), status, remarks } as AttendanceRow,
    }));

    try {
      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        body: JSON.stringify({ studentId, status, remarks, date }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        setMarks((prev) => ({ ...prev, [studentId]: data.attendance }));
        setSavedId(studentId);
        setTimeout(() => setSavedId((id) => (id === studentId ? null : id)), 1500);
      } else {
        setMarks((prev) => ({ ...prev, [studentId]: previous }));
        setError(data.message || "Failed to save attendance");
      }
    } catch {
      setMarks((prev) => ({ ...prev, [studentId]: previous }));
      setError("Failed to save attendance");
    } finally {
      setSavingId(null);
    }
  };

  const stats = useMemo(() => {
    const values = Object.values(marks).filter(Boolean) as AttendanceRow[];
    return {
      total: students.length,
      marked: values.length,
      present: values.filter((v) => v.status === "PRESENT").length,
      absent: values.filter((v) => v.status === "ABSENT").length,
      late: values.filter((v) => v.status === "LATE").length,
    };
  }, [marks, students.length]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mark Attendance</h1>
          <p className="text-slate-500 mt-1 text-sm">Select a status for each student — it saves instantly.</p>
        </div>
        <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
          <FiCalendar className="size-4 text-slate-400" />
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
          <p className="text-xl font-black text-slate-900">{stats.total}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Students</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm p-4">
          <p className="text-xl font-black text-emerald-700">{stats.present}</p>
          <p className="text-xs font-semibold text-emerald-600 mt-0.5">Present</p>
        </div>
        <div className="rounded-2xl bg-amber-50 border border-amber-100 shadow-sm p-4">
          <p className="text-xl font-black text-amber-700">{stats.late}</p>
          <p className="text-xs font-semibold text-amber-600 mt-0.5">Late</p>
        </div>
        <div className="rounded-2xl bg-rose-50 border border-rose-100 shadow-sm p-4">
          <p className="text-xl font-black text-rose-700">{stats.absent}</p>
          <p className="text-xs font-semibold text-rose-600 mt-0.5">Absent</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-semibold p-4">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center">
            <FiLoader className="size-6 animate-spin text-slate-400" />
          </div>
        ) : students.length === 0 ? (
          <div className="p-10 text-center">
            <FiUsers className="size-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-semibold">No students assigned to you yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {students.map((student) => {
              const mark = marks[student.id];
              return (
                <div key={student.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 min-w-0 sm:w-56 shrink-0">
                    <div className="size-10 rounded-full bg-gradient-to-tr from-[#FF5733] to-[#E91E63] text-white flex items-center justify-center font-bold shrink-0">
                      {student.user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{student.user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{student.user.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {STATUS_OPTIONS.map((opt) => {
                      const active = mark?.status === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleMark(student.id, opt.value)}
                          disabled={savingId === student.id}
                          className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-3.5 py-2 text-xs font-bold transition-all disabled:opacity-60 ${
                            active
                              ? `${opt.activeClass} shadow-lg`
                              : "border-slate-200 text-slate-500 hover:border-slate-300 bg-white"
                          }`}
                        >
                          {savingId === student.id && active ? (
                            <FiLoader className="size-3.5 animate-spin" />
                          ) : savedId === student.id && active ? (
                            <FiCheck className="size-3.5" />
                          ) : (
                            <opt.icon className="size-3.5" />
                          )}
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex-1 min-w-[160px] flex items-center gap-2">
                    <FiMessageSquare className="size-4 text-slate-300 shrink-0" />
                    <input
                      type="text"
                      placeholder="Remarks (optional)"
                      defaultValue={mark?.remarks ?? ""}
                      onChange={(e) => setRemarksDraft((prev) => ({ ...prev, [student.id]: e.target.value }))}
                      onBlur={() => {
                        if (mark && remarksDraft[student.id] !== undefined && remarksDraft[student.id] !== (mark.remarks ?? "")) {
                          handleMark(student.id, mark.status);
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]/40 transition-all"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
