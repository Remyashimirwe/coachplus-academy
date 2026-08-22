"use client";

import Link from "next/link";
import {useState, Suspense} from "react";
import {useSearchParams} from "next/navigation";
import {motion, AnimatePresence} from "framer-motion";
import {
    FiUser,
    FiMail,
    FiPhone,
    FiBookOpen,
    FiMessageSquare,
    FiSend,
    FiCheckCircle,
    FiCalendar,
    FiMapPin,
    FiLayers,
    FiX,
    FiClipboard,
    FiGlobe,
} from "react-icons/fi";
import {saveRequest} from "@/app/actions/request";
import TimePicker from "../components/TimePicker";
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

const learningModes = [
    "Home Coaching",
    "Online Coaching",
    "Coaching Center",
];

const daysList = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

function Field({
                   icon,
                   label,
                   htmlFor,
                   children,
                   className = "",
               }: {
    icon: React.ReactNode;
    label: string;
    htmlFor?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`space-y-2 ${className}`}>
            <label htmlFor={htmlFor} className="text-xs font-semibold text-slate-700 flex items-center gap-2">
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
    "w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm font-medium outline-none transition-all placeholder:text-slate-400 focus:border-[#E91E63] focus:bg-white focus:ring-4 focus:ring-[#E91E63]/10";

export default function RequestForm({programs}: { programs: Program[] }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RequestFormContent programs={programs}/>
        </Suspense>
    );
}

