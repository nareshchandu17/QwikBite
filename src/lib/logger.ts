/**
 * qwikBite Structured Logging Utility
 * Production-ready logging with timestamps and levels
 */

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

class Logger {
  private static instance: Logger;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Format log message
   */
  private format(level: LogLevel, message: string, details?: any): string {
    const timestamp = new Date().toISOString();

    let detailString = "";
    if (details) {
      try {
        detailString = ` | Details: ${JSON.stringify(details)}`;
      } catch {
        detailString = " | Details: [Unserializable Object]";
      }
    }

    // Terminal colors
    const colors = {
      INFO: "\x1b[32m",
      WARN: "\x1b[33m",
      ERROR: "\x1b[31m",
      DEBUG: "\x1b[36m",
      RESET: "\x1b[0m",
    };

    return `${colors[level]}[${timestamp}] [${level}] ${message}${detailString}${colors.RESET}`;
  }

  /**
   * Info log
   */
  public info(message: any, ...args: any[]): void {
    console.log(this.format("INFO", String(message), args.length > 0 ? args : undefined));
  }

  /**
   * Warning log
   */
  public warn(message: any, ...args: any[]): void {
    console.warn(this.format("WARN", String(message), args.length > 0 ? args : undefined));
  }

  /**
   * Error log (safe + structured)
   */
  public error(message: any, ...args: any[]): void {
    let details: Record<string, unknown> | undefined;
    const error = args.length > 0 ? args[0] : undefined;

    if (error instanceof Error) {
      details = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error !== undefined || args.length > 0) {
      details = {
        error: error !== undefined ? error : args,
      };
    }
    
    console.error(this.format("ERROR", String(message), details));
  }

  /**
   * Debug log (disabled in production)
   */
  public debug(message: any, ...args: any[]): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.format("DEBUG", String(message), args.length > 0 ? args : undefined));
    }
  }
}

/**
 * Singleton instance
 */
export const logger = Logger.getInstance();
export default logger;
