import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface ApiResponse {
  success: boolean;
  orders: unknown[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    console.log('Orders API: Simplified test endpoint - returning empty orders');
    
    // Return empty orders for testing without authentication
    return NextResponse.json(
      { 
        success: true, 
        orders: [], 
        meta: { 
          total: 0, 
          page: 1, 
          limit: 10, 
          totalPages: 0 
        } 
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Orders API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        orders: [], 
        meta: { 
          total: 0, 
          page: 1, 
          limit: 10, 
          totalPages: 0 
        }, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
