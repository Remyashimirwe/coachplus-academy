"use client";

import { FiMail, FiPhone } from "react-icons/fi";

export default function RequestsView({ requests }: any) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-2xl font-bold text-slate-900">Teacher Requests</h1>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {requests.map((request: any) => (
          <div key={request.id} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-rose-50 text-[#E91E63] flex items-center justify-center font-bold text-lg">
                  {request.parent_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{request.parent_name}</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{request.grade}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${request.status === 'new' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {request.status}
              </span>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 text-xs text-slate-600 border border-slate-100 font-medium leading-relaxed">
                {request.details}
              </div>
              {(request.country || request.location) && (
                <div className="px-4 py-3 rounded-2xl bg-indigo-50/50 text-[10px] text-indigo-700 border border-indigo-100 font-medium space-y-1">
                  <p className="font-bold text-indigo-900 uppercase tracking-wider mb-1">📍 Location</p>
                  {request.country && <span>{request.country}</span>}
                  {request.country && request.location && <span> • </span>}
                  {request.location && <span>{request.location}</span>}
                </div>
              )}
              <div className="p-4 rounded-2xl bg-rose-50/30 border border-rose-100">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Courses & Topics</p>
                <p className="text-xs font-bold text-slate-700 leading-relaxed">{request.subjects}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <a href={`mailto:${request.email}`} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                  <FiMail className="size-4" />
                  <span className="text-xs font-bold">Email</span>
                </a>
                <a href={`tel:${request.phone}`} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                  <FiPhone className="size-4" />
                  <span className="text-xs font-bold">Call 1</span>
                </a>
                {request.phone2 && (
                  <a href={`tel:${request.phone2}`} className="col-span-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                    <FiPhone className="size-4" />
                    <span className="text-xs font-bold">Call 2: {request.phone2}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
        {requests.length === 0 && <p className="text-sm text-slate-400 italic">No teacher requests found.</p>}
      </div>
    </div>
  );
}
