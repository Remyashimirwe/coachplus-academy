"use client";

import { FiMail, FiPhone } from "react-icons/fi";

export default function TeachersView({ teacherApplications }: any) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-2xl font-bold text-slate-900">Teacher Applications</h1>
      <div className="grid gap-6">
        {teacherApplications.map((app: any) => (
          <div key={app.id} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl">
                {app.fullName.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{app.fullName}</h3>
                <p className="text-sm font-semibold text-slate-500">{app.experience} of experience • {app.subjects}</p>
                <div className="flex gap-4 mt-2">
                  {app.idPassportUrl && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">ID Uploaded</span>
                  )}
                  {app.photoUrl && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Photo Uploaded</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end mr-4">
                <span className="text-xs font-bold text-slate-400 uppercase">Application Status</span>
                <span className="text-sm font-bold text-amber-600">{app.status}</span>
              </div>
              <div className="flex gap-2">
                 <a href={`mailto:${app.email}`} className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                  <FiMail className="size-5" />
                </a>
                <a href={`tel:${app.phone}`} className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                  <FiPhone className="size-5" />
                </a>
              </div>
            </div>
          </div>
        ))}
        {teacherApplications.length === 0 && <p className="text-sm text-slate-400 italic">No applications found.</p>}
      </div>
    </div>
  );
}
