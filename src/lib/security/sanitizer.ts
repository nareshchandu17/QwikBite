/**
 * Input Sanitization Utilities
 * Provides functions to sanitize user input to prevent XSS and injection attacks
 */

/**
 * Sanitize a string by removing potentially dangerous characters
 */
export function sanitizeString(input: string | unknown): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
    .slice(0, 1000); // Limit length
}

/**
 * Sanitize an email address
 */
export function sanitizeEmail(email: string | unknown): string {
  if (typeof email !== 'string') return '';
  
  const sanitized = email.trim().toLowerCase();
  // Basic email validation pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * Sanitize a phone number
 */
export function sanitizePhone(phone: string | unknown): string {
  if (typeof phone !== 'string') return '';
  
  return phone.replace(/[^0-9+]/g, '').slice(0, 15);
}

/**
 * Sanitize a name (allow letters, spaces, hyphens, apostrophes)
 */
export function sanitizeName(name: string | unknown): string {
  if (typeof name !== 'string') return '';
  
  return name
    .trim()
    .replace(/[^a-zA-Z\s\-']/g, '')
    .slice(0, 100);
}

/**
 * Sanitize an object by recursively sanitizing all string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

/**
 * Validate and sanitize a number
 */
export function sanitizeNumber(input: string | number | unknown): number {
  if (typeof input === 'number') return Math.max(0, Math.min(input, 999999999));
  if (typeof input === 'string') {
    const num = parseFloat(input.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : Math.max(0, Math.min(num, 999999999));
  }
  return 0;
}