function RequestFormContent({programs}: { programs: Program[] }) {
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const searchParams = useSearchParams();
    const programIdParam = searchParams.get("programId");

    const [selectedProgramId, setSelectedProgramId] = useState<string>(programIdParam || "");
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedCourses, setSelectedCourses] = useState<Record<string, string[]>>({});
    const [selectionError, setSelectionError] = useState(false);
    const [selectedMode, setSelectedMode] = useState<string>("");
    const [modeError, setModeError] = useState(false);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [dayTimes, setDayTimes] = useState<Record<string, { from: string; to: string }>>({});
    const [daysError, setDaysError] = useState(false);

    const availableSubjects = selectedProgramId === ""
        ? []
        : programs.find(p => p.id.toString() === selectedProgramId)?.subjects.map(s => s.name) || [];

    const hasTopicsInSelection = selectedProgramId !== ""
        ? (programs.find(p => p.id.toString() === selectedProgramId)?.subjects.some(
            s => selectedSubjects.includes(s.name) && s.topics.length > 0
        ) ?? false)
        : false;

    const toggleDay = (day: string) => {
        setSelectedDays(prev => {
            if (prev.includes(day)) {
                setDayTimes(dt => {
                    const copy = {...dt};
                    delete copy[day];
                    return copy;
                });
                return prev.filter(d => d !== day);
            }
            setDayTimes(dt => ({...dt, [day]: dt[day] || {from: "", to: ""}}));
            return [...prev, day];
        });
    };

    const updateDayTime = (day: string, field: "from" | "to", value: string) => {
        setDayTimes(prev => ({...prev, [day]: {...(prev[day] || {from: "", to: ""}), [field]: value}}));
    };

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
                        [subCategoryName]: []
                    }));
                }
                return [...prev, subCategoryName];
            } else {
                setSelectedCourses(c => {
                    const newCourses = {...c};
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

    return (
        <main className="min-h-screen bg-slate-50 text-[#121826]">
            <div className="relative overflow-hidden bg-[#0f172a] pt-40 pb-24 text-white">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF5733]/20 via-[#E91E63]/20 to-[#7B1FA2]/20"/>
                <div className="absolute -left-32 top-24 size-96 rounded-full bg-[#E91E63]/10 blur-3xl"/>
                <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-[#7B1FA2]/10 blur-3xl"/>

                <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.5}}
                    >
            <span
                className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-md border border-white/20 mb-6 uppercase tracking-widest">
              Join CoachPlus Academy
            </span>
                        <h1 className="text-2xl font-medium leading-tight sm:text-3xl lg:text-4xl">
                            Request a <span className="text-[#E91E63]">Teacher</span>
                        </h1>
                        <p className="mt-6 mx-auto max-w-2xl text-base leading-relaxed text-slate-300">
                            Tell us your learning goals and we&apos;ll find the perfect match from our network of elite
                            educators.
                        </p>
                    </motion.div>
                </div>
            </div>

            <section className="relative -mt-12 pb-24">
                <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
                    <AnimatePresence mode="wait">
                        {status === "success" ? (
                            <motion.div
                                key="success"
                                initial={{opacity: 0, scale: 0.95}}
                                animate={{opacity: 1, scale: 1}}
                                exit={{opacity: 0, scale: 0.95}}
                                className="rounded-[40px] bg-white p-12 text-center shadow-2xl shadow-slate-200 border border-slate-100"
                            >
                                <div
                                    className="mx-auto flex size-24 items-center justify-center rounded-3xl bg-green-50 text-green-500 mb-8">
                                    <FiCheckCircle className="size-12"/>
                                </div>
                                <h2 className="text-xl font-semibold text-[#0f172a]">Request Sent Successfully!</h2>
                                <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-slate-500">
                                    Our team is already working on finding the best teacher for you. Expect an update
                                    within 24 hours.
                                </p>
                                <Link
                                    href="/"
                                    className="mt-10 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0f172a] px-8 text-base font-semibold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-[#E91E63]"
                                >
                                    Return Home
                                </Link>
                            </motion.div>
                        ) : status === "error" ? (
                            <motion.div
                                key="error"
                                initial={{opacity: 0, scale: 0.95}}
                                animate={{opacity: 1, scale: 1}}
                                exit={{opacity: 0, scale: 0.95}}
                                className="rounded-[40px] bg-white p-12 text-center shadow-2xl shadow-slate-200 border border-slate-100"
                            >
                                <div
                                    className="mx-auto flex size-24 items-center justify-center rounded-3xl bg-red-50 text-red-500 mb-8">
                                    <FiX className="size-12"/>
                                </div>
                                <h2 className="text-xl font-semibold text-[#0f172a]">Form is not Submited</h2>
                                <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-slate-500">
                                    Something went wrong while sending your request. Please try again later or contact
                                    us directly.
                                </p>
                                <button
                                    onClick={() => setStatus("idle")}
                                    className="mt-10 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#E91E63] px-8 text-base font-semibold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-[#0f172a]"
                                >
                                    Try Again
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="form"
                                initial={{opacity: 0, y: 40}}
                                animate={{opacity: 1, y: 0}}
                                className="rounded-[40px] bg-white p-8 md:p-14 shadow-2xl shadow-slate-200 border border-slate-100"
                            >
                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        if (selectedSubjects.length === 0) {
                                            setSelectionError(true);
                                            const el = document.getElementById('subject-selection');
                                            el?.scrollIntoView({behavior: 'smooth', block: 'center'});
                                            return;
                                        }
                                        if (selectedMode === "") {
                                            setModeError(true);
                                            const el = document.getElementById('learning-mode');
                                            el?.scrollIntoView({behavior: 'smooth', block: 'center'});
                                            return;
                                        }
                                        if (selectedDays.length === 0 || selectedDays.some(d => !dayTimes[d]?.from || !dayTimes[d]?.to)) {
                                            setDaysError(true);
                                            const el = document.getElementById('preferred-days');
                                            el?.scrollIntoView({behavior: 'smooth', block: 'center'});
                                            return;
                                        }
                                        setSelectionError(false);
                                        setModeError(false);
                                        setDaysError(false);
                                        setStatus("submitting");

                                        const formData = new FormData(e.currentTarget);
                                        selectedSubjects.forEach(s => formData.append('subjects', s));

                                        // Add selected courses
                                        Object.entries(selectedCourses).forEach(([subject, courses]) => {
                                            courses.forEach(c => formData.append('courses', `${subject}: ${c}`));
                                        });

                                        formData.append('programId', selectedProgramId);
                                        formData.append('mode', selectedMode);
                                        selectedDays.forEach(d => {
                                            formData.append('availableDays', d);
                                            formData.append('dayTimeSlots', `${d}: ${dayTimes[d]?.from || ''} - ${dayTimes[d]?.to || ''}`);
                                        });
                                        const result = await saveRequest(formData);

                                        if (result && result.success) {
                                            setStatus("idle");
                                            setShowSuccessModal(true);
                                            // Reset form
                                            e.currentTarget.reset();
                                            setSelectedSubjects([]);
                                            setSelectedCourses({});
                                            setSelectedMode("");
                                            setSelectedDays([]);
                                            setDayTimes({});
                                        } else {
                                            setStatus("error");
                                        }
                                    }}
                                    className="space-y-10"
                                >
                                    <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
                                        <Field icon={<FiUser/>} label="Student or Guardian Name" htmlFor="parent-name">
                                            <input id="parent-name" name="parentName" required
                                                   placeholder="e.g. John Doe" className={inputClasses}/>
                                        </Field>

                                        <Field icon={<FiMail/>} label="Email Address" htmlFor="email">
                                            <input id="email" name="email" type="email" required
                                                   placeholder="john@example.com" className={inputClasses}/>
                                        </Field>

                                        <Field icon={<FiPhone/>} label="Primary Phone Number" htmlFor="phone">
                                            <input id="phone" name="phone" type="tel" required
                                                   placeholder="+250 780 ... ..." className={inputClasses}/>
                                        </Field>

                                        <Field icon={<FiPhone/>} label="Secondary Phone Number (Optional)"
                                               htmlFor="phone2">
                                            <input id="phone2" name="phone2" type="tel" placeholder="+250 790 ... ..."
                                                   className={inputClasses}/>
                                        </Field>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-base font-semibold text-[#0f172a] flex items-center gap-2">
                                            <FiMapPin className="text-[#E91E63]"/>
                                            Location Details
                                        </h3>
                                        <div className="grid gap-8 md:grid-cols-2">
                                            <Field icon={<FiGlobe/>} label="Country" htmlFor="country">
                                                <input id="country" name="country" required placeholder="e.g. Rwanda"
                                                       className={inputClasses}/>
                                            </Field>

                                            <Field icon={<FiMapPin/>} label="City" htmlFor="city">
                                                <input id="city" name="city" required placeholder="e.g. Kigali"
                                                       className={inputClasses}/>
                                            </Field>
                                        </div>
                                    </div>

                                    <div className="grid gap-8">
                                        <Field icon={<FiLayers/>} label="Choose a Category" htmlFor="program">
                                            <div className="relative group">
                                                <select
                                                    id="program"
                                                    name="programId"
                                                    required
                                                    value={selectedProgramId}
                                                    onChange={(e) => {
                                                        setSelectedProgramId(e.target.value);
                                                        setSelectedSubjects([]);
                                                        setSelectedCourses({});
                                                    }}
                                                    className={`${inputClasses} appearance-none cursor-pointer pr-12 text-xs sm:text-sm`}
                                                >
                                                    <option value="" disabled>Choose a Category</option>
                                                    {programs.map(p => <option key={p.id}
                                                                               value={p.id}>{p.title}</option>)}
                                                </select>
                                                <div
                                                    className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-[#E91E63] transition-colors">
                                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                                                         xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor"
                                                              strokeWidth="2" strokeLinecap="round"
                                                              strokeLinejoin="round"/>
                                                    </svg>
                                                </div>
                                            </div>
                                        </Field>
                                    </div>

                                    <div className="space-y-4" id="subject-selection">
                                        <div className="flex items-center justify-between">
                                            <label
                                                className={`text-xs font-semibold flex items-center gap-2 transition-colors ${selectionError ? 'text-red-500' : 'text-slate-700'}`}>
                                                <FiBookOpen
                                                    className={selectionError ? 'text-red-500' : 'text-[#E91E63]'}/>
                                                Choose a Course or Subject *
                                            </label>
                                            {selectionError && (
                                                <span
                                                    className="text-[10px] font-medium text-red-500 uppercase tracking-wider">Please select at least one course</span>
                                            )}
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
                            <span className="text-xs font-semibold text-slate-800">
                              All Courses
                            </span>
                                                        <div
                                                            className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                                selectedSubjects.length === availableSubjects.length
                                                                    ? "bg-[#E91E63] border-[#E91E63]"
                                                                    : "bg-slate-100 border-slate-200"
                                                            }`}>
                                                            {selectedSubjects.length === availableSubjects.length &&
                                                                <FiCheckCircle className="text-white size-3"/>}
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
                                                                    <div
                                                                        className="relative h-24 w-full overflow-hidden">
                                                                        <img
                                                                            src={s.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80"}
                                                                            alt={s.name}
                                                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                                        />
                                                                        <div
                                                                            className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
                                                                        <div
                                                                            className={`absolute top-3 right-3 size-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                                                isSelected
                                                                                    ? "bg-[#E91E63] border-[#E91E63]"
                                                                                    : "bg-white/20 border-white/40 backdrop-blur-sm"
                                                                            }`}>
                                                                            {isSelected && <FiCheckCircle
                                                                                className="text-white size-3"/>}
                                                                        </div>
                                                                        <span
                                                                            className="absolute bottom-3 left-4 text-xs sm:text-xs font-semibold text-white truncate right-4">
                                      {s.name}
                                    </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                         })}
                                                </div>

                                                {/* Additional Topic Selection Section */}
                                                {hasTopicsInSelection && (
                                                    <motion.div
                                                        initial={{opacity: 0, y: 10}}
                                                        animate={{opacity: 1, y: 0}}
                                                        className="rounded-3xl bg-slate-50 p-8 border-2 border-slate-100"
                                                    >
                                                        <div className="flex items-center gap-2 mb-6">
                                                            <FiLayers className="text-[#E91E63]"/>
                                                            <h3 className="text-xs font-semibold text-slate-700">Refine
                                                                Topics to Cover</h3>
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
                                                                            <div className="h-px flex-1 bg-slate-200"/>
                                                                        </h4>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {sub.topics.map(topic => (
                                                                                <button
                                                                                    key={topic.id}
                                                                                    type="button"
                                                                                    onClick={() => toggleTopic(subName, topic.name)}
                                                                                    className={`group/btn flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] sm:text-xs font-medium transition-all ${
                                                                                        selectedCourses[subName]?.includes(topic.name)
                                                                                            ? "bg-[#E91E63] text-white shadow-lg shadow-rose-200"
                                                                                            : "bg-white text-slate-500 border border-slate-200 hover:border-[#E91E63]/30"
                                                                                    }`}
                                                                                >
                                                                                    <div
                                                                                        className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
                                                                                            selectedCourses[subName]?.includes(topic.name)
                                                                                                ? "bg-white border-white text-[#E91E63]"
                                                                                                : "bg-slate-100 border-slate-200"
                                                                                        }`}>
                                                                                        {selectedCourses[subName]?.includes(topic.name) &&
                                                                                            <FiCheckCircle
                                                                                                className="size-2.5"/>}
                                                                                    </div>
                                                                                    {topic.name}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-400 italic bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-100">
                                                Please select a category above to see available courses.
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-4" id="learning-mode">
                                        <div className="flex items-center justify-between">
                                            <label
                                                className={`text-xs font-semibold flex items-center gap-2 transition-colors ${modeError ? 'text-red-500' : 'text-slate-700'}`}>
                                                <FiMapPin className={modeError ? 'text-red-500' : 'text-[#E91E63]'}/>
                                                Choose Learning Mode *
                                            </label>
                                            {modeError && (
                                                <span
                                                    className="text-[10px] font-medium text-red-500 uppercase tracking-wider">Please choose a learning mode</span>
                                            )}
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {learningModes.map(m => {
                                                const isSelected = selectedMode === m;
                                                return (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedMode(m);
                                                            setModeError(false);
                                                        }}
                                                        className={`flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-xs font-semibold transition-all ${
                                                            isSelected
                                                                ? "bg-[#E91E63]/5 border-[#E91E63] text-[#21121f] shadow-md"
                                                                : "bg-white border-slate-100 text-slate-600 hover:border-[#E91E63]/30"
                                                        }`}
                                                    >
                                                        {m}
                                                        <div
                                                            className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                                isSelected
                                                                    ? "bg-[#E91E63] border-[#E91E63]"
                                                                    : "bg-slate-100 border-slate-200"
                                                            }`}>
                                                            {isSelected && <FiCheckCircle className="text-white size-3"/>}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-4" id="preferred-days">
                                        <div className="flex items-center justify-between">
                                            <label
                                                className={`text-xs font-semibold flex items-center gap-2 transition-colors ${daysError ? 'text-red-500' : 'text-slate-700'}`}>
                                                <FiCalendar className={daysError ? 'text-red-500' : 'text-[#E91E63]'}/>
                                                Preferred Days &amp; Time *
                                            </label>
                                            {daysError && (
                                                <span
                                                    className="text-[10px] font-medium text-red-500 uppercase tracking-wider">Select days and set times</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Pick the days you would like lessons, then choose your preferred hours (from - to) for each selected day.
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {daysList.map(d => {
                                                const isSelected = selectedDays.includes(d);
                                                return (
                                                    <button
                                                        key={d}
                                                        type="button"
                                                        onClick={() => toggleDay(d)}
                                                        className={`rounded-xl px-4 py-2 text-xs font-medium transition-all border-2 ${
                                                            isSelected
                                                                ? "bg-[#E91E63] border-[#E91E63] text-white shadow-lg shadow-rose-200"
                                                                : "bg-white border-slate-100 text-slate-600 hover:border-[#E91E63]/30"
                                                        }`}
                                                    >
                                                        {d}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {selectedDays.length > 0 && (
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                {selectedDays.map(d => (
                                                    <div key={d} className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-4">
                                                        <p className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-700">
                                                            <FiCalendar className="text-[#E91E63]"/>
                                                            {d}
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <TimePicker
                                                                label="From"
                                                                ariaLabel={`${d} from time`}
                                                                value={dayTimes[d]?.from || ""}
                                                                onChange={(v) => updateDayTime(d, "from", v)}
                                                            />
                                                            <TimePicker
                                                                label="To"
                                                                ariaLabel={`${d} to time`}
                                                                value={dayTimes[d]?.to || ""}
                                                                onChange={(v) => updateDayTime(d, "to", v)}
                                                            />
                                                        </div>
                                                        {daysError && (!dayTimes[d]?.from || !dayTimes[d]?.to) && (
                                                            <p className="mt-2 text-[10px] font-medium text-red-500">Set a from and to time for {d}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <Field icon={<FiCalendar/>} label="Preferred Start Date" htmlFor="start-date">
                                        <input id="start-date" name="startDate" type="date" required
                                               onClick={(e) => {
                                                   const input = e.target as HTMLInputElement;
                                                   if (input.showPicker) input.showPicker();
                                               }}
                                               className={inputClasses}/>
                                    </Field>

                                    <button
                                        type="submit"
                                        disabled={status === "submitting"}
                                        className="group relative w-full overflow-hidden rounded-2xl bg-[#E91E63] p-4 text-base font-semibold text-white shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        <div
                                            className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full transition-transform duration-500 group-hover:translate-x-full"/>
                                        <span className="relative flex items-center justify-center gap-3">
                      {status === "submitting" ? "Sending..." : "Send My Request"}
                                            <FiSend
                                                className={`transition-transform ${status === "submitting" ? "animate-pulse" : "group-hover:translate-x-1"}`}/>
                    </span>
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>
            <Footer/>

            {/* Success Modal */}
            <AnimatePresence>
                {showSuccessModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 sm:p-6">
                        <motion.div
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            onClick={() => setShowSuccessModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{opacity: 0, scale: 0.9, y: 20}}
                            animate={{opacity: 1, scale: 1, y: 0}}
                            exit={{opacity: 0, scale: 0.9, y: 20}}
                            className="relative w-full max-w-lg overflow-hidden rounded-[40px] bg-white p-8 text-center shadow-2xl md:p-12"
                        >
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="absolute right-6 top-6 rounded-2xl bg-slate-100 p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-[#E91E63]"
                            >
                                <FiX className="size-5"/>
                            </button>

                            <div
                                className="mx-auto mb-8 flex size-24 items-center justify-center rounded-3xl bg-green-50 text-green-500">
                                <FiCheckCircle className="size-12"/>
                            </div>

                            <h2 className="text-xl font-semibold text-[#0f172a]">Request Sent!</h2>
                            <p className="mt-6 text-lg leading-relaxed text-slate-500">
                                Our team is already working on finding the best teacher for you. Expect an update within
                                24 hours.
                            </p>

                            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                                <button
                                    onClick={() => setShowSuccessModal(false)}
                                    className="flex-1 rounded-2xl bg-[#0f172a] py-4 text-base font-semibold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-[#E91E63]"
                                >
                                    Got it, thanks!
                                </button>
                                <Link
                                    href="/"
                                    className="flex-1 rounded-2xl bg-slate-100 py-4 text-base font-semibold text-slate-600 transition-all hover:bg-slate-200"
                                >
                                    Return Home
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
