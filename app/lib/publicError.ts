/**
 * Helpers for turning thrown errors into messages that are safe to return to
 * an applicant.
 *
 * Server logs keep the full error; API responses must not. A raw
 * "Failed to fetch" (browser/undici), a Prisma code, or a socket error gives
 * the user no way to recover and leaks internals.
 */

const TECHNICAL_MESSAGE_PATTERN =
  /failed to fetch|fetch failed|networkerror|load failed|typeerror|econnrefused|econnreset|etimedout|enotfound|eai_again|socketexception|clientexception|invalid prisma|\bp\d{4}\b|sqlstate|stack trace|at\s+\S+\s*\(.+:\d+:\d+\)/i;

const DATABASE_ERROR_CODES = new Set([
  "P1000", // authentication failed
  "P1001", // cannot reach database server
  "P1002", // database server timed out
  "P1008", // operation timed out
  "P1017", // server closed the connection
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
  "57P01", // admin shutdown
  "08006", // connection failure
]);

export function isTechnicalMessage(message: string): boolean {
  return TECHNICAL_MESSAGE_PATTERN.test(message);
}

/** True when the error looks like a database/network outage rather than bad input. */
export function isUnavailableError(error: unknown): boolean {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
  if (DATABASE_ERROR_CODES.has(code)) return true;

  const message = error instanceof Error ? error.message : String(error ?? "");
  return /connect|connection|timeout|timed out|terminated|unreachable|econn|etimedout|enotfound|eai_again|failed to fetch|fetch failed/i.test(
    message,
  );
}

/**
 * Returns [error]'s message only when it is a short, human-readable
 * explanation. Anything technical falls back to [fallback].
 */
export function safeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const message = error.message?.trim();
    if (
      message &&
      message.length <= 300 &&
      !message.includes("\n") &&
      !isTechnicalMessage(message)
    ) {
      return message;
    }
  }
  return fallback;
}
