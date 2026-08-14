"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiSearch,
  FiUserCheck,
  FiUsers,
  FiAward,
  FiLoader,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiLink,
} from "react-icons/fi";

export default function AssignPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [busyStudentId, setBusyStudentId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [teachersRes, studentsRes] = await Promise.all([
        fetch("/api/admin/teachers"),
        fetch("/api/admin/students"),
      ]);
      const [teachersData, studentsData] = await Promise.all([teachersRes.json(), studentsRes.json()]);
      setTeachers(teachersData);
      setStudents(studentsData);
    } catch {
      setFeedback({ success: false, text: "Failed to load teachers and students" });
    } finally {
      setLoading(false);
    }
  }

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId) || null;

  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) => t.user.name.toLowerCase().includes(q) || t.user.email.toLowerCase().includes(q)
    );
  }, [teachers, teacherSearch]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) => s.user.name.toLowerCase().includes(q) || s.user.email.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  async function handleToggleAssign(student: any) {
    if (!selectedTeacherId) return;
    const isAssignedToSelected = student.teacherId === selectedTeacherId;
    const nextTeacherId = isAssignedToSelected ? null : selectedTeacherId;

    setBusyStudentId(student.id);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/users/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: nextTeacherId, studentId: student.id }),
      });
      const data = await res.json();

      if (res.ok) {
        setStudents((prev) =>
          prev.map((s) => (s.id === student.id ? { ...s, teacherId: nextTeacherId, teacher: data.student?.teacher } : s))
        );
        setTeachers((prev) =>
          prev.map((t) => {
            if (t.id === selectedTeacherId) {
              const alreadyIn = t.students.some((s: any) => s.id === student.id);
              return {
                ...t,
                students: nextTeacherId
                  ? alreadyIn
                    ? t.students
                    : [...t.students, student]
                  : t.students.filter((s: any) => s.id !== student.id),
              };
            }
            return t;
          })
        );
        setFeedback({
          success: true,
          text: nextTeacherId
            ? `${student.user.name} assigned to ${selectedTeacher.user.name}`
            : `${student.user.name} unassigned`,
        });
      } else {
        setFeedback({ success: false, text: data.message || "Failed to update assignment" });
      }
    } catch {
      setFeedback({ success: false, text: "Something went wrong. Please try again." });
    } finally {
      setBusyStudentId(null);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Assign Students to Teachers</h1>
        <p className="text-slate-500">Pick a teacher, then click a student to instantly assign or unassign them.</p>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl p-4 border flex items-center gap-2 text-sm font-bold ${
            feedback.success
              ? "bg-emerald-50 border-emerald-100 text-emerald-700"
              : "bg-rose-50 border-rose-100 text-rose-600"
          }`}
        >
          {feedback.success ? <FiCheckCircle className="shrink-0" /> : <FiAlertCircle className="shrink-0" />}
          {feedback.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <FiLoader className="size-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Teachers column */}
          <div className="lg:col-span-2 rounded-[28px] bg-white p-6 shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-sm font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
              <FiAward /> 1. Select a Teacher
            </h2>
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
              <input
                type="text"
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                placeholder="Search teachers..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
            <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
              {filteredTeachers.map((t) => {
                const isActive = t.id === selectedTeacherId;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeacherId(isActive ? null : t.id)}
                    className={`w-full flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
                      isActive ? "border-indigo-500 bg-indigo-50/60 shadow-sm" : "border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`size-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        isActive ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {t.user.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">{t.user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{t.user.email}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-black px-2 py-1 rounded-full bg-slate-100 text-slate-500">
                      {t.students.length} {t.students.length === 1 ? "student" : "students"}
                    </span>
                  </button>
                );
              })}
              {filteredTeachers.length === 0 && (
                <p className="text-sm text-slate-400 italic text-center py-8">No teachers found.</p>
              )}
            </div>
          </div>

          {/* Students column */}
          <div className="lg:col-span-3 rounded-[28px] bg-white p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-sm font-black text-[#E91E63] uppercase tracking-widest flex items-center gap-2">
                <FiUsers /> 2. Assign Students
              </h2>
              {selectedTeacher && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <FiLink className="text-indigo-500" /> Assigning to {selectedTeacher.user.name}
                  <button
                    onClick={() => setSelectedTeacherId(null)}
                    className="ml-1 text-slate-400 hover:text-slate-700"
                  >
                    <FiX className="size-3.5" />
                  </button>
                </span>
              )}
            </div>

            {!selectedTeacher ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
                <div className="size-14 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center">
                  <FiAward className="size-7" />
                </div>
                <p className="text-slate-400 font-medium italic">Select a teacher on the left to start assigning students.</p>
              </div>
            ) : (
              <>
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search students..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
                  />
                </div>
                <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
                  {filteredStudents.map((s) => {
                    const isAssignedHere = s.teacherId === selectedTeacherId;
                    const isAssignedElsewhere = s.teacherId && s.teacherId !== selectedTeacherId;
                    const isBusy = busyStudentId === s.id;
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 transition-all ${
                          isAssignedHere ? "border-emerald-400 bg-emerald-50/50" : "border-slate-100"
                        }`}
                      >
                        <div className="size-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold shrink-0">
                          {s.user.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 truncate">{s.user.name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {s.user.email}
                            {isAssignedElsewhere && (
                              <span className="text-amber-600 font-semibold"> · currently with {s.teacher?.user?.name}</span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleAssign(s)}
                          disabled={isBusy}
                          className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            isAssignedHere
                              ? "bg-white text-rose-600 border-2 border-rose-200 hover:bg-rose-50"
                              : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-100"
                          }`}
                        >
                          {isBusy ? (
                            <FiLoader className="size-3.5 animate-spin" />
                          ) : isAssignedHere ? (
                            <FiX className="size-3.5" />
                          ) : (
                            <FiUserCheck className="size-3.5" />
                          )}
                          {isBusy ? "..." : isAssignedHere ? "Unassign" : isAssignedElsewhere ? "Reassign" : "Assign"}
                        </button>
                      </div>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <p className="text-sm text-slate-400 italic text-center py-8">No students found.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
