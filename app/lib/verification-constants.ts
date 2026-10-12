/**
 * Verification constants shared by the server (see `verification.ts`) and by
 * client components such as `OtpStep`.
 *
 * They live in their own module with no imports on purpose: `verification.ts`
 * pulls in the Prisma client and the Resend SDK, so importing it from a
 * `"use client"` component would drag server-only code into the browser bundle.
 * `verification.ts` re-exports everything below, so existing server-side
 * imports keep working unchanged.
 */

/** How long a freshly issued code stays valid. */
export const VERIFICATION_TTL_MINUTES = 10;

/** Wrong guesses allowed before the code is invalidated and must be resent. */
export const VERIFICATION_MAX_ATTEMPTS = 5;

/**
 * Minimum gap between two emails for the same account/purpose. The client also
 * counts down 60s before enabling its "Resend code" link — this is the value
 * both sides agree on, and the server enforces it regardless of what the UI
 * does, so the endpoint cannot be used to flood an inbox.
 */
export const VERIFICATION_RESEND_COOLDOWN_SECONDS = 60;
