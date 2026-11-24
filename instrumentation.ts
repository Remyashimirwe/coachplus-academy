import type { Instrumentation } from "next";

/** Error-only fallback telemetry for Next.js requests outside wrapped routes. */
export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  const headers = request.headers;
  const requestId =
    headers["x-request-id"] ?? headers["X-Request-ID"] ?? crypto.randomUUID();
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "unknown";
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String(error.digest)
      : undefined;

  console.error(
    JSON.stringify({
      event: "next_request_error",
      requestId: Array.isArray(requestId) ? requestId[0] : requestId,
      route: context.routePath,
      method: request.method,
      routerType: context.routeType,
      category: "uncaught_request_error",
      code,
      digest,
    }),
  );
};
