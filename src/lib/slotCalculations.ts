/**
 * Slot calculation utilities for dynamic status and fill percentage
 */

export const DEFAULT_MAX_LOAD = 300; // 5 hours of cumulative prep time per 30 min window

/**
 * Calculate slot fill percentage based on load
 * @param currentLoad - Current cumulative prep time
 * @param maxLoad - Maximum prep time capacity
 * @returns Fill percentage (0-100)
 */
export function calculateFillPercentage(currentLoad: number, maxLoad: number = DEFAULT_MAX_LOAD): number {
  return Math.min(100, Math.round((currentLoad / maxLoad) * 100));
}

/**
 * Determine slot status based on fill percentage
 * @param fill - Fill percentage (0-100)
 * @returns Status: "Open" | "Busy" | "Full"
 */
export function getSlotStatus(fill: number): 'Open' | 'Busy' | 'Full' {
  if (fill < 70) return 'Open';
  if (fill < 100) return 'Busy';
  return 'Full';
}

/**
 * Get user-friendly status message
 * @param status - Slot status
 * @returns User-friendly message
 */
export function getStatusMessage(status: 'Open' | 'Busy' | 'Full'): string {
  const messages = {
    'Open': '🟢 Fast Delivery',
    'Busy': '🟡 Slight Delay',
    'Full': '🔴 Next Slot Recommended'
  };
  return messages[status];
}

/**
 * Get color classes for slot based on status
 */
export function getSlotColorClasses(status: 'Open' | 'Busy' | 'Full'): {
  bgColor: string;
  textColor: string;
  glowColor: string;
} {
  const colors = {
    'Open': {
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-400',
      glowColor: 'shadow-[0_0_20px_rgba(34,197,94,0.5)]'
    },
    'Busy': {
      bgColor: 'bg-yellow-500/20',
      textColor: 'text-yellow-400',
      glowColor: 'shadow-[0_0_20px_rgba(234,179,8,0.5)]'
    },
    'Full': {
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-400',
      glowColor: 'shadow-[0_0_20px_rgba(239,68,68,0.5)]'
    }
  };
  return colors[status];
}
