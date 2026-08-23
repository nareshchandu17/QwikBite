import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Create redis instance safely (won't crash if env vars missing, just throws later)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Cache limiters so we don't recreate them every request
const limiters = new Map<string, Ratelimit>();

export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000,
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  // If Redis is not configured, fallback to allow-all to prevent production crashes if keys are missing
  if (!redis) {
    console.warn('Upstash Redis not configured. Rate limiting is disabled.');
    return { allowed: true, remaining: limit, resetTime: Date.now() + windowMs };
  }

  // Convert windowMs to upstash format (e.g. "60 s")
  const windowSecs = Math.max(1, Math.floor(windowMs / 1000));
  const limiterKey = `${limit}-${windowSecs}s`;

  let limiter = limiters.get(limiterKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSecs} s`),
      analytics: true,
    });
    limiters.set(limiterKey, limiter);
  }

  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    return {
      allowed: success,
      remaining,
      resetTime: reset,
    };
  } catch (error) {
    // Fail open on Redis errors so we don't block legitimate traffic
    console.error('Rate limit error:', error);
    return { allowed: true, remaining: 1, resetTime: Date.now() + windowMs };
  }
}

export function getRateLimitIdentifier(request: Request): string {
  const userId = request.headers.get("x-user-id");
  if (userId) return `user:${userId}`;

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0] || "unknown";
  return `ip:${ip}`;
}

export const RateLimitPresets = {
  STRICT: { limit: 5, windowMs: 60000 },
  STANDARD: { limit: 20, windowMs: 60000 },
  LENIENT: { limit: 100, windowMs: 60000 },
  ORDER: { limit: 3, windowMs: 300000 },
  AUTH: { limit: 5, windowMs: 900000 },
};
