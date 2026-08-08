import "server-only";
import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import path from "node:path";
import bcrypt from "bcryptjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(dir, "..", "data.db");

export const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    level TEXT NOT NULL,
    text TEXT NOT NULL,
    points TEXT NOT NULL DEFAULT '[]',
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    grade TEXT NOT NULL DEFAULT '',
    subjects TEXT NOT NULL DEFAULT '',
    details TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@wecouch.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    "INSERT OR IGNORE INTO admins (email, password_hash, name) VALUES (?, ?, ?)"
  ).run(email, hash, "Admin");
}

function seedPrograms() {
  const count = db
    .prepare("SELECT COUNT(*) AS count FROM programs")
    .get() as { count: number };
  if (count.count > 0) return;

  const seed = [
    {
      title: "Primary School Support",
      level: "Grades 1-6",
      text: "Friendly tutoring for reading, writing, numeracy, homework routines, and classroom confidence.",
      points: ["Literacy and numeracy", "Homework coaching", "Foundation skills"],
    },
    {
      title: "Secondary School Mastery",
      level: "Grades 7-12",
      text: "Structured lessons for core subjects, stronger study habits, and consistent academic improvement.",
      points: ["Math and science", "English and humanities", "Progress tracking"],
    },
    {
      title: "Exam Preparation",
      level: "Focused revision",
      text: "Targeted revision plans, practice sessions, test strategy, and accountability before major exams.",
      points: ["Past paper practice", "Weekly revision plans", "Performance reviews"],
    },
    {
      title: "STEM and Coding",
      level: "Beginner to advanced",
      text: "Modern learning for curious students who want to build skills in technology, logic, and problem solving.",
      points: ["Coding basics", "Robotics foundations", "Project learning"],
    },
    {
      title: "Languages",
      level: "All ages",
      text: "Personal language lessons for fluency, grammar, conversation, reading, and school performance.",
      points: ["English support", "Conversation practice", "Writing skills"],
    },
    {
      title: "Home Learning Plan",
      level: "Custom",
      text: "A personalized plan for families who need recurring support across several subjects or goals.",
      points: ["Custom timetable", "Matched teachers", "Parent updates"],
    },
  ];

  const insert = db.prepare(
    "INSERT INTO programs (title, level, text, points, sort_order) VALUES (?, ?, ?, ?, ?)"
  );
  seed.forEach((program, index) => {
    insert.run(
      program.title,
      program.level,
      program.text,
      JSON.stringify(program.points),
      index
    );
  });
}

seedAdmin();
seedPrograms();

export type ProgramRow = {
  id: number;
  title: string;
  level: string;
  text: string;
  points: string;
  sort_order: number;
};

export type RequestRow = {
  id: number;
  parent_name: string;
  email: string;
  phone: string;
  grade: string;
  subjects: string;
  details: string;
  status: string;
  created_at: string;
};

export function getPrograms(): (Omit<ProgramRow, "points"> & {
  points: string[];
})[] {
  const rows = db
    .prepare("SELECT * FROM programs ORDER BY sort_order ASC")
    .all() as ProgramRow[];
  return rows.map((row) => ({ ...row, points: JSON.parse(row.points) }));
}

export function getAdminByEmail(email: string) {
  return db
    .prepare("SELECT * FROM admins WHERE email = ?")
    .get(email) as
    | {
        id: number;
        email: string;
        password_hash: string;
        name: string;
      }
    | undefined;
}
