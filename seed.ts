import "dotenv/config";
import { prisma } from "./app/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database...");

  // 1. Create Admin
  const adminEmail = process.env.ADMIN_EMAIL || "admin@coachplusacademy.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashedPassword,
      name: "Super Admin",
      role: "ADMIN",
      isFirstLogin: false
    },
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
      name: "Super Admin",
      role: "ADMIN",
      isFirstLogin: false
    },
  });
  console.log(`Admin created: ${adminEmail}`);

  // 2. Create Programs and Subjects with Topics
  const programsData = [
    {
      title: "Early Years (Nursery–Pre-K / Maternelle)",
      level: "Nursery - Pre-K",
      text: "Phonics, basic counting, creative arts, and beginner piano/music.",
      sortOrder: 1,
      subCategories: [
        { name: "Phonics & Literacy", topics: ["Alphabet Basics", "Storytelling", "Pronunciation"] },
        { name: "Basic Counting", topics: ["Numbers 1-20", "Shapes", "Simple Addition"] },
        { name: "Creative Arts", topics: ["Drawing", "Coloring", "Crafts"] },
        { name: "Beginner Piano/Music", topics: ["Notes", "Rhythm", "Songs"] },
      ],
    },
    {
      title: "Primary School (Grade 1–6 / P1–P6)",
      level: "Primary",
      text: "Math, introductory science, beginner coding, music, and languages.",
      sortOrder: 2,
      subCategories: [
        { name: "Mathematics", topics: ["Arithmetic", "Fractions", "Word Problems"] },
        { name: "Introductory Science", topics: ["Living Things", "Matter", "Environment"] },
        { name: "Beginner Coding", topics: ["Scratch", "Logic Puzzles"] },
        { name: "Music & Languages", topics: ["French Basics", "English Grammar", "Keyboard"] },
      ],
    },
    {
      title: "Secondary & High School (Grade 7–12 / S1–S6)",
      level: "Secondary",
      text: "Advanced STEM (Physics, Chemistry, Biology, Math), coding, national exam prep, advanced languages, and music.",
      sortOrder: 3,
      subCategories: [
        { name: "Advanced STEM", topics: ["Physics", "Chemistry", "Biology", "Calculus"] },
        { name: "National Exam Prep", topics: ["Past Papers", "Exam Strategies", "Review Sessions"] },
        { name: "Advanced Languages", topics: ["Literature", "Essay Writing", "Public Speaking"] },
        { name: "Coding & Music", topics: ["Python", "Web Design", "Music Theory"] },
      ],
    },
    {
      title: "Adult & Personal (Post-Secondary & Beyond)",
      level: "Adult",
      text: "Software development, practical language fluency, Music mastery, and professional skills.",
      sortOrder: 4,
      subCategories: [
        { name: "Software Development", topics: ["React", "Node.js", "Databases"] },
        { name: "Language Fluency", topics: ["Conversational English", "Business French", "Kinyarwanda"] },
        { name: "Music Mastery", topics: ["Piano", "Guitar", "Vocal Training"] },
        { name: "Professional Skills", topics: ["Project Management", "Digital Marketing", "Soft Skills"] },
      ],
    },
  ];

  // Clear existing programs
  await prisma.program.deleteMany({});

  for (const p of programsData) {
    await prisma.program.create({
      data: {
        title: p.title,
        level: p.level,
        text: p.text,
        sortOrder: p.sortOrder,
        subjects: {
          create: p.subCategories.map((sc) => ({
            name: sc.name,
            topics: {
              create: sc.topics.map(t => ({ name: t }))
            }
          })),
        },
      },
    });
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
