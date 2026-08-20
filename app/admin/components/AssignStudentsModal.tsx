"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiX,
  FiSearch,
  FiLoader,
  FiUserPlus,
  FiUserCheck,
  FiMapPin,
  FiBookOpen,
  FiMail,
  FiCheckCircle,
  FiAlertCircle,
  FiStar,
} from "react-icons/fi";
import { scoreTeacherForStudent, matchLabel } from "@/app/lib/matching";

export default function AssignStudentsModal({ teacher, onClose, onAssigned }: any) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyStudentId, setBusyStudentId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/students");
        const data = await res.json();
        if (!cancelled) setStudents(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setFeedback({ success: false, text: "Failed to load students." });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const assignedCount = useMemo(
    () => students.filter((s) => s.teacherId === teacher.id).length,
    [students, teacher.id]
  );

  // Students ranked by how well this teacher matches their location (branch) and the subjects they need help with.
  const rankedStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students
      .filter((s) =>
        q
          ? s.user.name.toLowerCase().includes(q) ||
            s.user.email.toLowerCase().includes(q) ||
            String(s.subjects || "").toLowerCase().includes(q)
          : true
      )
      .map((s) => ({ ...s, match: scoreTeacherForStudent(teacher, s) }))
      .sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0));
  }, [students, search, teacher]);

  async function handleToggleAssign(student: any) {
    const isAssignedHere = student.teacherId === teacher.id;
    const nextTeacherId = isAssignedHere ? null : teacher.id;
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
          prev.map((s) =>
            s.id === student.id ? { ...s, teacherId: nextTeacherId, teacher: data.student?.teacher } : s
          )
        );
        onAssigned?.(assignedCount + (nextTeacherId ? 1 : -1));
        setFeedback({
          success: true,
          text: nextTeacherId
            ? `${student.user.name} assigned to ${teacher.user.name}`
            : `${student.user.name} unassigned from ${teacher.user.name}`,
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
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-12 rounded-2xl bg-[#E91E63]/10 text-[#E91E63] flex items-center justify-center font-semibold text-lg shrink-0 overflow-hidden">
                {teacher.user.image ? (
                  <img src={teacher.user.image} alt="" className="size-full object-cover" />
                ) : (
                  teacher.user.name.charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                  Assign Students to {teacher.user.name}
                </h2>
                <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                  <FiMail className="size-3 shrink-0" /> {teacher.user.email}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-slate-400">
                  {teacher.branch && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold">
                      <FiMapPin className="size-2.5" /> {teacher.branch}
                    </span>
                  )}
                  {teacher.subjects && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold truncate max-w-[220px]">
                      <FiBookOpen className="size-2.5" /> {teacher.subjects}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 size-9 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-colors"
            >
              <FiX className="size-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5">
              <FiUserCheck className="text-[#E91E63]" />
              {assignedCount} student{assignedCount === 1 ? "" : "s"} currently with this teacher
            </p>
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
              />
            </div>
          </div>

          {feedback && (
            <div
              className={`rounded-2xl p-3.5 border flex items-center gap-2 text-[13px] font-semibold ${
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
            <div className="flex items-center justify-center py-16 text-slate-400">
              <FiLoader className="size-7 animate-spin" />
            </div>
          ) : rankedStudents.length === 0 ? (
            <div className="py-16 text-center">
              <FiUserPlus className="size-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium italic">No students found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rankedStudents.map((s) => {
                const isAssignedHere = s.teacherId === teacher.id;
                const isBusy = busyStudentId === s.id;
                const label = s.match ? matchLabel(s.match) : null;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 transition-all ${
                      isAssignedHere ? "border-emerald-300 bg-emerald-50/50" : "border-slate-100"
                    }`}
                  >
                    <div className="size-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-semibold shrink-0">
                      {s.user.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-slate-900 truncate flex items-center gap-2">
                        {s.user.name}
                        {label && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              label === "Best match"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-indigo-50 text-indigo-600"
                            }`}
                          >
                            <FiStar className="size-2.5" /> {label}
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                        <FiMail className="size-3 shrink-0" /> {s.user.email}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-slate-400">
                        {s.branch && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold">
                            <FiMapPin className="size-2.5" /> {s.branch}
                          </span>
                        )}
                        {s.subjects && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold truncate max-w-[160px]">
                            <FiBookOpen className="size-2.5" /> {s.subjects}
                          </span>
                        )}
                        {s.teacherId && !isAssignedHere && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-500">
                            with {s.teacher?.user?.name?.split(" ")[0]}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleAssign(s)}
                      disabled={isBusy}
                      className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
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
                        <FiUserPlus className="size-3.5" />
                      )}
                      {isBusy ? "..." : isAssignedHere ? "Unassign" : s.teacherId ? "Reassign" : "Assign"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}