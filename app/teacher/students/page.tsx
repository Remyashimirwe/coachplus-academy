"use client";

import { useEffect, useState } from "react";
import {
  FiUsers,
  FiBookOpen,
  FiClock,
  FiMapPin,
  FiMonitor,
  FiChevronLeft,
  FiLoader,
  FiUser,
  FiCalendar,
} from "react-icons/fi";

interface Student {
  id: number;
  user: { name: string; email: string; phone?: string };
  program?: string;
  subjects?: string;
  preferredTime?: string;
  preferredDays?: string;
  learningMode?: string;
  branch?: string;
  phone?: string;
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/teacher/students");
        const data = await res.json();
        if (!cancelled) setStudents(Array.isArray(data) ? data : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const detailRows = (s: Student) => [
    { icon: FiBookOpen, label: "Program & Subjects", value: [s.program, s.subjects].filter(Boolean).join(" · ") || "Not specified", color: "text-indigo-600 bg-indigo-50" },
    { icon: FiClock, label: "Preferred Time", value: s.preferredTime || "Not specified", color: "text-rose-600 bg-rose-50" },
    { icon: FiCalendar, label: "Preferred Days", value: s.preferredDays || "Not specified", color: "text-emerald-600 bg-emerald-50" },
    { icon: FiMapPin, label: "Location", value: s.branch || "Not specified", color: "text-amber-600 bg-amber-50" },
    { icon: FiMonitor, label: "Learning Mode", value: s.learningMode || "Not specified", color: "text-violet-600 bg-violet-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Students</h1>
        <p className="text-slate-500 mt-1 text-sm">Click a student to view their profile.</p>
      </div>

      {loading ? (
        <div className="p-10 flex justify-center rounded-2xl bg-white border border-slate-100 shadow-sm">
          <FiLoader className="size-6 animate-spin text-slate-400" />
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-10 text-center">
          <FiUsers className="size-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-semibold">No students assigned to you yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Assigned Students</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50 ${
                    selected?.id === s.id ? "bg-rose-50/40" : ""
                  }`}
                >
                  <div className="size-10 rounded-full bg-gradient-to-tr from-[#FF5733] to-[#E91E63] text-white flex items-center justify-center font-bold shrink-0">
                    {s.user.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{s.user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{s.user.email}</p>
                  </div>
                  <FiChevronLeft className="size-4 rotate-180 text-slate-300 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {selected ? (
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-tr from-slate-50 to-white">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-full bg-gradient-to-tr from-[#FF5733] to-[#E91E63] text-white flex items-center justify-center text-lg font-black shrink-0">
                    {selected.user.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-black text-slate-900 truncate">{selected.user.name}</h2>
                    <p className="text-sm text-slate-500 truncate">{selected.user.email}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {detailRows(selected).map((row) => (
                  <div key={row.label} className="flex items-start gap-3">
                    <div className={`size-9 rounded-xl ${row.color} flex items-center justify-center shrink-0 mt-0.5`}>
                      <row.icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{row.label}</p>
                      <p className="text-sm font-semibold text-slate-800 break-words">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-10 flex flex-col items-center justify-center text-center">
              <div className="size-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <FiUser className="size-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-semibold">Select a student to view their profile</p>
              <p className="text-xs text-slate-400 mt-1">Name, preferred time, location, program & subjects, and learning mode.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
