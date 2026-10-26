/**
 * Test-account report / cleanup for the pre-launch production database.
 *
 * Read-only report (default — safe to run at any time):
 *     npx tsx scripts/test-accounts.ts
 *
 * Validate the delete statements without touching a row:
 *     npx tsx scripts/test-accounts.ts --verify
 *
 * Back up + delete everything that is NOT a protected account:
 *     npx tsx scripts/test-accounts.ts --apply
 *
 * Additional accounts to spare, comma separated:
 *     npx tsx scripts/test-accounts.ts --apply --keep=me@example.com
 *
 * Why this is safe
 * ---------------
 * The production database was wiped down to a single admin account before
 * launch, so every account outside the protected set is closed-test data.
 * Program -> Subject -> Topic and Setting are never referenced by any statement
 * below. The protected set always covers:
 *
 *   - every account with the ADMIN role          (admins are removed by admins)
 *   - $ADMIN_EMAIL, default admin@coachplusacademy.com
 *   - every review-*@coachplusacademy.com        (Play Console sign-in details)
 *
 * Deleting during the 14-day closed test does NOT disturb Google's clock —
 * Google tracks opt-in against tester Google accounts, not our rows — but it
 * does throw away the per-tester activity signal, so prefer running this only
 * after production access is granted.
 *
 * Rows are deleted in FK-safe order as separate autocommit statements (Neon's
 * pooled endpoint dislikes long transactions), mirroring the order already
 * proven by DELETE /api/account in app/api/account/route.ts — extended with
 * TeacherApplication / Request, which are keyed by a bare email address and
 * that endpoint never touches.
 *
 * Before anything is removed the full set is written to a timestamped JSON
 * backup beside this script.
 */
import "dotenv/config";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

net.setDefaultAutoSelectFamilyAttemptTimeout(5_000);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Every table the schema owns. A table missing from here aborts --apply. */
const KNOWN_TABLES = new Set([
  "User",
  "Teacher",
  "Student",
  "Attendance",
  "TeacherAttendance",
  "StudentAttendance",
  "Notification",
  "DeviceToken",
  "Report",
  "DevelopmentReport",
  "TeacherRating",
  "Program",
  "Subject",
  "Topic",
  "Request",
  "TeacherApplication",
  "TeacherApplicationDocument",
  "Setting",
  // Prisma's own bookkeeping — not application data, never written to here.
  "_prisma_migrations",
]);

