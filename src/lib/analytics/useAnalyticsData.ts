import { useState, useEffect, useCallback, useRef } from "react";
import {
  BlendedAnalyticsData,
  AnalyticsError,
  FetchAnalyticsOptions,
} from "./types";
import { fetchRealAnalyticsData } from "./fetchAnalytics";

interface UseAnalyticsDataState {
  data: BlendedAnalyticsData | null;
  isLoading: boolean;
  error: AnalyticsError | null;
  lastFetched: Date | null;
  refetchCount: number;
}

interface UseAnalyticsDataReturn extends UseAnalyticsDataState {
  refetch: (options?: FetchAnalyticsOptions) => Promise<void>;
  isUsingRealData: boolean;
  isUsingMockData: boolean;
  isBlended: boolean;
  realDataPercentage: number;
  dataSource: "mock" | "real" | "blended";
}

export function useAnalyticsData(
  options: FetchAnalyticsOptions = {},
): UseAnalyticsDataReturn {
  const [state, setState] = useState<UseAnalyticsDataState>({
    data: null,
    isLoading: true,
    error: null,
    lastFetched: null,
    refetchCount: 0,
  });

  const fetchData = useCallback(
    async (fetchOptions: FetchAnalyticsOptions = {}) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const realData = await fetchRealAnalyticsData({
          timeout: fetchOptions.timeout || options.timeout,
          retryAttempts:
            fetchOptions.retryAttempts ?? options.retryAttempts,
          cache:
            fetchOptions.cache !== undefined
              ? fetchOptions.cache
              : options.cache,
        });

        const data: BlendedAnalyticsData = {
          ...realData,
          metadata: {
            realDataPercentage: 100,
            mockDataPercentage: 0,
            lastUpdated: new Date(),
            dataSource: "real",
          },
        };

        setState((prev) => ({
          data,
          isLoading: false,
          error: null,
          lastFetched: new Date(),
          refetchCount: prev.refetchCount + 1,
        }));
      } catch (error) {
        const analyticsError =
          error instanceof AnalyticsError
            ? error
            : new AnalyticsError("Failed to fetch analytics data", {
                code: "NETWORK_ERROR",
                retryable: true,
              });

        setState((prev) => ({
          ...prev,
          data: null,
          isLoading: false,
          error: analyticsError,
          lastFetched: null,
          refetchCount: prev.refetchCount + 1,
        }));
      }
    },
    [options.timeout, options.retryAttempts, options.cache],
  );

  const refetch = useCallback(
    async (fetchOptions?: FetchAnalyticsOptions) => {
      await fetchData(fetchOptions);
    },
    [fetchData],
  );

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchData();
    }
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData({ cache: false });
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    ...state,
    refetch,
    isUsingRealData: Boolean(state.data),
    isUsingMockData: false,
    isBlended: false,
    realDataPercentage: state.data ? 100 : 0,
    dataSource: state.data ? "real" : "real",
  };
}

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
    dailySales: data?.dailySales || [],
    topDishes: data?.topDishes || [],
    peakHours: data?.peakHours || [],
    insights: data?.insights,
    metadata: data?.metadata,
    isLoading,
    error,
    lastFetched,
    refetch,
    isUsingRealData,
    isUsingMockData,
    isBlended,
    realDataPercentage,
    dataSource,
  };
}

export function useAnalyticsDebug() {
  const analytics = useAnalytics();
  const [debugInfo, setDebugInfo] = useState<unknown>(null);
  const isDevelopment = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (isDevelopment) {
      setDebugInfo({
        dataInfo: analytics.metadata
          ? {
              dataSource: analytics.metadata.dataSource,
              realDataPercentage: analytics.metadata.realDataPercentage,
              mockDataPercentage: analytics.metadata.mockDataPercentage,
              lastUpdated: analytics.metadata.lastUpdated,
            }
          : null,
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
