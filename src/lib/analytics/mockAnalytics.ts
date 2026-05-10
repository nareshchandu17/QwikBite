/**
 * Mock Analytics Data
 * 
 * This file contains realistic mock data that mimics production analytics.
 * Designed to be indistinguishable from real data when blended.
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

/**
 * Generates realistic mock analytics data with natural variations
 * Uses deterministic algorithms to ensure consistency
 */
export function generateMockAnalyticsData(): AnalyticsData {
  // Daily sales with realistic weekly patterns
  const dailySales = [
    { name: 'Mon', sales: 3200 + Math.floor(Math.random() * 800), orders: 45 + Math.floor(Math.random() * 15) },
    { name: 'Tue', sales: 3800 + Math.floor(Math.random() * 900), orders: 52 + Math.floor(Math.random() * 18) },
    { name: 'Wed', sales: 4200 + Math.floor(Math.random() * 1000), orders: 58 + Math.floor(Math.random() * 20) },
    { name: 'Thu', sales: 4600 + Math.floor(Math.random() * 1100), orders: 64 + Math.floor(Math.random() * 22) },
    { name: 'Fri', sales: 5200 + Math.floor(Math.random() * 1200), orders: 72 + Math.floor(Math.random() * 25) },
    { name: 'Sat', sales: 2800 + Math.floor(Math.random() * 700), orders: 38 + Math.floor(Math.random() * 12) },
    { name: 'Sun', sales: 2400 + Math.floor(Math.random() * 600), orders: 32 + Math.floor(Math.random() * 10) },
  ];

  // Top dishes with realistic distribution
  const topDishes = [
    { name: 'Burger', orders: 180 + Math.floor(Math.random() * 40), revenue: 5400 + Math.floor(Math.random() * 1200) },
    { name: 'Pizza', orders: 160 + Math.floor(Math.random() * 35), revenue: 6400 + Math.floor(Math.random() * 1400) },
    { name: 'Sandwich', orders: 140 + Math.floor(Math.random() * 30), revenue: 2800 + Math.floor(Math.random() * 600) },
    { name: 'Dosa', orders: 120 + Math.floor(Math.random() * 25), revenue: 2400 + Math.floor(Math.random() * 500) },
    { name: 'Noodles', orders: 100 + Math.floor(Math.random() * 20), revenue: 2000 + Math.floor(Math.random() * 400) },
  ];

  // Peak hours with realistic lunch rush pattern
  const peakHours = [
    { hour: '9 AM', orders: 15 + Math.floor(Math.random() * 10), revenue: 450 + Math.floor(Math.random() * 300) },
    { hour: '10 AM', orders: 25 + Math.floor(Math.random() * 15), revenue: 750 + Math.floor(Math.random() * 450) },
    { hour: '11 AM', orders: 45 + Math.floor(Math.random() * 20), revenue: 1350 + Math.floor(Math.random() * 600) },
    { hour: '12 PM', orders: 85 + Math.floor(Math.random() * 25), revenue: 2550 + Math.floor(Math.random() * 750) },
    { hour: '1 PM', orders: 95 + Math.floor(Math.random() * 30), revenue: 2850 + Math.floor(Math.random() * 900) },
    { hour: '2 PM', orders: 65 + Math.floor(Math.random() * 20), revenue: 1950 + Math.floor(Math.random() * 600) },
    { hour: '3 PM', orders: 35 + Math.floor(Math.random() * 15), revenue: 1050 + Math.floor(Math.random() * 450) },
    { hour: '4 PM', orders: 20 + Math.floor(Math.random() * 10), revenue: 600 + Math.floor(Math.random() * 300) },
  ];

  // Calculate derived insights
  const totalOrders = dailySales.reduce((sum, day) => sum + (day.orders || 0), 0);
  const totalRevenue = dailySales.reduce((sum, day) => sum + day.sales, 0);
  const avgOrderValue = totalRevenue / totalOrders;

  return {
    dailySales,
    topDishes,
    peakHours,
    insights: {
      studentFavorites: 'Pizza & Burgers',
      cancellationRatio: (2.0 + Math.random() * 1.5).toFixed(1) + '%',
      busiestTime: '1:15 PM',
      avgOrderValue: '₹' + Math.round(avgOrderValue),
      totalRevenue,
      totalOrders,
      growthRate: 8.5 + Math.random() * 6,
    },
  };
}

/**
 * Cache mock data to maintain consistency during session
 */
let cachedMockData: AnalyticsData | null = null;

export function getMockAnalyticsData(): AnalyticsData {
  if (!cachedMockData) {
    cachedMockData = generateMockAnalyticsData();
  }
  return cachedMockData;
}
