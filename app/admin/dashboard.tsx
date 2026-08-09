"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  FiPlus,
  FiTrash2,
  FiLogOut,
  FiHome,
  FiMail,
  FiPhone,
  FiGrid,
  FiBook,
  FiUsers,
  FiMessageSquare,
  FiMenu,
  FiX,
  FiSearch,
  FiBell,
  FiSettings,
  FiTrendingUp,
  FiActivity,
  FiCalendar,
} from "react-icons/fi";
import { logout } from "@/app/actions/auth";
import {
  addProgram,
  deleteProgram,
  addSubject,
  deleteSubject,
  addTopic,
  deleteTopic,
  updateRequestStatus,
} from "@/app/actions/admin";

export default function AdminDashboard({
  programs,
  requests,
  teacherApplications = [],
}: {
  programs: { 
    id: number; 
    title: string; 
    level: string; 
    text: string; 
    subjects: { 
      id: number; 
      name: string;
      image: string | null;
      topics: { id: number; name: string; image: string | null }[];
    }[] 
  }[];
  requests: {
    id: number;
    parent_name: string;
    email: string;
    phone: string;
    grade: string;
    subjects: string;
    details: string;
    status: string;
    created_at: string;
  }[];
  teacherApplications?: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    subjects: string;
    experience: string;
    resumeUrl: string | null;
    status: string;
    created_at: string;
  }[];
}) {
  const [addState, addAction, addPending] = useActionState(
    addProgram,
    undefined as undefined | { error?: string; success?: boolean }
  );

  const [addSubjectState, addSubjectAction, addSubjectPending] = useActionState(
    addSubject,
    undefined as undefined | { error?: string; success?: boolean }
  );

  const [addTopicState, addTopicAction, addTopicPending] = useActionState(
    addTopic,
    undefined as undefined | { error?: string; success?: boolean }
  );

  const [activeTab, setActiveTab] = useState<"overview" | "programs" | "requests" | "teachers" | "settings">("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);

  const navItems = [
    { id: "overview", label: "Overview", icon: FiGrid },
    { id: "programs", label: "Manage Learning", icon: FiBook },
    { id: "requests", label: "Teacher Requests", icon: FiMessageSquare },
    { id: "teachers", label: "Teacher Applications", icon: FiUsers },
    { id: "settings", label: "Settings", icon: FiSettings },
  ];

  const selectedProgram = programs.find(p => p.id === selectedProgramId);

  const programsContent = (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Learning Content</h1>
          <p className="text-slate-500">Organize Categories, Sub-categories, and Subjects for your students.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
        {/* Left Column: Category Selection & Management */}
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Categories</h2>
            <div className="space-y-2">
              {programs.map((program) => (
                <button
                  key={program.id}
                  onClick={() => setSelectedProgramId(program.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedProgramId === program.id
                      ? "bg-[#E91E63] border-[#E91E63] text-white shadow-lg shadow-rose-500/20"
                      : "bg-slate-50 border-slate-100 text-slate-700 hover:border-[#E91E63]/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{program.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      selectedProgramId === program.id ? "bg-white/20" : "bg-slate-200 text-slate-500"
                    }`}>
                      {program.subjects.length}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${selectedProgramId === program.id ? "text-white/80" : "text-slate-500"}`}>
                    {program.level}
                  </p>
                </button>
              ))}
              <button
                onClick={() => setSelectedProgramId(null)}
                className={`w-full p-4 rounded-2xl border border-dashed transition-all flex items-center justify-center gap-2 font-bold text-sm ${
                  selectedProgramId === null
                    ? "bg-slate-100 border-slate-300 text-slate-900"
                    : "bg-white border-slate-200 text-slate-400 hover:border-[#E91E63]/30 hover:text-[#E91E63]"
                }`}
              >
                <FiPlus /> Add New Category
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Dynamic Content */}
        <div className="space-y-6">
          {/* Status Messages */}
          <div className="space-y-4">
            {(addState?.error || addState?.success) && (
              <div className={`rounded-2xl p-4 text-sm font-semibold border ${
                addState?.error ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
              }`}>
                {addState?.error || "Category successfully updated."}
              </div>
            )}
            {(addSubjectState?.error || addSubjectState?.success) && (
              <div className={`rounded-2xl p-4 text-sm font-semibold border ${
                addSubjectState?.error ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
              }`}>
                {addSubjectState?.error || "Sub-category successfully updated."}
              </div>
            )}
            {(addTopicState?.error || addTopicState?.success) && (
              <div className={`rounded-2xl p-4 text-sm font-semibold border ${
                addTopicState?.error ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
              }`}>
                {addTopicState?.error || "Subject successfully updated."}
              </div>
            )}
          </div>

          {!selectedProgramId ? (
            <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-xl bg-rose-50 text-[#E91E63] flex items-center justify-center">
                  <FiPlus className="size-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Create New Category</h2>
              </div>
              <form action={addAction} className="grid gap-6">
                <input type="hidden" name="action" value="add" />
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Category Title</label>
                    <input name="title" required placeholder="e.g. Academic Excellence" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Tagline/Level</label>
                    <input name="level" required placeholder="e.g. Primary & Secondary" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Description</label>
                  <textarea name="text" rows={3} required placeholder="What is this category about?" className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Image URL</label>
                  <input name="image" placeholder="https://images.unsplash.com/..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]" />
                </div>
                <button type="submit" disabled={addPending} className="mt-2 inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-[#E91E63] text-base font-bold text-white shadow-xl shadow-rose-500/20 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50">
                  <FiPlus className="size-5" />
                  {addPending ? "Creating..." : "Create Category"}
                </button>
              </form>
            </section>
          ) : (
            <div className="space-y-6">
              {/* Selected Category Header */}
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedProgram?.title}</h2>
                  <p className="text-sm text-slate-500">{selectedProgram?.level}</p>
                </div>
                <form action={deleteProgram}>
                  <input type="hidden" name="id" value={selectedProgram?.id} />
                  <button type="submit" className="p-3 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                    <FiTrash2 className="size-5" />
                  </button>
                </form>
              </div>

              {/* Sub-categories Grid */}
              <div className="grid gap-6">
                {selectedProgram?.subjects.map((subject) => (
                  <div key={subject.id} className="rounded-3xl bg-white shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {subject.image && (
                          <img src={subject.image} alt="" className="size-10 rounded-lg object-cover border border-slate-200" />
                        )}
                        <h3 className="font-bold text-slate-800">{subject.name}</h3>
                      </div>
                      <form action={deleteSubject}>
                        <input type="hidden" name="id" value={subject.id} />
                        <button type="submit" className="text-slate-400 hover:text-rose-500 transition-colors">
                          <FiTrash2 className="size-4" />
                        </button>
                      </form>
                    </div>
                    <div className="p-6 space-y-4">
                      {/* Topics */}
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {subject.topics.map((topic) => (
                          <div key={topic.id} className="group relative flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 transition-all hover:bg-white hover:border-[#E91E63]/30">
                            <div className="size-10 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-white">
                              <img 
                                src={topic.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&q=80"} 
                                alt={topic.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-700 truncate">{topic.name}</p>
                            </div>
                            <form action={deleteTopic}>
                              <input type="hidden" name="id" value={topic.id} />
                              <button type="submit" className="size-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
                                <FiTrash2 className="size-3.5" />
                              </button>
                            </form>
                          </div>
                        ))}
                        {subject.topics.length === 0 && (
                          <div className="col-span-full py-4 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                             <p className="text-xs text-slate-400 italic">No subjects added yet.</p>
                          </div>
                        )}
                      </div>

                      {/* Add Topic Form */}
                      <form action={addTopicAction} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                        <input type="hidden" name="subjectId" value={subject.id} />
                        <input 
                          name="name" 
                          required 
                          placeholder="Subject name (e.g. Algebra)" 
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#E91E63]/20" 
                        />
                        <input 
                          name="image" 
                          placeholder="Image URL (optional)" 
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#E91E63]/20" 
                        />
                        <button 
                          type="submit" 
                          disabled={addTopicPending}
                          className="px-6 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-[#E91E63] transition-colors disabled:opacity-50"
                        >
                          Add
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Sub-category Section */}
              <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Add Sub-category to {selectedProgram?.title}</h4>
                <form action={addSubjectAction} className="grid gap-4">
                  <input type="hidden" name="programId" value={selectedProgram?.id} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input 
                      name="name" 
                      required 
                      placeholder="Sub-category name (e.g. Mathematics)" 
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#E91E63]/20" 
                    />
                    <input 
                      name="image" 
                      placeholder="Image URL (optional)" 
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#E91E63]/20" 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={addSubjectPending}
                    className="w-full py-3 rounded-2xl bg-[#E91E63] text-white text-sm font-bold shadow-lg shadow-rose-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                  >
                    Create Sub-category
                  </button>
                </form>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-[#0F172A] text-white transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center gap-3 px-8 border-b border-slate-800">
          <img src="/logo.png" alt="WeCoach" className="size-9 rounded-lg" />
          <span className="text-xl font-bold tracking-tight">WeCoach <span className="text-[#E91E63]">Admin</span></span>
        </div>
        
        <nav className="mt-8 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setSidebarOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all ${
                activeTab === item.id 
                  ? "bg-[#E91E63] text-white shadow-lg shadow-rose-500/20" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="size-5" />
              {item.id === "programs" ? "Manage Learning" : item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-8 w-full px-4">
          <form action={logout}>
            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500">
              <FiLogOut className="size-5" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Topbar */}
        <header className="sticky top-0 z-40 h-20 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <FiMenu className="size-6" />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-slate-500">
              <FiSearch className="size-4" />
              <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm w-64" />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#E91E63] transition-colors"
            >
              <FiHome className="size-4" />
              Live Site
            </Link>
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <FiBell className="size-5" />
              <span className="absolute top-2 right-2 size-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <div className="size-10 rounded-full bg-gradient-to-tr from-[#FF5733] to-[#E91E63] border-2 border-white shadow-sm" />
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {activeTab === "overview" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
                <p className="text-slate-500">Welcome back, Admin! Here's what's happening today.</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Categories", value: programs.length, icon: FiBook, color: "bg-blue-500" },
                  { label: "Teacher Requests", value: requests.length, icon: FiMessageSquare, color: "bg-rose-500" },
                  { label: "Applications", value: teacherApplications.length, icon: FiUsers, color: "bg-indigo-500" },
                  { label: "Active Sub-categories", value: programs.reduce((acc, p) => acc + p.subjects.length, 0), icon: FiActivity, color: "bg-emerald-500" },
                ].map((stat, i) => (
                  <div key={i} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`size-12 rounded-2xl ${stat.color} text-white flex items-center justify-center shadow-lg shadow-inherit/20`}>
                        <stat.icon className="size-6" />
                      </div>
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                        <FiTrendingUp className="size-3" />
                        +12%
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</h3>
                      <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Teacher Requests</h2>
                  <div className="space-y-4">
                    {requests.slice(0, 5).map((req) => (
                      <div key={req.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-white flex items-center justify-center font-bold text-rose-500 shadow-sm">
                            {req.parent_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{req.parent_name}</p>
                            <p className="text-xs text-slate-500">{req.grade} • {new Date(req.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-600 px-2 py-1 rounded-lg">
                          {req.status}
                        </span>
                      </div>
                    ))}
                    {requests.length === 0 && <p className="text-sm text-slate-400 italic">No recent requests.</p>}
                  </div>
                </section>

                <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">System Activity</h2>
                  <div className="space-y-6">
                    {[
                      { label: "New Program Added", time: "2 hours ago", icon: FiPlus, color: "text-blue-500" },
                      { label: "Teacher Application Received", time: "5 hours ago", icon: FiUsers, color: "text-indigo-500" },
                      { label: "Database Backup Completed", time: "Yesterday", icon: FiActivity, color: "text-emerald-500" },
                      { label: "New Parent Request", time: "2 days ago", icon: FiMessageSquare, color: "text-rose-500" },
                    ].map((activity, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="relative">
                          <div className={`size-10 rounded-xl bg-slate-50 ${activity.color} flex items-center justify-center z-10 relative`}>
                            <activity.icon className="size-5" />
                          </div>
                          {i !== 3 && <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-8 bg-slate-100" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{activity.label}</p>
                          <p className="text-xs text-slate-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {activeTab === "programs" && programsContent}

          {activeTab === "requests" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-2xl font-bold text-slate-900">Teacher Requests</h1>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {requests.map((request) => (
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
                      <div className="p-4 rounded-2xl bg-slate-50 text-sm text-slate-600 border border-slate-100">
                        {request.details}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <a href={`mailto:${request.email}`} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                          <FiMail className="size-4" />
                          <span className="text-xs font-bold">Email</span>
                        </a>
                        <a href={`tel:${request.phone}`} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                          <FiPhone className="size-4" />
                          <span className="text-xs font-bold">Call</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "teachers" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-2xl font-bold text-slate-900">Teacher Applications</h1>
              <div className="grid gap-6">
                {teacherApplications.map((app) => (
                  <div key={app.id} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="size-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl">
                        {app.fullName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{app.fullName}</h3>
                        <p className="text-sm font-semibold text-slate-500">{app.experience} of experience • {app.subjects}</p>
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
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Admin Settings</h1>
                <p className="text-slate-500">Configure your dashboard and system preferences.</p>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">Account Settings</h2>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Admin Email</label>
                      <input disabled value="admin@wecoach.com" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none opacity-60" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Change Password</label>
                      <input type="password" placeholder="••••••••" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]" />
                    </div>
                    <button className="inline-flex h-[56px] items-center justify-center rounded-2xl bg-[#0F172A] px-8 text-base font-bold text-white transition-all hover:-translate-y-1 active:scale-95">
                      Update Profile
                    </button>
                  </div>
                </section>

                <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">System Configuration</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div>
                        <p className="text-sm font-bold text-slate-900">Email Notifications</p>
                        <p className="text-xs text-slate-500">Receive alerts for new teacher requests.</p>
                      </div>
                      <div className="w-12 h-6 bg-[#E91E63] rounded-full relative">
                        <div className="absolute right-1 top-1 size-4 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div>
                        <p className="text-sm font-bold text-slate-900">Maintenance Mode</p>
                        <p className="text-xs text-slate-500">Temporarily disable the public request form.</p>
                      </div>
                      <div className="w-12 h-6 bg-slate-300 rounded-full relative">
                        <div className="absolute left-1 top-1 size-4 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">Developer Mode</p>
                      <p className="text-[10px] text-amber-600">Advanced settings for database and API management.</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
