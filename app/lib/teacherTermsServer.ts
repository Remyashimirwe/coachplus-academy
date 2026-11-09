import { getSetting, setSetting } from "@/app/lib/db";
import {
  normalizeTeacherTerms,
  parseTeacherTerms,
  type TeacherTerms,
} from "@/app/lib/teacherTerms";

/** Prisma `Setting.key` for the editable Teacher Partner agreement. */
export const TEACHER_TERMS_KEY = "teacher_partner_terms";

/** Current agreement content, falling back to the built-in defaults. */
export async function getTeacherTerms(): Promise<TeacherTerms> {
  const raw = await getSetting(TEACHER_TERMS_KEY, "");
  return parseTeacherTerms(raw);
}

/** Persists normalized agreement content and returns what was stored. */
export async function saveTeacherTerms(value: unknown): Promise<TeacherTerms> {
  const terms = normalizeTeacherTerms(value);
  await setSetting(TEACHER_TERMS_KEY, JSON.stringify(terms));
  return terms;
}
