/**
 * Analytics Data Blending Utility
 * 
 * Sophisticated data blending system that seamlessly merges real and mock data
 * Maintains visual consistency and realistic patterns regardless of data source
 */

import { AnalyticsData, BlendedAnalyticsData } from './types';

/**
 * Configuration for data blending
 */
interface BlendConfig {
  realDataPercentage: number;
  mockDataPercentage: number;
  preserveTrends: boolean;
  smoothTransitions: boolean;
}

/**
 * Blends real and mock analytics data using sophisticated algorithms
 * 
 * The blending follows these principles:
 * 1. Visual consistency - Charts look realistic at any blend percentage
 * 2. Smooth transitions - No sudden spikes or drops
 * 3. Trend preservation - Real data trends influence the blended result
 * 4. Natural variance - Slight variations to simulate real-world data
 */
export function blendAnalyticsData(
  realData: AnalyticsData | null,
  mockData: AnalyticsData,
  config: Partial<BlendConfig> = {}
): BlendedAnalyticsData {
  const realDataPercentage = config.realDataPercentage ?? 
    parseFloat(process.env.NEXT_PUBLIC_ANALYTICS_REAL_DATA_PERCENT || '0');
  
  const mockDataPercentage = 100 - realDataPercentage;
  
  const finalConfig: BlendConfig = {
    realDataPercentage,
    mockDataPercentage,
    preserveTrends: true,
    smoothTransitions: true,
    ...config,
  };

  // Determine data source
  let dataSource: 'mock' | 'real' | 'blended';
  if (realDataPercentage === 0) {
    dataSource = 'mock';
  } else if (realDataPercentage === 100 && realData) {
    dataSource = 'real';
  } else {
    dataSource = 'blended';
  }

  // If no real data available, return mock data
  if (!realData || realDataPercentage === 0) {
    return {
      ...mockData,
      metadata: {
        realDataPercentage: 0,
        mockDataPercentage: 100,
        lastUpdated: new Date(),
        dataSource: 'mock',
      },
    };
  }

  // If 100% real data, return real data
  if (realDataPercentage === 100) {
    return {
      ...realData,
      metadata: {
        realDataPercentage: 100,
        mockDataPercentage: 0,
        lastUpdated: new Date(),
        dataSource: 'real',
      },
    };
  }

  // Blend the data
  const blendedData: AnalyticsData = {
    dailySales: blendArrayData(
      realData.dailySales,
      mockData.dailySales,
      finalConfig,
      'sales'
    ),
    topDishes: blendArrayData(
      realData.topDishes,
      mockData.topDishes,
      finalConfig,
      'orders'
    ),
    peakHours: blendArrayData(
      realData.peakHours,
      mockData.peakHours,
      finalConfig,
      'orders'
    ),
    insights: blendInsights(realData.insights, mockData.insights, finalConfig),
  };

  return {
    ...blendedData,
    metadata: {
      realDataPercentage,
      mockDataPercentage,
      lastUpdated: new Date(),
      dataSource,
    },
  };
}

/**
 * Blends array data (charts, timelines) with sophisticated algorithms
 */
function blendArrayData<T extends Record<string, unknown>>(
  realData: T[],
  mockData: T[],
  config: BlendConfig,
  valueKey: string
): T[] {
  const result: T[] = [];
  const realWeight = config.realDataPercentage / 100;
  const mockWeight = config.mockDataPercentage / 100;

  // Ensure both arrays have the same length
  const maxLength = Math.max(realData.length, mockData.length);

  for (let i = 0; i < maxLength; i++) {
    const realItem = realData[i];
    const mockItem = mockData[i];

    if (!realItem && mockItem) {
      // Only mock data available
      result.push(mockItem);
    } else if (realItem && !mockItem) {
      // Only real data available
      result.push(realItem);
    } else if (realItem && mockItem) {
      // Both available - blend them
      const blendedItem = { ...mockItem } as Record<string, unknown>;

      // Blend numeric values with trend preservation
      for (const key in mockItem) {
        const mockVal = mockItem[key];
        const realVal = realItem[key];
        if (typeof mockVal === 'number' && typeof realVal === 'number') {
          if (key === valueKey) {
            // Primary value - weighted average with trend adjustment
            const realValue = realVal;
            const mockValue = mockVal;
            
            let blendedValue = realValue * realWeight + mockValue * mockWeight;
            
            // Add slight natural variance (±2%)
            if (config.smoothTransitions) {
              const variance = 0.02 * blendedValue * (Math.random() - 0.5);
              blendedValue += variance;
            }
            
            blendedItem[key] = Math.max(0, Math.round(blendedValue));
          } else if (key === 'revenue') {
            // Revenue - calculated from orders if available
            const orders = (blendedItem['orders'] as number) || 0;
            const avgOrderValue = (realVal / ((realItem['orders'] as number) || 1)) * realWeight + 
                                 (mockVal / ((mockItem['orders'] as number) || 1)) * mockWeight;
            blendedItem[key] = Math.round(orders * avgOrderValue);
          } else {
            // Other numeric values
            blendedItem[key] = realVal * realWeight + mockVal * mockWeight;
          }
        } else {
          // Non-numeric values - use real data if available, otherwise mock
          blendedItem[key] = realVal !== undefined ? realVal : mockVal;
        }
      }

      result.push(blendedItem as T);
    }
  }

  return result;
}

