/**
 * CSRF Protection Utilities
 * Generates and validates CSRF tokens for state-changing operations
 */

import { createHash, randomBytes } from 'crypto';

/**
 * Generate a random CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a CSRF token with a signature
 * @param secret - Secret key for signing
 * @param token - CSRF token to sign
 */
export function signCSRFToken(secret: string, token: string): string {
  const hmac = createHash('sha256');
  hmac.update(`${token}:${secret}`);
  return hmac.digest('hex');
}

/**
 * Verify a CSRF token
 * @param secret - Secret key for verification
 * @param token - CSRF token to verify
 * @param signature - Expected signature
 */
export function verifyCSRFToken(secret: string, token: string, signature: string): boolean {
  const expectedSignature = signCSRFToken(secret, token);
  return signature === expectedSignature;
}

/**
 * Extract CSRF token from request headers
 */
export function getCSRFTokenFromRequest(request: Request): string | null {
  return request.headers.get('x-csrf-token') || null;
}

/**
 * Generate CSRF token for client (to be stored in cookie)
 */
export function generateClientCSRFToken(secret: string): { token: string; signature: string } {
  const token = generateCSRFToken();
  const signature = signCSRFToken(secret, token);
  return { token, signature };
}

/**
 * Middleware to validate CSRF token for state-changing operations
 */
export function validateCSRFMiddleware(request: Request, secret: string): boolean {
  // Skip CSRF validation for GET requests (they should be idempotent)
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return true;
  }
  
  const token = getCSRFTokenFromRequest(request);
  const signature = request.headers.get('x-csrf-signature');
  
  if (!token || !signature) {
    return false;
  }
  
  return verifyCSRFToken(secret, token, signature);
}
