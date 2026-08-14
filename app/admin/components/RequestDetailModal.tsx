"use client";

import { useEffect, useState } from "react";
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
} from "react-icons/fi";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-amber-100 text-amber-700",
  contacted: "bg-indigo-100 text-indigo-700",
  resolved: "bg-emerald-100 text-emerald-700",
};

export default function RequestDetailModal({
  request,
  onClose,
  onUpdated,
}: {
  request: any;
  onClose: () => void;
  onUpdated: (id: number, changes: any) => void;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ success: boolean; text: string } | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

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
        setSendStatus({ success: true, text: "Email sent from Coach Plus!" });
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

  const locationParts = [request.country, request.province, request.district, request.sector, request.cell, request.village]
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-3xl max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto bg-white sm:rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 sm:gap-4 bg-white/90 backdrop-blur px-5 sm:px-8 pt-6 sm:pt-8 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className="size-14 sm:size-16 rounded-2xl bg-rose-50 text-[#E91E63] flex items-center justify-center font-bold text-xl sm:text-2xl shrink-0">
              {request.parent_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{request.parent_name}</h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5 truncate">
                  <FiMail className="text-indigo-500 shrink-0" /> <span className="truncate">{request.email}</span>
                </p>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-tighter ${
                    STATUS_STYLES[request.status] || "bg-slate-100 text-slate-600"
                  }`}
                >
                  {request.status}
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
          {/* Contact row */}
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

          <div className="grid sm:grid-cols-2 gap-5 sm:gap-8">
            {/* Request details */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <FiBookOpen /> Request Details
              </h4>
              <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100 h-full">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Program / Grade</p>
                  <p className="text-sm font-bold text-slate-700 break-words">{request.grade || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Courses & Topics</p>
                  <p className="text-sm font-bold text-slate-700 break-words">{request.subjects || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                    <FiClock className="size-3" /> Submitted
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {new Date(request.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                <FiMapPin /> Location
              </h4>
              <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100 h-full">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Address</p>
                  <p className="text-sm font-bold text-slate-700 break-words">
                    {locationParts.length > 0 ? locationParts.join(", ") : "Not specified"}
                  </p>
                </div>
                {request.location && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">City</p>
                    <p className="text-sm font-bold text-slate-700 break-words">{request.location}</p>
                  </div>
                )}
                {request.idPassport && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                      <FiCreditCard className="size-3" /> ID / Passport
                    </p>
                    <p className="text-sm font-bold text-slate-700 break-words">{request.idPassport}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Message/Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FiFileText /> Additional Details
            </h4>
            <div className="bg-slate-50 p-5 sm:p-6 rounded-3xl border border-slate-100">
              <p className="text-sm text-slate-600 leading-relaxed break-words whitespace-pre-line">
                {request.details || "No additional details were provided."}
              </p>
            </div>
          </div>

          {/* Send Message */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-[#E91E63] uppercase tracking-widest flex items-center gap-2">
              <FiSend /> Send an Email to {request.parent_name.split(" ")[0]}
            </h4>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Write a reply to send to ${request.email} directly from Coach Plus...`}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all resize-none"
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  {sendStatus && (
                    <p className={`text-xs font-bold flex items-center gap-1.5 ${sendStatus.success ? "text-emerald-600" : "text-rose-600"}`}>
                      {sendStatus.success ? <FiCheckCircle /> : <FiAlertCircle />}
                      {sendStatus.text}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !message.trim()}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#0f172a] text-white text-sm font-bold hover:bg-[#E91E63] transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? <FiLoader className="size-4 animate-spin" /> : <FiSend className="size-4" />}
                  {sending ? "Sending..." : "Send Email"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-100 px-5 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Update Status</p>
          <div className="flex flex-wrap gap-2">
            {["new", "contacted", "resolved"].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={statusUpdating || status === request.status}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-tight transition-all disabled:cursor-default ${
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
