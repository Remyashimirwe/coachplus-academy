"use client";

import { useEffect, useState } from "react";
import ImageLightboxModal from "@/app/components/ImageLightboxModal";
import {
  FiX,
  FiMail,
  FiPhone,
  FiLinkedin,
  FiMapPin,
  FiAward,
  FiClock,
  FiCalendar,
  FiFileText,
  FiMessageSquare,
  FiStar,
  FiTarget,
  FiInstagram,
  FiYoutube,
  FiLink,
  FiSend,
  FiDownload,
  FiExternalLink,
  FiCheckCircle,
  FiAlertCircle,
  FiCopy,
  FiCheck,
} from "react-icons/fi";

const DOCUMENT_LABELS: Record<string, string> = {
  photo: "Photo",
  resume: "CV / Resume",
  coverLetter: "Cover Letter",
  academicCertificates: "Academic Certificates",
  otherCertificates: "Other Certificate",
  license: "Teaching License",
  idPassport: "Passport / National ID",
  criminalRecord: "Criminal Record Certificate",
};

function documentUrl(docId: number) {
  return `/api/admin/teacher-applications/documents/${docId}`;
}

function documentDownloadUrl(docId: number) {
  return `${documentUrl(docId)}?download=1`;
}

type GroupedSubject = { name: string; topics: string[] };
type GroupedCategory = { category: string; subjects: GroupedSubject[] };

function groupSubjects(raw: string): GroupedCategory[] {
  const categoryMap = new Map<string, Map<string, string[]>>();

  (raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const idx = entry.indexOf(":");
      if (idx === -1) return;
      const category = entry.slice(0, idx).trim();
      const rest = entry.slice(idx + 1).trim();
      const dashIdx = rest.indexOf(" - ");
      let subject: string;
      let topic: string | null = null;
      if (dashIdx !== -1) {
        subject = rest.slice(0, dashIdx).trim();
        topic = rest.slice(dashIdx + 3).trim();
      } else {
        subject = rest;
      }
      if (!categoryMap.has(category)) categoryMap.set(category, new Map());
      const subjMap = categoryMap.get(category)!;
      if (!subjMap.has(subject)) subjMap.set(subject, []);
      if (topic) subjMap.get(subject)!.push(topic);
    });

  return Array.from(categoryMap.entries()).map(([category, subjMap]) => ({
    category,
    subjects: Array.from(subjMap.entries()).map(([name, topics]) => ({ name, topics })),
  }));
}

