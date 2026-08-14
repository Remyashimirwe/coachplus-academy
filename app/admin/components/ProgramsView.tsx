"use client";

import { useActionState, useState } from "react";
import {
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiUpload,
  FiImage,
  FiX,
  FiCheck,
  FiLayers,
  FiBookOpen,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import {
  addProgram,
  updateProgram,
  deleteProgram,
  addSubject,
  updateSubject,
  deleteSubject,
  addTopic,
  updateTopic,
  deleteTopic,
} from "@/app/actions/admin";

const inputClasses =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]";

const compactInputClasses =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#E91E63]/20";

function StatusBanner({ state, successMessage }: { state: any; successMessage: string }) {
  if (!state?.error && !state?.success) return null;
  return (
    <div
      className={`rounded-2xl p-4 text-sm font-semibold border ${
        state?.error ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
      }`}
    >
      {state?.error || successMessage}
    </div>
  );
}

/** A drag-and-drop-friendly image picker with a live preview. Replaces the old "paste a URL" inputs everywhere. */
function ImageUploadField({
  name,
  existingImage,
  label = "Image",
  compact = false,
}: {
  name: string;
  existingImage?: string | null;
  label?: string;
  compact?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(existingImage || null);

  const size = compact ? "size-14" : "size-20";

  return (
    <div className="space-y-2">
      {!compact && <label className="text-sm font-bold text-slate-700">{label}</label>}
      <div className="flex items-center gap-4">
        <div
          className={`${size} shrink-0 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center`}
        >
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <FiImage className="text-slate-300" />
          )}
        </div>
        <label className="flex-1 cursor-pointer">
          <input
            type="file"
            name={name}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setPreview(reader.result as string);
              reader.readAsDataURL(file);
            }}
          />
          <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:border-[#E91E63]/40 hover:text-[#E91E63] transition-colors">
            <FiUpload className="size-3.5" /> {existingImage ? "Change Image" : "Upload Image"}
          </span>
        </label>
      </div>
    </div>
  );
}

