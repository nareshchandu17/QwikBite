/**
 * useAnalyticsData Hook
 * 
 * Main React hook that provides analytics data with progressive blending
 * Handles all the complexity of data fetching, blending, and state management
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BlendedAnalyticsData, AnalyticsError, FetchAnalyticsOptions } from './types';
import { fetchRealAnalyticsData } from './fetchAnalytics';
import { getMockAnalyticsData } from './mockAnalytics';
import { blendAnalyticsData, getBlendConfig } from './blendAnalyticsData';

/**
 * Hook state interface
 */
interface UseAnalyticsDataState {
  data: BlendedAnalyticsData | null;
  isLoading: boolean;
  error: AnalyticsError | null;
  lastFetched: Date | null;
  refetchCount: number;
}

/**
 * Hook return interface
 */
interface UseAnalyticsDataReturn extends UseAnalyticsDataState {
  refetch: (options?: FetchAnalyticsOptions) => Promise<void>;
  isUsingRealData: boolean;
  isUsingMockData: boolean;
  isBlended: boolean;
  realDataPercentage: number;
  dataSource: 'mock' | 'real' | 'blended';
}

/**
 * Main analytics data hook
 * 
 * Provides a clean interface for accessing analytics data
 * regardless of whether it's mock, real, or blended
 */
export function useAnalyticsData(
  options: FetchAnalyticsOptions = {}
): UseAnalyticsDataReturn {
  const [state, setState] = useState<UseAnalyticsDataState>({
    data: null,
    isLoading: true,
    error: null,
    lastFetched: null,
    refetchCount: 0,
  });

  const blendConfig = useMemo(() => getBlendConfig(), []);

  /**
   * Fetches and blends analytics data
   */
  const fetchData = useCallback(async (fetchOptions: FetchAnalyticsOptions = {}) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get mock data first (always available)
      const mockData = getMockAnalyticsData();
      
      // Try to fetch real data
      let realData = null;
      let fetchError = null;

      if (blendConfig.realDataPercentage > 0) {
        try {
          realData = await fetchRealAnalyticsData({
            timeout: fetchOptions.timeout || options.timeout,
            retryAttempts: fetchOptions.retryAttempts || options.retryAttempts,
            cache: fetchOptions.cache !== undefined ? fetchOptions.cache : options.cache,
          });
        } catch (error) {
          fetchError = error as AnalyticsError;
          console.warn('[Analytics] Failed to fetch real data:', error);
          
          // If real data fetch fails but we need it, we'll use mock data
          // but log the error for debugging
          if (blendConfig.realDataPercentage > 50) {
            console.error('[Analytics] High real data percentage but fetch failed:', fetchError);
          }
        }
      }

      // Blend the data
      const blendedData = blendAnalyticsData(realData, mockData, {
        realDataPercentage: realData ? blendConfig.realDataPercentage : 0,
        mockDataPercentage: realData ? blendConfig.mockDataPercentage : 100,
      });

      setState(prev => ({
        data: blendedData,
        isLoading: false,
        error: fetchError,
        lastFetched: new Date(),
        refetchCount: prev.refetchCount + 1,
      }));

    } catch (error) {
      const analyticsError = error as AnalyticsError;
      console.error('[Analytics] Critical error:', analyticsError);
      
      setState(prev => ({
        data: null,
        isLoading: false,
        error: analyticsError,
        lastFetched: null,
        refetchCount: prev.refetchCount + 1,
      }));
    }
  }, [blendConfig.realDataPercentage, blendConfig.mockDataPercentage, options.timeout, options.retryAttempts, options.cache]);

  /**
   * Manual refetch function
   */
  const refetch = useCallback(async (fetchOptions?: FetchAnalyticsOptions) => {
    await fetchData(fetchOptions);
  }, [fetchData]);

  /**
   * Initial data fetch
   */
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchData();
    }
  }, [fetchData]);

  /**
   * Auto-refresh interval (optional)
   */
  useEffect(() => {
    // Only auto-refresh if we have real data component
    if (blendConfig.realDataPercentage > 0) {
      const interval = setInterval(() => {
        fetchData({ cache: false });
      }, 5 * 60 * 1000); // Refresh every 5 minutes

      return () => clearInterval(interval);
    }
  }, [fetchData, blendConfig.realDataPercentage]);

  /**
   * Computed values
   */
  const isUsingRealData = useMemo(() => {
    return state.data?.metadata.dataSource === 'real' || 
           state.data?.metadata.dataSource === 'blended';
  }, [state.data]);

  const isUsingMockData = useMemo(() => {
    return state.data?.metadata.dataSource === 'mock' || 
           state.data?.metadata.dataSource === 'blended';
  }, [state.data]);

  const isBlended = useMemo(() => {
    return state.data?.metadata.dataSource === 'blended';
  }, [state.data]);

  const realDataPercentage = useMemo(() => {
    return state.data?.metadata.realDataPercentage ?? 0;
  }, [state.data]);

  const dataSource = useMemo(() => {
    return state.data?.metadata.dataSource ?? 'mock';
  }, [state.data]);

  return {
    ...state,
    refetch,
    isUsingRealData,
    isUsingMockData,
    isBlended,
    realDataPercentage,
    dataSource,
  };
}

/**
 * Hook for analytics data with loading states and error handling
 * Designed to be used directly in components
 */
export function useAnalytics() {
  const {
    data,
    isLoading,
    error,
    lastFetched,
    refetch,
    isUsingRealData,
    isUsingMockData,
    isBlended,
    realDataPercentage,
    dataSource,
  } = useAnalyticsData();

  return {
    // Data
    dailySales: data?.dailySales || [],
    topDishes: data?.topDishes || [],
    peakHours: data?.peakHours || [],
    insights: data?.insights,
    
    // Metadata
    metadata: data?.metadata,
    
    // State
    isLoading,
    error,
    lastFetched,
    
    // Actions
    refetch,
    
    // Flags
    isUsingRealData,
    isUsingMockData,
    isBlended,
    realDataPercentage,
    dataSource,
  };
}

/**
 * Development hook for debugging analytics data blending
 * Only active in development mode
 */
export function useAnalyticsDebug() {
  const analytics = useAnalytics();
  const [debugInfo, setDebugInfo] = useState<unknown>(null);
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (isDevelopment) {
      setDebugInfo({
        blendConfig: getBlendConfig(),
        envVars: {
          NEXT_PUBLIC_ANALYTICS_REAL_DATA_PERCENT: process.env.NEXT_PUBLIC_ANALYTICS_REAL_DATA_PERCENT,
        },
        dataInfo: analytics.metadata ? {
          dataSource: analytics.metadata.dataSource,
          realDataPercentage: analytics.metadata.realDataPercentage,
          mockDataPercentage: analytics.metadata.mockDataPercentage,
          lastUpdated: analytics.metadata.lastUpdated,
        } : null,
      });
    } else {
      setDebugInfo(null);
    }
  }, [analytics.metadata, isDevelopment]);

  return {
    ...analytics,
    debugInfo,
  };
}
