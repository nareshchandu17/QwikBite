/**
 * qwikBite Structured Logging Utility
 * Production-ready logging with timestamps and levels
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

class Logger {
  private static instance: Logger;

  private constructor() { }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Format log message
   */
  private format(level: LogLevel, message: string, details?: unknown): string {
    const timestamp = new Date().toISOString();

    let detailString = '';
    if (details) {
      try {
        detailString = ` | Details: ${JSON.stringify(details)}`;
      } catch {
        detailString = ' | Details: [Unserializable Object]';
      }
    }

    // Terminal colors
    const colors = {
      INFO: '\x1b[32m',
      WARN: '\x1b[33m',
      ERROR: '\x1b[31m',
      DEBUG: '\x1b[36m',
      RESET: '\x1b[0m',
    };

    return `${colors[level]}[${timestamp}] [${level}] ${message}${detailString}${colors.RESET}`;
  }

  /**
   * Info log
   */
  public info(message: string, details?: unknown): void {
    console.log(this.format('INFO', message, details));
  }

  /**
   * Warning log
   */
  public warn(message: string, details?: unknown): void {
    console.warn(this.format('WARN', message, details));
  }

  /**
   * Error log (safe + structured)
   */
  public error(message: string, error?: unknown): void {
    let details: Record<string, unknown> | undefined;

    if (error instanceof Error) {
      details = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error !== undefined) {
      details = {
        error,
      };
    }

    console.error(this.format('ERROR', message, details));
  }

  /**
   * Debug log (disabled in production)
   */
  public debug(message: string, details?: unknown): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.format('DEBUG', message, details));
    }
  }
}

/**
 * Singleton instance
 */
export const logger = Logger.getInstance();
export default logger;