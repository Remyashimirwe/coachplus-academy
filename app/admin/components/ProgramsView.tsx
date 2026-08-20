"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
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
  FiMove,
  FiStar,
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
  reorderPrograms,
  reorderSubjects,
  reorderTopics,
  toggleProgramFeatured,
} from "@/app/actions/admin";

/** Moves the item with `draggedId` to sit right before/after the item with `targetId`, keeping every other item's relative order untouched. */
function reorderById<T extends { id: number }>(items: T[], draggedId: number, targetId: number): T[] {
  const fromIndex = items.findIndex((item) => item.id === draggedId);
  const toIndex = items.findIndex((item) => item.id === targetId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return items;

  const updated = [...items];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(toIndex, 0, moved);
  return updated;
}

const inputClasses =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]";

const compactInputClasses =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#E91E63]/20";

/** Checkbox styled like a mini switch, used to let admins mark a Category as featured in the homepage Hero slideshow. */
function FeaturedInHeroField({ defaultChecked }: { defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-dashed border-[#E91E63]/30 bg-rose-50/50 px-4 py-3 cursor-pointer select-none">
      <input type="checkbox" name="featuredInHero" defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-slate-300 transition-colors peer-checked:bg-[#E91E63]">
        <span className="inline-block size-4.5 translate-x-1 rounded-full bg-white shadow-md transition-transform peer-checked:translate-x-[22px]" />
      </span>
      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
        <FiStar className="size-3.5 text-[#E91E63]" /> Show in Homepage Slideshow
      </span>
    </label>
  );
}

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
  onFileChange,
}: {
  name: string;
  existingImage?: string | null;
  label?: string;
  compact?: boolean;
  onFileChange?: (file: File | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(existingImage || null);

  const size = compact ? "size-14" : "size-20";

  return (
    <div className="space-y-2">
      {!compact && <label className="text-[13px] font-semibold text-slate-700">{label}</label>}
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
              const file = e.target.files?.[0] || null;
              onFileChange?.(file);
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setPreview(reader.result as string);
              reader.readAsDataURL(file);
            }}
          />
          <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold text-slate-600 hover:border-[#E91E63]/40 hover:text-[#E91E63] transition-colors">
            <FiUpload className="size-3.5" /> {existingImage ? "Change Image" : "Upload Image"}
          </span>
        </label>
      </div>
    </div>
  );
}

type DraftTopic = { tempId: number; name: string; imageFile: File | null };
type DraftSubject = { tempId: number; name: string; imageFile: File | null; topics: DraftTopic[] };

/** Small thumbnail that renders a live preview for a `File` picked in the draft sub-category popup. */
function FilePreviewThumb({ file, size = "size-10" }: { file: File | null; size?: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className={`${size} shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center`}>
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <FiImage className="text-slate-300 size-4" />}
    </div>
  );
}

/**
 * Popup used from the "Create New Category" card so admins can draft a
 * sub-category (and its subjects) inline, without leaving the category form
 * or having to create the category first. Confirmed drafts are held in
 * memory and only actually created once the category itself is submitted.
 */