export default function ProgramsView({ programs }: any) {
  const [addState, addAction, addPending] = useActionState(
    addProgram,
    undefined as undefined | { error?: string; success?: boolean }
  );
  const [editProgramState, editProgramAction, editProgramPending] = useActionState(
    updateProgram,
    undefined as undefined | { error?: string; success?: boolean }
  );

  const [addSubjectState, addSubjectAction, addSubjectPending] = useActionState(
    addSubject,
    undefined as undefined | { error?: string; success?: boolean }
  );
  const [editSubjectState, editSubjectAction, editSubjectPending] = useActionState(
    updateSubject,
    undefined as undefined | { error?: string; success?: boolean }
  );

  const [addTopicState, addTopicAction, addTopicPending] = useActionState(
    addTopic,
    undefined as undefined | { error?: string; success?: boolean }
  );
  const [editTopicState, editTopicAction, editTopicPending] = useActionState(
    updateTopic,
    undefined as undefined | { error?: string; success?: boolean }
  );

  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const selectedProgram = programs.find((p: any) => p.id === selectedProgramId);

  const [editingProgram, setEditingProgram] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
  const [expandedSubjectId, setExpandedSubjectId] = useState<number | null>(null);
  const [showAddSubjectForm, setShowAddSubjectForm] = useState(false);

  const resetSelectionState = () => {
    setEditingProgram(false);
    setEditingSubjectId(null);
    setEditingTopicId(null);
    setExpandedSubjectId(null);
    setShowAddSubjectForm(false);
  };

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
          <section className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200 lg:sticky lg:top-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FiLayers className="text-[#E91E63]" /> Categories
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 lg:mx-0 lg:px-0 lg:pb-0 lg:flex-col lg:overflow-visible lg:gap-2">
              {programs.map((program: any) => (
                <button
                  key={program.id}
                  onClick={() => {
                    setSelectedProgramId(program.id);
                    resetSelectionState();
                  }}
                  className={`w-60 sm:w-64 lg:w-full shrink-0 text-left p-4 rounded-2xl border transition-all flex items-center gap-3 ${
                    selectedProgramId === program.id
                      ? "bg-[#E91E63] border-[#E91E63] text-white shadow-lg shadow-rose-500/20"
                      : "bg-slate-50 border-slate-100 text-slate-700 hover:border-[#E91E63]/30"
                  }`}
                >
                  <div
                    className={`size-10 shrink-0 rounded-xl overflow-hidden border flex items-center justify-center ${
                      selectedProgramId === program.id ? "border-white/30 bg-white/10" : "border-slate-200 bg-white"
                    }`}
                  >
                    {program.image ? (
                      <img src={program.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <FiImage className={selectedProgramId === program.id ? "text-white/70" : "text-slate-300"} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold truncate">{program.title}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                          selectedProgramId === program.id ? "bg-white/20" : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {program.subjects.length}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 truncate ${selectedProgramId === program.id ? "text-white/80" : "text-slate-500"}`}>
                      {program.level}
                    </p>
                  </div>
                </button>
              ))}
              <button
                onClick={() => {
                  setSelectedProgramId(null);
                  resetSelectionState();
                }}
                className={`w-60 sm:w-64 lg:w-full shrink-0 p-4 rounded-2xl border border-dashed transition-all flex items-center justify-center gap-2 font-bold text-sm ${
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
            <StatusBanner state={addState} successMessage="Category successfully created." />
            <StatusBanner state={editProgramState} successMessage="Category successfully updated." />
            <StatusBanner state={addSubjectState} successMessage="Sub-category successfully created." />
            <StatusBanner state={editSubjectState} successMessage="Sub-category successfully updated." />
            <StatusBanner state={addTopicState} successMessage="Subject successfully created." />
            <StatusBanner state={editTopicState} successMessage="Subject successfully updated." />
          </div>

          {!selectedProgramId ? (
            <section className="rounded-3xl bg-white p-5 sm:p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-xl bg-rose-50 text-[#E91E63] flex items-center justify-center shrink-0">
                  <FiPlus className="size-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Create New Category</h2>
              </div>
              <form action={addAction} className="grid gap-6">
                <input type="hidden" name="action" value="add" />
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Category Title</label>
                    <input name="title" required placeholder="e.g. Academic Excellence" className={inputClasses} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Tagline/Level</label>
                    <input name="level" required placeholder="e.g. Primary & Secondary" className={inputClasses} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Description</label>
                  <textarea name="text" rows={3} required placeholder="What is this category about?" className={`${inputClasses} resize-none`} />
                </div>
                <ImageUploadField name="image" label="Category Image" />
                <button
                  type="submit"
                  disabled={addPending}
                  className="mt-2 inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-[#E91E63] text-base font-bold text-white shadow-xl shadow-rose-500/20 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                >
                  <FiPlus className="size-5" />
                  {addPending ? "Creating..." : "Create Category"}
                </button>
              </form>
            </section>
          ) : (
            <div className="space-y-6">
              <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200">
                {editingProgram ? (
                  <form
                    action={editProgramAction}
                    className="grid gap-6"
                    onSubmit={() => setEditingProgram(false)}
                  >
                    <input type="hidden" name="id" value={selectedProgram?.id} />
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Category Title</label>
                        <input name="title" required defaultValue={selectedProgram?.title} className={inputClasses} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Tagline/Level</label>
                        <input name="level" required defaultValue={selectedProgram?.level} className={inputClasses} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Description</label>
                      <textarea name="text" rows={3} required defaultValue={selectedProgram?.text} className={`${inputClasses} resize-none`} />
                    </div>
                    <ImageUploadField name="image" existingImage={selectedProgram?.image} label="Category Image" />
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <button
                        type="submit"
                        disabled={editProgramPending}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#E91E63] px-6 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                      >
                        <FiCheck /> {editProgramPending ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingProgram(false)}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 text-sm font-bold text-slate-600 transition-all hover:bg-slate-200"
                      >
                        <FiX /> Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="size-12 sm:size-14 shrink-0 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                        {selectedProgram?.image ? (
                          <img src={selectedProgram.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <FiImage className="text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{selectedProgram?.title}</h2>
                        <p className="text-sm text-slate-500 truncate">{selectedProgram?.level}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <button
                        onClick={() => setEditingProgram(true)}
                        className="p-2.5 sm:p-3 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-[#E91E63] transition-colors"
                      >
                        <FiEdit2 className="size-5" />
                      </button>
                      <form action={deleteProgram}>
                        <input type="hidden" name="id" value={selectedProgram?.id} />
                        <button type="submit" className="p-2.5 sm:p-3 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                          <FiTrash2 className="size-5" />
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-4">
                {selectedProgram?.subjects.map((subject: any) => {
                  const isExpanded = expandedSubjectId === subject.id;
                  return (
                    <div key={subject.id} className="rounded-3xl bg-white shadow-sm border border-slate-200 overflow-hidden">
                      <div className="p-4 sm:p-6 bg-slate-50/50 border-b border-slate-100">
                        {editingSubjectId === subject.id ? (
                          <form
                            action={editSubjectAction}
                            className="grid gap-4"
                            onSubmit={() => setEditingSubjectId(null)}
                          >
                            <input type="hidden" name="id" value={subject.id} />
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                              <input name="name" required defaultValue={subject.name} className={`${compactInputClasses} flex-1`} />
                              <ImageUploadField name="image" existingImage={subject.image} compact />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="submit"
                                disabled={editSubjectPending}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#E91E63] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#c81854] disabled:opacity-50"
                              >
                                <FiCheck className="size-3.5" /> {editSubjectPending ? "Saving..." : "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSubjectId(null)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200"
                              >
                                <FiX className="size-3.5" /> Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedSubjectId(isExpanded ? null : subject.id)}
                              className="flex flex-1 min-w-0 items-center gap-3 sm:gap-4 text-left"
                            >
                              <div className="size-10 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                                {subject.image ? (
                                  <img src={subject.image} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <FiImage className="text-slate-300 size-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-800 truncate">{subject.name}</h3>
                                <p className="text-xs text-slate-400">
                                  {subject.topics.length} subject{subject.topics.length === 1 ? "" : "s"}
                                </p>
                              </div>
                              {isExpanded ? (
                                <FiChevronUp className="size-4 text-slate-400 shrink-0" />
                              ) : (
                                <FiChevronDown className="size-4 text-slate-400 shrink-0" />
                              )}
                            </button>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingSubjectId(subject.id);
                                  setExpandedSubjectId(subject.id);
                                }}
                                className="p-2 rounded-lg text-slate-400 hover:bg-white hover:text-[#E91E63] transition-colors"
                              >
                                <FiEdit2 className="size-4" />
                              </button>
                              <form action={deleteSubject}>
                                <input type="hidden" name="id" value={subject.id} />
                                <button type="submit" className="p-2 rounded-lg text-slate-400 hover:bg-white hover:text-rose-500 transition-colors">
                                  <FiTrash2 className="size-4" />
                                </button>
                              </form>
                            </div>
                          </div>
                        )}
                      </div>
                      {isExpanded && editingSubjectId !== subject.id && (
                        <div className="p-4 sm:p-6 space-y-4">
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {subject.topics.map((topic: any) =>
                              editingTopicId === topic.id ? (
                                <form
                                  key={topic.id}
                                  action={editTopicAction}
                                  className="col-span-full flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-[#E91E63]/30"
                                  onSubmit={() => setEditingTopicId(null)}
                                >
                                  <input type="hidden" name="id" value={topic.id} />
                                  <ImageUploadField name="image" existingImage={topic.image} compact />
                                  <input name="name" required defaultValue={topic.name} className={`${compactInputClasses} flex-1`} />
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      type="submit"
                                      disabled={editTopicPending}
                                      className="size-9 flex items-center justify-center rounded-lg bg-[#E91E63] text-white hover:bg-[#c81854] transition-colors disabled:opacity-50"
                                    >
                                      <FiCheck className="size-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingTopicId(null)}
                                      className="size-9 flex items-center justify-center rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
                                    >
                                      <FiX className="size-4" />
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <div
                                  key={topic.id}
                                  className="group relative flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 transition-all hover:bg-white hover:border-[#E91E63]/30"
                                >
                                  <div className="size-10 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                                    {topic.image ? (
                                      <img src={topic.image} alt={topic.name} className="h-full w-full object-cover" />
                                    ) : (
                                      <FiImage className="text-slate-300 size-4" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-700 truncate">{topic.name}</p>
                                  </div>
                                  <button
                                    onClick={() => setEditingTopicId(topic.id)}
                                    className="size-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-[#E91E63] hover:bg-rose-50 transition-all"
                                  >
                                    <FiEdit2 className="size-3.5" />
                                  </button>
                                  <form action={deleteTopic}>
                                    <input type="hidden" name="id" value={topic.id} />
                                    <button type="submit" className="size-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
                                      <FiTrash2 className="size-3.5" />
                                    </button>
                                  </form>
                                </div>
                              )
                            )}
                            {subject.topics.length === 0 && (
                              <div className="col-span-full py-4 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                <p className="text-xs text-slate-400 italic">No subjects added yet.</p>
                              </div>
                            )}
                          </div>

                          <form action={addTopicAction} className="grid gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                            <input type="hidden" name="subjectId" value={subject.id} />
                            <ImageUploadField name="image" compact />
                            <input
                              name="name"
                              required
                              placeholder="Subject name (e.g. Algebra)"
                              className={compactInputClasses}
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
                      )}
                    </div>
                  );
                })}
                {selectedProgram?.subjects.length === 0 && (
                  <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white py-8 text-center">
                    <p className="text-sm text-slate-400 italic">No sub-categories added yet.</p>
                  </div>
                )}
              </div>

              {!showAddSubjectForm ? (
                <button
                  type="button"
                  onClick={() => setShowAddSubjectForm(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-200 bg-white py-5 text-sm font-bold text-slate-400 hover:border-[#E91E63]/40 hover:text-[#E91E63] transition-all"
                >
                  <FiPlus /> Add Sub-category to {selectedProgram?.title}
                </button>
              ) : (
                <section className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 min-w-0">
                      <FiBookOpen className="shrink-0" /> <span className="truncate">Add Sub-category to {selectedProgram?.title}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddSubjectForm(false)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
                    >
                      <FiX className="size-4" />
                    </button>
                  </div>
                  <form
                    action={addSubjectAction}
                    className="grid gap-4"
                    onSubmit={() => setShowAddSubjectForm(false)}
                  >
                    <input type="hidden" name="programId" value={selectedProgram?.id} />
                    <input
                      name="name"
                      required
                      placeholder="Sub-category name (e.g. Mathematics)"
                      className={`${inputClasses} py-3`}
                    />
                    <ImageUploadField name="image" label="Sub-category Image" />
                    <button
                      type="submit"
                      disabled={addSubjectPending}
                      className="w-full py-3 rounded-2xl bg-[#E91E63] text-white text-sm font-bold shadow-lg shadow-rose-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                    >
                      {addSubjectPending ? "Creating..." : "Create Sub-category"}
                    </button>
                  </form>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
