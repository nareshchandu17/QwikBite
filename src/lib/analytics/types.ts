/**
 * Analytics Type Definitions
 * 
 * Central type definitions for the analytics system
 */

export interface AnalyticsData {
  dailySales: Array<{ name: string; sales: number; orders?: number }>;
  topDishes: Array<{ name: string; orders: number; revenue?: number }>;
  peakHours: Array<{ hour: string; orders: number; revenue?: number }>;
  insights: {
    studentFavorites: string;
    cancellationRatio: string;
    busiestTime: string;
    avgOrderValue: string;
    totalRevenue: number;
    totalOrders: number;
    growthRate: number;
  };
}

export interface BlendedAnalyticsData extends AnalyticsData {
  metadata: {
    realDataPercentage: number;
    mockDataPercentage: number;
    lastUpdated: Date;
    dataSource: 'mock' | 'real' | 'blended';
  };
}

export interface FetchAnalyticsOptions {
  timeout?: number;
  retryAttempts?: number;
  cache?: boolean;
}

export class AnalyticsError extends Error {
  public readonly code: 'NETWORK_ERROR' | 'TIMEOUT' | 'PARTIAL_DATA' | 'INVALID_RESPONSE';
  public readonly retryable: boolean;

  constructor(message: string, options: { code: 'NETWORK_ERROR' | 'TIMEOUT' | 'PARTIAL_DATA' | 'INVALID_RESPONSE'; retryable: boolean }) {
    super(message);
    this.name = 'AnalyticsError';
    this.code = options.code;
    this.retryable = options.retryable;
  }
}
