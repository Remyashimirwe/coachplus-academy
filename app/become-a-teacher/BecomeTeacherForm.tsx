"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBookOpen,
  FiMessageSquare,
  FiSend,
  FiCheckCircle,
  FiAward,
  FiBriefcase,
  FiStar,
  FiAlertCircle,
  FiFileText,
  FiImage,
  FiX,
  FiMapPin,
  FiLinkedin,
  FiLink,
  FiCalendar,
  FiClock,
  FiCpu,
  FiActivity,
  FiTarget,
  FiInstagram,
  FiYoutube,
  FiShield,
  FiEye,
  FiMaximize2,
  FiSearch,
} from "react-icons/fi";
import TimePicker from "@/app/components/TimePicker";
import ImageLightboxModal from "@/app/components/ImageLightboxModal";
import type { TeacherTerms } from "@/app/lib/teacherTerms";
import { localizedContent, t, useSiteLocale } from "@/app/lib/site-i18n";

const MAX_SUBJECTS_PER_PROGRAM = 4;
const MAX_TOPICS_PER_SUBJECT = 4;

type ProgramTopic = {
  id: number;
  name: string;
  nameFr?: string | null;
};

type ProgramSubject = {
  id: number;
  name: string;
  nameFr?: string | null;
  topics: ProgramTopic[];
};

type TeacherProgram = {
  id: number;
  title: string;
  titleFr?: string | null;
  subjects: ProgramSubject[];
};

const daysList = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];


function Field({
  icon,
  label,
  htmlFor,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const locale = useSiteLocale();
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-xs font-medium text-[#0f172a] flex items-center gap-2 mb-1">
        <span className="flex items-center justify-center size-6 rounded-lg bg-[#E91E63]/5 text-[#E91E63]">{icon}</span>
        {t(locale, label)}
      </label>
      <div className="relative group">
        {children}
      </div>
    </div>
  );
}

const inputClasses =
  "w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#E91E63] focus:bg-white focus:ring-4 focus:ring-[#E91E63]/10";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Low-level strings that must never be shown to an applicant. A bare
// "Failed to fetch" is what browsers and some server-side clients return when
// the network or database is unreachable; it tells the applicant nothing.
const TECHNICAL_ERROR_PATTERN =
  /failed to fetch|fetch failed|networkerror|load failed|typeerror|econnrefused|econnreset|etimedout|enotfound|eai_again|socketexception|clientexception|invalid prisma|\bp\d{4}\b|sqlstate|stack trace|at\s+\S+\s*\(.+:\d+:\d+\)/i;

function looksTechnical(message: string) {
  return TECHNICAL_ERROR_PATTERN.test(message);
}

/**
 * Converts any thrown value into a sentence the applicant can act on.
 * Server-provided explanations are kept when they are meaningful; technical
 * details (including "Failed to fetch") are replaced with a specific fallback.
 */
function friendlyErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof TypeError) {
    const text = error.message.toLowerCase();
    if (
      text.includes("fetch") ||
      text.includes("network") ||
      text.includes("load failed")
    ) {
      return "We couldn't reach the server. Check your internet connection and try again.";
    }
    return fallback;
  }
  if (error instanceof Error) {
    const message = error.message.trim();
    if (message && message.length <= 300 && !looksTechnical(message)) {
      return message;
    }
  }
  return fallback;
}

// Vercel caps a single serverless request body at ~4.5 MB. Files are uploaded
// one at a time so the application itself only sends a small JSON payload.
// Photos are downscaled first so typical phone pictures stay under the cap.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;

async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  // Animated GIFs would lose animation, and canvas cannot decode every format
  // (e.g. HEIC in some browsers) - leave those untouched.
  if (
    file.type === "image/gif" ||
    file.type === "image/heic" ||
    file.type === "image/heif"
  ) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    // Flatten transparency onto white so transparent PNGs don't turn black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82),
    );
    // Keep the original when compression did not actually help.
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

async function prepareUpload(file: File, label: string): Promise<File> {
  const prepared = await shrinkImage(file);
  if (prepared.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `${label} is ${formatFileSize(prepared.size)}. Please choose a file smaller than 4 MB (photos are resized automatically).`,
    );
  }
  return prepared;
}

async function uploadDocument(
  file: File,
  label: string,
): Promise<{ url: string; publicId: string }> {
  const body = new FormData();
  body.append("file", file);
  body.append("folder", "teacher-applications");

  let response: Response;
  try {
    response = await fetch("/api/uploads", { method: "POST", body });
  } catch {
    throw new Error(
      `We couldn't reach the server while uploading "${label}". Check your internet connection and try again.`,
    );
  }

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.url) {
    const serverMessage =
      typeof data?.error === "string" ? data.error.trim() : "";
    const reason =
      serverMessage && !looksTechnical(serverMessage)
        ? serverMessage
        : response.status === 413
          ? "The file is too large."
          : response.status === 503
            ? "File storage is temporarily unavailable."
            : "The upload service could not store this file.";
    throw new Error(
      `Could not upload "${label}". ${reason} Please try again.`,
    );
  }
  return { url: String(data.url), publicId: String(data.publicId ?? "") };
}

