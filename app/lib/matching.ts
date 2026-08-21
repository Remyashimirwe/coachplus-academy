// Helpers used to suggest the best-fitting teacher for a student (or the
// best-fitting request for a teacher), based on the subjects/courses they
// want to learn.

/** Splits a comma-separated field (e.g. "Mathematics, Coding") into clean, lowercased tokens. */
function splitList(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[,/]|\(Topics:|\)/gi)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Counts how many distinct subjects/topics two lists have in common (substring-tolerant). */
function countSubjectOverlap(a: string[], b: string[]): string[] {
  const matches: string[] = [];
  for (const item of a) {
    const hit = b.find((other) => other === item || other.includes(item) || item.includes(other));
    if (hit && !matches.includes(item)) matches.push(item);
  }
  return matches;
}

export interface MatchInput {
  subjects?: string | null;
}

export interface MatchResult {
  score: number;
  matchedSubjects: string[];
}

/**
 * Scores how well a teacher fits a student, based on the subjects they want
 * to learn. Higher score = better fit.
 */
export function scoreTeacherForStudent(teacher: MatchInput, student: MatchInput): MatchResult {
  const teacherSubjects = splitList(teacher.subjects);
  const studentSubjects = splitList(student.subjects);
  const matchedSubjects = countSubjectOverlap(studentSubjects, teacherSubjects);

  const score = matchedSubjects.length * 15;

  return { score, matchedSubjects };
}

export function matchLabel(result: MatchResult): string | null {
  if (result.matchedSubjects.length > 0) return "Subject match";
  return null;
}
