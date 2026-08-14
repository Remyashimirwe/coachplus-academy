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
  FiMapPin,
  FiBookOpen,
  FiMail,
  FiPhone,
  FiStar,
} from "react-icons/fi";
import { BRANCHES } from "@/app/lib/constants";
import { scoreTeacherForStudent, matchLabel } from "@/app/lib/matching";

export default function AssignPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [busyTeacherId, setBusyTeacherId] = useState<number | null>(null);
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

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || null;

  const allSubjects = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach((t) =>
      String(t.subjects || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => set.add(s))
    );
    return Array.from(set).sort();
  }, [teachers]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) => s.user.name.toLowerCase().includes(q) || s.user.email.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  // Teachers ranked by how well they match the selected student's branch and desired subjects.
  const rankedTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    return teachers
      .filter((t) => (q ? t.user.name.toLowerCase().includes(q) || t.user.email.toLowerCase().includes(q) : true))
      .filter((t) => (branchFilter ? t.branch === branchFilter : true))
      .filter((t) =>
        subjectFilter
          ? String(t.subjects || "")
              .toLowerCase()
              .includes(subjectFilter.toLowerCase())
          : true
      )
      .map((t) => ({
        ...t,
        match: selectedStudent ? scoreTeacherForStudent(t, selectedStudent) : null,
      }))
      .sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0));
  }, [teachers, teacherSearch, branchFilter, subjectFilter, selectedStudent]);

  async function handleToggleAssign(teacher: any) {
    if (!selectedStudent) return;
    const isAssignedToSelected = selectedStudent.teacherId === teacher.id;
    const nextTeacherId = isAssignedToSelected ? null : teacher.id;

    setBusyTeacherId(teacher.id);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/users/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: nextTeacherId, studentId: selectedStudent.id }),
      });
      const data = await res.json();

      if (res.ok) {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === selectedStudent.id ? { ...s, teacherId: nextTeacherId, teacher: data.student?.teacher } : s
          )
        );
        setTeachers((prev) =>
          prev.map((t) => {
            if (t.id === teacher.id) {
              const alreadyIn = t.students.some((s: any) => s.id === selectedStudent.id);
              return {
                ...t,
                students: nextTeacherId
                  ? alreadyIn
                    ? t.students
                    : [...t.students, selectedStudent]
                  : t.students.filter((s: any) => s.id !== selectedStudent.id),
              };
            }
            return t;
          })
        );
        setFeedback({
          success: true,
          text: nextTeacherId
            ? `${selectedStudent.user.name} assigned to ${teacher.user.name}`
            : `${selectedStudent.user.name} unassigned`,
        });
      } else {
        setFeedback({ success: false, text: data.message || "Failed to update assignment" });
      }
    } catch {
      setFeedback({ success: false, text: "Something went wrong. Please try again." });
    } finally {
      setBusyTeacherId(null);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Assign Students to Teachers</h1>
        <p className="text-slate-500">Pick a student, then choose the best-matching teacher suggested for their location and subjects.</p>
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
          {/* Students column */}
          <div className="lg:col-span-2 rounded-[28px] bg-white p-6 shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-sm font-black text-[#E91E63] uppercase tracking-widest flex items-center gap-2">
              <FiUsers /> 1. Select a Student
            </h2>
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
            <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
              {filteredStudents.map((s) => {
                const isActive = s.id === selectedStudentId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudentId(isActive ? null : s.id)}
                    className={`w-full flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
                      isActive ? "border-[#E91E63] bg-[#fff0f3] shadow-sm" : "border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`size-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        isActive ? "bg-[#E91E63] text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {s.user.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">{s.user.name}</p>
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                        <FiMail className="size-3 shrink-0" /> {s.user.email}
                      </p>
                      {s.phone && (
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                          <FiPhone className="size-3 shrink-0" /> {s.phone}
                        </p>
                      )}
                      <p className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-slate-400">
                        {s.branch && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-bold">
                            <FiMapPin className="size-2.5" /> {s.branch}
                          </span>
                        )}
                        {s.subjects && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-bold truncate max-w-[140px]">
                            <FiBookOpen className="size-2.5" /> {s.subjects}
                          </span>
                        )}
                      </p>
                    </div>
                    {s.teacher && (
                      <span className="shrink-0 text-[10px] font-black px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                        with {s.teacher.user.name.split(" ")[0]}
                      </span>
                    )}
                  </button>
                );
              })}
              {filteredStudents.length === 0 && (
                <p className="text-sm text-slate-400 italic text-center py-8">No students found.</p>
              )}
            </div>
          </div>

          {/* Teachers column */}
          <div className="lg:col-span-3 rounded-[28px] bg-white p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-sm font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                <FiAward /> 2. Assign a Teacher
              </h2>
              {selectedStudent && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <FiLink className="text-[#E91E63]" /> Assigning for {selectedStudent.user.name}
                  <button
                    onClick={() => setSelectedStudentId(null)}
                    className="ml-1 text-slate-400 hover:text-slate-700"
                  >
                    <FiX className="size-3.5" />
                  </button>
                </span>
              )}
            </div>

            {!selectedStudent ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
                <div className="size-14 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center">
                  <FiUsers className="size-7" />
                </div>
                <p className="text-slate-400 font-medium italic">Select a student on the left to see suggested teachers.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="relative sm:col-span-1">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                    <input
                      type="text"
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      placeholder="Search teachers..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                    />
                  </div>
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                  >
                    <option value="">All branches</option>
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                  >
                    <option value="">All subjects</option>
                    {allSubjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
                  {rankedTeachers.map((t) => {
                    const isAssignedHere = selectedStudent.teacherId === t.id;
                    const label = t.match ? matchLabel(t.match) : null;
                    const isBusy = busyTeacherId === t.id;
                    return (
                      <div
                        key={t.id}
                        className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 transition-all ${
                          isAssignedHere ? "border-emerald-400 bg-emerald-50/50" : "border-slate-100"
                        }`}
                      >
                        <div className="size-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold shrink-0">
                          {t.user.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 truncate flex items-center gap-2">
                            {t.user.name}
                            {label && (
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  label === "Best match"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-indigo-50 text-indigo-600"
                                }`}
                              >
                                <FiStar className="size-2.5" /> {label}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                            <FiMail className="size-3 shrink-0" /> {t.user.email}
                          </p>
                          {t.phone && (
                            <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                              <FiPhone className="size-3 shrink-0" /> {t.phone}
                            </p>
                          )}
                          <p className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-slate-400">
                            {t.branch && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-bold">
                                <FiMapPin className="size-2.5" /> {t.branch}
                              </span>
                            )}
                            {t.subjects && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-bold truncate max-w-[160px]">
                                <FiBookOpen className="size-2.5" /> {t.subjects}
                              </span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleAssign(t)}
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
                          {isBusy ? "..." : isAssignedHere ? "Unassign" : selectedStudent.teacherId ? "Reassign" : "Assign"}
                        </button>
                      </div>
                    );
                  })}
                  {rankedTeachers.length === 0 && (
                    <p className="text-sm text-slate-400 italic text-center py-8">No teachers found.</p>
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