function AddSubCategoryModal({
  categoryTitle,
  onClose,
  onAdd,
}: {
  categoryTitle?: string;
  onClose: () => void;
  onAdd: (subject: DraftSubject) => void;
}) {
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [topics, setTopics] = useState<DraftTopic[]>([]);
  const [topicName, setTopicName] = useState("");
  const [topicImageFile, setTopicImageFile] = useState<File | null>(null);

  const addTopicDraft = () => {
    const trimmed = topicName.trim();
    if (!trimmed) return;
    setTopics((prev) => [...prev, { tempId: Date.now() + Math.random(), name: trimmed, imageFile: topicImageFile }]);
    setTopicName("");
    setTopicImageFile(null);
  };

  const removeTopicDraft = (tempId: number) => {
    setTopics((prev) => prev.filter((topic) => topic.tempId !== tempId));
  };

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({ tempId: Date.now(), name: trimmed, imageFile, topics });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-base font-semibold text-slate-900">
            Add Sub-category{categoryTitle ? ` to ${categoryTitle}` : ""}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <FiX className="size-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-slate-700">Sub-category Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mathematics"
              className={inputClasses}
            />
          </div>
          <ImageUploadField name="__draft-subject-image" label="Sub-category Image" onFileChange={setImageFile} />

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FiBookOpen /> Subjects in this Sub-category
            </h4>
            {topics.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {topics.map((topic) => (
                  <div key={topic.tempId} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <FilePreviewThumb file={topic.imageFile} size="size-8" />
                    <span className="flex-1 min-w-0 text-[11px] font-semibold text-slate-700 truncate">{topic.name}</span>
                    <button
                      type="button"
                      onClick={() => removeTopicDraft(topic.tempId)}
                      className="p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-white transition-colors"
                    >
                      <FiTrash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <ImageUploadField name="__draft-topic-image" compact onFileChange={setTopicImageFile} />
              <input
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="Subject name (e.g. Algebra)"
                className={`${compactInputClasses} flex-1`}
              />
              <button
                type="button"
                onClick={addTopicDraft}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-[11px] font-semibold hover:bg-[#E91E63] transition-colors shrink-0 inline-flex items-center gap-1.5"
              >
                <FiPlus className="size-3.5" /> Add
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!name.trim()}
              className="flex-1 py-3 rounded-2xl bg-[#E91E63] text-white text-[13px] font-semibold shadow-lg shadow-rose-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              Add Sub-category
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-6 rounded-2xl bg-slate-100 text-[13px] font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
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

  // A locally reorderable copy of `programs`, so drag-and-drop can update the
  // order instantly instead of waiting on the server round-trip. Kept in
  // sync whenever fresh data arrives from the server (e.g. after a save).
  const [localPrograms, setLocalPrograms] = useState<any[]>(programs);
  useEffect(() => {
    setLocalPrograms(programs);
  }, [programs]);

  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const selectedProgram = localPrograms.find((p: any) => p.id === selectedProgramId);

  const [editingProgram, setEditingProgram] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
  const [expandedSubjectId, setExpandedSubjectId] = useState<number | null>(null);
  const [showAddSubjectForm, setShowAddSubjectForm] = useState(false);

  // Drag-and-drop reordering: which item id is currently being dragged, per list.
  const [draggedProgramId, setDraggedProgramId] = useState<number | null>(null);
  const [draggedSubjectId, setDraggedSubjectId] = useState<number | null>(null);
  const [draggedTopicId, setDraggedTopicId] = useState<number | null>(null);

  const handleToggleFeatured = (id: number, nextFeatured: boolean) => {
    setLocalPrograms((prev) => prev.map((p: any) => (p.id === id ? { ...p, featuredInHero: nextFeatured } : p)));
    startTransition(() => {
      toggleProgramFeatured(id, nextFeatured);
    });
  };

  const handleProgramDrop = (targetId: number) => {
    if (draggedProgramId === null || draggedProgramId === targetId) return;
    const reordered = reorderById(localPrograms, draggedProgramId, targetId);
    setLocalPrograms(reordered);
    setDraggedProgramId(null);
    startTransition(() => {
      reorderPrograms(reordered.map((p: any) => p.id));
    });
  };

  const handleSubjectDrop = (targetId: number) => {
    if (draggedSubjectId === null || draggedSubjectId === targetId || !selectedProgram) return;
    const reorderedSubjects = reorderById(selectedProgram.subjects, draggedSubjectId, targetId);
    setLocalPrograms((prev) =>
      prev.map((p: any) => (p.id === selectedProgram.id ? { ...p, subjects: reorderedSubjects } : p))
    );
    setDraggedSubjectId(null);
    startTransition(() => {
      reorderSubjects(reorderedSubjects.map((s: any) => s.id));
    });
  };

  const handleTopicDrop = (subjectId: number, targetId: number) => {
    if (draggedTopicId === null || draggedTopicId === targetId || !selectedProgram) return;
    const subject = selectedProgram.subjects.find((s: any) => s.id === subjectId);
    if (!subject) return;
    const reorderedTopics = reorderById(subject.topics, draggedTopicId, targetId);
    setLocalPrograms((prev) =>
      prev.map((p: any) =>
        p.id === selectedProgram.id
          ? {
              ...p,
              subjects: p.subjects.map((s: any) => (s.id === subjectId ? { ...s, topics: reorderedTopics } : s)),
            }
          : p
      )
    );
    setDraggedTopicId(null);
    startTransition(() => {
      reorderTopics(reorderedTopics.map((t: any) => t.id));
    });
  };

  const resetSelectionState = () => {
    setEditingProgram(false);
    setEditingSubjectId(null);
    setEditingTopicId(null);
    setExpandedSubjectId(null);
    setShowAddSubjectForm(false);
  };

  // Draft sub-categories (with their subjects) added from the popup while
  // creating a new category, so they can be submitted together with it.
  const [draftSubjects, setDraftSubjects] = useState<DraftSubject[]>([]);
  const [showAddSubCategoryModal, setShowAddSubCategoryModal] = useState(false);
  const addFormRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();

  const removeDraftSubject = (tempId: number) => {
    setDraftSubjects((prev) => prev.filter((subject) => subject.tempId !== tempId));
  };

  useEffect(() => {
    if (addState?.success) {
      setDraftSubjects([]);
      addFormRef.current?.reset();
    }
  }, [addState]);

  const handleCreateCategorySubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    draftSubjects.forEach((subject, subjectIndex) => {
      formData.append(`subjects[${subjectIndex}][name]`, subject.name);
      if (subject.imageFile) {
        formData.append(`subjects[${subjectIndex}][image]`, subject.imageFile, subject.imageFile.name);
      }
      subject.topics.forEach((topic, topicIndex) => {
        formData.append(`subjects[${subjectIndex}][topics][${topicIndex}][name]`, topic.name);
        if (topic.imageFile) {
          formData.append(`subjects[${subjectIndex}][topics][${topicIndex}][image]`, topic.imageFile, topic.imageFile.name);
        }
      });
    });
    startTransition(() => {
      addAction(formData);
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900">Manage Learning Content</h1>
          <p className="text-slate-500">Organize Categories, Sub-categories, and Subjects for your students.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="space-y-6 min-w-0">
          <section className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200 lg:sticky lg:top-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FiLayers className="text-[#E91E63]" /> Categories
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 min-w-0 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:gap-3 lg:grid-cols-1 lg:gap-2">
              {localPrograms.map((program: any) => (
                <button
                  key={program.id}
                  draggable
                  onDragStart={() => setDraggedProgramId(program.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleProgramDrop(program.id);
                  }}
                  onDragEnd={() => setDraggedProgramId(null)}
                  onClick={() => {
                    setSelectedProgramId(program.id);
                    resetSelectionState();
                  }}
                  className={`w-64 shrink-0 sm:w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3 cursor-grab active:cursor-grabbing ${
                    draggedProgramId === program.id ? "opacity-50" : ""
                  } ${
                    selectedProgramId === program.id
                      ? "bg-[#E91E63] border-[#E91E63] text-white shadow-lg shadow-rose-500/20"
                      : "bg-slate-50 border-slate-100 text-slate-700 hover:border-[#E91E63]/30"
                  }`}
                >
                  <FiMove
                    className={`shrink-0 size-4 ${selectedProgramId === program.id ? "text-white/60" : "text-slate-300"}`}
                  />
                  <div
                    className={`relative size-10 shrink-0 rounded-xl overflow-hidden border flex items-center justify-center ${
                      selectedProgramId === program.id ? "border-white/30 bg-white/10" : "border-slate-200 bg-white"
                    }`}
                  >
                    {program.image ? (
                      <img src={program.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <FiImage className={selectedProgramId === program.id ? "text-white/70" : "text-slate-300"} />
                    )}
                    {program.featuredInHero && (
                      <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#E91E63] text-white shadow ring-2 ring-white">
                        <FiStar className="size-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold truncate">
                        {program.title}{" "}
                        <span className={`font-medium ${selectedProgramId === program.id ? "text-white/70" : "text-slate-400"}`}>
                          ({program.level})
                        </span>
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                          selectedProgramId === program.id ? "bg-white/20" : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {program.subjects.length}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
              <button
                onClick={() => {
                  setSelectedProgramId(null);
                  resetSelectionState();
                }}
                className={`w-64 shrink-0 sm:w-full p-4 rounded-2xl border border-dashed transition-all flex items-center justify-center gap-2 font-bold text-sm ${
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

        <div className="space-y-6 min-w-0">
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
                <h2 className="text-base sm:text-lg font-semibold text-slate-900">Create New Category</h2>
              </div>
              <form ref={addFormRef} onSubmit={handleCreateCategorySubmit} className="grid gap-6">
                <input type="hidden" name="action" value="add" />
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-slate-700">Category Title</label>
                    <input name="title" required placeholder="e.g. Academic Excellence" className={inputClasses} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-slate-700">Tagline/Level</label>
                    <input name="level" required placeholder="e.g. Primary & Secondary" className={inputClasses} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-slate-700">Description</label>
                  <textarea name="text" rows={3} required placeholder="What is this category about?" className={`${inputClasses} resize-none`} />
                </div>
                <ImageUploadField name="image" label="Category Image" />
                <FeaturedInHeroField />

                <div className="space-y-3 border-t border-slate-100 pt-6">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <FiBookOpen /> Sub-categories & Subjects
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddSubCategoryModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-500 hover:border-[#E91E63]/40 hover:text-[#E91E63] transition-colors"
                    >
                      <FiPlus className="size-3.5" /> Add Sub-category
                    </button>
                  </div>
                  {draftSubjects.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      Optional — you can add sub-categories and their subjects now, or later after creating the category.
                    </p>
                  ) : (
                    <div className="grid gap-2">
                      {draftSubjects.map((subject) => (
                        <div key={subject.tempId} className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                          <FilePreviewThumb file={subject.imageFile} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-slate-800 truncate">{subject.name}</p>
                            {subject.topics.length > 0 ? (
                              <p className="text-xs text-slate-400 truncate">
                                {subject.topics.map((topic) => topic.name).join(", ")}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400 italic">No subjects added yet.</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDraftSubject(subject.tempId)}
                            className="p-2 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-white transition-colors shrink-0"
                          >
                            <FiTrash2 className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={addPending}
                  className="mt-2 inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-[#E91E63] text-base font-bold text-white shadow-xl shadow-rose-500/20 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                >
                  <FiPlus className="size-5" />
                  {addPending ? "Creating..." : "Create Category"}
                </button>
              </form>
              {showAddSubCategoryModal && (
                <AddSubCategoryModal
                  onClose={() => setShowAddSubCategoryModal(false)}
                  onAdd={(subject) => setDraftSubjects((prev) => [...prev, subject])}
                />
              )}
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
                        <label className="text-[13px] font-semibold text-slate-700">Category Title</label>
                        <input name="title" required defaultValue={selectedProgram?.title} className={inputClasses} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[13px] font-semibold text-slate-700">Tagline/Level</label>
                        <input name="level" required defaultValue={selectedProgram?.level} className={inputClasses} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-slate-700">Description</label>
                      <textarea name="text" rows={3} required defaultValue={selectedProgram?.text} className={`${inputClasses} resize-none`} />
                    </div>
                    <ImageUploadField name="image" existingImage={selectedProgram?.image} label="Category Image" />
                    <FeaturedInHeroField defaultChecked={selectedProgram?.featuredInHero} />
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <button
                        type="submit"
                        disabled={editProgramPending}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#E91E63] px-6 text-[13px] font-semibold text-white shadow-lg shadow-rose-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                      >
                        <FiCheck /> {editProgramPending ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingProgram(false)}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 text-[13px] font-semibold text-slate-600 transition-all hover:bg-slate-200"
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
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg sm:text-base sm:text-lg font-semibold text-slate-900 truncate">{selectedProgram?.title}</h2>
                          {selectedProgram?.featuredInHero && (
                            <span className="hidden sm:flex items-center gap-1 shrink-0 text-[10px] font-bold text-[#E91E63] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                              <FiStar className="size-2.5" /> IN SLIDESHOW
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 truncate">{selectedProgram?.level}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(selectedProgram!.id, !selectedProgram?.featuredInHero)}
                        title="Toggle homepage slideshow"
                        className={`w-12 h-7 rounded-full relative transition-all duration-300 ${
                          selectedProgram?.featuredInHero ? "bg-[#E91E63]" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`absolute top-1 size-5 bg-white rounded-full shadow-md transition-all duration-300 ${
                            selectedProgram?.featuredInHero ? "left-6" : "left-1"
                          }`}
                        />
                      </button>
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
                    <div
                      key={subject.id}
                      draggable
                      onDragStart={() => setDraggedSubjectId(subject.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleSubjectDrop(subject.id);
                      }}
                      onDragEnd={() => setDraggedSubjectId(null)}
                      className={`rounded-3xl bg-white shadow-sm border border-slate-200 overflow-hidden cursor-grab active:cursor-grabbing ${
                        draggedSubjectId === subject.id ? "opacity-50" : ""
                      }`}
                    >
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
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#E91E63] px-4 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#c81854] disabled:opacity-50"
                              >
                                <FiCheck className="size-3.5" /> {editSubjectPending ? "Saving..." : "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSubjectId(null)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-200"
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
                              <FiMove className="shrink-0 size-4 text-slate-300" />
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
                                  draggable
                                  onDragStart={() => setDraggedTopicId(topic.id)}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    handleTopicDrop(subject.id, topic.id);
                                  }}
                                  onDragEnd={() => setDraggedTopicId(null)}
                                  className={`group relative flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 transition-all hover:bg-white hover:border-[#E91E63]/30 cursor-grab active:cursor-grabbing ${
                                    draggedTopicId === topic.id ? "opacity-50" : ""
                                  }`}
                                >
                                  <FiMove className="shrink-0 size-3.5 text-slate-300" />
                                  <div className="size-10 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                                    {topic.image ? (
                                      <img src={topic.image} alt={topic.name} className="h-full w-full object-cover" />
                                    ) : (
                                      <FiImage className="text-slate-300 size-4" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-semibold text-slate-700 truncate">{topic.name}</p>
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
                              className="px-6 py-2 rounded-xl bg-slate-800 text-white text-[11px] font-semibold hover:bg-[#E91E63] transition-colors disabled:opacity-50"
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
                  className="w-full flex items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-200 bg-white py-5 text-[13px] font-semibold text-slate-400 hover:border-[#E91E63]/40 hover:text-[#E91E63] transition-all"
                >
                  <FiPlus /> Add Sub-category to {selectedProgram?.title}
                </button>
              ) : (
                <section className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2 min-w-0">
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
                      className="w-full py-3 rounded-2xl bg-[#E91E63] text-white text-[13px] font-semibold shadow-lg shadow-rose-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50"
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
