import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

export type RateLimitPolicy = {
  scope: string;
  identifier: string;
  limit: number;
  windowMs: number;
};

function digest(value: string) {
  const key = process.env.JWT_SECRET || process.env.SESSION_SECRET || "coachplus-local-rate-limit";
  return createHmac("sha256", key).update(value).digest("hex");
}

function requestId(request: Request) {
  return request.headers.get("x-request-id") || crypto.randomUUID();
}

function clientIp(request: Request) {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  return forwarded || "unknown";
}

/**
 * Shared Postgres fixed-window limiter. Identifiers are hashed before storage,
 * so the table never contains raw IP addresses, emails, or account IDs.
 * Requires the additive ApiRateLimit migration before the routes are deployed.
 */
export async function enforceRateLimit(
  request: Request,
  policies: RateLimitPolicy[],
) {
  const now = Date.now();

  try {
    for (const policy of policies) {
      const windowStartMs = Math.floor(now / policy.windowMs) * policy.windowMs;
      const keyHash = digest(`${policy.scope}:${policy.identifier}`);
      const windowStart = new Date(windowStartMs);
      const result = await pool.query<{ hits: number }>(
        `INSERT INTO "ApiRateLimit" ("keyHash", "windowStart", "hits")
         VALUES ($1, $2, 1)
         ON CONFLICT ("keyHash", "windowStart")
         DO UPDATE SET "hits" = "ApiRateLimit"."hits" + 1
         RETURNING "hits"`,
        [keyHash, windowStart],
      );

      if (result.rows[0].hits > policy.limit) {
        const retryAfter = Math.max(
          1,
          Math.ceil((windowStartMs + policy.windowMs - now) / 1000),
        );
        const id = requestId(request);
        return NextResponse.json(
          {
            error: "Too many requests. Please wait and try again.",
            message: "Too many requests. Please wait and try again.",
            code: "RATE_LIMITED",
            requestId: id,
          },
          {
            status: 429,
            headers: { "Retry-After": String(retryAfter), "X-Request-ID": id },
          },
        );
      }
    }

    // Opportunistic cleanup keeps expired buckets bounded without a scheduled
    // job. It uses the same database and runs on a small fraction of requests.
    if (Math.random() < 0.005) {
      await pool.query(
        `DELETE FROM "ApiRateLimit" WHERE "windowStart" < NOW() - INTERVAL '48 hours'`,
      );
    }
    return null;
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "rate_limit_storage_error",
        requestId: requestId(request),
        category: "rate_limit_store_unavailable",
        code:
          typeof error === "object" && error && "code" in error
            ? String(error.code)
            : "unknown",
      }),
    );
    const id = requestId(request);
    return NextResponse.json(
      {
        error: "This service is temporarily unavailable. Please try again shortly.",
        message: "This service is temporarily unavailable. Please try again shortly.",
        code: "RATE_LIMIT_UNAVAILABLE",
        requestId: id,
      },
      { status: 503, headers: { "X-Request-ID": id } },
    );
  }
}

export function rateLimitPolicies(
  request: Request,
  scope: string,
  options: { ipLimit: number; accountLimit?: number; windowMs: number; account?: string },
): RateLimitPolicy[] {
  const ip = clientIp(request);
  const policies: RateLimitPolicy[] = [
    {
      scope: `${scope}:ip`,
      identifier: ip,
      limit: options.ipLimit,
      windowMs: options.windowMs,
    },
  ];
  if (options.account && options.accountLimit) {
    policies.push({
      scope: `${scope}:account`,
      identifier: options.account.trim().toLowerCase(),
      limit: options.accountLimit,
      windowMs: options.windowMs,
    });
  }
  return policies;
}