export default function TeacherApplicationModal({
  app,
  onClose,
  onApproved,
  onDenied,
  onStatusChanged,
}: {
  app: any;
  onClose: () => void;
  onApproved: (id: number) => void;
  onDenied: (id: number) => void;
  onStatusChanged: (id: number, status: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ success: boolean; text: string } | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [approveInviteUrl, setApproveInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [shortlistError, setShortlistError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [missingDocsError, setMissingDocsError] = useState<string | null>(null);
  const [missingDocsSuccess, setMissingDocsSuccess] = useState<string | null>(null);
  const [stageChanging, setStageChanging] = useState(false);

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
      const res = await fetch(`/api/admin/teacher-applications/${app.id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();

      if (res.ok) {
        setSendStatus({ success: true, text: "Message sent!" });
        setMessage("");
      } else {
        setSendStatus({ success: false, text: data.message || "Failed to send message" });
      }
    } catch {
      setSendStatus({ success: false, text: "Failed to send message" });
    } finally {
      setSending(false);
    }
  }

  async function handleApprove() {
    if (!confirm(`Approve ${app.fullName} as an official teacher? An account will be created and an activation email will be sent.`)) return;

    setDecisionError(null);
    try {
      const res = await fetch(`/api/admin/teacher-applications/${app.id}/approve`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        if (data.inviteUrl) setApproveInviteUrl(data.inviteUrl);
        onApproved(app.id);
        if (data.emailSent === false) {
          setDecisionError(data.message || "The account was approved, but its email could not be sent. Use the invite link below.");
        }
      } else {
        setDecisionError(data.message || "Failed to approve application");
      }
    } catch {
      setDecisionError("Failed to approve application");
    }
  }

  function copyInviteLink() {
    if (!approveInviteUrl) return;
    navigator.clipboard.writeText(approveInviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDeny() {
    if (!confirm(`Deny ${app.fullName}'s application? It will be marked as rejected and kept on record.`)) return;

    setDecisionError(null);
    try {
      const res = await fetch(`/api/admin/teacher-applications/${app.id}/deny`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        onDenied(app.id);
      } else {
        setDecisionError(data.message || "Failed to deny application");
      }
    } catch {
      setDecisionError("Failed to deny application");
    }
  }

  async function handleShortlist() {
    setShortlistError(null);
    try {
      const res = await fetch(
        `/api/admin/teacher-applications/${app.id}/shortlist`,
        { method: "POST" },
      );
      const data = await res.json();
      if (res.ok) {
        onStatusChanged(app.id, "shortlisted");
      } else {
        setShortlistError(data.message || "Failed to shortlist application");
      }
    } catch {
      setShortlistError("Failed to shortlist application");
    }
  }

  async function handleScheduleAssessment() {
    setScheduleError(null);
    const examDate = prompt("Exam date (e.g. 2026-12-15):");
    if (!examDate) return;
    const examTime = prompt("Exam time (e.g. 10:00 AM):");
    if (!examTime) return;
    const assessmentMode = prompt("Mode (In-Person / Online):", "In-Person");
    if (!assessmentMode) return;
    const locationOrMeetingLink = prompt("Location / Meeting Link:");
    if (!locationOrMeetingLink) return;
    const contactPhone = prompt("Contact phone (optional):");

    try {
      const res = await fetch(
        `/api/admin/teacher-applications/${app.id}/assessment-schedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examDate,
            examTime,
            assessmentMode,
            locationOrMeetingLink,
            contactPhone: contactPhone || undefined,
          }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        onStatusChanged(app.id, "assessment_scheduled");
      } else {
        setScheduleError(data.message || data.error || "Failed to schedule assessment");
      }
    } catch {
      setScheduleError("Failed to schedule assessment");
    }
  }

  async function handleMissingDocs() {
    setMissingDocsError(null);
    setMissingDocsSuccess(null);
    const missingDocument = prompt("Document needed (e.g. National ID):");
    if (!missingDocument) return;
    const issueReason = prompt("Reason (e.g. blurry/unreadable):");
    if (!issueReason) return;
    const reuploadLink = prompt("Re-upload link:");
    if (!reuploadLink) return;

    try {
      const res = await fetch(
        `/api/admin/teacher-applications/${app.id}/missing-documents`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ missingDocument, issueReason, reuploadLink }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        setMissingDocsSuccess("Document update email sent.");
        onStatusChanged(app.id, "documents_needed");
      } else {
        setMissingDocsError(data.message || "Failed to send missing documents email");
      }
    } catch {
      setMissingDocsError("Failed to send missing documents email");
    }
  }

  const isPending = app.status === "pending";
  const statusOptions: Record<string, string[]> = {
    pending: ["documents_needed", "shortlisted", "approved", "rejected"],
    documents_needed: ["shortlisted", "approved", "rejected"],
    shortlisted: ["documents_needed", "assessment_scheduled", "approved", "rejected"],
    assessment_scheduled: ["documents_needed", "approved", "rejected"],
  };
  const statusLabels: Record<string, string> = {
    pending: "Pending review",
    documents_needed: "Documents needed",
    shortlisted: "Shortlisted",
    assessment_scheduled: "Assessment scheduled",
    approved: "Approved",
    rejected: "Rejected",
  };

  async function changeStatus(nextStatus: string) {
    setStageChanging(true);
    setDecisionError(null);
    setShortlistError(null);
    setScheduleError(null);
    setMissingDocsError(null);
    setMissingDocsSuccess(null);
    try {
      switch (nextStatus) {
        case "documents_needed": await handleMissingDocs(); break;
        case "shortlisted": await handleShortlist(); break;
        case "assessment_scheduled": await handleScheduleAssessment(); break;
        case "approved": await handleApprove(); break;
        case "rejected": await handleDeny(); break;
      }
    } finally {
      setStageChanging(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-4xl max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto bg-white sm:rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 sm:gap-4 bg-white/90 backdrop-blur px-5 sm:px-8 pt-6 sm:pt-8 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className="size-14 sm:size-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold text-xl sm:text-2xl shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#E91E63] transition-all"
              onClick={() => {
                const photoDoc = app.documents?.find((d: any) => d.kind === "photo");
                if (photoDoc) {
                  setLightboxImage({
                    url: documentUrl(photoDoc.id),
                    title: `${app.fullName}'s Profile Photo`,
                  });
                }
              }}
              title="Click to view full screen"
            >
              {app.documents?.find((d: any) => d.kind === "photo") ? (
                <img
                  src={documentUrl(app.documents.find((d: any) => d.kind === "photo").id)}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                app.fullName.charAt(0)
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">{app.fullName}</h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                <p className="text-[13px] font-semibold text-slate-500 flex items-center gap-1.5 min-w-0">
                  <FiMail className="text-indigo-500 shrink-0" /> <span className="truncate">{app.email}</span>
                </p>
                {app.phone && (
                  <p className="text-[13px] font-semibold text-slate-500 flex items-center gap-1.5">
                    <FiPhone className="text-emerald-500 shrink-0" /> {app.phone}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                <p className="text-[13px] font-semibold text-slate-500 flex items-center gap-1.5">
                  <FiClock className="text-indigo-500" /> {app.experienceYears} Years
                </p>
                <p className="text-[13px] font-semibold text-slate-500 flex items-center gap-1.5">
                  <FiMapPin className="text-rose-500" /> {[app.district || app.country].filter(Boolean).join(" · ")}
                </p>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-tighter ${
                    app.status === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : app.status === "documents_needed"
                      ? "bg-orange-100 text-orange-700"
                      : app.status === "shortlisted"
                      ? "bg-indigo-100 text-indigo-700"
                      : app.status === "assessment_scheduled"
                      ? "bg-blue-100 text-blue-700"
                      : app.status === "rejected"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {statusLabels[app.status] || app.status}
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

        <div className="px-5 sm:px-8 py-6 sm:py-8 space-y-8">
          {/* Contact + social row */}
          <div className="flex flex-wrap gap-2">
            <a href={`mailto:${app.email}`} title="Email" className="p-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-[#E91E63] border border-slate-100 transition-all">
              <FiMail className="size-5" />
            </a>
            <a href={`tel:${app.phone}`} title="Call" className="p-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-[#E91E63] border border-slate-100 transition-all">
              <FiPhone className="size-5" />
            </a>
            {app.linkedin && (
              <a href={app.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="p-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-[#E91E63] border border-slate-100 transition-all">
                <FiLinkedin className="size-5" />
              </a>
            )}
            {app.instagram && (
              <a href={app.instagram} target="_blank" rel="noopener noreferrer" title="Instagram" className="p-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-[#E91E63] border border-slate-100 transition-all">
                <FiInstagram className="size-5" />
              </a>
            )}
            {app.youtube && (
              <a href={app.youtube} target="_blank" rel="noopener noreferrer" title="YouTube" className="p-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-[#E91E63] border border-slate-100 transition-all">
                <FiYoutube className="size-5" />
              </a>
            )}
            {app.otherSocial && (
              <a href={app.otherSocial} target="_blank" rel="noopener noreferrer" title="Social/Website" className="p-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-[#E91E63] border border-slate-100 transition-all">
                <FiLink className="size-5" />
              </a>
            )}
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-8">
            {/* Education & Experience */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-semibold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <FiAward /> Education & Experience
              </h4>
              <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100 h-full">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Education</p>
                  <p className="text-[13px] font-semibold text-slate-700 break-words">{app.educationLevel} in {app.fieldOfStudy}</p>
                  <p className="text-[11px] text-slate-500 break-words">{app.institution} ({app.graduationYear})</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Teaching Subjects</p>
                  {groupSubjects(app.subjects).length > 0 ? (
                    <div className="mt-1.5 space-y-3">
                      {groupSubjects(app.subjects).map((cat) => (
                        <div
                          key={cat.category}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                        >
                          <p className="text-[13px] font-bold text-slate-800">{cat.category}</p>
                          <ul className="mt-1.5 space-y-1.5">
                            {cat.subjects.map((sub) => (
                              <li key={sub.name} className="text-[12px] text-slate-600">
                                <span className="font-semibold text-slate-700">{sub.name}</span>
                                {sub.topics.length > 0 && (
                                  <ul className="ml-4 mt-0.5 list-disc space-y-0.5 text-[11px] text-slate-500">
                                    {sub.topics.map((t) => (
                                      <li key={t}>{t}</li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] font-semibold text-slate-700 break-words">{app.subjects}</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Target Grades</p>
                  <p className="text-[13px] font-semibold text-slate-700 break-words">{app.grades}</p>
                </div>
              </div>
            </div>

            {/* Skills & Methods */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-semibold text-rose-400 uppercase tracking-widest flex items-center gap-2">
                <FiStar /> Teaching Skills
              </h4>
              <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100 h-full">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Methods</p>
                  <p className="text-[11px] text-slate-600 line-clamp-3" title={app.methods}>{app.methods}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Online Teaching</p>
                  <p className="text-[13px] font-semibold text-slate-700">{app.teachOnline}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Online Platforms</p>
                  <p className="text-[11px] text-slate-600 break-words">{app.onlinePlatforms || "None specified"}</p>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-4 sm:col-span-2 xl:col-span-1">
              <h4 className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <FiCalendar /> Availability
              </h4>
              <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100 h-full">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Type</p>
                  <p className="text-[13px] font-semibold text-slate-700">{app.employmentType}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Schedule</p>
                  <p className="text-[11px] text-slate-600 break-words">{app.availableDays}</p>
                  <p className="text-[11px] text-slate-600 break-words">{app.availableHours}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Start Date</p>
                  <p className="text-[13px] font-semibold text-slate-700">{app.startDate}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-5 sm:gap-8">
            {/* Detailed Q&A */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FiMessageSquare /> Motivation & Experience Description
              </h4>
              <div className="bg-slate-50 p-5 sm:p-6 rounded-3xl border border-slate-100 space-y-4 h-full">
                <div>
                  <p className="text-[10px] font-semibold text-indigo-500 uppercase mb-1">Teaching Experience</p>
                  <p className="text-[13px] text-slate-600 leading-relaxed break-words">{app.expDescription}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-indigo-500 uppercase mb-1">Why CoachPlus Academy?</p>
                  <p className="text-[13px] text-slate-600 leading-relaxed break-words">{app.whyTeach}</p>
                </div>
              </div>
            </div>

            {/* Handling Students & Contribution */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FiTarget /> Handling Students & Contribution
              </h4>
              <div className="bg-slate-50 p-5 sm:p-6 rounded-3xl border border-slate-100 space-y-4 h-full">
                <div>
                  <p className="text-[10px] font-semibold text-rose-500 uppercase mb-1">Difficult Students</p>
                  <p className="text-[13px] text-slate-600 leading-relaxed break-words">{app.difficultStudents}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-rose-500 uppercase mb-1">Contribution</p>
                  <p className="text-[13px] text-slate-600 leading-relaxed break-words">{app.contribution}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FiFileText /> Documents
            </h4>
            <div className="pt-1 flex flex-wrap gap-3">
              {app.documents && app.documents.length > 0 ? (
                app.documents
                  .filter((doc: any) => doc.kind !== "photo")
                  .map((doc: any) => (
                    <div key={doc.id} className="flex items-center gap-1.5">
                      <a
                        href={documentUrl(doc.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Preview ${doc.fileName}`}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-all"
                      >
                        <FiExternalLink />
                        <span className="text-[11px] font-semibold uppercase tracking-tight">
                          Preview {DOCUMENT_LABELS[doc.kind] || doc.kind}
                        </span>
                      </a>
                      <a
                        href={documentDownloadUrl(doc.id)}
                        title={`Download ${doc.fileName}`}
                        aria-label={`Download ${doc.fileName}`}
                        className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                      >
                        <FiDownload />
                      </a>
                    </div>
                  ))
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-slate-500">
                  <FiFileText /> <span className="text-[11px] font-semibold uppercase tracking-tight">No documents uploaded</span>
                </div>
              )}
            </div>
          </div>

          {/* Send Message */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-semibold text-[#E91E63] uppercase tracking-widest flex items-center gap-2">
              <FiSend /> Send a Message to {app.fullName.split(" ")[0]}
            </h4>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Write a message to send to ${app.email}...`}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all resize-none"
              />
              <div className="flex items-center justify-between gap-4">
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
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#0f172a] text-white text-[13px] font-semibold hover:bg-[#E91E63] transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSend className="size-4" />
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </div>
            </div>
          </div>

          {approveInviteUrl && (
            <div className="rounded-2xl p-4 border bg-emerald-50 border-emerald-100 text-emerald-700 space-y-3">
              <p className="text-[13px] font-semibold flex items-start gap-2">
                <FiAlertCircle className="mt-0.5 shrink-0" />
                Activation email could not be sent automatically. Share this link with {app.fullName.split(" ")[0]} manually:
              </p>
              <div className="flex items-center gap-2 bg-white rounded-xl border border-emerald-200 p-2 pl-3">
                <span className="text-[11px] text-slate-500 truncate flex-1">{approveInviteUrl}</span>
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
        </div>

        {/* Decision footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-100 px-5 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-h-[1.25rem]">
            {decisionError && (
              <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5">
                <FiAlertCircle /> {decisionError}
              </p>
            )}
            {shortlistError && (
              <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5">
                <FiAlertCircle /> {shortlistError}
              </p>
            )}
            {scheduleError && (
              <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5">
                <FiAlertCircle /> {scheduleError}
              </p>
            )}
            {missingDocsError && (
              <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5">
                <FiAlertCircle /> {missingDocsError}
              </p>
            )}
            {missingDocsSuccess && (
              <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5">
                <FiCheckCircle /> {missingDocsSuccess}
              </p>
            )}
            {!isPending && !decisionError && !shortlistError && !scheduleError && !missingDocsError && !missingDocsSuccess && (
              <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5">
                <FiCheckCircle /> {app.status === "rejected"
                  ? "This application has been rejected."
                  : app.status === "shortlisted"
                    ? "This applicant is shortlisted for assessment."
                    : app.status === "assessment_scheduled"
                      ? "This applicant's assessment is scheduled."
                      : "This applicant is already an accepted teacher."}
              </p>
            )}
          </div>
          {statusOptions[app.status] && (
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-600">
              <span>Application stage</span>
              <select
                value={app.status}
                disabled={stageChanging}
                onChange={(event) => void changeStatus(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/20 disabled:opacity-60"
              >
                <option value={app.status}>{statusLabels[app.status] || app.status}</option>
                {statusOptions[app.status].map((status) => (
                  <option key={status} value={status}>{statusLabels[status]}</option>
                ))}
              </select>
              <span className="text-xs font-normal text-slate-400">Changing the stage sends its matching email.</span>
            </label>
          )}
        </div>
      </div>
      <ImageLightboxModal
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        imageUrl={lightboxImage?.url || null}
        title={lightboxImage?.title || "Teacher Photo"}
        subtitle={app.fullName}
      />
    </div>
  );
}
