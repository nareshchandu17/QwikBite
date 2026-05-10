import { NextResponse } from 'next/server';

type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
};

export async function handleApiResponse<T>(
  promise: Promise<T>,
  successMessage?: string
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    const data = await promise;
    return NextResponse.json(
      { 
        success: true, 
        data,
        message: successMessage 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API Error:', error);
    const status = (error as { status?: number })?.status || 500;
    return NextResponse.json(
      { 
        success: false, 
        error: (error as Error).message || 'An unexpected error occurred',
        status 
      },
      { status }
    );
  }
}

export function notFoundResponse(message = 'Resource not found'): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, error: message, status: 404 },
    { status: 404 }
  );
}

export function badRequestResponse(message = 'Bad request'): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, error: message, status: 400 },
    { status: 400 }
  );
}

export function unauthorizedResponse(message = 'Unauthorized'): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, error: message, status: 401 },
    { status: 401 }
  );
}
