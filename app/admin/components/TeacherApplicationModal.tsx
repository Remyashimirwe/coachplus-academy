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
  FiEye,
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
  pageMode = false,
}: {
  app: any;
  onClose: () => void;
  onApproved: (id: number, patch?: Record<string, any>) => void;
  onDenied: (id: number, patch?: Record<string, any>) => void;
  pageMode?: boolean;
  onStatusChanged: (
    id: number,
    status: string,
    patch?: Record<string, any>,
  ) => void;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ success: boolean; text: string } | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [approveInviteUrl, setApproveInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [previewEmail, setPreviewEmail] = useState<{
    stage: string;
    recipient: string;
    subject: string;
    body: string;
    queued: boolean;
    saved: boolean;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [shortlistError, setShortlistError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [missingDocsError, setMissingDocsError] = useState<string | null>(null);
  const [missingDocsSuccess, setMissingDocsSuccess] = useState<string | null>(null);
  const [savingMissingDocs, setSavingMissingDocs] = useState(false);
  const [stageChanging, setStageChanging] = useState(false);
  const [activePanel, setActivePanel] = useState<"assessment" | "documents" | null>(null);
  const [clock, setClock] = useState<number | null>(null);
  const [savingEmailDraft, setSavingEmailDraft] = useState(false);
  const [emailDraftSaved, setEmailDraftSaved] = useState(false);
  const [previewStage, setPreviewStage] = useState<string>(app.pendingStatus || "shortlisted");

  // Editable Stage 4 details. Prefilled from what was last saved so an admin
  // can change the time/date and resend without retyping everything.
  const [assessmentDate, setAssessmentDate] = useState(app.assessmentDate || "");
  const [assessmentTime, setAssessmentTime] = useState(app.assessmentTime || "");
  const [assessmentMode, setAssessmentMode] = useState(app.assessmentMode || "In-Person");
  const [assessmentLocation, setAssessmentLocation] = useState(app.assessmentLocation || "");
  const [assessmentContactPhone, setAssessmentContactPhone] = useState(
    app.assessmentContactPhone || "",
  );

  // Editable Stage 2 details.
  const [missingDocument, setMissingDocument] = useState(app.missingDocument || "");
  const [missingDocumentReason, setMissingDocumentReason] = useState(
    app.missingDocumentReason || "",
  );
  const [reuploadLink, setReuploadLink] = useState(
    app.reuploadLink || "https://www.coachplusacademy.com/become-a-teacher",
  );

  useEffect(() => {
    if (pageMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, pageMode]);

  useEffect(() => {
    setClock(Date.now());
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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
    if (!confirm(`Approve ${app.fullName}? Their account email will be sent in 1 minute.`)) return;

    setDecisionError(null);
    try {
      const res = await fetch(`/api/admin/teacher-applications/${app.id}/approve`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        if (data.inviteUrl) setApproveInviteUrl(data.inviteUrl);
        onApproved(app.id, data.application);
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
        onDenied(app.id, data.application);
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
        onStatusChanged(app.id, "shortlisted", data.application || {});
      } else {
        setShortlistError(data.message || "Failed to shortlist application");
      }
    } catch {
      setShortlistError("Failed to shortlist application");
    }
  }

  async function handleScheduleAssessment() {
    setScheduleError(null);
    setScheduleSuccess(null);

    const date = assessmentDate.trim();
    const time = assessmentTime.trim();
    const mode = assessmentMode.trim();
    const location = assessmentLocation.trim();
    if (!date || !time || !mode || !location) {
      setScheduleError("Date, time, mode and location/meeting link are all required.");
      setActivePanel("assessment");
      return;
    }

    setSavingSchedule(true);
    try {
      const res = await fetch(
        `/api/admin/teacher-applications/${app.id}/assessment-schedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examDate: date,
            examTime: time,
            assessmentMode: mode,
            locationOrMeetingLink: location,
            contactPhone: assessmentContactPhone.trim() || undefined,
          }),
        },
      );
      const data = await res.json();

      if (res.ok) {
        onStatusChanged(app.id, "assessment_scheduled", {
          ...(data.application || {}),
          assessmentDate: date,
          assessmentTime: time,
          assessmentMode: mode,
          assessmentLocation: location,
          assessmentContactPhone: assessmentContactPhone.trim(),
        });
        setScheduleSuccess("Saved. Stage 4 email queued for 1 minute.");
        setActivePanel(null);
      } else {
        // The backend saves the fields even when the email fails, so keep the
        // dashboard in sync and let the admin press retry.
        if (data.application) {
          onStatusChanged(app.id, data.application.status || app.status, {
            assessmentDate: data.application.assessmentDate,
            assessmentTime: data.application.assessmentTime,
            assessmentMode: data.application.assessmentMode,
            assessmentLocation: data.application.assessmentLocation,
            assessmentContactPhone: data.application.assessmentContactPhone,
          });
        }
        setScheduleError(data.message || data.error || "Failed to schedule assessment");
      }
    } catch {
      setScheduleError("Failed to schedule assessment. Check your connection and try again.");
    } finally {
      setSavingSchedule(false);
    }
  }

  async function handleMissingDocs() {
    setMissingDocsError(null);
    setMissingDocsSuccess(null);

    const document = missingDocument.trim();
    const reason = missingDocumentReason.trim();
    const link = reuploadLink.trim();
    if (!document || !reason || !link) {
      setMissingDocsError("Document, reason and re-upload link are all required.");
      setActivePanel("documents");
      return;
    }

    setSavingMissingDocs(true);
    try {
      const res = await fetch(
        `/api/admin/teacher-applications/${app.id}/missing-documents`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            missingDocument: document,
            issueReason: reason,
            reuploadLink: link,
          }),
        },
      );
      const data = await res.json();

      if (res.ok) {
        onStatusChanged(app.id, "documents_needed", {
          ...(data.application || {}),
          missingDocument: document,
          missingDocumentReason: reason,
          reuploadLink: link,
        });
        setMissingDocsSuccess("Saved. Stage 2 email queued for 1 minute.");
        setActivePanel(null);
      } else {
        if (data.application) {
          onStatusChanged(app.id, data.application.status || app.status, {
            missingDocument: data.application.missingDocument,
            missingDocumentReason: data.application.missingDocumentReason,
            reuploadLink: data.application.reuploadLink,
          });
        }
        setMissingDocsError(data.message || data.error || "Failed to send missing documents email");
      }
    } catch {
      setMissingDocsError("Failed to send missing documents email. Check your connection and try again.");
    } finally {
      setSavingMissingDocs(false);
    }
  }

  const isPending = app.status === "pending";
  const canRequestDocuments = app.status !== "approved" && app.status !== "rejected";
  const canScheduleAssessment =
    app.status === "shortlisted" || app.status === "assessment_scheduled";
  const hasAssessmentDetails = Boolean(
    app.assessmentDate ||
      app.assessmentTime ||
      app.assessmentMode ||
      app.assessmentLocation,
  );
  const hasDocumentRequest = Boolean(app.missingDocument);
  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition-all focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/20";
  const labelClass =
    "mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400";
  const statusOptions: Record<string, string[]> = {
    pending: ["documents_needed", "shortlisted", "approved", "rejected"],
    documents_needed: ["shortlisted", "approved", "rejected"],
    shortlisted: ["documents_needed", "assessment_scheduled", "approved", "rejected"],
    assessment_scheduled: ["documents_needed", "approved", "rejected"],
  };
  const statusLabels: Record<string, string> = {
    pending: "Stage 1: Review",
    documents_needed: "Stage 2: Documents needed",
    shortlisted: "Stage 3: Shortlisted",
    assessment_scheduled: "Stage 4: Assessment set",
    approved: "Stage 5: Approved",
    rejected: "Stage 6: Rejected",
  };

  async function handlePreviewEmail(stage: string) {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await fetch(`/api/admin/teacher-applications/${app.id}/preview-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      const data = await res.json();
      if (res.ok) {
        setPreviewStage(data.stage);
        setEmailDraftSaved(Boolean(data.saved));
        setPreviewEmail({
          stage: data.stage,
          recipient: data.recipient,
          subject: data.subject,
          body: data.body,
          queued: data.queued,
          saved: Boolean(data.saved),
        });
      } else {
        setPreviewError(data.message || "Failed to fetch preview");
      }
    } catch {
      setPreviewError("Network error while fetching preview");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function saveEmailDraft() {
    if (!previewEmail || !previewEmail.queued) return;
    setSavingEmailDraft(true);
    setPreviewError(null);
    try {
      const res = await fetch(`/api/admin/teacher-applications/${app.id}/email-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: previewEmail.stage, subject: previewEmail.subject, body: previewEmail.body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPreviewError(data.message || "Could not save email draft.");
        return;
      }
      const patch = {
        pendingEmailSubject: previewEmail.subject.trim(),
        pendingEmailBody: previewEmail.body.trim(),
      };
      onStatusChanged(app.id, app.status, patch);
      setPreviewEmail((current) => current ? { ...current, ...patch, saved: true } : current);
      setEmailDraftSaved(true);
    } catch {
      setPreviewError("Could not save email draft. Check your connection.");
    } finally {
      setSavingEmailDraft(false);
    }
  }

  async function cancelScheduledEmail() {
    try {
      const res = await fetch(`/api/admin/teacher-applications/${app.id}/cancel-email`, {
        method: "POST",
      });
      if (res.ok) {
        onStatusChanged(app.id, app.status, {
          emailScheduledAt: null,
          emailScheduledFor: null,
          pendingStatus: null,
          pendingEmailSubject: null,
          pendingEmailBody: null,
        });
        setPreviewEmail(null);
      }
    } catch {
      setPreviewError("Failed to cancel scheduled email");
    }
  }

  async function changeStatus(nextStatus: string) {
    setStageChanging(true);
    setDecisionError(null);
    setShortlistError(null);
    setScheduleError(null);
    setScheduleSuccess(null);
    setMissingDocsError(null);
    setMissingDocsSuccess(null);
    try {
      switch (nextStatus) {
        // Stage 2 and Stage 4 need details, so open the editable form instead
        // of sending an email from a browser prompt.
        case "documents_needed":
          setActivePanel("documents");
          setTimeout(() => {
            document
              .getElementById("stage-documents")
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 60);
          break;
        case "assessment_scheduled":
          setActivePanel("assessment");
          setTimeout(() => {
            document
              .getElementById("stage-assessment")
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 60);
          break;
        case "shortlisted": await handleShortlist(); break;
        case "approved": await handleApprove(); break;
        case "rejected": await handleDeny(); break;
      }
    } finally {
      setStageChanging(false);
    }
  }

  return (
    <div
      className={pageMode
        ? "min-h-[calc(100vh-8rem)] animate-in fade-in duration-200"
        : "fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-6 animate-in fade-in duration-200"}
      onClick={pageMode ? undefined : onClose}
    >
      <div
        className={pageMode
          ? "relative w-full max-w-5xl mx-auto overflow-hidden bg-white rounded-3xl shadow-sm border border-slate-200"
          : "relative w-full sm:max-w-4xl max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto bg-white sm:rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"}
        onClick={pageMode ? undefined : (e) => e.stopPropagation()}
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

          {/* Stage 4 — editable exam & demo lesson details */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-semibold text-blue-500 uppercase tracking-widest flex items-center gap-2">
              <FiCalendar /> Exam &amp; Demo Lesson (Stage 4)
            </h4>
            <div
              id="stage-assessment"
              className={`rounded-3xl border p-5 sm:p-6 space-y-4 transition-all ${
                activePanel === "assessment"
                  ? "border-blue-300 bg-blue-50/50 ring-2 ring-blue-200"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-[12px] text-slate-500">
                  Add the date, time and meeting details. The email sends in 1 minute. Save again to resend.
                </p>
                {hasAssessmentDetails && (
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                    Saved
                  </span>
                )}
              </div>

              {canScheduleAssessment ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Exam date</label>
                      <input
                        type="date"
                        value={assessmentDate}
                        onChange={(event) => setAssessmentDate(event.target.value)}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Exam time</label>
                      <input
                        type="text"
                        value={assessmentTime}
                        onChange={(event) => setAssessmentTime(event.target.value)}
                        placeholder="e.g. 10:00 AM"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Mode</label>
                      <select
                        value={assessmentMode}
                        onChange={(event) => setAssessmentMode(event.target.value)}
                        className={fieldClass}
                      >
                        <option value="In-Person">In-Person (at the center)</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Contact phone (optional)</label>
                      <input
                        type="tel"
                        value={assessmentContactPhone}
                        onChange={(event) => setAssessmentContactPhone(event.target.value)}
                        placeholder="Phone / WhatsApp for rescheduling"
                        className={fieldClass}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Location or meeting link</label>
                      <input
                        type="text"
                        value={assessmentLocation}
                        onChange={(event) => setAssessmentLocation(event.target.value)}
                        placeholder="Center address or https://meet.example.com/..."
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      {scheduleError && (
                        <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5">
                          <FiAlertCircle /> {scheduleError}
                        </p>
                      )}
                      {scheduleSuccess && (
                        <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5">
                          <FiCheckCircle /> {scheduleSuccess}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleScheduleAssessment}
                      disabled={savingSchedule}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-[12px] font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FiSend className="size-3.5" />
                      {savingSchedule
                        ? "Sending..."
                        : hasAssessmentDetails
                          ? "Update & resend email"
                          : "Save & send email"}
                    </button>
                  </div>
                </>
              ) : hasAssessmentDetails ? (
                <dl className="grid gap-3 text-[12px] text-slate-600 sm:grid-cols-2">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Date</dt>
                    <dd className="font-semibold text-slate-800">{app.assessmentDate || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Time</dt>
                    <dd className="font-semibold text-slate-800">{app.assessmentTime || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Mode</dt>
                    <dd className="font-semibold text-slate-800">{app.assessmentMode || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Location / link</dt>
                    <dd className="break-words font-semibold text-slate-800">{app.assessmentLocation || "—"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Contact phone</dt>
                    <dd className="font-semibold text-slate-800">{app.assessmentContactPhone || "—"}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-[12px] font-medium text-slate-400">
                  Shortlist the applicant first, then schedule the exam and demo lesson here.
                </p>
              )}
            </div>
          </div>

          {/* Stage 2 — editable missing / unclear document request */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-semibold text-orange-500 uppercase tracking-widest flex items-center gap-2">
              <FiFileText /> Missing / Unclear Document (Stage 2)
            </h4>
            <div
              id="stage-documents"
              className={`rounded-3xl border p-5 sm:p-6 space-y-4 transition-all ${
                activePanel === "documents"
                  ? "border-orange-300 bg-orange-50/50 ring-2 ring-orange-200"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <p className="text-[12px] text-slate-500">
                Add the document, reason and upload link. The email sends in 1 minute.
              </p>

              {canRequestDocuments ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Document needed</label>
                      <input
                        type="text"
                        value={missingDocument}
                        onChange={(event) => setMissingDocument(event.target.value)}
                        placeholder="e.g. National ID, Diploma, Criminal Record Certificate"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Reason</label>
                      <input
                        type="text"
                        value={missingDocumentReason}
                        onChange={(event) => setMissingDocumentReason(event.target.value)}
                        placeholder="e.g. The file was blurry / expired"
                        className={fieldClass}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Re-upload link</label>
                      <input
                        type="url"
                        value={reuploadLink}
                        onChange={(event) => setReuploadLink(event.target.value)}
                        placeholder="https://..."
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
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
                    </div>
                    <button
                      type="button"
                      onClick={handleMissingDocs}
                      disabled={savingMissingDocs}
                      className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-[12px] font-semibold text-white transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FiSend className="size-3.5" />
                      {savingMissingDocs
                        ? "Sending..."
                        : hasDocumentRequest
                          ? "Update & resend email"
                          : "Send document request"}
                    </button>
                  </div>
                </>
              ) : hasDocumentRequest ? (
                <dl className="grid gap-3 text-[12px] text-slate-600 sm:grid-cols-2">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Document</dt>
                    <dd className="font-semibold text-slate-800">{app.missingDocument}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Reason</dt>
                    <dd className="font-semibold text-slate-800">{app.missingDocumentReason || "—"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Re-upload link</dt>
                    <dd className="break-words font-semibold text-slate-800">{app.reuploadLink || "—"}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-[12px] font-medium text-slate-400">
                  This application has reached a final decision, so no document request can be sent.
                </p>
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
            {scheduleSuccess && (
              <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5">
                <FiCheckCircle /> {scheduleSuccess}
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
            {!isPending && !decisionError && !shortlistError && !scheduleError && !scheduleSuccess && !missingDocsError && !missingDocsSuccess && (
              <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5">
                <FiCheckCircle /> {app.status === "rejected"
                  ? "Application rejected."
                  : app.status === "shortlisted"
                    ? "Shortlisted for assessment."
                    : app.status === "assessment_scheduled"
                      ? "Assessment scheduled."
                      : "Approved teacher."}
              </p>
            )}
            {app.status === "approved" && (
              <p className="mt-1 text-[11px] font-medium text-slate-400">
                Next: assign a student from Requests.
              </p>
            )}
          </div>
          {(statusOptions[app.status] || app.pendingStatus) && (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm font-semibold text-slate-700">
                  <span>Application stage</span>
                  <select
                    value={app.status}
                    disabled={stageChanging || !statusOptions[app.status]}
                    onChange={(event) => void changeStatus(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/20 disabled:opacity-60 sm:max-w-md"
                  >
                    <option value={app.status}>{statusLabels[app.status] || app.status}</option>
                    {(statusOptions[app.status] || []).map((status) => (
                      <option key={status} value={status}>{statusLabels[status]}</option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-col items-start gap-2 sm:max-w-xs">
                  <p className="text-xs leading-relaxed text-slate-500">
                    Stage emails send in 1 minute. You can cancel before then.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handlePreviewEmail(app.pendingStatus || previewStage)}
                    disabled={previewLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-60"
                  >
                    <FiEye className="size-4" />
                    {previewLoading ? "Loading..." : "Preview / edit email"}
                  </button>
                  {previewError && <p className="text-[11px] font-medium text-rose-600">{previewError}</p>}
                </div>
              </div>
              {app.pendingStatus && app.emailScheduledFor && (() => {
                const secondsLeft = clock === null
                  ? 60
                  : Math.max(0, Math.ceil((new Date(app.emailScheduledFor).getTime() - clock) / 1000));
                const countdown = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;
                return (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-orange-700">
                      <FiClock size={14} /> {statusLabels[app.pendingStatus] || app.pendingStatus} sends in {countdown}
                    </span>
                    <button
                      type="button"
                      onClick={cancelScheduledEmail}
                      disabled={stageChanging}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                    >
                      <FiX className="size-3.5" /> Cancel email
                    </button>
                  </div>
                );
              })()}
            </section>
          )}
        </div>
      </div>
      {previewEmail && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6" onClick={() => setPreviewEmail(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-preview-title"
            className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6">
              <div>
                <h2 id="email-preview-title" className="text-base font-semibold text-slate-900">Email preview</h2>
                <p className="mt-1 text-xs text-slate-500">Review or edit the message for {previewEmail.stage.replaceAll("_", " ")}.</p>
              </div>
              <button type="button" onClick={() => setPreviewEmail(null)} aria-label="Close email preview" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <FiX className="size-5" />
              </button>
            </header>
            <div className="min-h-0 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <label className="block text-xs font-semibold text-slate-600">
                Email stage
                <select
                  value={previewEmail.stage}
                  onChange={(event) => void handlePreviewEmail(event.target.value)}
                  disabled={previewLoading}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  {Object.entries(statusLabels).filter(([stage]) => stage !== "pending").map(([stage, label]) => (
                    <option key={stage} value={stage}>{label}</option>
                  ))}
                </select>
              </label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                <p>From: <span className="font-semibold text-slate-800">CoachPlus Academy</span> <span className="text-slate-400">via Resend</span></p>
                <p className="mt-1">To: <span className="font-semibold text-slate-800">{previewEmail.recipient}</span></p>
              </div>
              <label className="block text-xs font-semibold text-slate-600">
                Subject
                <input
                  value={previewEmail.subject}
                  maxLength={180}
                  onChange={(event) => {
                    setEmailDraftSaved(false);
                    setPreviewEmail((current) => current ? { ...current, subject: event.target.value } : current);
                  }}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Message
                <textarea
                  value={previewEmail.body}
                  maxLength={12000}
                  rows={12}
                  onChange={(event) => {
                    setEmailDraftSaved(false);
                    setPreviewEmail((current) => current ? { ...current, body: event.target.value } : current);
                  }}
                  className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-relaxed text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <span className="mt-1 block text-right font-normal text-slate-400">{previewEmail.body.length}/12,000</span>
              </label>
              {previewEmail.stage === "approved" && (
                <p className="text-[11px] text-slate-500">The account setup link is added when this email sends.</p>
              )}
              {previewError && <p className="text-xs font-medium text-rose-600">{previewError}</p>}
              {!previewEmail.queued && <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800">Queue this stage first. Then you can save your edits before the email sends.</p>}
              {emailDraftSaved && <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">Email saved and queued through Resend.</p>}
            </div>
            <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
              <button type="button" onClick={() => setPreviewEmail(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">Close</button>
              <button
                type="button"
                onClick={() => void saveEmailDraft()}
                disabled={!previewEmail.queued || savingEmailDraft || emailDraftSaved}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiCheckCircle className="size-4" />
                {savingEmailDraft ? "Saving..." : "Save email"}
              </button>
            </footer>
          </section>
        </div>
      )}
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
