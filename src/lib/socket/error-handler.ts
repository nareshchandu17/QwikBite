export class SocketErrorHandler {
  private static instance: SocketErrorHandler;
  private errorCounts: Map<string, number> = new Map();
  private lastErrors: Map<string, number> = new Map();
  private readonly MAX_RETRIES = 3;
  private readonly COOLDOWN_PERIOD = 60000; // 1 minute

  private constructor() {}

  public static getInstance(): SocketErrorHandler {
    if (!SocketErrorHandler.instance) {
      SocketErrorHandler.instance = new SocketErrorHandler();
    }
    return SocketErrorHandler.instance;
  }

  public shouldRetry(errorType: string): boolean {
    const now = Date.now();
    const lastError = this.lastErrors.get(errorType) || 0;
    const errorCount = this.errorCounts.get(errorType) || 0;

    // Check if we're in cooldown period
    if (now - lastError < this.COOLDOWN_PERIOD) {
      return false;
    }

    // Check if we've exceeded max retries
    if (errorCount >= this.MAX_RETRIES) {
      return false;
    }

    return true;
  }

  public recordError(errorType: string): void {
    const now = Date.now();
    const currentCount = this.errorCounts.get(errorType) || 0;
    
    this.errorCounts.set(errorType, currentCount + 1);
    this.lastErrors.set(errorType, now);
  }

  public resetError(errorType: string): void {
    this.errorCounts.delete(errorType);
    this.lastErrors.delete(errorType);
  }

  public getErrorStats(): { [key: string]: { count: number; lastOccurrence: number } } {
    const stats: { [key: string]: { count: number; lastOccurrence: number } } = {};
    
    for (const [errorType, count] of this.errorCounts.entries()) {
      stats[errorType] = {
        count,
        lastOccurrence: this.lastErrors.get(errorType) || 0
      };
    }
    
    return stats;
  }
}

export const socketErrorHandler = SocketErrorHandler.getInstance();
