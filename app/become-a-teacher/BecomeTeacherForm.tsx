"use client";

import Link from "next/link";
import { useState } from "react";
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
  FiBriefcase,
  FiStar,
  FiXCircle,
  FiAlertCircle,
  FiArrowRight,
  FiFileText,
  FiImage,
  FiX,
  FiMapPin,
  FiLinkedin,
  FiLink,
  FiCalendar,
  FiClock,
  FiCpu,
  FiActivity,
  FiTarget,
  FiInstagram,
  FiYoutube,
} from "react-icons/fi";
import { saveTeacherApplication } from "@/app/actions/teacher";

const subjectsList = [
  "Mathematics",
  "English",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "Geography",
  "History",
  "Civics",
  "Coding",
  "ICT",
  "French",
  "Swahili",
  "Kinyarwanda",
  "Economics",
  "Entrepreneurship",
  "Literature",
  "Art & Music",
  "Special Needs Education",
  "Exam Prep (e.g. TOEFL, IELTS, GRE)",
];

const gradesList = [
  "Kindergarten / Nursery",
  "Primary (P1 - P6)",
  "Lower Secondary (S1 - S3)",
  "Upper Secondary (S4 - S6)",
  "University / College",
  "Adult Learners",
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

const benefits = [
  {
    icon: FiBriefcase,
    title: "Flexible Schedule",
    text: "Teach when you want, from anywhere in the world.",
  },
  {
    icon: FiAward,
    title: "Competitive Pay",
    text: "Set your own rates and earn what your expertise deserves.",
  },
  {
    icon: FiStar,
    title: "Professional Growth",
    text: "Access resources and a community of elite educators.",
  },
];

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
      <label htmlFor={htmlFor} className="text-sm font-bold text-[#0f172a] flex items-center gap-2 mb-1">
        <span className="flex items-center justify-center size-6 rounded-lg bg-[#E91E63]/5 text-[#E91E63]">{icon}</span>
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

export default function BecomeTeacherForm({ isOpen }: { isOpen: boolean }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectionErrors, setSelectionErrors] = useState<{ subjects?: boolean; grades?: boolean; days?: boolean }>({});

  const toggleItem = (item: string, list: string[], setter: (val: string[]) => void) => {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          {/* Right Side: Application Form or Status */}
          <div className="relative w-full max-w-4xl">
            <div className="absolute -inset-4 rounded-[44px] bg-gradient-to-tr from-[#E91E63]/10 to-transparent blur-2xl" />
            
            <AnimatePresence mode="wait">
              {!isOpen ? (
                <motion.div
                  key="closed"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative rounded-[40px] bg-white p-12 text-center shadow-2xl shadow-slate-200 border border-slate-100 flex flex-col items-center justify-center min-h-[500px]"
                >
                  <div className="size-24 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mb-8">
                    <FiAlertCircle className="size-12" />
                  </div>
                  <h2 className="text-3xl font-bold text-[#0f172a]">Applications are Closed</h2>
                  <p className="mt-6 text-lg text-slate-500 max-w-sm mx-auto leading-relaxed">
                    We are currently not accepting new teacher applications. Please check back later or follow us for updates on future recruitment cycles.
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative rounded-[40px] bg-white p-8 md:p-12 shadow-2xl shadow-slate-200 border border-slate-100"
                >
                  <div className="mb-12 text-center">
                    <h2 className="text-4xl font-extrabold text-[#0f172a] tracking-tight">Application Form</h2>
                    <p className="text-slate-500 mt-3 text-lg">Tell us about your expertise and teaching journey</p>
                    <div className="mt-6 flex justify-center">
                      <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-[#FF5733] to-[#E91E63]" />
                    </div>
                  </div>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const errors: typeof selectionErrors = {};
                      if (selectedSubjects.length === 0) errors.subjects = true;
                      if (selectedGrades.length === 0) errors.grades = true;
                      if (selectedDays.length === 0) errors.days = true;
                      
                      if (Object.keys(errors).length > 0) {
                        setSelectionErrors(errors);
                        const firstError = document.querySelector('[data-error="true"]');
                        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        return;
                      }

                      setSelectionErrors({});
                      setStatus("submitting");

                      const formData = new FormData(e.currentTarget);
                      selectedSubjects.forEach(s => formData.append('subjects', s));
                      selectedGrades.forEach(g => formData.append('grades', g));
                      selectedDays.forEach(d => formData.append('availableDays', d));
                      
                      const result = await saveTeacherApplication(formData);
                      if (result && result.success) {
                        setStatus("idle");
                        setShowSuccessModal(true);
                        e.currentTarget.reset();
                        setSelectedSubjects([]);
                        setSelectedGrades([]);
                        setSelectedDays([]);
                      } else {
                        setStatus("error");
                      }
                    }}
                    className="space-y-12"
                  >
                    {/* 1. Personal Information */}
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0f172a] text-white shadow-lg shadow-slate-200">
                          <FiUser className="size-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-[#0f172a]">Personal Information</h3>
                          <p className="text-sm text-slate-500 font-medium">Basic details to identify you</p>
                        </div>
                      </div>
                      <div className="grid gap-6">
                        <Field icon={<FiUser />} label="Full Name *" htmlFor="fullName">
                          <input id="fullName" name="fullName" required placeholder="e.g. Jane Smith" className={inputClasses} />
                        </Field>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <Field icon={<FiMail />} label="Email Address *" htmlFor="email">
                          <input id="email" name="email" type="email" required placeholder="jane@example.com" className={inputClasses} />
                        </Field>
                        <Field icon={<FiPhone />} label="Phone Number *" htmlFor="phone">
                          <input id="phone" name="phone" type="tel" required placeholder="+250 780 000 000" className={inputClasses} />
                        </Field>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <Field icon={<FiMapPin />} label="Country *" htmlFor="country">
                          <input id="country" name="country" required placeholder="e.g. Rwanda" className={inputClasses} />
                        </Field>
                        <Field icon={<FiMapPin />} label="City *" htmlFor="city">
                          <input id="city" name="city" required placeholder="e.g. Kigali" className={inputClasses} />
                        </Field>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <Field icon={<FiMapPin />} label="Specific Location (Optional)" htmlFor="location">
                          <input id="location" name="location" placeholder="e.g. Nyarutarama, Street 123" className={inputClasses} />
                        </Field>
                        <Field icon={<FiLinkedin />} label="LinkedIn Profile" htmlFor="linkedin">
                          <input id="linkedin" name="linkedin" type="url" placeholder="https://linkedin.com/in/username" className={inputClasses} />
                        </Field>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <Field icon={<FiInstagram />} label="Instagram Profile" htmlFor="instagram">
                          <input id="instagram" name="instagram" type="url" placeholder="https://instagram.com/username" className={inputClasses} />
                        </Field>
                        <Field icon={<FiYoutube />} label="YouTube Channel" htmlFor="youtube">
                          <input id="youtube" name="youtube" type="url" placeholder="https://youtube.com/@channel" className={inputClasses} />
                        </Field>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <Field icon={<FiLink />} label="Other Social Media / Website (Optional)" htmlFor="otherSocial">
                          <input id="otherSocial" name="otherSocial" type="url" placeholder="https://yourwebsite.com" className={inputClasses} />
                        </Field>
                      </div>
                    <Field icon={<FiImage />} label="Profile Photo (Upload)" htmlFor="photo">
                      <div className="flex items-center gap-4">
                        <input 
                          id="photo" 
                          name="photo" 
                          type="file" 
                          accept="image/*" 
                          className={`${inputClasses} py-3`} 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const preview = document.getElementById('photo-preview') as HTMLImageElement;
                                if (preview) preview.src = event.target?.result as string;
                                const placeholder = document.getElementById('photo-placeholder');
                                if (placeholder) placeholder.style.display = 'none';
                                if (preview) preview.style.display = 'block';
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <div className="size-16 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                          <FiUser id="photo-placeholder" className="size-8 text-slate-400" />
                          <img id="photo-preview" alt="Preview" className="size-full object-cover hidden" />
                        </div>
                      </div>
                    </Field>
                    </div>

                    {/* 2. Education */}
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0f172a] text-white shadow-lg shadow-slate-200">
                          <FiBookOpen className="size-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-[#0f172a]">Education</h3>
                          <p className="text-sm text-slate-500 font-medium">Your academic background</p>
                        </div>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <Field icon={<FiAward />} label="Highest Level of Education *" htmlFor="educationLevel">
                          <select id="educationLevel" name="educationLevel" required className={`${inputClasses} appearance-none`}>
                            <option value="">Select Level</option>
                            <option value="Bachelor's Degree">Bachelor's Degree</option>
                            <option value="Master's Degree">Master's Degree</option>
                            <option value="PhD / Doctorate">PhD / Doctorate</option>
                            <option value="Diploma">Diploma</option>
                            <option value="Other">Other</option>
                          </select>
                        </Field>
                        <Field icon={<FiBookOpen />} label="Field of Study *" htmlFor="fieldOfStudy">
                          <input id="fieldOfStudy" name="fieldOfStudy" required placeholder="e.g. Mathematics, Physics" className={inputClasses} />
                        </Field>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <Field icon={<FiTarget />} label="University/Institution *" htmlFor="institution">
                          <input id="institution" name="institution" required placeholder="e.g. University of Rwanda" className={inputClasses} />
                        </Field>
                        <Field icon={<FiCalendar />} label="Graduation Year *" htmlFor="graduationYear">
                          <input id="graduationYear" name="graduationYear" required placeholder="e.g. 2020" className={inputClasses} />
                        </Field>
                      </div>
                      <Field icon={<FiFileText />} label="Academic Certificates (Upload) *" htmlFor="academicCert">
                        <input id="academicCert" name="academicCert" type="file" required accept=".pdf,image/*" className={`${inputClasses} py-3`} />
                      </Field>
                    </div>

                    {/* 3. Teaching Experience */}
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0f172a] text-white shadow-lg shadow-slate-200">
                          <FiBriefcase className="size-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-[#0f172a]">Teaching Experience</h3>
                          <p className="text-sm text-slate-500 font-medium">Where and what you've taught</p>
                        </div>
                      </div>
                      <Field icon={<FiClock />} label="Years of Teaching Experience *" htmlFor="experienceYears">
                        <select id="experienceYears" name="experienceYears" required className={`${inputClasses} appearance-none`}>
                          <option value="">Select Years</option>
                          <option value="0-1">Less than 1 year</option>
                          <option value="1-3">1-3 Years</option>
                          <option value="4-7">4-7 Years</option>
                          <option value="8+">8+ Years</option>
                        </select>
                      </Field>

                      <div className="space-y-4" data-error={selectionErrors.subjects}>
                        <div className="flex items-center justify-between">
                          <label className={`text-sm font-bold flex items-center gap-2 ${selectionErrors.subjects ? 'text-red-500' : 'text-slate-700'}`}>
                            Subjects You Can Teach *
                          </label>
                          {selectionErrors.subjects && <span className="text-[10px] font-bold text-red-500 uppercase">Select at least one</span>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {subjectsList.map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => toggleItem(s, selectedSubjects, setSelectedSubjects)}
                              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all border-2 ${
                                selectedSubjects.includes(s)
                                ? "bg-[#E91E63] border-[#E91E63] text-white shadow-lg shadow-rose-200"
                                : "bg-white border-slate-100 text-slate-600 hover:border-[#E91E63]/30"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4" data-error={selectionErrors.grades}>
                        <div className="flex items-center justify-between">
                          <label className={`text-sm font-bold flex items-center gap-2 ${selectionErrors.grades ? 'text-red-500' : 'text-slate-700'}`}>
                            Grade/Level You Can Teach *
                          </label>
                          {selectionErrors.grades && <span className="text-[10px] font-bold text-red-500 uppercase">Select at least one</span>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {gradesList.map(g => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => toggleItem(g, selectedGrades, setSelectedGrades)}
                              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all border-2 ${
                                selectedGrades.includes(g)
                                ? "bg-[#0f172a] border-[#0f172a] text-white shadow-lg shadow-slate-200"
                                : "bg-white border-slate-100 text-slate-600 hover:border-[#0f172a]/30"
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <Field icon={<FiTarget />} label="Previous School/Organization" htmlFor="previousOrg">
                          <input id="previousOrg" name="previousOrg" placeholder="e.g. Green Hills Academy" className={inputClasses} />
                        </Field>
                        <Field icon={<FiBriefcase />} label="Previous Teaching Position" htmlFor="previousPos">
                          <input id="previousPos" name="previousPos" placeholder="e.g. Math Head Teacher" className={inputClasses} />
                        </Field>
                      </div>

                      <Field icon={<FiMessageSquare />} label="Briefly describe your teaching experience *" htmlFor="expDescription">
                        <textarea id="expDescription" name="expDescription" required rows={3} placeholder="Summarize your career and achievements..." className={inputClasses} />
                      </Field>
                    </div>

                    {/* 4. Teaching Skills */}
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0f172a] text-white shadow-lg shadow-slate-200">
                          <FiStar className="size-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-[#0f172a]">Teaching Skills</h3>
                          <p className="text-sm text-slate-500 font-medium">Your pedagogical approach</p>
                        </div>
                      </div>
                      <Field icon={<FiActivity />} label="What teaching methods do you use? *" htmlFor="methods">
                        <textarea id="methods" name="methods" required placeholder="e.g. Inquiry-based learning, Gamification..." className={inputClasses} />
                      </Field>
                      <Field icon={<FiAlertCircle />} label="How do you handle difficult or struggling students? *" htmlFor="difficultStudents">
                        <textarea id="difficultStudents" name="difficultStudents" required className={inputClasses} />
                      </Field>
                      <Field icon={<FiTarget />} label="How do you keep students engaged? *" htmlFor="engagement">
                        <textarea id="engagement" name="engagement" required className={inputClasses} />
                      </Field>
                      <Field icon={<FiCpu />} label="What educational technologies/tools can you use?" htmlFor="techTools">
                        <input id="techTools" name="techTools" placeholder="e.g. Google Classroom, Kahoot, Zoom" className={inputClasses} />
                      </Field>
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">Are you able to teach online? *</label>
                        <div className="flex gap-6">
                          {["Yes", "No"].map(option => (
                            <label key={option} className="flex items-center gap-2 cursor-pointer group">
                              <input type="radio" name="teachOnline" value={option} required className="size-5 accent-[#E91E63]" />
                              <span className="text-slate-600 font-medium group-hover:text-[#E91E63] transition-colors">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 5. Availability */}
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0f172a] text-white shadow-lg shadow-slate-200">
                          <FiCalendar className="size-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-[#0f172a]">Availability</h3>
                          <p className="text-sm text-slate-500 font-medium">When can you start teaching?</p>
                        </div>
                      </div>
                      <Field icon={<FiBriefcase />} label="Employment Type *" htmlFor="employmentType">
                        <select id="employmentType" name="employmentType" required className={`${inputClasses} appearance-none`}>
                          <option value="">Select Type</option>
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                        </select>
                      </Field>
                      
                      <div className="space-y-4" data-error={selectionErrors.days}>
                        <div className="flex items-center justify-between">
                          <label className={`text-sm font-bold flex items-center gap-2 ${selectionErrors.days ? 'text-red-500' : 'text-slate-700'}`}>
                            Available Days *
                          </label>
                          {selectionErrors.days && <span className="text-[10px] font-bold text-red-500 uppercase">Select at least one</span>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {daysList.map(d => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => toggleItem(d, selectedDays, setSelectedDays)}
                              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all border-2 ${
                                selectedDays.includes(d)
                                ? "bg-[#E91E63] border-[#E91E63] text-white shadow-lg shadow-rose-200"
                                : "bg-white border-slate-100 text-slate-600 hover:border-[#E91E63]/30"
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <Field icon={<FiClock />} label="Available Hours *" htmlFor="availableHours">
                          <input id="availableHours" name="availableHours" required placeholder="e.g. 4 PM - 8 PM" className={inputClasses} />
                        </Field>
                        <Field icon={<FiCalendar />} label="Earliest Start Date *" htmlFor="startDate">
                          <input id="startDate" name="startDate" type="date" required className={inputClasses} />
                        </Field>
                      </div>
                    </div>

                    {/* 6. Application Documents */}
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0f172a] text-white shadow-lg shadow-slate-200">
                          <FiFileText className="size-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-[#0f172a]">Application Documents</h3>
                          <p className="text-sm text-slate-500 font-medium">Supporting files for your application</p>
                        </div>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <Field icon={<FiFileText />} label="Upload CV/Resume *" htmlFor="resume">
                          <input id="resume" name="resume" type="file" required accept=".pdf,.doc,.docx" className={`${inputClasses} py-3`} />
                        </Field>
                        <Field icon={<FiMessageSquare />} label="Upload Application/Cover Letter *" htmlFor="coverLetter">
                          <input id="coverLetter" name="coverLetter" type="file" required accept=".pdf,.doc,.docx" className={`${inputClasses} py-3`} />
                        </Field>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <Field icon={<FiAward />} label="Upload Certificates" htmlFor="otherCerts">
                          <input id="otherCerts" name="otherCerts" type="file" accept=".pdf,image/*" multiple className={`${inputClasses} py-3`} />
                        </Field>
                        <Field icon={<FiStar />} label="Teaching License/Certification" htmlFor="license">
                          <input id="license" name="license" type="file" accept=".pdf,image/*" className={`${inputClasses} py-3`} />
                        </Field>
                      </div>
                      <Field icon={<FiLink />} label="Portfolio / Sample Work (optional)" htmlFor="portfolio">
                        <input id="portfolio" name="portfolio" type="url" placeholder="Link to portfolio or shared folder" className={inputClasses} />
                      </Field>
                    </div>

                    {/* 7. Final Questions */}
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0f172a] text-white shadow-lg shadow-slate-200">
                          <FiMessageSquare className="size-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-[#0f172a]">Final Questions</h3>
                          <p className="text-sm text-slate-500 font-medium">Tell us a bit more about your motivation</p>
                        </div>
                      </div>
                      <Field label="Why do you want to teach at our institution? *" htmlFor="whyTeach" icon={<FiTarget />}>
                        <textarea id="whyTeach" name="whyTeach" required rows={3} className={inputClasses} />
                      </Field>
                      <Field label="Why should we select you? *" htmlFor="whySelect" icon={<FiCheckCircle />}>
                        <textarea id="whySelect" name="whySelect" required rows={3} className={inputClasses} />
                      </Field>
                      <Field label="What can you contribute to our students? *" htmlFor="contribution" icon={<FiAward />}>
                        <textarea id="contribution" name="contribution" required rows={3} className={inputClasses} />
                      </Field>
                    </div>

                    {/* 8. Declaration */}
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0f172a] text-white shadow-lg shadow-slate-200">
                          <FiCheckCircle className="size-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-[#0f172a]">Declaration</h3>
                          <p className="text-sm text-slate-500 font-medium">Final confirmation</p>
                        </div>
                      </div>
                      <div className="rounded-[32px] bg-slate-50 p-8 border-2 border-slate-100 shadow-inner">
                        <p className="text-slate-600 leading-relaxed italic">
                          "I confirm that the information provided in this application is accurate and complete. 
                          I understand that providing false information may result in disqualification."
                        </p>
                        <label className="mt-6 flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" name="agreedToTerms" required className="size-6 rounded-lg accent-[#E91E63]" />
                          <span className="text-slate-700 font-bold group-hover:text-[#E91E63] transition-colors">I agree to the declaration. *</span>
                        </label>
                      </div>
                    </div>

                    {/* 9. Submit */}
                    <div className="pt-6">
                      <button
                        type="submit"
                        disabled={status === "submitting"}
                        className="group relative w-full overflow-hidden rounded-3xl bg-[#0f172a] p-6 text-xl font-bold text-white shadow-2xl transition-all hover:-translate-y-1 hover:bg-[#E91E63] active:scale-[0.98] disabled:opacity-70"
                      >
                        <span className="relative flex items-center justify-center gap-3">
                          {status === "submitting" ? (
                            <>
                              <div className="size-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                              Submitting Application...
                            </>
                          ) : (
                            <>
                              <FiSend className="size-6" />
                              Submit Application
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccessModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[40px] bg-white p-8 text-center shadow-2xl md:p-12"
            >
              <button
                onClick={() => setShowSuccessModal(false)}
                className="absolute right-6 top-6 rounded-2xl bg-slate-100 p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-[#E91E63]"
              >
                <FiX className="size-5" />
              </button>
              
              <div className="mx-auto mb-8 flex size-24 items-center justify-center rounded-3xl bg-green-50 text-green-500">
                <FiCheckCircle className="size-12" />
              </div>
              
              <h2 className="text-3xl font-bold text-[#0f172a]">Application Sent!</h2>
              <p className="mt-6 text-lg leading-relaxed text-slate-500">
                Thank you for applying to join Wecoach Academy. Our academic team will review your profile and get back to you within 3-5 business days.
              </p>
              
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 rounded-2xl bg-[#0f172a] py-5 text-lg font-bold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-[#E91E63]"
                >
                  Got it, thanks!
                </button>
                <Link
                  href="/"
                  className="flex-1 rounded-2xl bg-slate-100 py-5 text-lg font-bold text-slate-600 transition-all hover:bg-slate-200"
                >
                  Return Home
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

function WhyTeachSection() {
  return (
    <section className="py-32 bg-slate-50 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-[#E91E63]/5 blur-3xl -mr-24" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-[#FF5733]/5 blur-3xl -ml-24" />
      
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-extrabold text-[#0f172a] sm:text-5xl tracking-tight">Why teach with us?</h2>
          <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto">
            We're more than just a platform; we're a community dedicated to educational excellence and teacher empowerment.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div 
                key={benefit.title} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative rounded-[40px] bg-white p-10 shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-[#E91E63]/20 hover:shadow-2xl hover:shadow-[#E91E63]/5 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <Icon className="size-24" />
                </div>
                
                <div className="flex size-16 items-center justify-center rounded-2xl bg-[#f8fafc] text-[#E91E63] group-hover:bg-[#E91E63] group-hover:text-white transition-all duration-500 mb-8 shadow-inner">
                  <Icon className="size-8" />
                </div>
                
                <h3 className="text-2xl font-bold text-[#0f172a] group-hover:text-[#E91E63] transition-colors">{benefit.title}</h3>
                <p className="mt-4 text-slate-600 leading-relaxed text-lg font-medium">{benefit.text}</p>
                
                <div className="mt-8 flex items-center text-sm font-bold text-[#E91E63] opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-500">
                  Learn more <FiArrowRight className="ml-2" />
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-20 rounded-[48px] bg-[#0f172a] p-12 md:p-16 text-white overflow-hidden relative shadow-2xl shadow-[#0f172a]/20"
        >
          <div className="absolute top-0 right-0 size-96 bg-[#E91E63]/20 blur-[100px] -mr-48 -mt-48 animate-pulse" />
          <div className="absolute bottom-0 left-0 size-64 bg-[#FF5733]/10 blur-[80px] -ml-32 -mb-32" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
                {[1, 2, 3, 4, 5].map(i => <FiStar key={i} className="fill-amber-400 text-amber-400 size-6" />)}
              </div>
              <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight">Elite Educator Network</h3>
              <p className="mt-6 text-xl text-slate-300 leading-relaxed font-medium">
                Join a community where 95% of our teachers report higher satisfaction and better work-life balance compared to traditional agencies.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 shrink-0">
              <div className="text-center bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 min-w-[140px]">
                <div className="text-4xl font-bold text-[#E91E63]">95%</div>
                <div className="text-sm text-slate-400 font-bold uppercase tracking-wider mt-1">Satisfaction</div>
              </div>
              <div className="text-center bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 min-w-[140px]">
                <div className="text-4xl font-bold text-[#FF5733]">Elite</div>
                <div className="text-sm text-slate-400 font-bold uppercase tracking-wider mt-1">Network</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export { WhyTeachSection };
