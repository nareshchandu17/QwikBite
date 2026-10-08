import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const limiters = new Map<string, Ratelimit>();

export async function checkRateLimit(
  identifier: string,
  limit = 10,
  windowMs = 60000,
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  if (!redis) {
    if (process.env.NODE_ENV === "production") {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
      };
    }
    return {
      allowed: true,
      remaining: limit,
      resetTime: Date.now() + windowMs,
    };
  }

  const windowSecs = Math.max(1, Math.floor(windowMs / 1000));
  const limiterKey = `${limit}-${windowSecs}s`;

  let limiter = limiters.get(limiterKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSecs} s`),
      analytics: true,
    });
    limiters.set(limiterKey, limiter);
  }

  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    return { allowed: success, remaining, resetTime: reset };
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      console.error("Rate limit backend unavailable", error);
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
      };
    }
    console.warn("Rate limit backend unavailable in development", error);
    return {
      allowed: true,
      remaining: limit,
      resetTime: Date.now() + windowMs,
    };
  }
}

export function getRateLimitIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    realIp?.trim() ||
    "unknown";

  return `ip:${ip}`;
}

export const RateLimitPresets = {
  STRICT: { limit: 5, windowMs: 60000 },
  STANDARD: { limit: 20, windowMs: 60000 },
  LENIENT: { limit: 100, windowMs: 60000 },
  ORDER: { limit: 3, windowMs: 300000 },
  AUTH: { limit: 5, windowMs: 900000 },
};
