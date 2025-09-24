/**
 * Logger Utility for Production-Safe Logging
 * ==========================================
 * 
 * Provides environment-aware logging that removes debug information in production.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enableInProduction: boolean;
  enableInDevelopment: boolean;
}

const LOG_CONFIG: Record<LogLevel, LoggerConfig> = {
  debug: {
    enableInProduction: false,
    enableInDevelopment: true,
  },
  info: {
    enableInProduction: true,
    enableInDevelopment: true,
  },
  warn: {
    enableInProduction: true,
    enableInDevelopment: true,
  },
  error: {
    enableInProduction: true,
    enableInDevelopment: true,
  },
};

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private shouldLog(level: LogLevel): boolean {
    const config = LOG_CONFIG[level];
    
    if (this.isDevelopment) {
      return config.enableInDevelopment;
    }
    
    if (this.isProduction) {
      return config.enableInProduction;
    }
    
    // Default to development behavior for other environments
    return config.enableInDevelopment;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  // Specialized logging for different contexts
  api(message: string, ...args: unknown[]): void {
    this.debug(`[API] ${message}`, ...args);
  }

  websocket(message: string, ...args: unknown[]): void {
    this.debug(`[WebSocket] ${message}`, ...args);
  }

  store(message: string, ...args: unknown[]): void {
    this.debug(`[Store] ${message}`, ...args);
  }

  performance(message: string, ...args: unknown[]): void {
    this.debug(`[Performance] ${message}`, ...args);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for use in other files
export type { LogLevel };
