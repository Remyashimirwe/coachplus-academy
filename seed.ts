import "dotenv/config";
import { prisma } from "./app/lib/db";
import bcrypt from "bcryptjs";

type SeedSubject = {
  name: string;
  topics: string[];
};

type SeedProgram = {
  title: string;
  level: string;
  text: string;
  image: string;
  sortOrder: number;
  featuredInHero: boolean;
  showOnTeacherForm: boolean;
  subjects: SeedSubject[];
};

const programs: SeedProgram[] = [
  {
    title: "Primary School Coaching",
    level: "P1-P6",
    text: "Confidence-building coaching for Primary 1–6 in Mathematics, English, Science & Social Studies — aligned with the national curriculum and national exams.",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=70",
    sortOrder: 0,
    featuredInHero: true,
    showOnTeacherForm: true,
    subjects: [
      {
        name: "Lower Primary (P1-P3)",
        topics: [
          "Kinyarwanda: Reading & Writing Basics",
          "English: Phonics & Vocabulary",
          "Mathematics: Counting & Numbers",
          "Mathematics: Addition & Subtraction",
          "Mathematics: Shapes & Patterns",
          "English: Speaking & Listening",
        ],
      },
      {
        name: "Upper Primary (P4-P6)",
        topics: [
          "Mathematics: Whole Numbers & Decimals",
          "Mathematics: Fractions & Percentages",
          "Mathematics: Geometry & Measurement",
          "English: Grammar & Composition",
          "English: Reading Comprehension",
          "Kinyarwanda: Reading & Composition",
          "French: Basics & Conversation",
          "Science & Elementary Technology (SET)",
          "Social Studies (SST)",
          "National Exam Preparation",
        ],
      },
    ],
  },
  {
    title: "Secondary School Coaching",
    level: "S1-S6",
    text: "Subject mastery and exam-readiness coaching for Secondary 1–6, covering sciences, languages, humanities and computer science with personalized progress tracking.",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=70",
    sortOrder: 1,
    featuredInHero: true,
    showOnTeacherForm: true,
    subjects: [
      {
        name: "Lower Secondary (S1-S3)",
        topics: [
          "Mathematics: Algebra & Equations",
          "Mathematics: Geometry & Trigonometry",
          "English: Grammar, Writing & Literature",
          "French: Grammar & Conversation",
          "Kinyarwanda: Language & Literature",
          "Physics: Forces, Motion & Energy",
          "Chemistry: Matter & Chemical Reactions",
          "Biology: Living Organisms & Cells",
          "Geography: Physical & Human Geography",
          "Entrepreneurship & Financial Literacy",
        ],
      },
      {
        name: "Upper Secondary (S4-S6)",
        topics: [
          "Mathematics: Calculus & Statistics",
          "Physics: Mechanics & Electricity",
          "Chemistry: Organic & Inorganic Chemistry",
          "Biology: Genetics & Human Biology",
          "Geography: Mapping & Ecosystems",
          "History: World & Rwandan History",
          "Computer Science: Programming & Databases",
          "National Exam Preparation (A-Level)",
        ],
      },
    ],
  },
  {
    title: "Language Coaching & Exam Preparation",
    level: "All Ages",
    text: "Learn and master languages with certified tutors — English, French, Swahili, Mandarin, German, Spanish and Italian, with preparation for DELF, IELTS, TOEFL & more.",
    image:
      "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1200&q=70",
    sortOrder: 2,
    featuredInHero: true,
    showOnTeacherForm: true,
    subjects: [
      {
        name: "English Language",
        topics: [
          "Grammar & Sentence Structure",
          "Vocabulary Development",
          "Listening & Comprehension",
          "Speaking & Conversation",
          "Pronunciation & Accent",
          "Reading & Comprehension",
          "Writing Skills",
          "Academic & Business English",
          "Fluency & Communication Skills",
          "Exam Skills & Mock Tests",
          "IELTS / TOEFL / Cambridge / PTE / TOEIC / Duolingo Prep",
        ],
      },
      {
        name: "French Language",
        topics: [
          "French Grammar",
          "Vocabulary Development",
          "Listening & Comprehension",
          "Speaking & Conversation",
          "Pronunciation",
          "Reading Comprehension",
          "Writing Skills",
          "French for Business & Work",
          "Fluency & Communication",
          "DELF / DALF / TCF / TEF Preparation",
        ],
      },
      {
        name: "Kiswahili / Swahili",
        topics: [
          "Swahili Grammar",
          "Vocabulary Development",
          "Listening & Speaking",
          "Reading & Writing Skills",
          "Business & Commercial Swahili",
          "East African Communication",
          "Proficiency Assessment & Practice",
        ],
      },
      {
        name: "Mandarin Chinese",
        topics: [
          "Pinyin & Pronunciation",
          "Chinese Characters",
          "Basic Grammar & Vocabulary",
          "Listening & Speaking",
          "Reading & Writing Characters",
          "Business & Cultural Communication",
          "HSK Exam Preparation",
        ],
      },
      {
        name: "German Language",
        topics: [
          "German Grammar",
          "Vocabulary Development",
          "Listening & Comprehension",
          "Speaking & Conversation",
          "Reading & Writing Skills",
          "German for Work & Study",
          "Goethe-Zertifikat / telc / TestDaF / DSH Prep",
        ],
      },
      {
        name: "Spanish Language",
        topics: [
          "Spanish Grammar",
          "Vocabulary Development",
          "Listening & Speaking",
          "Reading Comprehension",
          "Writing Skills",
          "Everyday & Business Spanish",
          "DELE / SIELE Preparation",
        ],
      },
      {
        name: "Italian Language",
        topics: [
          "Italian Grammar",
          "Vocabulary Development",
          "Listening & Speaking",
          "Reading & Writing Skills",
          "Italian for Work & Study",
          "CILS / CELI / PLIDA Preparation",
        ],
      },
    ],
  },
  {
    title: "Cambridge Sciences",
    level: "Primary",
    text: "Structured Cambridge Science coaching for young learners — building strong foundations in Mathematics, Biology, Chemistry and Physics with fun, hands-on lessons.",
    image:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=70",
    sortOrder: 3,
    featuredInHero: true,
    showOnTeacherForm: true,
    subjects: [
      {
        name: "Mathematics",
        topics: [
          "Numbers & Place Value",
          "Addition, Subtraction & Multiplication",
          "Division & Fractions",
          "Decimals & Percentages",
          "Shapes, Angles & Symmetry",
          "Measurement & Units",
          "Data Handling & Graphs",
          "Problem Solving Strategies",
        ],
      },
      {
        name: "Biology",
        topics: [
          "Living Things & Their Habitats",
          "Plant & Animal Cells",
          "The Human Body & Systems",
          "Food Chains & Ecosystems",
          "Health & Nutrition",
          "Life Cycles & Reproduction",
        ],
      },
      {
        name: "Chemistry",
        topics: [
          "States of Matter",
          "Materials & Their Properties",
          "Mixtures & Solutions",
          "Simple Chemical Reactions",
          "Acids & Bases",
          "Everyday Chemistry",
        ],
      },
      {
        name: "Physics",
        topics: [
          "Forces & Motion",
          "Electricity & Circuits",
          "Light & Shadows",
          "Sound & Vibrations",
          "Magnets & Magnetism",
          "Energy & Its Forms",
        ],
      },
      {
        name: "Other Sciences",
        topics: [
          "Scientific Inquiry & Investigation",
          "Earth, Sun & The Solar System",
          "Weather & Climate",
          "Rocks, Soils & Fossils",
          "Scientific Diagrams & Recording",
        ],
      },
    ],
  },
  {
    title: "Digital Marketing",
    level: "Short Course",
    text: "Master modern digital marketing — social media, paid ads, SEO, email and analytics — to grow brands and land real career opportunities.",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=70",
    sortOrder: 4,
    featuredInHero: true,
    showOnTeacherForm: true,
    subjects: [
      {
        name: "Key Topics Covered",
        topics: [
          "Digital Marketing Fundamentals",
          "Social Media Marketing",
          "Facebook & Instagram Advertising",
          "Google Ads",
          "Content Marketing & Strategy",
          "Search Engine Optimization (SEO)",
          "WhatsApp Business Marketing",
          "Email Marketing",
          "Digital Branding",
          "Lead Generation & Customer Engagement",
          "Marketing Analytics & Performance Tracking",
          "Digital Marketing Campaign Planning",
        ],
      },
    ],
  },
  {
    title: "Professional & Short Courses",
    level: "All Levels",
    text: "Career-boosting professional training: graphic design, office applications, AI, web & mobile development, cybersecurity, video production and programming.",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=70",
    sortOrder: 5,
    featuredInHero: false,
    showOnTeacherForm: true,
    subjects: [
      {
        name: "Graphic Design",
        topics: [
          "Design Principles",
          "Adobe Illustrator",
          "Branding & Visual Identity",
          "Typography",
          "Color Theory",
          "Adobe Photoshop",
          "InDesign",
        ],
      },
      {
        name: "Microsoft Office & Computer Applications",
        topics: [
          "Computer Fundamentals",
          "Microsoft Word",
          "Microsoft Excel",
          "PowerPoint",
          "Outlook",
          "Internet & Email",
          "Digital File Management",
        ],
      },
      {
        name: "Advanced Excel",
        topics: [
          "Advanced Formulas",
          "Functions",
          "Pivot Tables",
          "Charts & Dashboards",
          "Data Cleaning",
          "Data Analysis",
          "Excel Automation",
        ],
      },
      {
        name: "Artificial Intelligence (AI) for Professionals",
        topics: [
          "AI Fundamentals",
          "Generative AI",
          "AI for Marketing",
          "AI for Business",
          "AI for Productivity",
          "Prompt Engineering",
          "AI Ethics & Responsible Use",
        ],
      },
      {
        name: "Web Design & Development",
        topics: [
          "HTML",
          "CSS",
          "JavaScript Fundamentals",
          "Responsive Design",
          "WordPress",
          "Web Hosting & Domains",
          "UI Basics",
          "Website Deployment",
        ],
      },
      {
        name: "Cybersecurity Fundamentals",
        topics: [
          "Cybersecurity Fundamentals",
          "Password Security",
          "Network Security",
          "Phishing & Social Engineering",
          "Malware",
          "Data Protection",
          "Cybersecurity Awareness",
        ],
      },
      {
        name: "UI/UX Design",
        topics: [
          "UX Fundamentals",
          "User Research",
          "Information Architecture",
          "Wireframing",
          "UI Design",
          "Prototyping",
          "Usability Testing",
          "Figma",
        ],
      },
      {
        name: "Programming & Software Development",
        topics: [
          "Introduction to Programming",
          "Python Programming",
          "JavaScript Programming",
          "Java Programming",
          "C & C++ Programming",
          "Object-Oriented Programming",
          "SQL & Database Programming",
          "PHP Programming",
          "Software Development Fundamentals",
        ],
      },
      {
        name: "Mobile App Development",
        topics: [
          "Programming Fundamentals",
          "Flutter & Dart",
          "UI/UX Design",
          "Authentication",
          "Database & Firebase",
          "APIs & Backend Integration",
          "Testing & Debugging",
          "Git & GitHub",
          "Performance Optimization",
          "App Security",
          "Deployment & Publishing",
          "Final Mobile App Project",
        ],
      },
      {
        name: "Digital Marketing",
        topics: [
          "Online Advertising",
          "SEO",
          "Email Marketing",
          "Content Marketing",
          "Social Media Marketing",
          "Analytics & Reporting",
        ],
      },
      {
        name: "Video Production & Filmmaking",
        topics: [
          "Introduction to Video Production & Filmmaking",
          "Camera Operation & Techniques",
          "Lighting Techniques",
          "Sound Recording & Production",
          "Scriptwriting & Screenwriting",
          "Cinematography",
          "Film Directing",
          "Video Editing",
          "Motion Graphics & Visual Effects",
          "Color Correction & Color Grading",
          "Documentary & Short Film Production",
          "Film Production Management",
          "Professional Film Project & Portfolio",
        ],
      },
    ],
  },
  {
    title: "Music & Performing Arts",
    level: "All Ages",
    text: "Comprehensive music education from theory to performance — piano, drums and more, taught by passionate musicians.",
    image:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=70",
    sortOrder: 6,
    featuredInHero: false,
    showOnTeacherForm: true,
    subjects: [
      {
        name: "Music Theory",
        topics: [
          "Musical Notation",
          "Rhythm & Meter",
          "Scales & Key Signatures",
          "Intervals",
          "Chords & Harmony",
        ],
      },
      {
        name: "Piano",
        topics: [
          "Piano Fundamentals",
          "Keyboard Orientation",
          "Finger Techniques",
          "Scales & Arpeggios",
          "Reading Sheet Music",
        ],
      },
      {
        name: "Drums",
        topics: [
          "Drum Kit Fundamentals",
          "Basic Rhythms",
          "Rudiments",
          "Coordination",
          "Playing to a Click",
        ],
      },
    ],
  },
];