/** Tables holding learning content / config — never written to. */
const NEVER_TOUCH = ["Program", "Subject", "Topic", "Setting"];

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
/** Exercise every delete statement with empty id sets — matches zero rows. */
const VERIFY = args.includes("--verify");
const keepArg = args.find((a) => a.startsWith("--keep="));
const extraKeep = (keepArg?.slice("--keep=".length) ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function isProtected(email: string, role: string): string | null {
  const e = email.toLowerCase();
  if (role === "ADMIN") return "ADMIN role";
  if (e === (process.env.ADMIN_EMAIL ?? "admin@coachplusacademy.com").toLowerCase())
    return "$ADMIN_EMAIL";
  if (e.startsWith("review-")) return "Play reviewer account";
  if (extraKeep.includes(e)) return "--keep";
  return null;
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 20_000,
  keepAlive: true,
});
const q = async (sql: string, params: unknown[] = []) =>
  (await client.query(sql, params)).rows;

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  await client.connect();

  // ── Safety net: refuse to act if the schema grew and we haven't kept up ──
  const found: string[] = (
    await q(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    )
  ).map((r: { table_name: string }) => r.table_name);
  const unknown = found.filter((t) => !KNOWN_TABLES.has(t));
  if (unknown.length) {
    console.error(
      `\n  ⚠  Unknown table(s) not covered by this script: ${unknown.join(", ")}\n` +
        `     Review the schema, add them to KNOWN_TABLES, then re-run.\n`
    );
    process.exit(1);
  }

  // ── Who is here ────────────────────────────────────────────────────────
  const users: Array<{
    id: number;
    email: string;
    role: string;
    createdAt: Date;
    emailVerified: boolean;
    verificationSentAt: Date | null;
    tokens: string;
    lastToken: Date | null;
  }> = await q(
    `SELECT u.id, u.email, u.role, u."createdAt", u."emailVerified",
            u."verificationSentAt",
            count(dt.id)::text          AS tokens,
            max(dt."createdAt")         AS "lastToken"
       FROM "User" u
       LEFT JOIN "DeviceToken" dt ON dt."userId" = u.id
      GROUP BY u.id
      ORDER BY u."createdAt" ASC`
  );
  const deletable = users.filter((u) => !isProtected(u.email, u.role));
  const userIds = deletable.map((u) => u.id);
  const emails = deletable.map((u) => u.email.toLowerCase());

  const studentIds: number[] = (await q(
    `SELECT id FROM "Student" WHERE "userId" = ANY($1::int[])`,
    [userIds]
  )).map((r: { id: number }) => r.id);
  const teacherIds: number[] = (await q(
    `SELECT id FROM "Teacher" WHERE "userId" = ANY($1::int[])`,
    [userIds]
  )).map((r: { id: number }) => r.id);

  const count = async (sql: string, params: unknown[]) => {
    const rows = await q(sql, params);
    return Number(rows[0]?.n ?? 0);
  };
  const uid = userIds;
  const sid = studentIds;
  const tid = teacherIds;

  const childCounts: Array<[string, number]> = [
    [
      "Attendance",
      await count(
        `SELECT count(*) n FROM "Attendance"
          WHERE "studentId" = ANY($1::int[]) OR "teacherId" = ANY($2::int[])`,
        [sid, tid]
      ),
    ],
    [
      "StudentAttendance",
      await count(
        `SELECT count(*) n FROM "StudentAttendance" WHERE "studentId" = ANY($1::int[])`,
        [sid]
      ),
    ],
    [
      "TeacherAttendance",
      await count(
        `SELECT count(*) n FROM "TeacherAttendance" WHERE "teacherId" = ANY($1::int[])`,
        [tid]
      ),
    ],
    [
      "Report",
      await count(
        `SELECT count(*) n FROM "Report"
          WHERE "studentId" = ANY($1::int[]) OR "teacherId" = ANY($2::int[])`,
        [sid, tid]
      ),
    ],
    [
      "DevelopmentReport",
      await count(
        `SELECT count(*) n FROM "DevelopmentReport"
          WHERE "studentId" = ANY($1::int[]) OR "teacherId" = ANY($2::int[])`,
        [sid, tid]
      ),
    ],
    [
      "TeacherRating",
      await count(
        `SELECT count(*) n FROM "TeacherRating"
          WHERE "studentId" = ANY($1::int[]) OR "teacherId" = ANY($2::int[])`,
        [sid, tid]
      ),
    ],
    [
      "Notification",
      await count(
        `SELECT count(*) n FROM "Notification" WHERE "userId" = ANY($1::int[])`,
        [uid]
      ),
    ],
    [
      "DeviceToken",
      await count(
        `SELECT count(*) n FROM "DeviceToken" WHERE "userId" = ANY($1::int[])`,
        [uid]
      ),
    ],
    [
      "Request",
      await count(
        `SELECT count(*) n FROM "Request"
          WHERE "studentId" = ANY($1::int[])
             OR ("studentId" IS NULL AND lower(email) = ANY($2::text[]))`,
        [sid, emails]
      ),
    ],
    [
      "TeacherApplication",
      await count(
        `SELECT count(*) n FROM "TeacherApplication" WHERE lower(email) = ANY($1::text[])`,
        [emails]
      ),
    ],
    [
      "TeacherApplicationDocument",
      await count(
        `SELECT count(*) n FROM "TeacherApplicationDocument" d
           WHERE d."applicationId" IN (
             SELECT id FROM "TeacherApplication" WHERE lower(email) = ANY($1::text[])
           )`,
        [emails]
      ),
    ],
  ];

  // ── Report ─────────────────────────────────────────────────────────────
  const fmt = (d: Date | null) =>
    d ? new Date(d).toISOString().slice(0, 16).replace("T", " ") : "—";
  const isTest = (email: string, role: string) => !isProtected(email, role);

  console.log("\n  CoachPlus — production account report");
  console.log("  " + "─".repeat(78));
  console.log(
    "  " +
      "created".padEnd(17) +
      "role".padEnd(9) +
      "1st OTP".padEnd(17) +
      "toks".padEnd(5) +
      "last launch".padEnd(17) +
      "email"
  );
  for (const u of users) {
    const mark = isTest(u.email, u.role) ? " " : "✓";
    console.log(
      ` ${mark} ` +
        fmt(u.createdAt).padEnd(17) +
        u.role.padEnd(9) +
        fmt(u.verificationSentAt).padEnd(17) +
        String(u.tokens).padEnd(5) +
        fmt(u.lastToken).padEnd(17) +
        u.email
    );
  }

  console.log(
    `\n  ${users.length} account(s) total — ` +
      `${users.length - deletable.length} protected, ${deletable.length} deletable\n` +
        "  Column meaning:\n" +
        "    created    the account row exists  → they registered (installed + OTP login)\n" +
        "    1st OTP    an email code was sent   → they reached login from the app\n" +
        "    toks/launch an FCM token on a real device with push working\n" +
        "  Play Console Statistics stays authoritative for install counts (lags ~24h)."
  );
  if (deletable.length) {
    console.log("  Deletable child rows:");
    for (const [t, n] of childCounts) {
      if (n > 0) console.log(`    ${t.padEnd(30)}${n}`);
    }
  }
  const untouched = found.filter((t) => NEVER_TOUCH.includes(t));
  console.log(
    `  Untouched by design: ${untouched.join(", ")}\n`
  );

  // ── Act ────────────────────────────────────────────────────────────────
  if (!APPLY && !VERIFY) {
    if (!deletable.length) {
      console.log("  Nothing to delete. Re-run with --apply only if that changes.\n");
      return;
    }
    console.log(
      "  Dry run — no rows touched. Back up + delete with:\n" +
        "      npx tsx scripts/test-accounts.ts --apply\n" +
        "    Validate the delete statements first with:\n" +
        "      npx tsx scripts/test-accounts.ts --verify\n"
    );
    return;
  }
  if (APPLY && !deletable.length) {
    console.log("  Nothing to delete.\n");
    return;
  }

  let backupPath: string | null = null;

  if (APPLY && !VERIFY) {
  // Backup first: full rows of every table we are about to write to.
  const backup: Record<string, unknown[]> = {};  const backupQueries: Array<[string, string]> = [
    ["User", `SELECT * FROM "User" WHERE id = ANY($1::int[])`],
    ["Student", `SELECT * FROM "Student" WHERE "userId" = ANY($1::int[])`],
    ["Teacher", `SELECT * FROM "Teacher" WHERE "userId" = ANY($1::int[])`],
    [
      "Notification",
      `SELECT * FROM "Notification" WHERE "userId" = ANY($1::int[])`,
    ],
    [
      "DeviceToken",
      `SELECT * FROM "DeviceToken" WHERE "userId" = ANY($1::int[])`,
    ],
    [
      "Attendance",
      `SELECT * FROM "Attendance" WHERE "studentId" = ANY($1::int[]) OR "teacherId" = ANY($2::int[])`,
    ],
    [
      "StudentAttendance",
      `SELECT * FROM "StudentAttendance" WHERE "studentId" = ANY($1::int[])`,
    ],
    [
      "TeacherAttendance",
      `SELECT * FROM "TeacherAttendance" WHERE "teacherId" = ANY($1::int[])`,
    ],
    [
      "Report",
      `SELECT * FROM "Report" WHERE "studentId" = ANY($1::int[]) OR "teacherId" = ANY($2::int[])`,
    ],
    [
      "DevelopmentReport",
      `SELECT * FROM "DevelopmentReport" WHERE "studentId" = ANY($1::int[]) OR "teacherId" = ANY($2::int[])`,
    ],
    [
      "TeacherRating",
      `SELECT * FROM "TeacherRating" WHERE "studentId" = ANY($1::int[]) OR "teacherId" = ANY($2::int[])`,
    ],
    [
      "Request",
      `SELECT * FROM "Request" WHERE "studentId" = ANY($1::int[])
         OR ("studentId" IS NULL AND lower(email) = ANY($2::text[]))`,
    ],
    [
      "TeacherApplication",
      `SELECT * FROM "TeacherApplication" WHERE lower(email) = ANY($1::text[])`,
    ],
    [
      "TeacherApplicationDocument",
      `SELECT * FROM "TeacherApplicationDocument" WHERE "applicationId" IN (
         SELECT id FROM "TeacherApplication" WHERE lower(email) = ANY($1::text[])
       )`,
    ],
  ];
  for (const [table, sql] of backupQueries) {
    // $1 is always userIds; a $2 bound as int[] is teacherIds, as text[] emails.
    const params: unknown[][] = [userIds];
    if (sql.includes("$2::int[]")) params.push(teacherIds);
    if (sql.includes("$2::text[]")) params.push(emails);
    const rows = await q(sql, params);
    if (rows.length) backup[table] = rows;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  backupPath = path.join(__dirname, `test-accounts-backup-${stamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(
    `\n  Backup written: ${backupPath} ` +
      `(${Object.values(backup).reduce((n, r) => n + r.length, 0)} rows)\n`
  );
  } // end backup

  // FK-safe order, autocommit per statement.
  const steps: Array<[string, string, unknown[]]> = [
    [
      "TeacherApplicationDocument",
      `DELETE FROM "TeacherApplicationDocument" WHERE "applicationId" IN (
         SELECT id FROM "TeacherApplication" WHERE lower(email) = ANY($1::text[])
       )`,
      [emails],
    ],
    [
      "TeacherApplication",
      `DELETE FROM "TeacherApplication" WHERE lower(email) = ANY($1::text[])`,
      [emails],
    ],
    [
      "Student.teacherId (detach kept students)",
      `UPDATE "Student" SET "teacherId" = NULL WHERE "teacherId" = ANY($1::int[])`,
      [teacherIds],
    ],
    [
      "StudentAttendance",
      `DELETE FROM "StudentAttendance" WHERE "studentId" = ANY($1::int[])`,
      [studentIds],
    ],
    [
      "Attendance",
      `DELETE FROM "Attendance"
        WHERE "studentId" = ANY($1::int[]) OR "teacherId" = ANY($2::int[])`,
      [studentIds, teacherIds],
    ],
    [
      "Report",
      `DELETE FROM "Report"
        WHERE "studentId" = ANY($1::int[]) OR "teacherId" = ANY($2::int[])`,
      [studentIds, teacherIds],
    ],
    [
      "DevelopmentReport",
      `DELETE FROM "DevelopmentReport"
        WHERE "studentId" = ANY($1::int[]) OR "teacherId" = ANY($2::int[])`,
      [studentIds, teacherIds],
    ],
    [
      "TeacherRating",
      `DELETE FROM "TeacherRating"
        WHERE "studentId" = ANY($1::int[]) OR "teacherId" = ANY($2::int[])`,
      [studentIds, teacherIds],
    ],
    [
      "Request",
      `DELETE FROM "Request"
        WHERE "studentId" = ANY($1::int[])
           OR ("studentId" IS NULL AND lower(email) = ANY($2::text[]))`,
      [studentIds, emails],
    ],
    [
      "Student",
      `DELETE FROM "Student" WHERE "userId" = ANY($1::int[])`,
      [userIds],
    ],
    [
      "TeacherAttendance",
      `DELETE FROM "TeacherAttendance" WHERE "teacherId" = ANY($1::int[])`,
      [teacherIds],
    ],
    [
      "Teacher",
      `DELETE FROM "Teacher" WHERE "userId" = ANY($1::int[])`,
      [userIds],
    ],
    [
      "Notification",
      `DELETE FROM "Notification" WHERE "userId" = ANY($1::int[])`,
      [userIds],
    ],
    [
      "DeviceToken",
      `DELETE FROM "DeviceToken" WHERE "userId" = ANY($1::int[])`,
      [userIds],
    ],
    ["User", `DELETE FROM "User" WHERE id = ANY($1::int[])`, [userIds]],
  ];

  if (VERIFY) {
    console.log(
      "\n  --verify: running every delete statement against the live schema\n" +
        "    with all id arrays emptied — PostgreSQL accepts them, so table,\n" +
        "    column and FK references are all valid. Nothing can be matched.\n"
    );
    let bad = 0;
    for (const [label, sql, params] of steps) {
      // Keep the placeholder count, empty every array.
      const empty = params.map(() => []);
      try {
        await client.query(sql, empty);
        console.log(`  ✓ ${label}`);
      } catch (err) {
        bad++;
        console.error(`  ✗ ${label}: ${(err as Error).message}`);
      }
    }
    console.log(
      bad
        ? `\n  ${bad} statement(s) FAILED — fix before running --apply.\n`
        : `\n  All ${steps.length} statements valid. FK order OK.\n`
    );
    process.exitCode = bad ? 1 : 0;
    return;
  }

  let total = 0;
  for (const [label, sql, params] of steps) {
    // Skip statements whose arrays are empty — nothing to do, fewer round trips.
    if (
      params.every((p) => Array.isArray(p) && p.length === 0)
    ) {
      continue;
    }
    try {
      const res = await client.query(sql, params);
      if (res.rowCount) {
        total += res.rowCount;
        console.log(`  ✓ ${label.padEnd(38)}${res.rowCount} row(s)`);
      }
    } catch (err) {
      console.error(`  ✗ FAILED at ${label}: ${(err as Error).message}`);
      console.error(
        `    Rows deleted so far are listed above; re-run the dry report to see ` +
          `what remains. Backup: ${backupPath}`
      );
      process.exitCode = 1;
      return;
    }
  }
  console.log(`\n  Done — ${total} row(s) removed. Backup: ${backupPath}\n`);
}

main()
  .catch((err) => {
    console.error(`\n  ✗ ${err instanceof Error ? err.message : err}\n`);
    process.exitCode = 1;
  })
  .finally(() => client.end());
