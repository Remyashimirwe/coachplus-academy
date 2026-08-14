// Helpers used to suggest the best-fitting teacher for a student (or the
// best-fitting request for a teacher), based on the student's branch
// (location) and the subjects/courses they want to learn.

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
  branch?: string | null;
  subjects?: string | null;
}

export interface MatchResult {
  score: number;
  branchMatch: boolean;
  matchedSubjects: string[];
}

/**
 * Scores how well a teacher fits a student, based on the student's branch
 * (location) and the subjects they want to learn. Higher score = better fit.
 * A branch match matters most (a student generally needs a teacher they can
 * meet near their branch), followed by how many subjects overlap.
 */
export function scoreTeacherForStudent(teacher: MatchInput, student: MatchInput): MatchResult {
  const branchMatch =
    !!teacher.branch && !!student.branch && teacher.branch.trim().toLowerCase() === student.branch.trim().toLowerCase();

  const teacherSubjects = splitList(teacher.subjects);
  const studentSubjects = splitList(student.subjects);
  const matchedSubjects = countSubjectOverlap(studentSubjects, teacherSubjects);

  const score = (branchMatch ? 50 : 0) + matchedSubjects.length * 15;

  return { score, branchMatch, matchedSubjects };
}

export function matchLabel(result: MatchResult): string | null {
  if (result.branchMatch && result.matchedSubjects.length > 0) return "Best match";
  if (result.branchMatch) return "Same branch";
  if (result.matchedSubjects.length > 0) return "Subject match";
  return null;
}
