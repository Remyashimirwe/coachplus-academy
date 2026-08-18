"use client";

import { useState } from "react";
import Link from "next/link";
import { toggleTeacherApplications } from "@/app/actions/admin";
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiUsers, FiArrowRight } from "react-icons/fi";

export default function SettingsView({ initialSettings }: { initialSettings: { teacherApplicationsOpen: boolean } }) {
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(initialSettings.teacherApplicationsOpen);
  const [isUpdating, setIsUpdating] = useState(false);

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
    </div>
  );
}
