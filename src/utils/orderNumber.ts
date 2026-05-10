"use client";

// Order number utility for generating and managing persistent order numbers
export class OrderNumberManager {
  private static readonly ORDER_NUMBER_KEY = 'currentOrderNumber';
  private static readonly ORDER_PREFIX = 'ORD';
  
  // Generate a Swiggy/Zomato style order number (6 digits)
  private static generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const uniqueId = (parseInt(timestamp.slice(-6)) + parseInt(random)).toString().slice(-6);
    return `${this.ORDER_PREFIX}${uniqueId}`;
  }
  
  // Get current order number or generate new one
  static getCurrentOrderNumber(): string {
    if (typeof window === 'undefined') {
      // Fallback for server-side rendering
      return this.generateOrderNumber();
    }
    
    try {
      const stored = localStorage.getItem(this.ORDER_NUMBER_KEY);
      if (stored) {
        // Validate stored order number format
        if (stored.startsWith(this.ORDER_PREFIX) && stored.length === 9) {
          return stored;
        }
      }
      
      // Generate new order number if none exists or invalid
      const newOrderNumber = this.generateOrderNumber();
      localStorage.setItem(this.ORDER_NUMBER_KEY, newOrderNumber);
      return newOrderNumber;
    } catch (error) {
      console.error('Error managing order number:', error);
      return this.generateOrderNumber();
    }
  }
  
  // Generate new order number and store it
  static generateNewOrderNumber(): string {
    const newOrderNumber = this.generateOrderNumber();
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.ORDER_NUMBER_KEY, newOrderNumber);
      } catch (error) {
        console.error('Error storing order number:', error);
      }
    }
    return newOrderNumber;
  }
  
  // Clear current order number (call after order completion)
  static clearOrderNumber(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.ORDER_NUMBER_KEY);
      } catch (error) {
        console.error('Error clearing order number:', error);
      }
    }
  }
  
  // Check if order number exists
  static hasOrderNumber(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const stored = localStorage.getItem(this.ORDER_NUMBER_KEY);
      return stored !== null && stored.startsWith(this.ORDER_PREFIX) && stored.length === 9;
    } catch {
      return false;
    }
  }
}
