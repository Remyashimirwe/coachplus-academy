"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiX,
  FiMail,
  FiPhone,
  FiMapPin,
  FiBookOpen,
  FiFileText,
  FiSend,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiClock,
  FiCreditCard,
  FiThumbsUp,
  FiUserCheck,
  FiAward,
  FiSearch,
  FiXCircle,
  FiUserPlus,
  FiCopy,
  FiCheck,
  FiStar,
  FiCalendar,
  FiUser,
} from "react-icons/fi";
import { BRANCHES } from "@/app/lib/constants";
import { scoreTeacherForStudent, matchLabel } from "@/app/lib/matching";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-amber-100 text-amber-700",
  contacted: "bg-indigo-100 text-indigo-700",
  approved: "bg-sky-100 text-sky-700",
  assigned: "bg-violet-100 text-violet-700",
  resolved: "bg-emerald-100 text-emerald-700",
};

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 shrink-0 pt-0.5">{label}</span>
      <span className="text-[13px] text-slate-700 text-right break-words max-w-[70%]">{value || "—"}</span>
    </div>
  );
}

function SectionTitle({ icon, children, color = "text-slate-400" }: { icon: React.ReactNode; children: React.ReactNode; color?: string }) {
  return (
    <h4 className={`text-[11px] font-semibold ${color} uppercase tracking-widest flex items-center gap-2`}>
      {icon} {children}
    </h4>
  );
}

