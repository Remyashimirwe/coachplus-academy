import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/app/lib/db";
import { issueVerificationCode } from "@/app/lib/verification";
import { notifyAdmins } from "@/app/lib/notifications";

/**
 * Self-service sign-up, shared by the app's Register screen and the website's
 * `/register` page so both behave identically.
 *
 * Two very different outcomes depending on the role, which is the one part of
 * this route worth reading carefully:
 *
 *  - **STUDENT** — an account is created immediately and a 6-digit code is
 *    emailed. The account is unusable until that code is entered, which is
 *    what stops someone signing up with an address they do not control.
 *
 *  - **TEACHER** — no account is created at all. The request is filed as a
 *    `TeacherApplication` and goes into the same admin review queue as the
 *    public "Become a teacher" form. A teacher can take money, see minors'
 *    attendance and be assigned students, so letting anyone self-approve into
 *    that role would bypass the vetting the rest of the product is built
 *    around. The applicant gets an invite email only once an admin approves
 *    them, which is exactly how the existing pipeline already works.
 *
 * `ADMIN` is refused outright. There is no path from a public form to an
 * administrator account.
 */

/** Roles a person may pick for themselves. Administrator is deliberately absent. */
const SELF_SERVICE_ROLES = ["STUDENT", "TEACHER"] as const;

/** Matches the app's form validation ("At least 8 characters"). */
const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    // Trimmed but deliberately *not* lowercased: every other lookup in the
    // system (`/api/login`, `/api/auth/login`) matches the address exactly as
    // stored, so normalising the case here would create accounts those routes
    // then fail to find.
    const email = String(body?.email ?? "").trim();
    const password = String(body?.password ?? "");
    const role = String(body?.role ?? "STUDENT").trim().toUpperCase();
    const phone = String(body?.phone ?? "").trim();
    const subjects = String(body?.subjects ?? "").trim();
    const agreedToTerms = body?.agreedToTerms === true;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required." },
        { status: 400 },
      );
    }
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 },
      );
    }
    // Explicitly reject anything that is not a pickable role. Comparing
    // against the allow-list (rather than just "is it ADMIN?") means a future
    // role cannot accidentally become self-serve by default.
    if (!(SELF_SERVICE_ROLES as readonly string[]).includes(role)) {
      return NextResponse.json(
        { error: "Only students and teachers can sign up here. Admin accounts are created by an administrator." },
        { status: 403 },
      );
    }

    // ── Teacher: file an application, create no account ──────────────
    if (role === "TEACHER") {
      const existingUser = await db.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json(
          { error: "An account already exists for this email. Please sign in instead." },
          { status: 409 },
        );
      }

      const openApplication = await db.teacherApplication.findFirst({
        where: { email, status: "pending" },
      });
      if (openApplication) {
        return NextResponse.json(
          { error: "We already have a teaching application for this email and it is still under review." },
          { status: 409 },
        );
      }

      await db.teacherApplication.create({
        data: {
          fullName: name,
          email,
          phone,
          subjects,
          agreedToTerms,
          status: "pending",
        },
      });

      // An application is the one thing an admin must not miss, so this goes
      // straight to the admin bell as well as the review queue. There is no
      // actor to exclude — nobody has an account yet.
      await notifyAdmins({
        title: "New teacher application",
        message: `${name} applied to teach.`,
        type: "info",
      });

      return NextResponse.json(
        {
          requiresApproval: true,
          message:
            "Thanks — your teaching application has been submitted. Our team will review it and email you once a decision is made.",
        },
        // 201, matching the student branch and the contract the clients check
        // for: a resource *was* created (the application), and the app only
        // inspects `requiresApproval` after seeing a success status. Returning
        // a bare 200 here made the app treat its own success as a failure.
        { status: 201 },
      );
    }

    // ── Student: create the account now, gate it behind the code ─────
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account already exists for this email. Please sign in instead." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "STUDENT",
        // The password is set by the person themselves, not accepted via an
        // admin invite, so this is not a first login.
        isFirstLogin: false,
        emailVerified: false,
        studentProfile: { create: { phone } },
      },
      include: { teacherProfile: true, studentProfile: true },
    });

    // Emails the code. If Resend rejects the send the code is cleared again,
    // so there is nothing outstanding to verify — the app/website are expected
    // to tell the user to try again rather than hang on an OTP screen.
    await issueVerificationCode(user, "register");

    return NextResponse.json(
      {
        requiresVerification: true,
        message: `We sent a 6-digit code to ${user.email}. Enter it to activate your account.`,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isFirstLogin: user.isFirstLogin,
          profileId: user.studentProfile?.id ?? null,
          teacherId: user.teacherProfile?.id ?? null,
          studentId: user.studentProfile?.id ?? null,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 },
    );
  }
}
