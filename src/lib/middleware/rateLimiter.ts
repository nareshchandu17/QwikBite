import { NextRequest } from 'next/server';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  total: number;
  resetTime: number;
}

export default class RateLimiter {
  private static instances: Map<string, RateLimiter> = new Map();
  private limit: number;
  private windowMs: number;
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  private constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  public static getInstance(limit: number = 100, windowMs: number = 15 * 60 * 1000): RateLimiter {
    const key = `${limit}-${windowMs}`;
    if (!RateLimiter.instances.has(key)) {
      RateLimiter.instances.set(key, new RateLimiter(limit, windowMs));
    }
    return RateLimiter.instances.get(key)!;
  }

  public isAllowed(request: NextRequest): RateLimitResult {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const now = Date.now();
    
    let clientData = this.requests.get(ip);
    
    if (!clientData || now > clientData.resetTime) {
      clientData = {
        count: 0,
        resetTime: now + this.windowMs
      };
    }
    
    clientData.count++;
    this.requests.set(ip, clientData);
    
    return {
      allowed: clientData.count <= this.limit,
      remaining: Math.max(0, this.limit - clientData.count),
      total: this.limit,
      resetTime: clientData.resetTime
    };
  }

  public createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
      'X-RateLimit-Limit': result.total.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
    };
  }
}
