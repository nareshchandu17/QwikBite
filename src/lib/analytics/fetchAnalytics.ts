/**
 * Real Analytics Data Fetcher
 * 
 * Handles fetching real analytics data from the backend API
 * Includes error handling, retries, and timeout management
 */

import { AnalyticsData, FetchAnalyticsOptions, AnalyticsError } from './types';

/**
 * Fetches real analytics data from the backend API
 * Implements robust error handling and retry logic
 */
export async function fetchRealAnalyticsData(
  options: FetchAnalyticsOptions = {}
): Promise<AnalyticsData> {
  const {
    timeout = 5000,
    retryAttempts = 2,
    cache = true,
  } = options;

  let lastError: AnalyticsError | null = null;

  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    try {
      // Add realistic delay to simulate network latency
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch('/api/admin/analytics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': cache ? 'max-age=300' : 'no-cache',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status >= 500) {
          throw new AnalyticsError('Server error', {
            code: 'NETWORK_ERROR',
            retryable: true,
          });
        } else if (response.status === 404) {
          throw new AnalyticsError('Analytics endpoint not found', {
            code: 'INVALID_RESPONSE',
            retryable: false,
          });
        }
        throw new AnalyticsError(`HTTP ${response.status}`, {
          code: 'NETWORK_ERROR',
          retryable: true,
        });
      }

      const data = await response.json();

      // Validate response structure
      if (!isValidAnalyticsData(data)) {
        throw new AnalyticsError('Invalid analytics data structure', {
          code: 'INVALID_RESPONSE',
          retryable: false,
        });
      }

      return data;

    } catch (error) {
      if (error instanceof AnalyticsError) {
        lastError = error;
      } else if (error instanceof Error) {
        const code = error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR';
        lastError = new AnalyticsError(error.message, {
          code,
          retryable: (code as string) !== 'INVALID_RESPONSE',
        });
      } else {
        lastError = new AnalyticsError('Unknown error occurred', {
          code: 'NETWORK_ERROR',
          retryable: true,
        });
      }

      // Don't retry on non-retryable errors
      if (!lastError.retryable) {
        break;
      }
    }
  }

  // Return partial data if available, otherwise throw the last error
  if (lastError && lastError.code === 'PARTIAL_DATA') {
    console.warn('[Analytics] Using partial data due to:', lastError.message);
    throw lastError;
  }

  console.error('[Analytics] Failed to fetch real data after', retryAttempts, 'attempts:', lastError?.message);
  throw lastError || new AnalyticsError('Failed to fetch analytics data', {
    code: 'NETWORK_ERROR',
    retryable: true,
  });
}

/**
 * Validates the structure of analytics data
 */
function isValidAnalyticsData(data: unknown): data is AnalyticsData {
  const d = data as Record<string, unknown>;
  if (!d || typeof d !== 'object') {
    return false;
  }

  const requiredFields = ['dailySales', 'topDishes', 'peakHours', 'insights'];
  for (const field of requiredFields) {
    if (!Array.isArray(d[field]) && field !== 'insights') {
      return false;
    }
    if (field === 'insights' && typeof d[field] !== 'object') {
      return false;
    }
  }

  // Validate array structures
  if (!Array.isArray(d.dailySales) || d.dailySales.length === 0) {
    return false;
  }

  if (!Array.isArray(d.topDishes) || d.topDishes.length === 0) {
    return false;
  }

  if (!Array.isArray(d.peakHours) || d.peakHours.length === 0) {
    return false;
  }

  // Validate insights structure
  const insights = d.insights as Record<string, unknown>;
  const insightFields = ['studentFavorites', 'cancellationRatio', 'busiestTime', 'avgOrderValue'];
  for (const field of insightFields) {
    if (typeof insights[field] !== 'string') {
      return false;
    }
  }

  return true;
}

/**
 * Creates a fallback partial data structure when real data is incomplete
 */
export function createPartialAnalyticsData(partialData: unknown): AnalyticsData {
  const p = partialData as Record<string, any>;
  const pi = (p.insights || {}) as Record<string, any>;
  return {
    dailySales: (p.dailySales as AnalyticsData['dailySales']) || [],
    topDishes: (p.topDishes as AnalyticsData['topDishes']) || [],
    peakHours: (p.peakHours as AnalyticsData['peakHours']) || [],
    insights: {
      studentFavorites: (pi.studentFavorites as string) || 'Loading...',
      cancellationRatio: (pi.cancellationRatio as string) || '0%',
      busiestTime: (pi.busiestTime as string) || 'Loading...',
      avgOrderValue: (pi.avgOrderValue as string) || '₹0',
      totalRevenue: (pi.totalRevenue as number) || 0,
      totalOrders: (pi.totalOrders as number) || 0,
      growthRate: (pi.growthRate as number) || 0,
    },
  };
}
