export interface TimeSlot {
  _id?: string;
  time: string;           // Base time (e.g., "8:30-9:00")
  timeSlot?: string;      // Display/Enriched time slot name
  status: string;         // 'Open' | 'Busy' | 'Full' (case-insensitive in UI)
  fill?: number;          // Backward compatibility
  percentage?: number;    // Calculated capacity percentage
  orderCount?: number;    // Number of orders in this slot
  used?: number;          // Current prep load in minutes
  capacity?: number;      // Max prep load capacity in minutes
  maxCapacity?: number;   // Max orders capacity
  statusMessage?: string; // Human-readable status message
}

