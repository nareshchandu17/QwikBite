import { apiResponse, apiError } from '@/lib/api-response';
import { categories as initialCategories } from '@/data/menu';

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET() {
  try {
    // Filter out 'All' from categories for admin use
    const adminCategories = Array.isArray(initialCategories)
      ? initialCategories.filter((cat: string) => cat !== 'All')
      : [];

    return apiResponse(adminCategories, 200, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      }
    });
  } catch (error: unknown) {
    console.error('Error fetching categories:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return apiError(errorMessage, 500, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      }
    });
  }
}

export async function POST(request: Request) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return apiError('Invalid JSON in request body', 400, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        }
      });
    }

    const { name } = body;
    
    // Validate category name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return apiError('Category name is required', 400, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        }
      });
    }

    // Sanitize category name
    const sanitizedName = name.trim();
    
    // Validate category name format (alphanumeric and spaces, 2-50 chars)
    const nameRegex = /^[a-zA-Z0-9\s]{2,50}$/;
    if (!nameRegex.test(sanitizedName)) {
      return apiError(
        'Category name must contain only letters, numbers, and spaces (2-50 characters)',
        400,
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
          }
        }
      );
    }

    // In a real app, this would save to database
    // For now, we'll just return success
    return apiResponse(
      { name: sanitizedName, message: 'Category created successfully' },
      201,
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        }
      }
    );
  } catch (error) {
    console.error('Error creating category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return apiError(errorMessage, 500, {
      code: 'CATEGORY_CREATION_FAILED',
      details: { originalError: errorMessage },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      }
    });
  }
}
