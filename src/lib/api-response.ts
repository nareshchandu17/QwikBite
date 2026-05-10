import { NextResponse } from 'next/server';
import logger from './logger';

/**
 * Standard API Success Response
 */
export function successResponse<T = unknown>(data: T, status: number = 200, headers?: Record<string, string>) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status, headers }
  );
}

/**
 * Standard API Error Response
 */
export function errorResponse(
  message: string, 
  status: number = 500, 
  code: string = 'INTERNAL_ERROR',
  details?: unknown,
  headers?: Record<string, string>
) {
  // Log the error automatically
  if (status >= 500) {
    logger.error(`API Error: ${message}`, { status, code, details });
  } else {
    logger.warn(`API Warning: ${message}`, { status, code, details });
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        ...(details ? { details } : {}),
      },
    },
    { status, headers }
  );
}

/**
 * Legacy wrapper for backward compatibility during migration
 */
export function apiResponse(data: unknown, status: number = 200, options?: { code?: string; details?: unknown; headers?: Record<string, string> }) {
  if (status >= 400) {
    const errorMessage = data && typeof data === 'object' && 'message' in data && typeof data.message === 'string' 
      ? data.message 
      : data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
      ? data.error
      : 'Unknown error';
    return errorResponse(errorMessage, status, options?.code, options?.details, options?.headers);
  }
  return successResponse(data, status, options?.headers);
}

export function apiError(error: Error | string, status: number = 500, options?: { code?: string; details?: unknown; headers?: Record<string, string> }) {
  const message = typeof error === 'string' ? error : error.message;
  return errorResponse(message, status, options?.code, options?.details, options?.headers);
}
