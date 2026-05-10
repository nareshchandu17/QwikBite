import { Socket } from 'socket.io';

/**
 * WebSocket Rate Limiter
 * 
 * Prevents abuse of WebSocket events through rate limiting.
 * Implements token bucket algorithm per user/namespace.
 */

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private tokensPerSecond: number;
  private maxBurst: number;

  constructor(tokensPerSecond: number = 10, maxBurst: number = 20) {
    this.tokensPerSecond = tokensPerSecond;
    this.maxBurst = maxBurst;
  }

  /**
   * Check if an action is allowed under rate limit.
   * Returns true if allowed, false if rate limited.
   */
  public isAllowed(key: string, tokensRequired: number = 1): boolean {
    const now = Date.now();
    let entry = this.limits.get(key);

    if (!entry) {
      // First request - initialize with full bucket
      entry = { tokens: this.maxBurst, lastRefill: now };
      this.limits.set(key, entry);
      return true;
    }

    // Refill tokens based on elapsed time
    const elapsed = (now - entry.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = elapsed * this.tokensPerSecond;
    entry.tokens = Math.min(
      this.maxBurst,
      entry.tokens + tokensToAdd
    );
    entry.lastRefill = now;

    // Check if enough tokens available
    if (entry.tokens >= tokensRequired) {
      entry.tokens -= tokensRequired;
      return true;
    }

    return false;
  }

  /**
   * Get current token count (for monitoring).
   */
  public getTokens(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return this.maxBurst;

    const now = Date.now();
    const elapsed = (now - entry.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.tokensPerSecond;
    return Math.min(this.maxBurst, entry.tokens + tokensToAdd);
  }

  /**
   * Reset rate limit for a key (admin override).
   */
  public reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Cleanup old entries (call periodically).
   */
  public cleanup(maxAge: number = 3600000): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now - entry.lastRefill > maxAge) {
        this.limits.delete(key);
      }
    }
  }
}

// Global rate limiters
export const broadcastLimiter = new RateLimiter(5, 10); // 5 broadcasts/sec, max 10 burst
export const notificationLimiter = new RateLimiter(20, 30); // 20 notifications/sec, max 30 burst
export const roomJoinLimiter = new RateLimiter(50, 100); // 50 joins/sec, max 100 burst

/**
 * Middleware to enforce rate limiting on Socket.IO events.
 */
export function createRateLimitMiddleware(
  limiter: RateLimiter,
  tokensPerEvent: number = 1
) {
  return (socket: Socket, next: (err?: Error) => void) => {
    const userId = socket.data?.userId;
    const key = `${socket.nsp.name}:${userId || socket.id}`;

    if (limiter.isAllowed(key, tokensPerEvent)) {
      next();
    } else {
      next(new Error('Rate limit exceeded'));
    }
  };
}

/**
 * Cleanup task to run periodically (e.g., via cron job).
 */
export function startRateLimiterCleanup(interval: number = 300000) {
  // Run cleanup every 5 minutes
  setInterval(() => {
    broadcastLimiter.cleanup();
    notificationLimiter.cleanup();
    roomJoinLimiter.cleanup();
    console.log('✓ Rate limiter cleanup completed');
  }, interval);
}
