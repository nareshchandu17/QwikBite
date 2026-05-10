export type InventoryStatus = 'In_Stock' | 'Low_Stock' | 'Out_of_Stock';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: InventoryStatus;
  lastUpdated: string;
}
