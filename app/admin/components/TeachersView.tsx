"use client";

import { FiMail, FiPhone, FiLinkedin, FiMapPin, FiAward, FiBookOpen, FiClock, FiCalendar, FiGlobe, FiFileText, FiMessageSquare, FiStar, FiTarget, FiInstagram, FiYoutube, FiLink } from "react-icons/fi";
import { useState } from "react";

export default function TeachersView({ teacherApplications }: any) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-2xl font-bold text-slate-900">Teacher Applications</h1>
      <div className="grid gap-6">
        {teacherApplications.map((app: any) => (
          <div key={app.id} className="rounded-[32px] bg-white p-8 shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="size-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-2xl shrink-0">
                  {app.photoUrl ? (
                    <img src={app.photoUrl} alt="" className="size-full object-cover rounded-2xl" />
                  ) : (
                    app.fullName.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{app.fullName}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5">
                      <FiClock className="text-indigo-500" /> {app.experienceYears} Years
                    </p>
                    <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5">
                      <FiMapPin className="text-rose-500" /> {app.city}, {app.country} {app.location ? `(${app.location})` : ""}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Status</span>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full uppercase tracking-tighter ${
                    app.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {app.status}
                  </span>
                </div>
                <div className="flex gap-2">
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
                  <button 
                    onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                    className="px-5 py-3 rounded-2xl bg-[#0f172a] text-white text-sm font-bold hover:bg-[#E91E63] transition-all shadow-lg shadow-slate-200"
                  >
                    {expandedId === app.id ? "Hide Details" : "View Details"}
                  </button>
                </div>
              </div>
            </div>

            {expandedId === app.id && (
              <div className="mt-8 pt-8 border-t border-slate-100 grid gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Education & Experience */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                      <FiAward /> Education & Experience
                    </h4>
                    <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Education</p>
                        <p className="text-sm font-bold text-slate-700">{app.educationLevel} in {app.fieldOfStudy}</p>
                        <p className="text-xs text-slate-500">{app.institution} ({app.graduationYear})</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Teaching Subjects</p>
                        <p className="text-sm font-bold text-slate-700">{app.subjects}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Target Grades</p>
                        <p className="text-sm font-bold text-slate-700">{app.grades}</p>
                      </div>
                    </div>
                  </div>

                  {/* Skills & Methods */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                      <FiStar /> Teaching Skills
                    </h4>
                    <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Methods</p>
                        <p className="text-xs text-slate-600 line-clamp-3" title={app.methods}>{app.methods}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Online Teaching</p>
                        <p className="text-sm font-bold text-slate-700">{app.teachOnline}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Tech Tools</p>
                        <p className="text-xs text-slate-600">{app.techTools || "None specified"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                      <FiCalendar /> Availability
                    </h4>
                    <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Type</p>
                        <p className="text-sm font-bold text-slate-700">{app.employmentType}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Schedule</p>
                        <p className="text-xs text-slate-600">{app.availableDays}</p>
                        <p className="text-xs text-slate-600">{app.availableHours}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Start Date</p>
                        <p className="text-sm font-bold text-slate-700">{app.startDate}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Detailed Q&A */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <FiMessageSquare /> Motivation & Experience Description
                    </h4>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase mb-1">Teaching Experience</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{app.expDescription}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase mb-1">Why Coach Plus?</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{app.whyTeach}</p>
                      </div>
                    </div>
                  </div>

                  {/* Handling Students & Contribution */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <FiTarget /> Handling Students & Contribution
                    </h4>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-rose-500 uppercase mb-1">Difficult Students</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{app.difficultStudents}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-rose-500 uppercase mb-1">Contribution</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{app.contribution}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents / Files Placeholder */}
                <div className="pt-4 flex flex-wrap gap-4">
                   <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-slate-500">
                     <FiFileText /> <span className="text-xs font-bold uppercase tracking-tight">CV/Resume Attached</span>
                   </div>
                   <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-slate-500">
                     <FiFileText /> <span className="text-xs font-bold uppercase tracking-tight">Cover Letter Attached</span>
                   </div>
                   {app.academicCertificatesUrl && (
                     <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                       <FiAward /> <span className="text-xs font-bold uppercase tracking-tight">Certificates Uploaded</span>
                     </div>
                   )}
                </div>
              </div>
            )}
          </div>
        ))}
        {teacherApplications.length === 0 && (
          <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-medium italic">No applications found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
