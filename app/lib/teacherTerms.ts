/**
 * Editable "Teacher Partner Terms & Conditions" content.
 *
 * Stored as JSON in the Prisma `Setting` table under
 * `teacher_partner_terms`, so the website and the Flutter app can render the
 * same content that an administrator edits from either admin dashboard.
 *
 * This module is intentionally dependency-free: client components import the
 * types, the defaults and the parsers, while the database helpers live in
 * `teacherTermsServer.ts`.
 */

export type TeacherTermsSection = {
  title: string;
  points: string[];
};

export type TeacherTerms = {
  title: string;
  subtitle: string;
  notice: string;
  sections: TeacherTermsSection[];
  acknowledgmentTitle: string;
  acknowledgment: string;
};

/** Used until an administrator saves custom content. */
export const DEFAULT_TEACHER_TERMS: TeacherTerms = {
  title: "Teacher Partner Terms & Conditions",
  subtitle: "COACHPLUS ACADEMY",
  notice: "Please review our partnership policies carefully",
  sections: [
    {
      title: "YOUR STATUS & PART-TIME DISPATCH",
      points: [
        "Independent Educator: You are joining CoachPlus Academy as an independent, part-time teacher partner, not as a permanent full-time employee.",
        "Session-Based Work: Assignments are offered on a part-time, per-session basis depending on client demand and your location. CoachPlus Academy does not guarantee a fixed monthly salary or a fixed number of hours.",
        "Brand Representation: When dispatched to teach a CoachPlus Academy student, you act as an official representative of our academy. You must arrive on time, dress professionally, and maintain high teaching standards.",
        "No Fixed Monthly Salary: You pay teachers based on completed hours or matched sessions. You do not owe them a fixed monthly wage if there are no active clients in their area.",
        "No Employment Liabilities: Because they are independent partners, CoachPlus Academy is not legally required to provide full-time benefits, pension contributions, paid annual leave, or severance pay.",
        "Platform Membership: Teachers are members of your certified Educator Network/Forum. They maintain their freedom to work elsewhere, but whenever they accept a CoachPlus Academy dispatch, they must follow your code of conduct and represent your brand professionally.",
      ],
    },
    {
      title: "TEACHING STANDARDS & CONDUCT",
      points: [
        "Lesson Preparation: You must prepare your lessons well and help your assigned students reach their goals.",
        "Zero Misconduct: Bad behavior is strictly prohibited. This includes showing up late, using inappropriate language, attending lessons under the influence of alcohol or drugs, or engaging in any unprofessional conduct with students or parents.",
        "Account Removal: Breaking these conduct rules will lead to immediate removal from our active teacher database.",
      ],
    },
    {
      title: "SAFETY, THEFT & LEGAL RESPONSIBILITY",
      points: [
        "Respecting Client Homes: During home-coaching visits, you must respect the client's home, privacy, and family rules.",
        "Theft and Property Damage: If a teacher steals, causes intentional property damage, or breaks the law, CoachPlus Academy will immediately terminate their profile and report them to law enforcement.",
        "Personal Liability: You accept full legal and financial responsibility for your personal actions, damage, or misconduct during active coaching sessions.",
      ],
    },
    {
      title: "NO DIRECT CASH OR PRIVATE DEALS",
      points: [
        "Client Ownership: All students, parents, and bookings matched through CoachPlus Academy belong exclusively to the CoachPlus Academy platform.",
        "No Direct Payments: You must never ask for or accept direct cash, private mobile money, or bank transfers from parents. All client payments are collected directly by CoachPlus Academy.",
        "No Private Deals: You are strictly forbidden from making private offline coaching deals with CoachPlus Academy clients outside our platform.",
        "Penalties: Attempting to bypass the platform will result in immediate profile deactivation, forfeiture of unpaid earnings, and potential legal recovery of lost fees.",
      ],
    },
    {
      title: "LESSON SCHEDULES & CANCELLATIONS",
      points: [
        "Package Completion: Once you accept a student match, you commit to finishing the full scheduled package.",
        "24-Hour Notice: If you face an emergency and cannot attend a lesson, you must inform CoachPlus Academy at least 24 hours in advance. Unexcused absences will result in payment deductions or account suspension.",
      ],
    },
    {
      title: "HOW YOU GET PAID",
      points: [
        "Central Billing: CoachPlus Academy handles all client billing directly before lessons begin.",
        "Teacher Payouts: You will receive your agreed partner payment after verified completion of your assigned coaching hours according to our standard payout schedule.",
        "Transport: The cost of transport will be conducted based on your Location provided during registration and it is paid once you start coaching.",
      ],
    },
  ],
  acknowledgmentTitle: "Acknowledgment & Sign-Off",
  acknowledgment:
    "By checking the agreement box on our website, you confirm that you have read, understood, and agreed to follow all the rules in this agreement.",
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function textOr(value: unknown, fallback: string): string {
  return clean(value) || fallback;
}

/** Deep copy so callers can freely edit the object in component state. */
export function cloneTeacherTerms(terms: TeacherTerms): TeacherTerms {
  return {
    ...terms,
    sections: terms.sections.map((section) => ({
      title: section.title,
      points: [...section.points],
    })),
  };
}

function defaultTerms(): TeacherTerms {
  return cloneTeacherTerms(DEFAULT_TEACHER_TERMS);
}

/**
 * Coerces stored/JSON input into a complete [TeacherTerms]. Missing or
 * malformed fields fall back to the built-in defaults so a partially written
 * setting can never blank out the applicant-facing agreement.
 */
export function normalizeTeacherTerms(value: unknown): TeacherTerms {
  if (!value || typeof value !== "object") return defaultTerms();

  const input = value as Record<string, unknown>;
  const sections: TeacherTermsSection[] = Array.isArray(input.sections)
    ? input.sections
        .map((raw) => {
          const section =
            raw && typeof raw === "object"
              ? (raw as Record<string, unknown>)
              : {};
          const points = Array.isArray(section.points)
            ? section.points.map((point) => clean(point)).filter(Boolean)
            : [];
          return { title: clean(section.title), points };
        })
        .filter((section) => section.title || section.points.length > 0)
    : [];

  return {
    title: textOr(input.title, DEFAULT_TEACHER_TERMS.title),
    subtitle: textOr(input.subtitle, DEFAULT_TEACHER_TERMS.subtitle),
    notice: textOr(input.notice, DEFAULT_TEACHER_TERMS.notice),
    sections: sections.length > 0 ? sections : cloneTeacherTerms(DEFAULT_TEACHER_TERMS).sections,
    acknowledgmentTitle: textOr(
      input.acknowledgmentTitle,
      DEFAULT_TEACHER_TERMS.acknowledgmentTitle
    ),
    acknowledgment: textOr(
      input.acknowledgment,
      DEFAULT_TEACHER_TERMS.acknowledgment
    ),
  };
}

/** Parses the raw `Setting.value` string. Invalid JSON means "use defaults". */
export function parseTeacherTerms(raw: string | null | undefined): TeacherTerms {
  if (!raw) return defaultTerms();
  try {
    return normalizeTeacherTerms(JSON.parse(raw));
  } catch {
    return defaultTerms();
  }
}

/**
 * Validates content submitted by an admin editor. Returns a user-facing error
 * message, or `null` when the content is safe to save.
 */
export function validateTeacherTerms(value: unknown): string | null {
  if (!value || typeof value !== "object") return "Invalid terms content.";

  const input = value as Record<string, unknown>;
  if (!clean(input.title)) return "A title is required.";
  if (!clean(input.acknowledgmentTitle)) {
    return "An acknowledgment title is required.";
  }
  if (!clean(input.acknowledgment)) return "The acknowledgment text is required.";
  if (!Array.isArray(input.sections) || input.sections.length === 0) {
    return "Add at least one section.";
  }

  for (let index = 0; index < input.sections.length; index += 1) {
    const raw = input.sections[index];
    const section =
      raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    if (!clean(section.title)) return `Section ${index + 1} needs a title.`;
    const points = Array.isArray(section.points)
      ? section.points.map((point) => clean(point)).filter(Boolean)
      : [];
    if (points.length === 0) {
      return `Section "${clean(section.title)}" needs at least one point.`;
    }
  }

  return null;
}