async function upsertProgram(p: SeedProgram) {
  const existing = await prisma.program.findFirst({
    where: { title: p.title },
    include: { subjects: { include: { topics: true } } },
  });

  const program = existing
    ? await prisma.program.update({
        where: { id: existing.id },
        data: {
          level: p.level,
          text: p.text,
          image: p.image,
          sortOrder: p.sortOrder,
          featuredInHero: p.featuredInHero,
          showOnTeacherForm: p.showOnTeacherForm,
        },
      })
    : await prisma.program.create({
        data: {
          title: p.title,
          level: p.level,
          text: p.text,
          image: p.image,
          sortOrder: p.sortOrder,
          featuredInHero: p.featuredInHero,
          showOnTeacherForm: p.showOnTeacherForm,
        },
      });

  // Upsert subjects (by name) and topics (by name) so the seed is idempotent.
  for (let i = 0; i < p.subjects.length; i++) {
    const sub = p.subjects[i];
    const existingSubject = await prisma.subject.findFirst({
      where: { programId: program.id, name: sub.name },
    });

    let subject;
    if (existingSubject) {
      subject = await prisma.subject.update({
        where: { id: existingSubject.id },
        data: { sortOrder: i },
      });
    } else {
      subject = await prisma.subject.create({
        data: { name: sub.name, programId: program.id, sortOrder: i },
      });
    }

    const existingTopics = await prisma.topic.findMany({
      where: { subjectId: subject.id },
    });
    const existingNames = new Set(existingTopics.map((t) => t.name));

    for (let j = 0; j < sub.topics.length; j++) {
      const topicName = sub.topics[j];
      if (existingNames.has(topicName)) {
        await prisma.topic.updateMany({
          where: { subjectId: subject.id, name: topicName },
          data: { sortOrder: j },
        });
      } else {
        await prisma.topic.create({
          data: {
            name: topicName,
            subjectId: subject.id,
            sortOrder: j,
          },
        });
      }
    }
  }

  console.log(
    `  ✓ Program "${p.title}" (${p.subjects.length} subjects)`
  );
}

