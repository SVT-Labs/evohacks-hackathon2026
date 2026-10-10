/**
 * A simple in-memory sliding-window rate limiter, keyed by client IP.
 *
 * It lives in the memory of one server process: counts reset on restart, and on
 * serverless hosting every instance keeps its own. That is enough to stop one
 * client from burning through the LLM budget during a demo; a production
 * deployment would move the counts to a shared store.
 */

const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 10;

/** Start pruning idle clients once this many are tracked. */
const MAX_TRACKED_CLIENTS = 5_000;

/** Client key -> timestamps (ms) of that client's requests inside the window. */
const requestLog = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  /** Requests the client may still make in the current window. */
  remaining: number;
  /** Seconds until the next request will be accepted; 0 when allowed. */
  retryAfterSeconds: number;
}

/** Requests allowed per client per minute, from RATE_LIMIT_PER_MINUTE or the default. */
function configuredLimit(): number {
  const fromEnv = Number(process.env.RATE_LIMIT_PER_MINUTE);
  return Number.isInteger(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_LIMIT;
}

/** Best-effort client identity. Hosts such as Vercel put the caller's IP in x-forwarded-for. */
export function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "local";
}

/** Records one request for `key` and reports whether it is within the limit. */
export function checkRateLimit(
  key: string,
  limit: number = configuredLimit(),
  now: number = Date.now(),
): RateLimitResult {
  const windowStart = now - WINDOW_MS;
  const recent = (requestLog.get(key) ?? []).filter((time) => time > windowStart);

  if (recent.length >= limit) {
    requestLog.set(key, recent);
    const retryAfterMs = recent[0] + WINDOW_MS - now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  recent.push(now);
  requestLog.set(key, recent);

  if (requestLog.size > MAX_TRACKED_CLIENTS) {
    requestLog.forEach((times, client) => {
      if (times.every((time) => time <= windowStart)) requestLog.delete(client);
    });
  }

  return { allowed: true, remaining: limit - recent.length, retryAfterSeconds: 0 };
}