export default function RequestDetailModal({
  request,
  teachers,
  onClose,
  onUpdated,
}: {
  request: any;
  teachers?: { id: number; name: string; email: string; phone?: string; branch?: string; subjects?: string }[];
  onClose: () => void;
  onUpdated: (id: number, changes: any) => void;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ success: boolean; text: string } | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approveStatus, setApproveStatus] = useState<{ success: boolean; text: string } | null>(null);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [teacherBranchFilter, setTeacherBranchFilter] = useState("");
  const [teacherSubjectFilter, setTeacherSubjectFilter] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignStatus, setAssignStatus] = useState<{ success: boolean; text: string } | null>(null);
  const [approveInviteUrl, setApproveInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function handleSendMessage() {
    const trimmed = message.trim();
    if (!trimmed) return;

    setSending(true);
    setSendStatus(null);

    try {
      const res = await fetch(`/api/admin/requests/${request.id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();

      if (res.ok) {
        setSendStatus({ success: true, text: "Email sent from CoachPlus Academy!" });
        setMessage("");
        if (request.status === "new") onUpdated(request.id, { status: "contacted" });
      } else {
        setSendStatus({ success: false, text: data.message || "Failed to send email" });
      }
    } catch {
      setSendStatus({ success: false, text: "Failed to send email" });
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(status: string) {
    if (status === request.status || statusUpdating) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/admin/requests/${request.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        onUpdated(request.id, { status });
      }
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleApprove() {
    if (approving) return;
    setApproving(true);
    setApproveStatus(null);
    try {
      const res = await fetch(`/api/admin/requests/${request.id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        onUpdated(request.id, {
          status: data.status || "approved",
          studentId: data.student?.id,
          student: data.student,
        });
        if (data.inviteUrl) setApproveInviteUrl(data.inviteUrl);
        setApproveStatus({ success: true, text: data.message || "Request approved!" });
      } else {
        setApproveStatus({ success: false, text: data.message || "Failed to approve request" });
      }
    } catch {
      setApproveStatus({ success: false, text: "Failed to approve request" });
    } finally {
      setApproving(false);
    }
  }

  function copyInviteLink() {
    if (!approveInviteUrl) return;
    navigator.clipboard.writeText(approveInviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAssignTeacher(teacherId: number | null) {
    if (assigning) return;
    setAssigning(true);
    setAssignStatus(null);
    try {
      const res = await fetch(`/api/admin/requests/${request.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdated(request.id, {
          status: data.request?.status,
          student: data.request?.student,
          assignedTeacher: data.request?.student?.teacher
            ? { id: data.request.student.teacher.id, user: data.request.student.teacher.user }
            : null,
        });
        setAssignStatus({ success: true, text: data.message || "Teacher updated!" });
        if (teacherId) setTeacherSearch("");
      } else {
        setAssignStatus({ success: false, text: data.message || "Failed to update teacher assignment" });
      }
    } catch {
      setAssignStatus({ success: false, text: "Failed to update teacher assignment" });
    } finally {
      setAssigning(false);
    }
  }

  const teacherSubjectOptions = useMemo(() => {
    const set = new Set<string>();
    (teachers || []).forEach((t) =>
      String(t.subjects || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => set.add(s))
    );
    return Array.from(set).sort();
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    const list = teachers || [];
    const q = teacherSearch.trim().toLowerCase();
    return list
      .filter((t) => (q ? t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) : true))
      .filter((t) => (teacherBranchFilter ? t.branch === teacherBranchFilter : true))
      .filter((t) =>
        teacherSubjectFilter
          ? String(t.subjects || "").toLowerCase().includes(teacherSubjectFilter.toLowerCase())
          : true
      )
      .map((t) => ({ ...t, match: scoreTeacherForStudent(t, { branch: request.branch, subjects: request.subjects }) }))
      .sort((a, b) => b.match.score - a.match.score);
  }, [teachers, teacherSearch, teacherBranchFilter, teacherSubjectFilter, request.branch, request.subjects]);

  const fullAddress = [request.country, request.province, request.district, request.sector, request.cell, request.village]
    .filter(Boolean)
    .join(", ");

  const student = request.student;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-5xl max-h-[100dvh] sm:max-h-[92vh] overflow-y-auto bg-white sm:rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 sm:gap-4 bg-white/90 backdrop-blur px-6 sm:px-10 pt-6 sm:pt-8 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className="size-14 sm:size-16 rounded-2xl bg-gradient-to-tr from-[#E91E63] to-[#FF5733] text-white flex items-center justify-center font-semibold text-base sm:text-lg shrink-0">
              {request.parent_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">{request.parent_name}</h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                <p className="flex items-center gap-1.5 truncate">
                  <FiMail className="text-indigo-500 shrink-0" /> <span className="truncate">{request.email}</span>
                </p>
                {request.phone && (
                  <p className="flex items-center gap-1.5">
                    <FiPhone className="text-emerald-500 shrink-0" /> {request.phone}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-tighter ${
                    STATUS_STYLES[request.status] || "bg-slate-100 text-slate-600"
                  }`}
                >
                  {request.status}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <FiClock className="size-3" /> Submitted {new Date(request.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all shrink-0"
            title="Close"
          >
            <FiX className="size-5" />
          </button>
        </div>

        <div className="px-6 sm:px-10 py-6 sm:py-8 space-y-8">
          {/* Contact actions */}
          <div className="flex flex-wrap gap-2">
            <a href={`mailto:${request.email}`} title="Email" className="p-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-[#E91E63] border border-slate-100 transition-all">
              <FiMail className="size-5" />
            </a>
            {request.phone && (
              <a href={`tel:${request.phone}`} title="Call" className="p-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-[#E91E63] border border-slate-100 transition-all">
                <FiPhone className="size-5" />
              </a>
            )}
            {request.phone2 && (
              <a href={`tel:${request.phone2}`} title="Call (alt.)" className="p-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-[#E91E63] border border-slate-100 transition-all">
                <FiPhone className="size-5" />
              </a>
            )}
          </div>

          {/* Request details */}
          <div className="space-y-4">
            <SectionTitle icon={<FiBookOpen className="size-3.5" />} color="text-indigo-400">Request Details</SectionTitle>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-slate-50/70 p-5 rounded-3xl border border-slate-100">
                <Field label="Program" value={request.programTitle || request.grade} />
                <Field label="Grade" value={request.grade} />
                <Field label="Learning Mode" value={request.learningMode} />
                <Field label="Courses & Topics" value={request.subjects} />
                <Field label="Preferred Days" value={request.preferredDays} />
                <Field label="Preferred Time" value={request.preferredTime && <span className="whitespace-pre-line">{request.preferredTime}</span>} />
                <Field label="Start Date" value={request.startDate} />
              </div>

              <div className="bg-slate-50/70 p-5 rounded-3xl border border-slate-100">
                <Field label="Parent / Guardian" value={request.parent_name} />
                <Field label="Email" value={request.email} />
                <Field label="Phone" value={request.phone} />
                <Field label="Alt Phone" value={request.phone2} />
                <Field
                  label="Address"
                  value={fullAddress ? fullAddress : request.location ? request.location : request.branch ? request.branch : undefined}
                />
                {request.location && <Field label="City / Area" value={request.location} />}
                {request.branch && <Field label="Branch" value={request.branch} />}
                <Field label="ID / Passport" value={request.idPassport} />
              </div>
            </div>
          </div>

          {/* Student profile (after approval) */}
          {student && (
            <div className="space-y-4">
              <SectionTitle icon={<FiUser className="size-3.5" />} color="text-sky-500">Student Profile</SectionTitle>
              <div className="bg-sky-50/40 p-5 rounded-3xl border border-sky-100">
                <div className="flex items-center gap-3 pb-4 mb-2 border-b border-sky-100">
                  <div className="size-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-semibold text-base shrink-0">
                    {(student.user?.name || request.parent_name).charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">{student.user?.name || request.parent_name}</p>
                    <p className="text-xs text-slate-500 truncate">{student.user?.email || request.email}</p>
                  </div>
                  <span className="ml-auto shrink-0 flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-sky-100 text-sky-700">
                    <FiCheckCircle /> Approved
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-x-8">
                  <Field label="Phone" value={student.phone} />
                  <Field label="Branch" value={student.branch} />
                  <Field label="Program" value={student.program} />
                  <Field label="Subjects" value={student.subjects} />
                  <Field label="Learning Mode" value={student.learningMode} />
                  <Field label="Preferred Days" value={student.preferredDays} />
                  <Field label="Preferred Time" value={student.preferredTime && <span className="whitespace-pre-line">{student.preferredTime}</span>} />
                  <Field label="Start Date" value={student.startDate} />
                  <Field
                    label="Assigned Teacher"
                    value={student.teacher?.user?.name && (
                      <span className="inline-flex items-center gap-1 text-violet-600 font-semibold">
                        <FiUserCheck className="size-3.5" /> {student.teacher.user.name}
                      </span>
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Additional details */}
          <div className="space-y-4">
            <SectionTitle icon={<FiFileText className="size-3.5" />}>Additional Details</SectionTitle>
            <div className="bg-slate-50/70 p-5 sm:p-6 rounded-3xl border border-slate-100">
              <p className="text-sm text-slate-600 leading-relaxed break-words whitespace-pre-line">
                {request.details || "No additional details were provided."}
              </p>
            </div>
          </div>

          {/* Approve & Assign Teacher */}
          <div className="space-y-4">
            <SectionTitle icon={<FiThumbsUp className="size-3.5" />} color="text-sky-500">Approve &amp; Assign a Teacher</SectionTitle>
            <div className="bg-slate-50/70 p-6 rounded-3xl border border-slate-100 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-slate-700">
                    {request.studentId
                      ? "A student account has been created for this request."
                      : "This request hasn't been approved yet — approving creates a student account."}
                  </p>
                  {approveStatus && (
                    <p className={`mt-1.5 text-[11px] font-semibold flex items-center gap-1.5 ${approveStatus.success ? "text-emerald-600" : "text-rose-600"}`}>
                      {approveStatus.success ? <FiCheckCircle /> : <FiAlertCircle />}
                      {approveStatus.text}
                    </p>
                  )}
                </div>
                {!request.studentId ? (
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-500 text-white text-[13px] font-semibold hover:bg-sky-600 transition-all shadow-lg shadow-sky-100 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {approving ? <FiLoader className="size-4 animate-spin" /> : <FiThumbsUp className="size-4" />}
                    {approving ? "Approving..." : "Approve Request"}
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl bg-sky-100 text-sky-700 shrink-0">
                    <FiCheckCircle /> Approved
                  </span>
                )}
              </div>

              {approveInviteUrl && (
                <div className="rounded-2xl p-4 border bg-emerald-50 border-emerald-100 text-emerald-700 space-y-3">
                  <p className="text-[13px] font-semibold flex items-start gap-2">
                    <FiAlertCircle className="shrink-0 mt-0.5" />
                    The activation email couldn't be sent. Share this link with them manually so they can set their password:
                  </p>
                  <div className="flex items-center gap-2 bg-white rounded-xl border border-emerald-200 p-2 pl-3">
                    <span className="text-xs text-slate-500 truncate flex-1">{approveInviteUrl}</span>
                    <button
                      type="button"
                      onClick={copyInviteLink}
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-semibold hover:bg-emerald-600 transition-all"
                    >
                      {copied ? <FiCheck className="size-3.5" /> : <FiCopy className="size-3.5" />}
                      {copied ? "Copied" : "Copy Link"}
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-200 pt-5 space-y-4">
                {request.studentId && (
                  <div className="flex items-center gap-3 rounded-2xl border-2 border-indigo-200 bg-indigo-50/60 p-4">
                    <div className="size-11 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-semibold shrink-0">
                      <FiUserPlus className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-slate-900 truncate">
                        {student?.user?.name || request.parent_name} is now in the Student section
                      </p>
                      <p className="text-xs text-slate-500 truncate">{student?.user?.email || request.email}</p>
                    </div>
                  </div>
                )}

                {request.assignedTeacher ? (
                  <div className="flex items-center gap-3 rounded-2xl border-2 border-violet-200 bg-violet-50/60 p-4">
                    <div className="size-11 rounded-xl bg-violet-500 text-white flex items-center justify-center font-semibold shrink-0">
                      {request.assignedTeacher.user.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-slate-900 truncate">{request.assignedTeacher.user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{request.assignedTeacher.user.email}</p>
                    </div>
                    <button
                      onClick={() => handleAssignTeacher(null)}
                      disabled={assigning}
                      title="Unassign teacher"
                      className="shrink-0 p-2.5 rounded-xl bg-white text-rose-600 border-2 border-rose-200 hover:bg-rose-50 transition-all disabled:opacity-50"
                    >
                      {assigning ? <FiLoader className="size-4 animate-spin" /> : <FiXCircle className="size-4" />}
                    </button>
                  </div>
                ) : (
                  <p className="text-[13px] font-semibold text-slate-700 flex items-center gap-2">
                    <FiAward className="text-violet-400" /> No teacher assigned yet.
                  </p>
                )}

                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="relative sm:col-span-1">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                    <input
                      type="text"
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      placeholder="Search teachers to assign..."
                      className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
                    />
                  </div>
                  <select
                    value={teacherBranchFilter}
                    onChange={(e) => setTeacherBranchFilter(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
                  >
                    <option value="">All branches</option>
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <select
                    value={teacherSubjectFilter}
                    onChange={(e) => setTeacherSubjectFilter(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
                  >
                    <option value="">All subjects</option>
                    {teacherSubjectOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {filteredTeachers
                    .filter((t) => t.id !== request.assignedTeacher?.id)
                    .map((t) => {
                      const label = matchLabel(t.match);
                      return (
                        <button
                          key={t.id}
                          onClick={() => handleAssignTeacher(t.id)}
                          disabled={assigning || !request.studentId}
                          title={request.studentId ? "Assign teacher" : "Approve this request before assigning"}
                          className="w-full flex items-center gap-3 rounded-2xl border-2 border-slate-100 hover:border-violet-300 bg-white p-3 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="size-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-semibold shrink-0">
                            {t.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-slate-900 truncate flex items-center gap-2">
                              {t.name}
                              {label && (
                                <span
                                  className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    label === "Best match" ? "bg-amber-100 text-amber-700" : "bg-indigo-50 text-indigo-600"
                                  }`}
                                >
                                  <FiStar className="size-2.5" /> {label}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{t.email}{t.phone ? ` · ${t.phone}` : ""}</p>
                            {(t.branch || t.subjects) && (
                              <p className="text-[10px] text-slate-400 truncate">
                                {[t.branch, t.subjects].filter(Boolean).join(" · ")}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-violet-600">
                            <FiUserCheck className="size-4" />
                            {!request.studentId ? "Approve first" : request.assignedTeacher ? "Reassign" : "Assign"}
                          </span>
                        </button>
                      );
                    })}
                  {filteredTeachers.length === 0 && (
                    <p className="text-sm text-slate-400 italic text-center py-4">No teachers found.</p>
                  )}
                </div>

                {assignStatus && (
                  <p className={`text-[11px] font-semibold flex items-center gap-1.5 ${assignStatus.success ? "text-emerald-600" : "text-rose-600"}`}>
                    {assignStatus.success ? <FiCheckCircle /> : <FiAlertCircle />}
                    {assignStatus.text}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Send Message */}
          <div className="space-y-4">
            <SectionTitle icon={<FiSend className="size-3.5" />} color="text-[#E91E63]">
              Send an Email to {request.parent_name.split(" ")[0]}
            </SectionTitle>
            <div className="bg-slate-50/70 p-6 rounded-3xl border border-slate-100 space-y-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Write a reply to send to ${request.email} directly from CoachPlus Academy...`}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all resize-none"
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  {sendStatus && (
                    <p className={`text-[11px] font-semibold flex items-center gap-1.5 ${sendStatus.success ? "text-emerald-600" : "text-rose-600"}`}>
                      {sendStatus.success ? <FiCheckCircle /> : <FiAlertCircle />}
                      {sendStatus.text}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !message.trim()}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#0f172a] text-white text-[13px] font-semibold hover:bg-[#E91E63] transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? <FiLoader className="size-4 animate-spin" /> : <FiSend className="size-4" />}
                  {sending ? "Sending..." : "Send Email"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-100 px-6 sm:px-10 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Update Status</p>
          <div className="flex flex-wrap gap-2">
            {["new", "contacted", "resolved"].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={statusUpdating || status === request.status}
                className={`px-4 py-2.5 rounded-xl text-[11px] font-semibold uppercase tracking-tight transition-all disabled:cursor-default ${
                  status === request.status
                    ? STATUS_STYLES[status]
                    : "bg-white text-slate-500 border-2 border-slate-200 hover:border-slate-300"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}