async function main() {
  console.log("Seeding database...\n");

  // 1. Create/refresh the Admin account
  const adminEmail = process.env.ADMIN_EMAIL || "admin@coachplusacademy.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashedPassword,
      name: "Super Admin",
      role: "ADMIN",
      isFirstLogin: false,
    },
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
      name: "Super Admin",
      role: "ADMIN",
      isFirstLogin: false,
    },
  });
  console.log(`✓ Admin ready: ${adminEmail}\n`);

  // 2. Seed the learning catalog (Program → Subject → Topic)
  console.log("Seeding learning catalog:");
  for (const p of programs) {
    await upsertProgram(p);
  }

  // 3. Fix any leftover orphan subjects/topics from old seeds
  const musicLike = await prisma.program.findFirst({
    where: { title: { contains: "Music & Performing Arts" } },
  });
  if (musicLike) {
    const dupes = await prisma.program.findMany({
      where: { title: "Music & Performing Arts" },
    });
    if (dupes.length > 1) {
      // Keep the first, delete any duplicate programs created by older seeds.
      console.log(`  Cleaning ${dupes.length - 1} duplicate Music program(s)...`);
      for (const extra of dupes.slice(1)) {
        await prisma.topic.deleteMany({
          where: { subject: { programId: extra.id } },
        });
        await prisma.subject.deleteMany({ where: { programId: extra.id } });
        await prisma.program.delete({ where: { id: extra.id } });
      }
    }
  }

  // 4. Order every program by its sortOrder for consistency
  await prisma.$executeRawUnsafe(
    `UPDATE "Program" SET "sortOrder" = sub.q FROM (
       SELECT id, ROW_NUMBER() OVER (ORDER BY "sortOrder" ASC) - 1 AS q
       FROM "Program"
     ) sub WHERE "Program".id = sub.id;`
  );

  console.log("\nSeeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });