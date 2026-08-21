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

  // 2. Fix Music & Performing Arts program (remove duplicates)
  const musicProgram = {
    title: "Music & Performing Arts",
    level: "All Ages",
    text: "Comprehensive music education from theory to performance across multiple instruments.",
    sortOrder: 5,
    subCategories: [
      { name: "Music Theory", topics: ["Musical Notation", "Rhythm & Meter", "Scales & Key Signatures", "Intervals"] },
      { name: "Piano", topics: ["Piano Fundamentals", "Keyboard Orientation", "Finger Techniques", "Scales & Arpeggios"] },
      { name: "Drums", topics: ["Drum Kit Fundamentals", "Basic Rhythms", "Rudiments", "Coordination"] },
    ],
  };

  // Delete existing Music & Performing Arts program if exists (with its subjects/topics)
  const existingMusic = await prisma.program.findFirst({
    where: { title: "Music & Performing Arts" },
    include: { subjects: { include: { topics: true } } },
  });

  if (existingMusic) {
    // Delete topics first, then subjects, then program
    for (const subject of existingMusic.subjects) {
      await prisma.topic.deleteMany({ where: { subjectId: subject.id } });
    }
    await prisma.subject.deleteMany({ where: { programId: existingMusic.id } });
    await prisma.program.delete({ where: { id: existingMusic.id } });
    console.log("Removed existing Music & Performing Arts program");
  }

  // Create clean Music & Performing Arts program
  await prisma.program.create({
    data: {
      title: musicProgram.title,
      level: musicProgram.level,
      text: musicProgram.text,
      sortOrder: musicProgram.sortOrder,
      subjects: {
        create: musicProgram.subCategories.map((sc) => ({
          name: sc.name,
          topics: {
            create: sc.topics.map(t => ({ name: t }))
          }
        })),
      },
    },
  });
  console.log("Created clean Music & Performing Arts program");

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
