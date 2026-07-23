/**
 * Client-side CSRF Token Management
 * Handles fetching and storing CSRF tokens for API requests
 */

interface CSRFToken {
  token: string;
  signature: string;
}

let csrfToken: CSRFToken | null = null;

/**
 * Fetch a new CSRF token from the server
 */
export async function fetchCSRFToken(): Promise<CSRFToken | null> {
  try {
    const response = await fetch('/api/csrf');
    const data = await response.json();
    
    if (data.success && data.token && data.signature) {
      csrfToken = {
        token: data.token,
        signature: data.signature
      };
      return csrfToken;
    }
    
    return null;
  } catch (error) {
    console.error('[CSRF] Failed to fetch token:', error);
    return null;
  }
}

/**
 * Get the current CSRF token (fetches if not available)
 */
export async function getCSRFToken(): Promise<CSRFToken | null> {
  if (!csrfToken) {
    return await fetchCSRFToken();
  }
  return csrfToken;
}

/**
 * Add CSRF headers to a fetch request
 */
export async function addCSRFHeaders(headers: HeadersInit = {}): Promise<HeadersInit> {
  const token = await getCSRFToken();
  
  if (token) {
    return {
      ...headers,
      'X-CSRF-Token': token.token,
      'X-CSRF-Signature': token.signature
    };
  }
  
  return headers;
}

/**
 * Wrapper for fetch with CSRF protection
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = await addCSRFHeaders(options.headers || {});
  
  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * Clear the stored CSRF token (useful after logout)
 */
export function clearCSRFToken(): void {
  csrfToken = null;
}
