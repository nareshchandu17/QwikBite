/**
 * Rate Limiter Middleware
 * Prevents API abuse by limiting request frequency per user/IP
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory storage (for production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if a request should be rate limited
 * @param identifier - User ID or IP address
 * @param limit - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minute default
): { allowed: boolean; remaining: number; resetTime: number } {
  cleanupExpiredEntries();
  
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired one
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs
    };
    rateLimitStore.set(identifier, newEntry);
    
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: newEntry.resetTime
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime
    };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);
  
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * Get rate limit identifier from request
 * Priority: User ID > IP Address
 */
export function getRateLimitIdentifier(request: Request): string {
  // Try to get from headers (user ID from auth)
  const userId = request.headers.get('x-user-id');
  if (userId) return `user:${userId}`;
  
  // Fallback to IP (simplified - in production use proper IP extraction)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0] || 'unknown';
  return `ip:${ip}`;
}

/**
 * Rate limit configuration presets
 */
export const RateLimitPresets = {
  // Strict: 5 requests per minute (for sensitive operations)
  STRICT: { limit: 5, windowMs: 60000 },
  
  // Standard: 20 requests per minute (for regular API calls)
  STANDARD: { limit: 20, windowMs: 60000 },
  
  // Lenient: 100 requests per minute (for read operations)
  LENIENT: { limit: 100, windowMs: 60000 },
  
  // Order creation: 3 orders per 5 minutes
  ORDER: { limit: 3, windowMs: 300000 },
  
  // Auth: 5 login attempts per 15 minutes
  AUTH: { limit: 5, windowMs: 900000 }
};
