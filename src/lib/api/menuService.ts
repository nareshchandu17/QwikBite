import { MenuItem } from '@/data/menu';

const API_BASE_URL = '/api/menu';

export const menuService = {
  // Get all menu items
  async getMenuItems(): Promise<MenuItem[]> {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch menu items');
    }
    return response.json();
  },

  // Get single menu item
  async getMenuItem(id: string): Promise<MenuItem> {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch menu item');
    }
    return response.json();
  },

  // Create new menu item
  async createMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    if (!response.ok) {
      throw new Error('Failed to create menu item');
    }
    return response.json();
  },

  // Update menu item
  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update menu item');
    }
    return response.json();
  },

  // Delete menu item
  async deleteMenuItem(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete menu item');
    }
  },

  // Toggle item availability
  async toggleAvailability(id: string, available: boolean): Promise<MenuItem> {
    return this.updateMenuItem(id, { available });
  },
};