function UploadField({
  icon,
  label,
  htmlFor,
  name,
  required,
  multiple,
  accept,
  files,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  htmlFor: string;
  name: string;
  required?: boolean;
  multiple?: boolean;
  accept?: string;
  files: { file: File; url: string }[];
  onChange: (files: { file: File; url: string }[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  const removeFile = (index: number) => {
    const remaining = files.filter((_, i) => i !== index);
    onChange(remaining);
    if (inputRef.current) {
      const dt = new DataTransfer();
      remaining.forEach(f => dt.items.add(f.file));
      inputRef.current.files = dt.files;
    }
  };

  return (
    <Field icon={icon} label={label} htmlFor={htmlFor}>
      <input
        ref={inputRef}
        id={htmlFor}
        name={name}
        type="file"
        required={required}
        multiple={multiple}
        accept={accept}
        onChange={(e) => {
          const selected = Array.from(e.target.files || []);
          onChange(selected.map(f => ({ file: f, url: URL.createObjectURL(f) })));
        }}
        className={`${inputClasses} py-3 cursor-pointer`}
      />
      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {files.map(({ file, url }, i) => (
              <div key={i} className="relative group/preview rounded-2xl border-2 border-slate-100 bg-slate-50 p-3 flex flex-col gap-2 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  aria-label={`Remove ${file.name}`}
                  className="absolute top-2 right-2 z-10 grid size-6 place-items-center rounded-full bg-[#E91E63] text-white shadow-lg shadow-rose-200 transition-all hover:bg-red-600 hover:scale-110"
                >
                  <FiX className="size-3.5" />
                </button>
                <div className="flex items-center gap-3">
                  {file.type.startsWith("image/") ? (
                    <div
                      onClick={() => setLightboxImage({ url, title: file.name })}
                      className="group/img relative size-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-900 cursor-pointer shadow-inner"
                      title="Click to open big screen"
                    >
                      <img src={url} alt={file.name} className="h-full w-full object-cover transition-transform group-hover/img:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <FiMaximize2 className="size-5 drop-shadow" />
                      </div>
                    </div>
                  ) : (
                    <div className="size-20 shrink-0 rounded-xl bg-white border border-slate-100 flex flex-col items-center justify-center gap-1">
                      <FiFileText className="size-6 text-[#E91E63]" />
                      <span className="text-[8px] font-medium text-slate-400 uppercase">Document</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{formatFileSize(file.size)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {file.type.startsWith("image/") && (
                        <button
                          type="button"
                          onClick={() => setLightboxImage({ url, title: file.name })}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#E91E63] hover:underline"
                        >
                          <FiEye className="size-3" /> Open in Big Screen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <ImageLightboxModal
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        imageUrl={lightboxImage?.url || null}
        title={lightboxImage?.title || "Uploaded Image"}
        subtitle="Full Screen Preview"
      />
    </Field>
  );
}

export default function BecomeTeacherForm({ isOpen, programs, terms }: { isOpen: boolean; programs: TeacherProgram[]; terms: TeacherTerms }) {
  const locale = useSiteLocale();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [uploadStep, setUploadStep] = useState("Submitting Application...");
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [receiptEmailSent, setReceiptEmailSent] = useState<true | false | "pending">("pending");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [selectedProgramIds, setSelectedProgramIds] = useState<number[]>([]);
  const [programSubjects, setProgramSubjects] = useState<Record<number, string[]>>({});
  const [programTopics, setProgramTopics] = useState<Record<string, string[]>>({});
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [teachOnline, setTeachOnline] = useState<string>("");
  const [dayTimes, setDayTimes] = useState<Record<string, { from: string; to: string }>>({});
  const [selectionErrors, setSelectionErrors] = useState<{ subjects?: boolean; days?: boolean; dayTimes?: boolean }>({});
  const [diplomaFiles, setDiplomaFiles] = useState<{ file: File; url: string }[]>([]);
  const [criminalRecordFiles, setCriminalRecordFiles] = useState<{ file: File; url: string }[]>([]);
  const [photoFiles, setPhotoFiles] = useState<{ file: File; url: string }[]>([]);
  const [idPassportFiles, setIdPassportFiles] = useState<{ file: File; url: string }[]>([]);
  const [resumeFiles, setResumeFiles] = useState<{ file: File; url: string }[]>([]);
  const [coverLetterFiles, setCoverLetterFiles] = useState<{ file: File; url: string }[]>([]);
  const [otherCertFiles, setOtherCertFiles] = useState<{ file: File; url: string }[]>([]);

  const toggleProgram = (programId: number) => {
    setSelectedProgramIds(prev => {
      if (prev.includes(programId)) {
        setProgramSubjects(ps => {
          const copy = { ...ps };
          delete copy[programId];
          return copy;
        });
        setProgramTopics(ts => {
          const copy = { ...ts };
          Object.keys(copy).forEach(k => {
            if (k.startsWith(`${programId}:`)) delete copy[k];
          });
          return copy;
        });
        return prev.filter(id => id !== programId);
      }
      return [...prev, programId];
    });
  };

  const toggleProgramSubject = (programId: number, subjectName: string) => {
    setProgramSubjects(prev => {
      const current = prev[programId] || [];
      if (current.includes(subjectName)) {
        const key = `${programId}:${subjectName}`;
        setProgramTopics(ts => {
          const copy = { ...ts };
          delete copy[key];
          return copy;
        });
        return { ...prev, [programId]: current.filter(s => s !== subjectName) };
      }
      if (current.length >= MAX_SUBJECTS_PER_PROGRAM) return prev;
      return { ...prev, [programId]: [...current, subjectName] };
    });
  };

  const toggleProgramTopic = (programId: number, subjectName: string, topicName: string) => {
    const key = `${programId}:${subjectName}`;
    setProgramTopics(prev => {
      const current = prev[key] || [];
      if (current.includes(topicName)) {
        return { ...prev, [key]: current.filter(t => t !== topicName) };
      }
      if (current.length >= MAX_TOPICS_PER_SUBJECT) return prev;
      return { ...prev, [key]: [...current, topicName] };
    });
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        setDayTimes(dt => {
          const copy = { ...dt };
          delete copy[day];
          return copy;
        });
        return prev.filter(d => d !== day);
      }
      setDayTimes(dt => ({ ...dt, [day]: dt[day] || { from: "", to: "" } }));
      return [...prev, day];
    });
  };

  const updateDayTime = (day: string, field: "from" | "to", value: string) => {
    setDayTimes(prev => ({ ...prev, [day]: { ...(prev[day] || { from: "", to: "" }), [field]: value } }));
  };

  return (
    <section className="py-12 md:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          {/* Right Side: Application Form or Status */}
          <div className="relative w-full max-w-4xl">
            <div className="absolute -inset-4 rounded-[44px] bg-gradient-to-tr from-[#E91E63]/10 to-transparent blur-2xl" />
            
            <AnimatePresence mode="wait">
              {!isOpen ? (
                <motion.div
                  key="closed"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative rounded-[40px] bg-white p-12 text-center shadow-2xl shadow-slate-200 border border-slate-100 flex flex-col items-center justify-center min-h-[500px]"
                >
                  <div className="size-24 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mb-8">
                    <FiAlertCircle className="size-12" />
                  </div>
                  <h2 className="text-xl font-semibold text-[#0f172a]">{t(locale, "Applications are Closed")}</h2>
                  <p className="mt-6 text-lg text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {t(locale, "We are currently not accepting new teacher applications. Please check back later or follow us for updates on future recruitment cycles.")}
                  </p>
                  <Link
                    href="/"
                    className="mt-10 inline-flex min-h-[64px] items-center justify-center rounded-2xl bg-[#0f172a] px-10 text-base font-semibold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-[#E91E63]"
                  >
                    {t(locale, "Return Home")}
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative rounded-[32px] md:rounded-[40px] bg-white p-6 md:p-12 shadow-2xl shadow-slate-200 border border-slate-100"
                >
                  <div className="mb-8 md:mb-12 text-center">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-[#0f172a] tracking-tight">{t(locale, "Application Form")}</h2>
                    <p className="text-slate-500 mt-3 text-base">{t(locale, "Tell us about your expertise and teaching journey")}</p>
                    <div className="mt-6 flex justify-center">
                      <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-[#FF5733] to-[#E91E63]" />
                    </div>
                  </div>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formEl = e.currentTarget;
                      const totalSubjects =
                        Object.values(programSubjects).reduce((sum, list) => sum + list.length, 0);
                      const errors: typeof selectionErrors = {};
                      if (totalSubjects === 0) errors.subjects = true;
                      if (selectedDays.length === 0) {
                        errors.days = true;
                      } else {
                        const missingTime = selectedDays.some(d => !dayTimes[d]?.from || !dayTimes[d]?.to);
                        if (missingTime) errors.dayTimes = true;
                      }
                      
                      if (Object.keys(errors).length > 0) {
                        setSelectionErrors(errors);
                        const firstError = document.querySelector('[data-error="true"]');
                        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        return;
                      }

                      if (!agreedToTerms) {
                        alert("Please accept the terms and conditions to continue.");
                        return;
                      }

                      setSelectionErrors({});
                      setErrorMessage("");
                      setUploadStep("Preparing your application...");
                      setStatus("submitting");

                      try {
                        const formData = new FormData(formEl);

                        // Upload documents one at a time. Vercel rejects request
                        // bodies over ~4.5 MB, and six documents in a single
                        // server-action call easily exceed that, which made the
                        // form impossible to submit.
                        const pending: { file: File; kind: string; label: string }[] = [];
                        const addFiles = (name: string, kind: string, label: string) => {
                          formData.getAll(name).forEach((entry) => {
                            if (entry instanceof File && entry.size > 0) {
                              pending.push({ file: entry, kind, label });
                            }
                          });
                        };
                        addFiles("photo", "photo", "Profile photo");
                        addFiles("idPassport", "idPassport", "Passport / National ID");
                        addFiles("resume", "resume", "CV / Resume");
                        addFiles("coverLetter", "coverLetter", "Cover letter");
                        addFiles("academicCert", "academicCertificates", "Diploma / academic certificate");
                        addFiles("criminalRecord", "criminalRecord", "Criminal record certificate");
                        addFiles("otherCerts", "otherCertificates", "Other certificate");

                        const documents: {
                          kind: string;
                          fileName: string;
                          mimeType: string;
                          url: string;
                          publicId: string;
                        }[] = [];

                        for (let i = 0; i < pending.length; i += 1) {
                          const item = pending[i];
                          setUploadStep(`Uploading ${item.label} (${i + 1} of ${pending.length})...`);
                          const prepared = await prepareUpload(item.file, item.label);
                          const uploaded = await uploadDocument(prepared, item.label);
                          documents.push({
                            kind: item.kind,
                            fileName: prepared.name,
                            mimeType: prepared.type || "application/octet-stream",
                            url: uploaded.url,
                            publicId: uploaded.publicId,
                          });
                        }

                        const subjects: string[] = [];
                        Object.entries(programSubjects).forEach(([programId, subs]) => {
                          const program = programs.find(p => p.id === Number(programId));
                          subs.forEach(s => {
                            subjects.push(program ? `${program.title}: ${s}` : s);
                            const topics = programTopics[`${programId}:${s}`] || [];
                            topics.forEach(t => subjects.push(program ? `${program.title}: ${s} - ${t}` : `${s} - ${t}`));
                          });
                        });

                        const value = (name: string) => String(formData.get(name) ?? "").trim();
                        const submissionStorageKey = "teacher-application-submission-id";
                        let submissionId = sessionStorage.getItem(submissionStorageKey);
                        if (!submissionId) {
                          submissionId = crypto.randomUUID();
                          sessionStorage.setItem(submissionStorageKey, submissionId);
                        }
                        setUploadStep("Submitting application...");
                        const response = await fetch("/api/teacher-applications", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            fullName: value("fullName"),
                            email: value("email"),
                            phone: value("phone"),
                            country: value("country"),
                            province: value("province"),
                            district: value("district"),
                            sector: value("sector"),
                            cell: value("cell"),
                            village: value("village"),
                            linkedin: value("linkedin") || null,
                            instagram: value("instagram") || null,
                            youtube: value("youtube") || null,
                            otherSocial: value("otherSocial") || null,
                            educationLevel: value("educationLevel"),
                            fieldOfStudy: value("fieldOfStudy"),
                            institution: value("institution"),
                            graduationYear: value("graduationYear"),
                            experienceYears: value("experienceYears"),
                            subjects,
                            previousOrg: value("previousOrg") || null,
                            previousPos: value("previousPos") || null,
                            expDescription: value("expDescription"),
                            methods: value("methods"),
                            difficultStudents: value("difficultStudents"),
                            engagement: value("engagement"),
                            teachOnline: value("teachOnline"),
                            onlinePlatforms: value("onlinePlatforms"),
                            employmentType: value("employmentType"),
                            availableDays: selectedDays.join(", "),
                            availableHours: selectedDays
                              .map(d => `${d}: ${dayTimes[d]?.from || ""} - ${dayTimes[d]?.to || ""}`)
                              .join("; "),
                            startDate: value("startDate"),
                            portfolioUrl: value("portfolio") || null,
                            whyTeach: value("whyTeach"),
                            whySelect: value("whySelect"),
                            contribution: value("contribution"),
                            agreedToTerms: true,
                            documents,
                            submissionId,
                          }),
                        });

                        const result = await response.json().catch(() => null);
                        if (!response.ok) {
                          throw new Error(result?.error || "Submission failed. Please try again.");
                        }

                        setReceiptEmailSent(result?.emailSent === true ? true : result?.emailSent === false ? false : "pending");
                        sessionStorage.removeItem(submissionStorageKey);
                        setStatus("idle");
                        setShowSuccessModal(true);
                        formEl.reset();
                        setSelectedProgramIds([]);
                        setProgramSubjects({});
                        setProgramTopics({});
                        setSelectedDays([]);
                        setDayTimes({});
                        setDiplomaFiles([]);
                        setCriminalRecordFiles([]);
                        setPhotoFiles([]);
                        setIdPassportFiles([]);
                        setResumeFiles([]);
                        setCoverLetterFiles([]);
                        setOtherCertFiles([]);
                      } catch (error) {
                        setStatus("error");
                        setUploadStep("Submitting Application...");
                        setErrorMessage(
                          `${friendlyErrorMessage(
                            error,
                            "We couldn't submit your application. Please check your connection and try again.",
                          )} If your application was already received, submitting again is safe.`,
                        );
                      }
                    }}
                    className="space-y-10 md:space-y-12"
                  >
                    {/* 1. Personal Information */}
                    <div className="space-y-6 md:space-y-8">
                      <div className="flex items-center gap-4 mb-4 md:mb-8">
                        <div className="flex size-10 md:size-12 items-center justify-center rounded-2xl bg-[#0f172a] text-white shadow-lg shadow-slate-200">
                          <FiUser className="size-5 md:size-6" />
                        </div>
                        <div>
                          <h3 className="text-base md:text-lg font-semibold text-[#0f172a]">{t(locale, "Personal Information")}</h3>
                          <p className="text-[10px] md:text-xs text-slate-500 font-medium">{t(locale, "Basic details to identify you")}</p>
                        </div>
                      </div>
                      <div className="grid gap-6">
                        <Field icon={<FiUser />} label="Full Name *" htmlFor="fullName">
                          <input id="fullName" name="fullName" required placeholder="e.g. Jane Smith" className={inputClasses} />
                        </Field>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <Field icon={<FiMail />} label="Email Address *" htmlFor="email">
                          <input id="email" name="email" type="email" required placeholder="jane@example.com" className={inputClasses} />
                        </Field>
                        <Field icon={<FiPhone />} label="Phone Number *" htmlFor="phone">
                          <input id="phone" name="phone" type="tel" required placeholder="+250 780 000 000" className={inputClasses} />
                        </Field>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <Field icon={<FiMapPin />} label="Country *" htmlFor="country">
                          <input id="country" name="country" required placeholder="e.g. Rwanda" className={inputClasses} />
                        </Field>
                        <Field icon={<FiMapPin />} label="Province *" htmlFor="province">
                          <input id="province" name="province" required placeholder="e.g. Kigali / East" className={inputClasses} />
                        </Field>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <Field icon={<FiMapPin />} label="District *" htmlFor="district">
                          <input id="district" name="district" required placeholder="e.g. Nyarugenge" className={inputClasses} />
                        </Field>
                        <Field icon={<FiMapPin />} label="Sector *" htmlFor="sector">
                          <input id="sector" name="sector" required placeholder="e.g. Kanyinya" className={inputClasses} />
                        </Field>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <Field icon={<FiMapPin />} label="Cell *" htmlFor="cell">
                          <input id="cell" name="cell" required placeholder="e.g. Nyamweru" className={inputClasses} />
                        </Field>
                        <Field icon={<FiMapPin />} label="Village *" htmlFor="village">
                          <input id="village" name="village" required placeholder="e.g. Kibenga" className={inputClasses} />
                        </Field>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <Field icon={<FiLinkedin />} label="LinkedIn Profile (Optional)" htmlFor="linkedin">
                          <input id="linkedin" name="linkedin" type="url" placeholder="https://linkedin.com/in/username" className={inputClasses} />
                        </Field>
                        <Field icon={<FiInstagram />} label="Instagram Profile (Optional)" htmlFor="instagram">
                          <input id="instagram" name="instagram" type="url" placeholder="https://instagram.com/username" className={inputClasses} />
                        </Field>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <Field icon={<FiYoutube />} label="YouTube Channel (Optional)" htmlFor="youtube">
                          <input id="youtube" name="youtube" type="url" placeholder="https://youtube.com/@channel" className={inputClasses} />
                        </Field>
                        <Field icon={<FiLink />} label="Other Social Media / Website (Optional)" htmlFor="otherSocial">
                          <input id="otherSocial" name="otherSocial" type="url" placeholder="https://yourwebsite.com" className={inputClasses} />
                        </Field>
                      </div>
                    </div>

                    {/* 2. Education */}
                    <div className="space-y-6 md:space-y-8">
                      <div className="flex items-center gap-4 mb-4 md:mb-8">
                        <div className="flex size-10 md:size-12 items-center justify-center rounded-2xl bg-[#0f172a] text-white shadow-lg shadow-slate-200">
                          <FiBookOpen className="size-5 md:size-6" />
                        </div>
                        <div>
                          <h3 className="text-base md:text-lg font-semibold text-[#0f172a]">{t(locale, "Education")}</h3>
                          <p className="text-[10px] md:text-xs text-slate-500 font-medium">{t(locale, "Your academic background")}</p>
                        </div>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <Field icon={<FiAward />} label="Highest Level of Education / Degree Qualification *" htmlFor="educationLevel">
                          <select id="educationLevel" name="educationLevel" required className={`${inputClasses} appearance-none`}>
                            <option value="">{t(locale, "Select Level / Degree")}</option>
                            <option value="Bachelor of Education (B.Ed.) (e.g. B.Ed. in Mathematics)">1. Bachelor of Education (B.Ed.) — e.g. B.Ed. in Mathematics</option>
                            <option value="Bachelor of Science (BSc) (e.g. BSc in Physics)">2. Bachelor of Science (BSc) — e.g. BSc in Physics</option>
                            <option value="Bachelor of Arts (BA) (e.g. BA in English Literature)">3. Bachelor of Arts (BA) — e.g. BA in English Literature</option>
                            <option value="Bachelor’s Degree in Educational Psychology, Psychopedagogy, or Psychology">4. Bachelor’s Degree in Educational Psychology, Psychopedagogy, or Psychology</option>
                            <option value="Master's Degree">{t(locale, "Master's Degree")}</option>
                            <option value="PhD / Doctorate">{t(locale, "PhD / Doctorate")}</option>
                            <option value="Diploma">{t(locale, "Diploma / Certificate")}</option>
                            <option value="Other">{t(locale, "Other")}</option>
                          </select>
                        </Field>
                        <Field icon={<FiBookOpen />} label="Field of Study *" htmlFor="fieldOfStudy">
                          <input id="fieldOfStudy" name="fieldOfStudy" required placeholder="e.g. Mathematics, Physics" className={inputClasses} />
                        </Field>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <Field icon={<FiTarget />} label="University/Institution *" htmlFor="institution">
                          <input id="institution" name="institution" required placeholder="e.g. University of Rwanda" className={inputClasses} />
                        </Field>
                        <Field icon={<FiCalendar />} label="Graduation Year *" htmlFor="graduationYear">
                          <input id="graduationYear" name="graduationYear" required placeholder="e.g. 2020" className={inputClasses} />
                        </Field>
                      </div>
                    </div>

                    {/* 3. Teaching Experience */}
                    <div className="space-y-6 md:space-y-8">
                      <div className="flex items-center gap-4 mb-4 md:mb-8">
                        <div className="flex size-10 md:size-12 items-center justify-center rounded-2xl bg-[#0f172a] text-white shadow-lg shadow-slate-200">
                          <FiBriefcase className="size-5 md:size-6" />
                        </div>
                        <div>
                          <h3 className="text-base md:text-lg font-semibold text-[#0f172a]">{t(locale, "Teaching Experience")}</h3>
                          <p className="text-[10px] md:text-xs text-slate-500 font-medium">{t(locale, "Where and what you&apos;ve taught")}</p>
                        </div>
                      </div>
                      <Field icon={<FiClock />} label="Years of Teaching Experience *" htmlFor="experienceYears">
                        <select id="experienceYears" name="experienceYears" required className={`${inputClasses} appearance-none`}>
                          <option value="">{t(locale, "Select Years")}</option>
                          <option value="0-1">{t(locale, "Less than 1 year")}</option>
                          <option value="1-3">{t(locale, "1-3 Years")}</option>
                          <option value="4-7">{t(locale, "4-7 Years")}</option>
                          <option value="8+">{t(locale, "8+ Years")}</option>
                        </select>
                      </Field>

                      <div className="space-y-4" data-error={selectionErrors.subjects}>
                        <div className="flex items-center justify-between">
                          <label className={`text-xs font-semibold flex items-center gap-2 ${selectionErrors.subjects ? 'text-red-500' : 'text-slate-700'}`}>
                            Programs &amp; Subjects You Can Teach *
                          </label>
                          {selectionErrors.subjects && <span className="text-[10px] font-medium text-red-500 uppercase">Select at least one</span>}
                        </div>
                        <p className="text-xs text-slate-500">
                          Choose a program, then pick up to {MAX_SUBJECTS_PER_PROGRAM} subjects within it. Select a subject to reveal its available topics.
                        </p>
                        <div className="space-y-4">
                          {programs.filter(p => p.subjects.length > 0).map(p => {
                            const isProgramSelected = selectedProgramIds.includes(p.id);
                            const count = programSubjects[p.id]?.length || 0;
                            return (
                              <div
                                key={p.id}
                                className={`rounded-2xl border-2 transition-all overflow-hidden ${
                                  isProgramSelected
                                    ? "border-[#E91E63] bg-[#E91E63]/5"
                                    : "border-slate-100 bg-white"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleProgram(p.id)}
                                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                                >
                                  <span className={`text-xs font-semibold ${isProgramSelected ? "text-[#E91E63]" : "text-slate-800"}`}>
                                    {localizedContent(locale, p.title, p.titleFr)}
                                  </span>
                                  <span className={`size-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    isProgramSelected
                                      ? "bg-[#E91E63] border-[#E91E63]"
                                      : "bg-slate-100 border-slate-200"
                                  }`}>
                                    {isProgramSelected && <FiCheckCircle className="size-3 text-white" />}
                                  </span>
                                </button>
                                {isProgramSelected && (
                                  <div className="px-5 pb-5">
                                    <div className="mb-3 flex items-center justify-between">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Subjects (max {MAX_SUBJECTS_PER_PROGRAM})
                                      </span>
                                      <span className={`text-xs font-medium ${count >= MAX_SUBJECTS_PER_PROGRAM ? "text-[#E91E63]" : "text-slate-400"}`}>
                                        {count}/{MAX_SUBJECTS_PER_PROGRAM}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {p.subjects.map(s => {
                                        const isSelected = programSubjects[p.id]?.includes(s.name);
                                        const hasTopics = s.topics.length > 0;
                                        const selTopics = programTopics[`${p.id}:${s.name}`] || [];
                                        return (
                                          <div
                                            key={s.id}
                                            className={`rounded-xl border-2 transition-all overflow-hidden ${
                                              isSelected
                                                ? "border-[#E91E63]/50 bg-white"
                                                : "border-slate-100 bg-slate-50"
                                            }`}
                                          >
                                            <button
                                              type="button"
                                              onClick={() => toggleProgramSubject(p.id, s.name)}
                                              className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-xs font-medium transition-all ${
                                                isSelected ? "text-[#E91E63]" : "text-slate-600 hover:text-slate-800"
                                              }`}
                                            >
                                              <span>{localizedContent(locale, s.name, s.nameFr)}</span>
                                              {isSelected && <FiCheckCircle className="size-3.5 shrink-0" />}
                                            </button>
                                            {isSelected && hasTopics && (
                                              <div className="border-t border-slate-100 px-4 py-3">
                                                <div className="flex items-center justify-between">
                                                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                                                    Topics (max {MAX_TOPICS_PER_SUBJECT})
                                                  </span>
                                                  <span className={`text-xs font-medium ${selTopics.length >= MAX_TOPICS_PER_SUBJECT ? "text-[#E91E63]" : "text-slate-400"}`}>
                                                    {selTopics.length}/{MAX_TOPICS_PER_SUBJECT}
                                                  </span>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                  {s.topics.map(t => {
                                                    const isTopicSelected = selTopics.includes(t.name);
                                                    return (
                                                      <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() => toggleProgramTopic(p.id, s.name, t.name)}
                                                        className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all border ${
                                                          isTopicSelected
                                                            ? "bg-[#E91E63] border-[#E91E63] text-white"
                                                            : "bg-white border-slate-200 text-slate-500 hover:border-[#E91E63]/40 hover:text-slate-700"
                                                        }`}
                                                      >
                                                        {localizedContent(locale, t.name, t.nameFr)}
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <Field icon={<FiTarget />} label="Previous School/Organization" htmlFor="previousOrg">
                          <input id="previousOrg" name="previousOrg" placeholder="e.g. Green Hills Academy" className={inputClasses} />
                        </Field>
                        <Field icon={<FiBriefcase />} label="Previous Teaching Position" htmlFor="previousPos">
                          <input id="previousPos" name="previousPos" placeholder="e.g. Math Head Teacher" className={inputClasses} />
                        </Field>
                      </div>

                      <Field icon={<FiMessageSquare />} label="Briefly describe your teaching experience *" htmlFor="expDescription">
                        <textarea id="expDescription" name="expDescription" required rows={3} placeholder="Summarize your career and achievements..." className={inputClasses} />
                      </Field>
                    </div>

                    {/* 4. Teaching Skills */}
                    <div className="space-y-6 md:space-y-8">
                      <div className="flex items-center gap-4 mb-4 md:mb-8">
                        <div className="flex size-10 md:size-12 items-center justify-center rounded-2xl bg-[#0f172a] text-white shadow-lg shadow-slate-200">
                          <FiStar className="size-5 md:size-6" />
                        </div>
                        <div>
                          <h3 className="text-base md:text-lg font-semibold text-[#0f172a]">{t(locale, "Teaching Skills")}</h3>
                          <p className="text-[10px] md:text-xs text-slate-500 font-medium">{t(locale, "Your pedagogical approach")}</p>
                        </div>
                      </div>
                      <Field icon={<FiActivity />} label="What teaching methods do you use? *" htmlFor="methods">
                        <textarea id="methods" name="methods" required placeholder="e.g. Inquiry-based learning, Gamification..." className={inputClasses} />
                      </Field>
                      <Field icon={<FiAlertCircle />} label="How do you handle difficult or struggling students? *" htmlFor="difficultStudents">
                        <textarea id="difficultStudents" name="difficultStudents" required className={inputClasses} />
                      </Field>
                      <Field icon={<FiTarget />} label="How do you keep students engaged? *" htmlFor="engagement">
                        <textarea id="engagement" name="engagement" required className={inputClasses} />
                      </Field>
                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-slate-700">{t(locale, "Are you able to teach online? *")}</label>
                        <div className="flex gap-6">
                          {["Yes", "No"].map(option => (
                            <label key={option} className="flex items-center gap-2 cursor-pointer group">
                              <input type="radio" name="teachOnline" value={option} checked={teachOnline === option} onChange={() => setTeachOnline(option)} className="size-5 accent-[#E91E63]" />
                              <span className="text-slate-600 font-medium group-hover:text-[#E91E63] transition-colors">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {teachOnline === "Yes" && (
                        <Field icon={<FiCpu />} label="Which online platforms do you use? *" htmlFor="onlinePlatforms">
                          <input id="onlinePlatforms" name="onlinePlatforms" required placeholder="e.g. Zoom, Google Meet, Microsoft Teams" className={inputClasses} />
                        </Field>
                      )}
                    </div>

                    {/* 5. Availability */}
                    <div className="space-y-6 md:space-y-8">
                      <div className="flex items-center gap-4 mb-4 md:mb-8">
                        <div className="flex size-10 md:size-12 items-center justify-center rounded-2xl bg-[#0f172a] text-white shadow-lg shadow-slate-200">
                          <FiCalendar className="size-5 md:size-6" />
                        </div>
                        <div>
                          <h3 className="text-base md:text-lg font-semibold text-[#0f172a]">{t(locale, "Availability")}</h3>
                          <p className="text-[10px] md:text-xs text-slate-500 font-medium">{t(locale, "When can you start teaching?")}</p>
                        </div>
                      </div>
                      <Field icon={<FiBriefcase />} label="Employment Type *" htmlFor="employmentType">
                        <select id="employmentType" name="employmentType" required className={`${inputClasses} appearance-none`}>
                          <option value="">{t(locale, "Select Type")}</option>
                          <option value="Full-time">{t(locale, "Full-time")}</option>
                          <option value="Part-time">{t(locale, "Part-time")}</option>
                          <option value="Contract">{t(locale, "Contract")}</option>
                        </select>
                      </Field>
                      
                      <div className="space-y-4" data-error={selectionErrors.days || selectionErrors.dayTimes}>
                        <div className="flex items-center justify-between">
                          <label className={`text-xs font-semibold flex items-center gap-2 ${selectionErrors.days || selectionErrors.dayTimes ? 'text-red-500' : 'text-slate-700'}`}>
                            Available Days &amp; Time *
                          </label>
                          {(selectionErrors.days || selectionErrors.dayTimes) && <span className="text-[10px] font-medium text-red-500 uppercase">Select days and set times</span>}
                        </div>
                        <p className="text-xs text-slate-500">
                          Pick the days you are available, then choose your working hours (from - to) for each selected day.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {daysList.map(d => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => toggleDay(d)}
                              className={`rounded-xl px-4 py-2 text-xs font-medium transition-all border-2 ${
                                selectedDays.includes(d)
                                ? "bg-[#E91E63] border-[#E91E63] text-white shadow-lg shadow-rose-200"
                                : "bg-white border-slate-100 text-slate-600 hover:border-[#E91E63]/30"
                              }`}
                            >
                              {t(locale, d)}
                            </button>
                          ))}
                        </div>

                        {selectedDays.length > 0 && (
                          <div className="grid gap-4 sm:grid-cols-2">
                            {selectedDays.map(d => (
                              <div key={d} className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-4">
                                <p className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-700">
                                  <FiCalendar className="text-[#E91E63]" />
                                  {d}
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                  <TimePicker
                                    label={t(locale, "From")}
                                    ariaLabel={`${d} from time`}
                                    value={dayTimes[d]?.from || ""}
                                    onChange={(v) => updateDayTime(d, "from", v)}
                                  />
                                  <TimePicker
                                    label={t(locale, "To")}
                                    ariaLabel={`${d} to time`}
                                    value={dayTimes[d]?.to || ""}
                                    onChange={(v) => updateDayTime(d, "to", v)}
                                  />
                                </div>
                                {selectionErrors.dayTimes && (!dayTimes[d]?.from || !dayTimes[d]?.to) && (
                                  <p className="mt-2 text-[10px] font-medium text-red-500">Set a from and to time for {d}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Field icon={<FiCalendar />} label="Earliest Start Date *" htmlFor="startDate">
                        <input id="startDate" name="startDate" type="date" required onClick={(e) => { const input = e.target as HTMLInputElement; if (input.showPicker) input.showPicker(); }} className={inputClasses} />
                      </Field>
                    </div>

                    {/* 6. Final Questions */}
                    <div className="space-y-6 md:space-y-8">
                      <div className="flex items-center gap-4 mb-4 md:mb-8">
                        <div className="flex size-10 md:size-12 items-center justify-center rounded-2xl bg-[#0f172a] text-white shadow-lg shadow-slate-200">
                          <FiMessageSquare className="size-5 md:size-6" />
                        </div>
                        <div>
                          <h3 className="text-base md:text-lg font-semibold text-[#0f172a]">{t(locale, "Final Questions")}</h3>
                          <p className="text-[10px] md:text-xs text-slate-500 font-medium">{t(locale, "Tell us a bit more about your motivation")}</p>
                        </div>
                      </div>
                      <Field label="Why do you want to teach at our institution? *" htmlFor="whyTeach" icon={<FiTarget />}>
                        <textarea id="whyTeach" name="whyTeach" required rows={3} className={inputClasses} />
                      </Field>
                      <Field label="Why should we select you? *" htmlFor="whySelect" icon={<FiCheckCircle />}>
                        <textarea id="whySelect" name="whySelect" required rows={3} className={inputClasses} />
                      </Field>
                      <Field label="What can you contribute to our students? *" htmlFor="contribution" icon={<FiAward />}>
                        <textarea id="contribution" name="contribution" required rows={3} className={inputClasses} />
                      </Field>
                    </div>

                    {/* 7. Application Documents */}
                    <div className="space-y-6 md:space-y-8">
                      <div className="flex items-center gap-4 mb-4 md:mb-8">
                        <div className="flex size-10 md:size-12 items-center justify-center rounded-2xl bg-[#0f172a] text-white shadow-lg shadow-slate-200">
                          <FiFileText className="size-5 md:size-6" />
                        </div>
                        <div>
                          <h3 className="text-base md:text-lg font-semibold text-[#0f172a]">{t(locale, "Application Documents")}</h3>
                          <p className="text-[10px] md:text-xs text-slate-500 font-medium">{t(locale, "Supporting files for your application")}</p>
                        </div>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <UploadField icon={<FiImage />} label="Upload Your Profile Photo *" htmlFor="photo" name="photo" required accept="image/*" files={photoFiles} onChange={setPhotoFiles} />
                        <UploadField icon={<FiFileText />} label="Upload Passport / National ID *" htmlFor="idPassport" name="idPassport" required accept=".pdf,image/*" files={idPassportFiles} onChange={setIdPassportFiles} />
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <UploadField icon={<FiFileText />} label="Upload CV/Resume *" htmlFor="resume" name="resume" required accept=".pdf,.doc,.docx" files={resumeFiles} onChange={setResumeFiles} />
                        <UploadField icon={<FiMessageSquare />} label="Upload Application/Cover Letter *" htmlFor="coverLetter" name="coverLetter" required accept=".pdf,.doc,.docx" files={coverLetterFiles} onChange={setCoverLetterFiles} />
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <UploadField icon={<FiAward />} label="Diploma Upload *" htmlFor="academicCert" name="academicCert" required multiple accept=".pdf,image/*" files={diplomaFiles} onChange={setDiplomaFiles} />
                          <p className="mt-1 text-[11px] text-slate-500 font-medium leading-relaxed">
                            Upload your diploma / degree certificate. Supported qualifications:
                            <br /><span className="text-slate-700 font-semibold">1. Bachelor of Education (B.Ed.)</span> (e.g. B.Ed. in Mathematics)
                            <br /><span className="text-slate-700 font-semibold">2. Bachelor of Science (BSc)</span> (e.g. BSc in Physics)
                            <br /><span className="text-slate-700 font-semibold">3. Bachelor of Arts (BA)</span> (e.g. BA in English Literature)
                            <br /><span className="text-slate-700 font-semibold">4. Bachelor’s Degree in Educational Psychology, Psychopedagogy, or Psychology</span>
                          </p>
                        </div>
                        <UploadField icon={<FiShield />} label="Criminal Record Certificate *" htmlFor="criminalRecord" name="criminalRecord" required multiple accept=".pdf,image/*" files={criminalRecordFiles} onChange={setCriminalRecordFiles} />
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <UploadField icon={<FiAward />} label="Other Certificates (Optional)" htmlFor="otherCerts" name="otherCerts" multiple accept=".pdf,image/*" files={otherCertFiles} onChange={setOtherCertFiles} />
                      </div>

                      <Field icon={<FiLink />} label="Portfolio / Sample Work (Optional)" htmlFor="portfolio">
                        <input id="portfolio" name="portfolio" type="url" placeholder="Link to portfolio or shared folder" className={inputClasses} />
                      </Field>
                    </div>

                    {/* Terms and Agreement Title */}
                    <div className="space-y-6 md:space-y-8">
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="flex w-full items-center gap-4 mb-4 md:mb-8 text-left transition-all"
                      >
                        <div className="flex size-10 md:size-12 items-center justify-center rounded-2xl bg-[#0f172a] text-white shadow-lg shadow-slate-200">
                          <FiShield className="size-5 md:size-6" />
                        </div>
                        <div>
                          <h3 className="text-base md:text-lg font-semibold text-[#0f172a] hover:text-[#E91E63] transition-colors">{t(locale, "Read about the Terms and Agreement carefully")}</h3>
                          <p className="text-[10px] md:text-xs text-slate-500 font-medium hover:text-[#E91E63]/70 transition-colors">{t(locale, "Please review our partnership policies")}</p>
                        </div>
                      </button>
                    </div>

                    {/* 8. Agreement */}
                    <div className="space-y-4 pt-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 items-center">
                          <input
                            id="terms"
                            name="agreedToTerms"
                            type="checkbox"
                            required
                            checked={agreedToTerms}
                            onChange={() => {
                              if (!agreedToTerms) {
                                setShowTermsModal(true);
                              } else {
                                setAgreedToTerms(false);
                              }
                            }}
                            className="size-5 rounded border-2 border-slate-200 text-[#E91E63] focus:ring-[#E91E63]"
                          />
                        </div>
                        <div className="text-sm">
                          <label htmlFor="terms" className="font-medium text-slate-700">
                            I have read and accept the {" "}
                            <button
                              type="button"
                              onClick={() => setShowTermsModal(true)}
                              className="text-[#E91E63] hover:underline font-bold"
                            >
                              Teacher Partner Terms &amp; Conditions
                            </button>
                            {" "} and privacy policy.
                          </label>
                          <p className="text-xs text-slate-500 mt-1">
                            Click the box to open and read the terms. You can only tick it after reading the full agreement.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 9. Submit */}
                    <div className="pt-6">
                      <button
                        type="submit"
                        disabled={status === "submitting" || !agreedToTerms}
                        className="group relative w-full overflow-hidden rounded-3xl bg-[#0f172a] p-4 text-base font-semibold text-white shadow-2xl transition-all hover:-translate-y-1 hover:bg-[#E91E63] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      >
                        <span className="relative flex items-center justify-center gap-3">
                          {status === "submitting" ? (
                            <>
                              <div className="size-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                              {uploadStep}
                            </>
                          ) : (
                            <>
                              <FiSend className="size-6" />
                              Submit Application
                            </>
                          )}
                        </span>
                      </button>
                      {!agreedToTerms && (
                        <p className="mt-2 text-center text-xs text-rose-500 font-medium">
                          Please accept the terms and conditions to enable submission.
                        </p>
                      )}
                      {status === "error" && (
                        <p className="mt-2 text-center text-xs text-rose-500 font-medium flex items-center justify-center gap-1.5">
                          <FiAlertCircle />
                          {errorMessage || "Something went wrong while submitting your application. Please check your connection and try again."}
                        </p>
                      )}
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccessModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[40px] bg-white p-8 text-center shadow-2xl md:p-12"
            >
              <button
                onClick={() => setShowSuccessModal(false)}
                className="absolute right-6 top-6 rounded-2xl bg-slate-100 p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-[#E91E63]"
              >
                <FiX className="size-5" />
              </button>
              
              <div className="mx-auto mb-8 flex size-24 items-center justify-center rounded-3xl bg-green-50 text-green-500">
                <FiCheckCircle className="size-12" />
              </div>
              
              <h2 className="text-xl font-semibold text-[#0f172a]">{t(locale, "Application Sent!")}</h2>
              <p className="mt-6 text-lg leading-relaxed text-slate-500">
                {t(locale, "Thank you for applying to join CoachPlus Academy. Our academic team will review your profile and get back to you within 1-2 weeks.")}
              </p>
              {!receiptEmailSent && (
                <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-medium text-amber-800">
                  Your application was received, but we could not send the confirmation email. Our team has your application and will follow up with you.
                </p>
              )}
              {receiptEmailSent === "pending" && (
                <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  Your application is saved. The confirmation email is being sent; please check your inbox and spam folder shortly.
                </p>
              )}

              <Link
                href="/application-status"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#E91E63]/25 bg-[#E91E63]/5 py-4 text-sm font-semibold text-[#E91E63] transition-all hover:-translate-y-0.5 hover:bg-[#E91E63]/10"
              >
                <FiSearch className="size-4" />
                Track your application status
              </Link>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 rounded-2xl bg-[#0f172a] py-5 text-base font-semibold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-[#E91E63]"
                >
                  Got it, thanks!
                </button>
                <Link
                  href="/"
                  className="flex-1 rounded-2xl bg-slate-100 py-5 text-base font-semibold text-slate-600 transition-all hover:bg-slate-200"
                >
                  Return Home
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Terms and Conditions Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTermsModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[40px] bg-white shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#0f172a]">{terms.title}</h2>
                  <p className="text-sm text-[#E91E63] font-bold uppercase tracking-widest mt-1">{terms.subtitle}</p>
                </div>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="rounded-2xl bg-slate-100 p-3 text-slate-400 transition-colors hover:bg-rose-50 hover:text-[#E91E63]"
                >
                  <FiX className="size-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {terms.sections.map((section, sectionIndex) => (
                  <section key={sectionIndex}>
                    <h3 className="text-base font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-[#E91E63]/10 text-[#E91E63] text-xs">
                        {sectionIndex + 1}
                      </span>
                      {section.title}
                    </h3>
                    <ul className="space-y-4 text-sm text-slate-600 leading-relaxed list-disc ml-10">
                      {section.points.map((point, pointIndex) => {
                        const colon = point.indexOf(":");
                        const hasLabel = colon > 0 && colon < 60;
                        const label = hasLabel ? point.slice(0, colon).trim() : "";
                        const body = hasLabel ? point.slice(colon + 1).trim() : point;
                        return (
                          <li key={pointIndex}>
                            {hasLabel ? (
                              <>
                                <strong className="text-slate-900">{label}:</strong> {body}
                              </>
                            ) : (
                              point
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}

                <div className="bg-[#fff0f3] rounded-3xl p-6 border-2 border-[#E91E63]/10">
                  <h4 className="font-bold text-[#E91E63] mb-2 uppercase tracking-wider text-xs">
                    {terms.acknowledgmentTitle}
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed italic">
                    &quot;{terms.acknowledgment}&quot;
                  </p>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => {
                    setAgreedToTerms(true);
                    setShowTermsModal(false);
                  }}
                  className="w-full rounded-2xl bg-[#0f172a] py-5 text-base font-semibold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-[#E91E63]"
                >
                  I Understand & Agree
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
