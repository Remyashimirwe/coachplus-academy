import { randomUUID } from "node:crypto";

/** Adds a correlation ID and emits low-PII request metrics for API handlers. */
export function withApiObservability<Args extends unknown[]>(
  route: string,
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    const request = args[0] instanceof Request ? args[0] : undefined;
    const requestId = request?.headers.get("x-request-id") || randomUUID();
    const startedAt = performance.now();

    try {
      const response = await handler(...args);
      response.headers.set("X-Request-ID", requestId);
      // Keep every error response and a 10% sample of successful traffic to
      // make observability useful without logging every high-volume request.
      if (response.status >= 400 || Math.random() < 0.1) {
        console.info(
          JSON.stringify({
            event: "api_request",
            requestId,
            route,
            durationMs: Math.round(performance.now() - startedAt),
            status: response.status,
            category: response.status >= 500 ? "server_error" : "response",
            sampled: response.status < 400,
          }),
        );
      }
      return response;
    } catch (error) {
      const code =
        typeof error === "object" && error && "code" in error
          ? String(error.code)
          : "unknown";
      console.error(
        JSON.stringify({
          event: "api_request",
          requestId,
          route,
          durationMs: Math.round(performance.now() - startedAt),
          status: 500,
          category: "unhandled_exception",
          code,
        }),
      );
      return Response.json(
        {
          error: "Something went wrong. Please try again.",
          code: "INTERNAL_ERROR",
          requestId,
        },
        { status: 500, headers: { "X-Request-ID": requestId } },
      );
    }
  };
}
