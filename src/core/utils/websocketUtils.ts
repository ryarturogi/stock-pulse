/**
 * WebSocket Connection Utilities
 * ==============================
 *
 * Centralized utilities for managing WebSocket and EventSource connections
 * with robust error handling and debugging capabilities.
 */

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error?: string;
  lastAttempt?: number;
  attempts: number;
  maxAttempts: number;
}

export interface ConnectionOptions {
  maxAttempts?: number;
  timeoutMs?: number;
  retryDelayMs?: number;
  debugMode?: boolean;
}

/**
 * Create a robust EventSource connection with proper error handling
 */
export function createEventSource(
  url: string,
  options: ConnectionOptions = {}
): {
  eventSource: EventSource | null;
  state: ConnectionState;
  cleanup: () => void;
} {
  const {
    maxAttempts = 5,
    timeoutMs = 15000,
    debugMode = process.env.NODE_ENV === 'development',
  } = options;

  const state: ConnectionState = {
    status: 'disconnected',
    attempts: 0,
    maxAttempts,
  };

  let eventSource: EventSource | null = null;
  let timeoutId: NodeJS.Timeout | null = null;

  const log = (...args: unknown[]) => {
    if (debugMode) {
      console.log('[WebSocketUtils]', ...args);
    }
  };

  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (eventSource) {
      try {
        eventSource.close();
        log('EventSource closed successfully');
      } catch (error) {
        log('Error closing EventSource:', error);
      }
      eventSource = null;
    }
    state.status = 'disconnected';
  };

  const connect = () => {
    try {
      log('Creating EventSource connection to:', url);
      state.status = 'connecting';
      state.lastAttempt = Date.now();
      state.attempts++;

      eventSource = new EventSource(url);
      log('EventSource created, readyState:', eventSource.readyState);

      // Set connection timeout
      timeoutId = setTimeout(() => {
        if (state.status === 'connecting') {
          log('EventSource connection timeout');
          state.status = 'error';
          state.error = 'Connection timeout';
          cleanup();
        }
      }, timeoutMs);

      eventSource.onopen = () => {
        log('EventSource connected successfully');
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        state.status = 'connected';
        delete state.error;
        state.attempts = 0; // Reset attempts on success
      };

      eventSource.onerror = error => {
        log('EventSource error:', error);
        log('ReadyState:', eventSource?.readyState);

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        state.status = 'error';
        state.error = 'Connection failed';

        // Clean up the failed connection
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
      };

      return eventSource;
    } catch (error) {
      log('Failed to create EventSource:', error);
      state.status = 'error';
      state.error = error instanceof Error ? error.message : 'Unknown error';
      cleanup();
      return null;
    }
  };

  // Initial connection attempt
  eventSource = connect();

  return {
    eventSource,
    state,
    cleanup,
  };
}

/**
 * Retry logic with exponential backoff
 */
export function calculateRetryDelay(
  attempt: number,
  baseDelayMs: number = 1000
): number {
  return Math.min(baseDelayMs * Math.pow(2, attempt), 30000); // Max 30 seconds
}

/**
 * Check if a URL is valid for EventSource
 */
export function isValidEventSourceUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Parse Server-Sent Events data
 */
export function parseSSEData(data: string): Record<string, unknown> | null {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.warn('Failed to parse SSE data:', data, error);
    return null;
  }
}

/**
 * Connection health check
 */
export function isConnectionHealthy(
  state: ConnectionState,
  maxAge: number = 60000
): boolean {
  if (state.status !== 'connected') {
    return false;
  }

  if (state.lastAttempt && Date.now() - state.lastAttempt > maxAge) {
    return false; // Connection is too old
  }

  return true;
}
