"use client";

import { useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiFileText,
  FiPlus,
  FiSave,
  FiTrash2,
} from "react-icons/fi";
import { saveTeacherTermsAction } from "@/app/actions/admin";
import {
  cloneTeacherTerms,
  type TeacherTerms,
  type TeacherTermsSection,
} from "@/app/lib/teacherTerms";

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/10";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

export default function TermsEditor({
  initialTerms,
}: {
  initialTerms: TeacherTerms;
}) {
  const [terms, setTerms] = useState<TeacherTerms>(() =>
    cloneTeacherTerms(initialTerms)
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof TeacherTerms,>(
    key: K,
    value: TeacherTerms[K]
  ) => {
    setSaved(false);
    setTerms((current) => ({ ...current, [key]: value }));
  };

  const updateSection = (
    index: number,
    patch: Partial<TeacherTermsSection>
  ) => {
    setSaved(false);
    setTerms((current) => ({
      ...current,
      sections: current.sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, ...patch } : section
      ),
    }));
  };

  const addSection = () => {
    setSaved(false);
    setTerms((current) => ({
      ...current,
      sections: [...current.sections, { title: "", points: [""] }],
    }));
  };

  const removeSection = (index: number) => {
    if (terms.sections.length <= 1) return;
    setSaved(false);
    setTerms((current) => ({
      ...current,
      sections: current.sections.filter((_, i) => i !== index),
    }));
  };

  const addPoint = (index: number) => {
    setSaved(false);
    updateSection(index, { points: [...terms.sections[index].points, ""] });
  };

  const removePoint = (sectionIndex: number, pointIndex: number) => {
    setSaved(false);
    updateSection(sectionIndex, {
      points: terms.sections[sectionIndex].points.filter(
        (_, i) => i !== pointIndex
      ),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const result = await saveTeacherTermsAction(terms);
      if (result.success) {
        setSaved(true);
      } else {
        setError(result.error ?? "Could not save the agreement. Please try again.");
      }
    } catch {
      setError("Could not save the agreement. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900 sm:text-xl">
            <FiFileText className="size-5 text-[#E91E63]" />
            Terms &amp; Agreement
          </h1>
          <p className="mt-1 text-slate-500">
            Edit the Teacher Partner terms shown on the public application form
            and in the mobile app.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#E91E63] px-5 py-3 text-[13px] font-semibold text-white shadow-lg shadow-rose-200 transition-all hover:bg-[#c2185b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiSave className="size-4" />
          {saving ? "Saving..." : "Save agreement"}
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[12px] font-medium text-emerald-700">
          <FiCheckCircle className="size-4 shrink-0" />
          Agreement saved. The website and mobile app will show the new content.
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-[12px] font-medium text-rose-700">
          <FiAlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="mb-5 text-base font-semibold text-slate-900">
          Header
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Modal title">
            <input
              className={inputClass}
              value={terms.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="Teacher Partner Terms & Conditions"
            />
          </Field>
          <Field label="Small subtitle">
            <input
              className={inputClass}
              value={terms.subtitle}
              onChange={(event) => update("subtitle", event.target.value)}
              placeholder="COACHPLUS ACADEMY"
            />
          </Field>
          <div className="lg:col-span-2">
            <Field
              label="Mobile header notice"
              hint="Shown under the title in the Flutter application."
            >
              <input
                className={inputClass}
                value={terms.notice}
                onChange={(event) => update("notice", event.target.value)}
                placeholder="Please review our partnership policies carefully"
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Sections</h2>
            <p className="mt-1 text-[12px] text-slate-500">
              Each point is shown as a bullet. Keep one point per line.
            </p>
          </div>
          <button
            onClick={addSection}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#E91E63]/20 bg-[#E91E63]/5 px-3 py-2 text-[12px] font-semibold text-[#E91E63] transition-colors hover:bg-[#E91E63]/10"
          >
            <FiPlus className="size-4" /> Add section
          </button>
        </div>

        <div className="space-y-5">
          {terms.sections.map((section, sectionIndex) => (
            <div
              key={sectionIndex}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="inline-flex size-8 items-center justify-center rounded-xl bg-[#E91E63]/10 text-[12px] font-bold text-[#E91E63]">
                  {sectionIndex + 1}
                </span>
                <button
                  onClick={() => removeSection(sectionIndex)}
                  disabled={terms.sections.length <= 1}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiTrash2 className="size-3.5" /> Remove
                </button>
              </div>

              <Field label="Section title">
                <input
                  className={inputClass}
                  value={section.title}
                  onChange={(event) =>
                    updateSection(sectionIndex, { title: event.target.value })
                  }
                  placeholder="TEACHING STANDARDS & CONDUCT"
                />
              </Field>

              <div className="mt-3">
                <Field label="Points" hint="One bullet per line.">
                  <textarea
                    className={`${inputClass} min-h-36 resize-y leading-relaxed`}
                    value={section.points.join("\n")}
                    onChange={(event) =>
                      updateSection(sectionIndex, {
                        points: event.target.value.split("\n"),
                      })
                    }
                    placeholder={
                      "Lesson Preparation: Prepare every lesson well.\nZero Misconduct: Be professional at all times."
                    }
                  />
                </Field>
                <button
                  onClick={() => addPoint(sectionIndex)}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#E91E63] hover:text-[#7B1FA2]"
                >
                  <FiPlus className="size-3.5" /> Add point
                </button>
                {section.points.length > 1 && (
                  <button
                    onClick={() => removePoint(sectionIndex, section.points.length - 1)}
                    className="ml-4 mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-rose-600"
                  >
                    <FiTrash2 className="size-3.5" /> Remove last point
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="mb-5 text-base font-semibold text-slate-900">
          Acknowledgment
        </h2>
        <div className="space-y-4">
          <Field label="Acknowledgment title">
            <input
              className={inputClass}
              value={terms.acknowledgmentTitle}
              onChange={(event) =>
                update("acknowledgmentTitle", event.target.value)
              }
              placeholder="Acknowledgment & Sign-Off"
            />
          </Field>
          <Field label="Acknowledgment text">
            <textarea
              className={`${inputClass} min-h-24 resize-y leading-relaxed`}
              value={terms.acknowledgment}
              onChange={(event) => update("acknowledgment", event.target.value)}
              placeholder="By checking the agreement box, you confirm that you have read and agreed to these terms."
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end pb-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-6 py-3.5 text-[13px] font-semibold text-white shadow-lg shadow-slate-200 transition-all hover:bg-[#E91E63] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiSave className="size-4" />
          {saving ? "Saving..." : "Save agreement"}
        </button>
      </div>
    </div>
  );
}