/**
 * Blends insights data with intelligent merging
 */
function blendInsights(
  realInsights: AnalyticsData['insights'],
  mockInsights: AnalyticsData['insights'],
  config: BlendConfig
): AnalyticsData['insights'] {
  const realWeight = config.realDataPercentage / 100;
  const mockWeight = config.mockDataPercentage / 100;

  return {
    // Text-based insights - prefer real data if available
    studentFavorites: realInsights.studentFavorites || mockInsights.studentFavorites,
    busiestTime: realInsights.busiestTime || mockInsights.busiestTime,
    
    // Percentage values - blend with care
    cancellationRatio: blendPercentage(
      realInsights.cancellationRatio,
      mockInsights.cancellationRatio,
      config
    ),
    
    // Currency values - weighted average
    avgOrderValue: blendCurrency(
      realInsights.avgOrderValue,
      mockInsights.avgOrderValue,
      config
    ),
    
    // Numeric values - weighted average
    totalRevenue: Math.round(
      realInsights.totalRevenue * realWeight + mockInsights.totalRevenue * mockWeight
    ),
    totalOrders: Math.round(
      realInsights.totalOrders * realWeight + mockInsights.totalOrders * mockWeight
    ),
    growthRate: parseFloat(
      (realInsights.growthRate * realWeight + mockInsights.growthRate * mockWeight).toFixed(1)
    ),
  };
}

/**
 * Blends percentage values with proper formatting
 */
function blendPercentage(real: string, mock: string, config: BlendConfig): string {
  const realValue = parseFloat(real.replace('%', ''));
  const mockValue = parseFloat(mock.replace('%', ''));
  
  if (isNaN(realValue)) return mock;
  if (isNaN(mockValue)) return real;
  
  const realWeight = config.realDataPercentage / 100;
  const mockWeight = config.mockDataPercentage / 100;
  
  const blended = realValue * realWeight + mockValue * mockWeight;
  return blended.toFixed(1) + '%';
}

/**
 * Blends currency values with proper formatting
 */
function blendCurrency(real: string, mock: string, config: BlendConfig): string {
  const realValue = parseFloat(real.replace('₹', '').replace(',', ''));
  const mockValue = parseFloat(mock.replace('₹', '').replace(',', ''));
  
  if (isNaN(realValue)) return mock;
  if (isNaN(mockValue)) return real;
  
  const realWeight = config.realDataPercentage / 100;
  const mockWeight = config.mockDataPercentage / 100;
  
  const blended = realValue * realWeight + mockValue * mockWeight;
  return '₹' + Math.round(blended).toLocaleString();
}

/**
 * Utility function to get the current blend configuration
 */
export function getBlendConfig(): BlendConfig {
  const realDataPercentage = parseFloat(
    process.env.NEXT_PUBLIC_ANALYTICS_REAL_DATA_PERCENT || '0'
  );
  
  return {
    realDataPercentage: Math.min(100, Math.max(0, realDataPercentage)),
    mockDataPercentage: Math.max(0, 100 - realDataPercentage),
    preserveTrends: true,
    smoothTransitions: true,
  };
}
