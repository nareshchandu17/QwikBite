/**
 * Analytics System Exports
 * 
 * Central exports for the progressive analytics data blending system
 */

// Types
export type {
  AnalyticsData,
  BlendedAnalyticsData,
  FetchAnalyticsOptions,
} from './types';
export { AnalyticsError } from './types';

// Core functionality
export { fetchRealAnalyticsData, createPartialAnalyticsData } from './fetchAnalytics';
export { getMockAnalyticsData, generateMockAnalyticsData } from './mockAnalytics';
export { blendAnalyticsData, getBlendConfig } from './blendAnalyticsData';

// React hooks
export { useAnalyticsData, useAnalytics, useAnalyticsDebug } from './useAnalyticsData';
