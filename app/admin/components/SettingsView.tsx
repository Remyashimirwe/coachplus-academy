"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toggleTeacherApplications } from "@/app/actions/admin";
import {
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiUsers,
  FiArrowRight,
  FiMail,
  FiPhone,
  FiBookOpen,
  FiClock,
} from "react-icons/fi";

const APPLIED_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

const APPLIED_FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Accepted" },
  { id: "rejected", label: "Rejected" },
];

export default function SettingsView({
  initialSettings,
  teacherApplications = [],
}: {
  initialSettings: { teacherApplicationsOpen: boolean };
  teacherApplications?: any[];
}) {
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(initialSettings.teacherApplicationsOpen);
  const [isUpdating, setIsUpdating] = useState(false);
  const [appliedFilter, setAppliedFilter] = useState("all");

  const filteredApplications = useMemo(() => {
    if (appliedFilter === "all") return teacherApplications;
    return teacherApplications.filter((a) => a.status === appliedFilter);
  }, [teacherApplications, appliedFilter]);

  const handleToggleApplications = async () => {
    setIsUpdating(true);
    try {
      const nextState = !isApplicationsOpen;
      const result = await toggleTeacherApplications(nextState);
      if (result.success) {
        setIsApplicationsOpen(nextState);
      }
    } catch (error) {
      console.error("Failed to toggle applications:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Settings</h1>
        <p className="text-slate-500">Configure your dashboard and system preferences.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Recruitment Settings</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-6 rounded-[32px] bg-slate-50 border border-slate-100">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-slate-900">Teacher Applications</p>
                  {isApplicationsOpen ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      <FiCheckCircle /> OPEN
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                      <FiXCircle /> CLOSED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">Enable or disable the "Become a Teacher" application form.</p>
              </div>
              <button 
                onClick={handleToggleApplications}
                disabled={isUpdating}
                className={`w-14 h-8 rounded-full relative transition-all duration-300 ${isApplicationsOpen ? 'bg-[#E91E63]' : 'bg-slate-300'} ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className={`absolute top-1 size-6 bg-white rounded-full shadow-md transition-all duration-300 ${isApplicationsOpen ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            
            {!isApplicationsOpen && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800">
                <FiAlertCircle className="size-5 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  <strong>Note:</strong> When applications are closed, the form on the "Become a Teacher" page will be replaced with a notification message.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Teacher Management</h2>
          <Link
            href="/admin/teachers"
            className="flex items-center justify-between gap-4 p-6 rounded-[32px] bg-slate-50 border border-slate-100 hover:border-[#E91E63]/30 hover:bg-[#E91E63]/5 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-[#E91E63] text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-200">
                <FiUsers className="size-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">View All Teacher Applications</p>
                <p className="text-xs text-slate-500 mt-1">
                  See every teacher who applied and filter by accepted or rejected.
                </p>
              </div>
            </div>
            <FiArrowRight className="size-5 text-slate-400 shrink-0" />
          </Link>
        </section>
      </div>

      <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">View Applied Teachers</h2>
            <p className="text-sm text-slate-500 mt-1">
              Separate teacher applications by status and review who applied.
            </p>
          </div>
          <Link
            href="/admin/teachers"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E91E63] hover:text-[#7B1FA2] transition-colors"
          >
            Manage all applications <FiArrowRight className="size-4" />
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {APPLIED_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setAppliedFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-tight transition-all ${
                appliedFilter === f.id
                  ? "bg-[#0f172a] text-white shadow-lg shadow-slate-200"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-100 overflow-hidden">
          {filteredApplications.length === 0 ? (
            <div className="p-14 text-center">
              <FiUsers className="size-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 font-medium italic">No {appliedFilter === "all" ? "" : appliedFilter + " "}teacher applications found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Applicant</th>
                    <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Contact</th>
                    <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Branch</th>
                    <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Subjects</th>
                    <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Applied</th>
                    <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Status</th>
                    <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-[#E91E63]/10 text-[#E91E63] flex items-center justify-center font-bold text-sm shrink-0">
                            {app.fullName.charAt(0)}
                          </div>
                          <p className="text-sm font-semibold text-slate-900 truncate max-w-[160px]">{app.fullName}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs text-slate-600 truncate max-w-[200px] flex items-center gap-1.5">
                          <FiMail className="size-3 text-slate-300 shrink-0" /> {app.email}
                        </p>
                        {app.phone && (
                          <p className="text-[11px] text-slate-400 truncate max-w-[200px] flex items-center gap-1.5 mt-0.5">
                            <FiPhone className="size-3 text-slate-300 shrink-0" /> {app.phone}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{app.branch || "—"}</td>
                      <td className="px-5 py-4 text-xs text-slate-500 max-w-[220px] truncate">{app.subjects}</td>
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap flex items-center gap-1.5">
                        <FiClock className="size-3 text-slate-300 shrink-0" />
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-tighter ${
                            APPLIED_STATUS_STYLES[app.status] || "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {app.status === "approved" ? (
                            <FiCheckCircle className="size-3" />
                          ) : app.status === "rejected" ? (
                            <FiXCircle className="size-3" />
                          ) : (
                            <FiClock className="size-3" />
                          )}
                          {app.status === "approved" ? "Accepted" : app.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href="/admin/teachers"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0f172a] text-white text-xs font-bold hover:bg-[#E91E63] transition-all"
                        >
                          Review <FiArrowRight className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
