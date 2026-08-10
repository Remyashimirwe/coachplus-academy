"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBookOpen,
  FiMessageSquare,
  FiSend,
  FiCheckCircle,
  FiAward,
  FiCalendar,
  FiMapPin,
  FiLayers,
} from "react-icons/fi";
import { saveRequest } from "@/app/actions/request";
import Footer from "../components/Footer";

interface Topic {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
  image: string | null;
  topics: Topic[];
}

interface Program {
  id: number;
  title: string;
  level: string;
  subjects: Subject[];
}

const learningModes = ["Online", "At Home", "Physical Center"];

function Field({
  icon,
  label,
  htmlFor,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-bold text-slate-700 flex items-center gap-2">
        <span className="text-[#E91E63]">{icon}</span>
        {label}
      </label>
      <div className="relative group">
        {children}
      </div>
    </div>
  );
}

const inputClasses =
  "w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 text-base outline-none transition-all placeholder:text-slate-400 focus:border-[#E91E63] focus:bg-white focus:ring-4 focus:ring-[#E91E63]/10";

export default function RequestForm({ programs }: { programs: Program[] }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RequestFormContent programs={programs} />
    </Suspense>
  );
}

function RequestFormContent({ programs }: { programs: Program[] }) {
  const [submitted, setSubmitted] = useState(false);
  const searchParams = useSearchParams();
  const programIdParam = searchParams.get("programId");
  const subjectIdParam = searchParams.get("subjectId");

  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Record<string, string[]>>({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (programIdParam) {
      setSelectedProgramId(programIdParam);
      
      if (subjectIdParam) {
        const program = programs.find(p => p.id.toString() === programIdParam);
        const subject = program?.subjects.find(s => s.id.toString() === subjectIdParam);
        if (subject) {
          setSelectedSubjects([subject.name]);
          setSelectedCourses({ [subject.name]: subject.topics.map(t => t.name) });
        }
      }
    }
    setIsInitialLoad(false);
  }, []);

  const availableSubjects = selectedProgramId === "" 
    ? []
    : programs.find(p => p.id.toString() === selectedProgramId)?.subjects.map(s => s.name) || [];

  const toggleSubCategory = (subCategoryName: string) => {
    setSelectedSubjects(prev => {
      const isSelecting = !prev.includes(subCategoryName);
      
      if (isSelecting) {
        // Find sub-category and its topics
        const subCategory = programs
          .find(p => p.id.toString() === selectedProgramId)
          ?.subjects.find(s => s.name === subCategoryName);
        
        if (subCategory) {
          setSelectedCourses(c => ({
            ...c,
            [subCategoryName]: subCategory.topics.map(t => t.name)
          }));
        }
        return [...prev, subCategoryName];
      } else {
        setSelectedCourses(c => {
          const newCourses = { ...c };
          delete newCourses[subCategoryName];
          return newCourses;
        });
        return prev.filter(s => s !== subCategoryName);
      }
    });
  };

  const toggleTopic = (subCategoryName: string, topicName: string) => {
    setSelectedCourses(prev => {
      const current = prev[subCategoryName] || [];
      const isSelecting = !current.includes(topicName);
      let newTopicsForSubCategory: string[];
      
      if (isSelecting) {
        newTopicsForSubCategory = [...current, topicName];
      } else {
        newTopicsForSubCategory = current.filter(c => c !== topicName);
      }

      // If a topic is selected/deselected, the sub-category must be selected
      if (newTopicsForSubCategory.length > 0 && !selectedSubjects.includes(subCategoryName)) {
        setSelectedSubjects(s => [...s, subCategoryName]);
      } else if (newTopicsForSubCategory.length === 0 && selectedSubjects.includes(subCategoryName)) {
        setSelectedSubjects(s => s.filter(name => name !== subCategoryName));
      }

      return {
        ...prev,
        [subCategoryName]: newTopicsForSubCategory
      };
    });
  };

  const handleSelectAll = () => {
    if (selectedSubjects.length === availableSubjects.length) {
      setSelectedSubjects([]);
      setSelectedCourses({});
    } else {
      setSelectedSubjects([...availableSubjects]);
      const allCourses: Record<string, string[]> = {};
      const program = programs.find(p => p.id.toString() === selectedProgramId);
      program?.subjects.forEach(s => {
        allCourses[s.name] = s.topics.map(t => t.name);
      });
      setSelectedCourses(allCourses);
    }
  };

  useEffect(() => {
    if (!isInitialLoad) {
      setSelectedSubjects([]);
      setSelectedCourses({});
    }
  }, [selectedProgramId]);

  return (
    <main className="min-h-screen bg-slate-50 text-[#121826]">
      <div className="relative overflow-hidden bg-[#0f172a] pt-40 pb-24 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF5733]/20 via-[#E91E63]/20 to-[#7B1FA2]/20" />
        <div className="absolute -left-32 top-24 size-96 rounded-full bg-[#E91E63]/10 blur-3xl" />
        <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-[#7B1FA2]/10 blur-3xl" />
        
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold text-white backdrop-blur-md border border-white/20 mb-6 uppercase tracking-widest">
              Join WeCoach
            </span>
            <h1 className="text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl">
              Request a <span className="text-[#E91E63]">Teacher</span>
            </h1>
            <p className="mt-8 mx-auto max-w-2xl text-xl leading-relaxed text-slate-300">
              Tell us your learning goals and we'll find the perfect match from our network of elite educators.
            </p>
          </motion.div>
        </div>
      </div>

      <section className="relative -mt-12 pb-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-[40px] bg-white p-12 text-center shadow-2xl shadow-slate-200 border border-slate-100"
              >
                <div className="mx-auto flex size-24 items-center justify-center rounded-3xl bg-green-50 text-green-500 mb-8">
                  <FiCheckCircle className="size-12" />
                </div>
                <h2 className="text-4xl font-bold text-[#0f172a]">Request Sent Successfully!</h2>
                <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-slate-500">
                  Our team is already working on finding the best teacher for you. Expect an update within 24 hours.
                </p>
                <Link
                  href="/"
                  className="mt-10 inline-flex min-h-[64px] items-center justify-center rounded-2xl bg-[#0f172a] px-10 text-lg font-bold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-[#E91E63]"
                >
                  Return Home
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[40px] bg-white p-8 md:p-14 shadow-2xl shadow-slate-200 border border-slate-100"
              >
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    selectedSubjects.forEach(s => formData.append('subjects', s));
                    
                    // Add selected courses
                    Object.entries(selectedCourses).forEach(([subject, courses]) => {
                      courses.forEach(c => formData.append('courses', `${subject}: ${c}`));
                    });

                    formData.append('programId', selectedProgramId);
                    await saveRequest(formData);
                    setSubmitted(true);
                  }}
                  className="space-y-10"
                >
                  <div className="grid gap-8 md:grid-cols-2">
                    <Field icon={<FiUser />} label="Parent Full Name" htmlFor="parent-name">
                      <input id="parent-name" name="parentName" required placeholder="e.g. John Doe" className={inputClasses} />
                    </Field>

                    <Field icon={<FiMail />} label="Email Address" htmlFor="email">
                      <input id="email" name="email" type="email" required placeholder="john@example.com" className={inputClasses} />
                    </Field>

                    <Field icon={<FiPhone />} label="Phone Number" htmlFor="phone">
                      <input id="phone" name="phone" type="tel" required placeholder="+250 790 000 000" className={inputClasses} />
                    </Field>

                    <Field icon={<FiLayers />} label="Learning Category" htmlFor="program">
                      <div className="relative group">
                        <select 
                          id="program" 
                          name="programId" 
                          required
                          value={selectedProgramId}
                          onChange={(e) => setSelectedProgramId(e.target.value)}
                          className={`${inputClasses} appearance-none cursor-pointer pr-12`}
                        >
                          <option value="" disabled>Choose a category</option>
                          {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                        <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-[#E91E63] transition-colors">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </Field>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <FiBookOpen className="text-[#E91E63]" />
                        Sub-categories of Interest
                      </label>
                    </div>
                    
                    {availableSubjects.length > 0 ? (
                      <div className="space-y-10">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <div
                            onClick={handleSelectAll}
                            className={`group relative cursor-pointer overflow-hidden rounded-2xl transition-all border-2 p-4 flex items-center justify-between ${
                              selectedSubjects.length === availableSubjects.length
                                ? "bg-[#E91E63]/5 border-[#E91E63] shadow-md"
                                : "bg-white border-slate-100 hover:border-[#E91E63]/30"
                            }`}
                          >
                            <span className="text-sm font-bold text-slate-800">
                              All Sub-categories
                            </span>
                            <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              selectedSubjects.length === availableSubjects.length
                                ? "bg-[#E91E63] border-[#E91E63]"
                                : "bg-slate-100 border-slate-200"
                            }`}>
                              {selectedSubjects.length === availableSubjects.length && <FiCheckCircle className="text-white size-3" />}
                            </div>
                          </div>

                          {programs
                            .find(p => p.id.toString() === selectedProgramId)
                            ?.subjects.map(s => {
                              const isSelected = selectedSubjects.includes(s.name);
                              return (
                                <div
                                  key={s.id}
                                  onClick={() => toggleSubCategory(s.name)}
                                  className={`group relative cursor-pointer overflow-hidden rounded-2xl transition-all border-2 flex flex-col ${
                                    isSelected
                                      ? "bg-[#E91E63]/5 border-[#E91E63] shadow-md"
                                      : "bg-white border-slate-100 hover:border-[#E91E63]/30"
                                  }`}
                                >
                                  <div className="relative h-24 w-full overflow-hidden">
                                    <img 
                                      src={s.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80"} 
                                      alt={s.name}
                                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className={`absolute top-3 right-3 size-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                      isSelected
                                        ? "bg-[#E91E63] border-[#E91E63]"
                                        : "bg-white/20 border-white/40 backdrop-blur-sm"
                                    }`}>
                                      {isSelected && <FiCheckCircle className="text-white size-3" />}
                                    </div>
                                    <span className="absolute bottom-3 left-4 text-sm font-bold text-white truncate right-4">
                                      {s.name}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                        {/* Additional Topic Selection Section */}
                        {selectedSubjects.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-3xl bg-slate-50 p-8 border-2 border-slate-100"
                          >
                            <div className="flex items-center gap-2 mb-6">
                              <FiLayers className="text-[#E91E63]" />
                              <h3 className="text-sm font-bold text-slate-700">Refine Topics to Cover</h3>
                            </div>
                            
                            <div className="space-y-6">
                              {selectedSubjects.map(subName => {
                                const sub = programs
                                  .find(p => p.id.toString() === selectedProgramId)
                                  ?.subjects.find(s => s.name === subName);
                                
                                if (!sub || sub.topics.length === 0) return null;

                                return (
                                  <div key={subName} className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                      {subName}
                                      <div className="h-px flex-1 bg-slate-200" />
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {sub.topics.map(topic => (
                                        <button
                                          key={topic.id}
                                          type="button"
                                          onClick={() => toggleTopic(subName, topic.name)}
                                          className={`group/btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                            selectedCourses[subName]?.includes(topic.name)
                                              ? "bg-[#E91E63] text-white shadow-lg shadow-rose-200"
                                              : "bg-white text-slate-500 border border-slate-200 hover:border-[#E91E63]/30"
                                          }`}
                                        >
                                          <div className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
                                            selectedCourses[subName]?.includes(topic.name)
                                              ? "bg-white border-white text-[#E91E63]"
                                              : "bg-slate-100 border-slate-200"
                                          }`}>
                                            {selectedCourses[subName]?.includes(topic.name) && <FiCheckCircle className="size-2.5" />}
                                          </div>
                                          {topic.name}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {Object.values(selectedCourses).every(topics => topics.length === 0) && (
                                <p className="text-sm text-slate-400 italic">No topics selected. Please select at least one topic for your chosen sub-categories.</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-100">
                        Please select a category above to see available sub-categories.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-8 md:grid-cols-2">
                    <Field icon={<FiMapPin />} label="Learning Mode" htmlFor="mode">
                      <div className="relative group">
                        <select 
                          id="mode" 
                          name="mode" 
                          defaultValue="" 
                          required 
                          className={`${inputClasses} appearance-none cursor-pointer pr-12`}
                        >
                          <option value="" disabled>Preferred mode</option>
                          {learningModes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-[#E91E63] transition-colors">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </Field>

                    <Field icon={<FiCalendar />} label="Preferred Start Date" htmlFor="start-date">
                      <input id="start-date" name="startDate" type="date" required className={inputClasses} />
                    </Field>
                  </div>

                  <Field icon={<FiMessageSquare />} label="Anything else we should know?" htmlFor="details">
                    <textarea
                      id="details"
                      name="details"
                      rows={4}
                      placeholder="Share specific goals, challenges, or schedule preferences..."
                      className={`${inputClasses} resize-none`}
                    />
                  </Field>

                  <button
                    type="submit"
                    className="group relative w-full overflow-hidden rounded-2xl bg-[#E91E63] p-6 text-xl font-bold text-white shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full transition-transform duration-500 group-hover:translate-x-full" />
                    <span className="relative flex items-center justify-center gap-3">
                      Send My Request
                      <FiSend className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
      <Footer />
    </main>
  );
}
