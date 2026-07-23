# Security Setup Guide

This document outlines the security features implemented in the CanteenBuddy application and how to configure them.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# CSRF Secret - Used to sign and verify CSRF tokens
# Generate a random secret: openssl rand -base64 32
CSRF_SECRET=your-random-csrf-secret-here

# NextAuth Secret - Already required for authentication
NEXTAUTH_SECRET=your-nextauth-secret-here
```

## Security Features Implemented

### 1. Input Sanitization
**Location**: `src/lib/security/sanitizer.ts`

All user inputs are sanitized to prevent XSS and injection attacks:
- Strings: Removes dangerous characters, limits length
- Emails: Validates format and normalizes
- Phone numbers: Removes non-numeric characters
- Names: Allows only letters, spaces, hyphens, apostrophes
- Numbers: Validates and clamps to safe ranges

**Usage in APIs**:
- `/api/customer/profile` - Sanitizes name, phone, regNo
- `/api/customer/orders` - Sanitizes all order data

### 2. Rate Limiting
**Location**: `src/lib/security/rateLimiter.ts`

Prevents API abuse by limiting request frequency:

**Rate Limit Presets**:
- **STRICT**: 20 requests/minute (regular API calls)
- **LENIENT**: 100 requests/minute (read operations)
- **ORDER**: 3 orders/5 minutes (order creation)
- **AUTH**: 5 login attempts/15 minutes (authentication)

**Implementation**:
- In-memory storage (for production, use Redis)
- Per-user or per-IP tracking
- Automatic cleanup of expired entries

**Applied to**:
- `/api/customer/orders` - GET (LENIENT), POST (ORDER)
- `/api/customer/profile` - PUT (STANDARD)
- `/api/customer/notifications` - GET (LENIENT)

### 3. CSRF Protection
**Location**: `src/lib/security/csrf.ts`

Protects against Cross-Site Request Forgery attacks for state-changing operations:

**How it works**:
1. Client fetches CSRF token from `/api/csrf`
2. Token is signed with server secret
3. Client includes token in headers for POST/PUT/DELETE requests
4. Server validates token signature before processing

**Client Utility**: `src/lib/security/client-csrf.ts`

**Usage**:
```typescript
import { secureFetch } from '@/lib/security/client-csrf';

// Automatically adds CSRF headers
const response = await secureFetch('/api/customer/orders', {
  method: 'POST',
  body: JSON.stringify(orderData)
});
```

**Applied to**:
- `/api/customer/orders` - POST (order creation)

### 4. Authentication
**Location**: `src/auth.ts`, `src/lib/auth-helper.ts`

Multi-source authentication:
- NextAuth Session
- Custom JWT Cookie
- Authorization Header (Bearer token)
- NextAuth JWT Token fallback

**Role-based access**:
- Customer: Access to customer panel
- Admin: Access to admin panel
- Canteen Staff: Access to staff panel

## API Security Summary

| Endpoint | Auth | Rate Limit | CSRF | Sanitization |
|----------|------|------------|------|--------------|
| GET /api/customer/orders | ✅ | LENIENT | ❌ | ✅ |
| POST /api/customer/orders | ✅ | ORDER | ✅ | ✅ |
| GET /api/customer/profile | ✅ | - | ❌ | ✅ |
| PUT /api/customer/profile | ✅ | STANDARD | ❌ | ✅ |
| GET /api/customer/notifications | ✅ | LENIENT | ❌ | ✅ |
| GET /api/csrf | ❌ | - | ❌ | - |

## Production Recommendations

1. **Use Redis for rate limiting**: Replace in-memory storage with Redis for distributed systems
2. **Generate strong secrets**: Use `openssl rand -base64 32` for CSRF_SECRET
3. **Enable HTTPS**: Required for secure cookie transmission
4. **Monitor rate limits**: Add logging for rate limit violations
5. **Implement request validation**: Add Zod schemas for complex request bodies
6. **Add security headers**: Implement CSP, HSTS, X-Frame-Options headers
7. **Regular security audits**: Review dependencies and update regularly

## Testing Security Features

### Test Rate Limiting
```bash
# Send multiple requests quickly
for i in {1..25}; do
  curl -X GET http://localhost:3000/api/customer/orders
done
# Should receive 429 after limit exceeded
```

### Test CSRF Protection
```bash
# Try POST without CSRF headers
curl -X POST http://localhost:3000/api/customer/orders \
  -H "Content-Type: application/json" \
  -d '{"items": []}'
# Should receive 403 Invalid CSRF token
```

### Test Input Sanitization
```bash
# Try sending malicious input
curl -X PUT http://localhost:3000/api/customer/profile \
  -H "Content-Type: application/json" \
  -d '{"name": "<script>alert(1)</script>", "phone": "123"}'
# Script tags should be removed
```

## Troubleshooting

### CSRF Token Errors
- Ensure client calls `/api/csrf` before state-changing requests
- Check that CSRF_SECRET is set in environment
- Verify headers are being sent: `X-CSRF-Token`, `X-CSRF-Signature`

### Rate Limit Errors
- Check if user/IP is being tracked correctly
- Verify rate limit presets are appropriate
- Consider increasing limits for legitimate high-traffic scenarios

### Sanitization Issues
- If valid data is being rejected, check sanitization rules
- Adjust character sets or length limits as needed
- Ensure sanitization happens before validation
