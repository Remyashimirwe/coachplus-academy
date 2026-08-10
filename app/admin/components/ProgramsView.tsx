"use client";

import { useActionState, useState } from "react";
import { FiPlus, FiTrash2, FiBook } from "react-icons/fi";
import {
  addProgram,
  deleteProgram,
  addSubject,
  deleteSubject,
  addTopic,
  deleteTopic,
} from "@/app/actions/admin";

export default function ProgramsView({ programs }: any) {
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

  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const selectedProgram = programs.find((p: any) => p.id === selectedProgramId);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Learning Content</h1>
          <p className="text-slate-500">Organize Categories, Sub-categories, and Subjects for your students.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Categories</h2>
            <div className="space-y-2">
              {programs.map((program: any) => (
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

        <div className="space-y-6">
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

              <div className="grid gap-6">
                {selectedProgram?.subjects.map((subject: any) => (
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
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {subject.topics.map((topic: any) => (
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
}
