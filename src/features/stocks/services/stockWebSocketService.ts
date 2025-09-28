/**
 * Stock WebSocket Service
 * =======================
 *
 * Dedicated service for managing WebSocket connections for stock data.
 * Extracted from stockStore to provide better separation of concerns.
 * Contains the full complex WebSocket logic with all error handling, retries, and fallbacks.
 */

import { FinnhubStockQuote, WebSocketStatus, WatchedStock } from '@/core/types';

export interface StockWebSocketCallbacks {
  onStatusChange: (_status: WebSocketStatus) => void;
  onConnectionChange: (_connection: EventSource | null) => void;
  onConnectingChange: (_isConnecting: boolean) => void;
  onErrorChange: (_error: string | null) => void;
  onUpdateConnectionAttempts: (_attempts: number) => void;
  onUpdateLastConnectionAttempt: (_timestamp: number) => void;
  onDisableLiveData: () => void;
  onStartPeriodicRefresh: () => void;
  onStopPeriodicRefresh: () => void;
  onUpdateStockPrice: (_symbol: string, _quote: FinnhubStockQuote) => void;
  getWatchedStocks: () => WatchedStock[];
  getState: () => {
    isLiveDataEnabled: boolean;
    webSocketStatus: WebSocketStatus;
    webSocketConnection: EventSource | null;
    isConnecting: boolean;
    connectionAttempts: number;
    lastConnectionAttempt?: number;
    watchedStocks: WatchedStock[];
  };
}

export class StockWebSocketService {
  private callbacks: StockWebSocketCallbacks;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private eventSource: EventSource | null = null;

  constructor(callbacks: StockWebSocketCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Connect to real-time updates using secure WebSocket proxy
   * Full complex implementation with all error handling and retry logic
   */
  async connectWebSocket(): Promise<void> {
    // Don't create connections on server side
    if (typeof window === 'undefined') {
      return;
    }

    const state = this.callbacks.getState();

    // Don't connect if live data is disabled
    if (!state.isLiveDataEnabled) {
      console.log('⚠️ Live data is disabled, skipping WebSocket connection');
      return;
    }

    // Check if already connected
    if (state.webSocketStatus === 'connected' && state.webSocketConnection) {
      console.log('✅ WebSocket already connected');
      return;
    }

    // Check if already connecting to prevent duplicate connection attempts
    if (state.webSocketStatus === 'connecting' || state.isConnecting) {
      console.log(
        '⚠️ WebSocket connection already in progress, skipping duplicate attempt'
      );
      return;
    }

    // Check if we're in a cooldown period from previous failures
    const lastConnectionAttempt = state.lastConnectionAttempt || 0;
    const timeSinceLastAttempt = Date.now() - lastConnectionAttempt;
    const minConnectionInterval = 30 * 1000; // 30 seconds minimum between connection attempts

    if (timeSinceLastAttempt < minConnectionInterval) {
      const remainingTime = Math.ceil(
        (minConnectionInterval - timeSinceLastAttempt) / 1000
      );
      console.log(
        `⏰ Connection attempt too soon, waiting ${remainingTime}s before retry`
      );
      return;
    }

    // If we're in an error state, wait even longer before retrying
    if (state.webSocketStatus === 'error') {
      const errorCooldown = 60 * 1000; // 1 minute for error state
      if (timeSinceLastAttempt < errorCooldown) {
        const remainingTime = Math.ceil(
          (errorCooldown - timeSinceLastAttempt) / 1000
        );
        console.log(
          `⏰ Error state cooldown active, waiting ${remainingTime}s before retry`
        );
        return;
      }
    }

    // If we've had too many connection attempts, disable WebSocket temporarily
    const maxConnectionAttempts = 10; // Increased from 5 to 10
    if (state.connectionAttempts >= maxConnectionAttempts) {
      console.log(
        '🚫 Too many connection attempts, switching to API-only mode'
      );
      this.callbacks.onStatusChange('error');
      this.callbacks.onConnectingChange(false);
      this.callbacks.onErrorChange(
        'Real-time connection unavailable - using periodic updates'
      );
      this.callbacks.onConnectionChange(null);
      this.callbacks.onDisableLiveData(); // Disable live data to prevent further attempts
      return;
    }

    // Close existing connection if any
    if (state.webSocketConnection) {
      state.webSocketConnection.close();
    }

    if (state.watchedStocks.length === 0) {
      console.log('⚠️ No stocks to connect to');
      return;
    }

    console.log('🔌 Connecting to secure WebSocket proxy...');
    this.callbacks.onStatusChange('connecting');
    this.callbacks.onConnectingChange(true);
    this.callbacks.onErrorChange(null);
    this.callbacks.onUpdateLastConnectionAttempt(Date.now());

    try {
      const symbols = state.watchedStocks.map(stock => stock.symbol).join(',');
      const proxyUrl = `/api/websocket-proxy?symbols=${symbols}`;
      console.log('🔗 Proxy URL:', proxyUrl);

      this.eventSource = new EventSource(proxyUrl);

      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        const currentState = this.callbacks.getState();
        if (currentState.webSocketStatus === 'connecting') {
          console.log(
            '⏰ WebSocket proxy connection timeout, switching to API mode...'
          );
          this.cleanup();
          this.callbacks.onStatusChange('error');
          this.callbacks.onConnectingChange(false);
          this.callbacks.onErrorChange(
            'Connection timeout - using API fallback'
          );
          this.callbacks.onConnectionChange(null);

          // Start periodic refresh as fallback
          const errorState = this.callbacks.getState();
          if (
            errorState.isLiveDataEnabled &&
            errorState.watchedStocks.length > 0
          ) {
            this.callbacks.onStartPeriodicRefresh();
          }
        }
      }, 60000); // 60 second timeout (increased for better reliability and rate limit handling)

      this.eventSource.onopen = () => {
        console.log('✅ Connected to secure WebSocket proxy');
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        this.callbacks.onStatusChange('connected');
        this.callbacks.onConnectingChange(false);
        this.callbacks.onErrorChange(null);
        this.callbacks.onConnectionChange(this.eventSource);
        this.callbacks.onUpdateConnectionAttempts(0); // Reset connection attempts on successful connection

        // WebSocket connected - real-time data is now available, stop periodic refresh to avoid redundant API calls
        console.log(
          '🔌 WebSocket connected - real-time data active, stopping periodic refresh to avoid redundant API calls'
        );
        this.callbacks.onStopPeriodicRefresh();
      };

      this.eventSource.onerror = error => {
        console.error('❌ WebSocket proxy connection error:', error);
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }

        // Check if this is a connection error (409, 429, 503)
        if (
          this.eventSource &&
          this.eventSource.readyState === EventSource.CLOSED
        ) {
          console.log(
            '🔌 WebSocket connection closed, likely due to rate limiting or circuit breaker'
          );
          this.cleanup();
          this.callbacks.onStatusChange('error');
          this.callbacks.onConnectingChange(false);
          this.callbacks.onErrorChange(
            'Connection blocked - using API fallback'
          );
          this.callbacks.onConnectionChange(null);
          this.callbacks.onUpdateLastConnectionAttempt(Date.now());

          // Start periodic refresh as fallback
          const errorState = this.callbacks.getState();
          if (
            errorState.isLiveDataEnabled &&
            errorState.watchedStocks.length > 0
          ) {
            this.callbacks.onStartPeriodicRefresh();
          }
        }
      };

      // EventSource doesn't have onclose - using onerror for connection management instead

      this.eventSource.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket proxy message received:', data);

          if (data.type === 'trade' && data.data) {
            const trade = data.data;
            if (trade.symbol && trade.price) {
              const symbol = trade.symbol;
              const price = trade.price;

              console.log(`💰 Real-time trade update: ${symbol} = $${price}`);

              // Update stock price in store
              const currentState = this.callbacks.getState();
              const stock = currentState.watchedStocks.find(
                (s: WatchedStock) => s.symbol === symbol
              );
              if (stock) {
                // Calculate change if we have previous data
                const previousPrice =
                  stock.previousClose || stock.currentPrice || price;
                const change = price - previousPrice;
                const percentChange =
                  previousPrice > 0 ? (change / previousPrice) * 100 : 0;

                this.callbacks.onUpdateStockPrice(symbol, {
                  symbol,
                  current: price,
                  change: change,
                  percentChange: percentChange,
                  high: Math.max(stock.high || price, price),
                  low: Math.min(stock.low || price, price),
                  open: stock.open || price,
                  previousClose: stock.previousClose || price,
                  timestamp: trade.timestamp || Date.now(),
                });
              }
            }
          } else if (data.type === 'connected') {
            console.log('✅ WebSocket proxy connected:', data.message);
          } else if (data.type === 'error') {
            console.warn('⚠️ WebSocket proxy message:', data.message);
            this.callbacks.onStatusChange('error');
            this.callbacks.onConnectingChange(false);
            this.callbacks.onErrorChange(data.message);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket proxy message:', error);
        }
      };

      // Additional error handler for connection issues
      this.eventSource.addEventListener('error', (error: Event) => {
        console.warn(
          '⚠️ WebSocket proxy connection issue (likely rate limited or cooldown active)'
        );
        if (error instanceof ErrorEvent && error.message) {
          console.info('Connection details:', {
            message: error.message,
            type: 'EventSource error',
          });
        }
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }

        // Check if this is just an initial connection error
        const currentState = this.callbacks.getState();
        if (currentState.webSocketStatus === 'connecting') {
          console.log(
            '⚠️ Initial WebSocket proxy connection error, will retry...'
          );
          return;
        }

        // Don't show error messages for temporary connection issues
        // Just log them and continue with periodic refresh
        console.log(
          '⚠️ WebSocket connection issue, continuing with periodic refresh'
        );

        // Check EventSource readyState for more specific error info
        let readyStateText = 'UNKNOWN';
        if (this.eventSource) {
          readyStateText =
            this.eventSource.readyState === 0
              ? 'CONNECTING'
              : this.eventSource.readyState === 1
                ? 'OPEN'
                : 'CLOSED';
          console.log(
            `EventSource readyState: ${readyStateText} (${this.eventSource.readyState})`
          );
        }

        // Determine error message based on likely causes - use user-friendly messages
        let errorMessage = 'Connection temporarily unavailable';
        if (readyStateText === 'CLOSED') {
          errorMessage = 'Real-time connection paused - using periodic updates';
        }

        this.callbacks.onStatusChange('error');
        this.callbacks.onConnectingChange(false);
        this.callbacks.onErrorChange(errorMessage);
        this.callbacks.onConnectionChange(null);

        // Start periodic refresh as fallback when WebSocket fails
        const errorState = this.callbacks.getState();
        if (
          errorState.isLiveDataEnabled &&
          errorState.watchedStocks.length > 0
        ) {
          this.callbacks.onStartPeriodicRefresh();
        }

        // Attempt to reconnect after exponential backoff delay
        const reconnectState = this.callbacks.getState();

        // Increase backoff for repeated failures and limit max attempts
        const maxReconnectAttempts = 5; // Increased back to 5 for better reliability
        if (reconnectState.connectionAttempts >= maxReconnectAttempts) {
          console.log(
            '🚫 Max WebSocket reconnection attempts reached, switching to API-only mode'
          );
          this.callbacks.onStatusChange('error');
          this.callbacks.onConnectingChange(false);
          this.callbacks.onErrorChange(
            'Real-time connection unavailable - using periodic updates'
          );
          this.callbacks.onDisableLiveData(); // Disable to prevent further connection attempts
          return;
        }

        const backoffDelay = Math.min(
          5000 * Math.pow(2, reconnectState.connectionAttempts),
          60000
        ); // 5s, 10s, 20s, max 60s

        console.log(
          `🔄 Scheduling WebSocket reconnection in ${backoffDelay / 1000}s (attempt ${reconnectState.connectionAttempts + 1}/${maxReconnectAttempts})`
        );

        setTimeout(() => {
          const retryState = this.callbacks.getState();
          if (
            retryState.watchedStocks.length > 0 &&
            retryState.webSocketStatus !== 'connecting' &&
            retryState.webSocketStatus !== 'connected' &&
            retryState.isLiveDataEnabled
          ) {
            console.log(
              `🔄 Attempting WebSocket reconnection... (attempt ${retryState.connectionAttempts + 1}/${maxReconnectAttempts})`
            );
            this.callbacks.onUpdateConnectionAttempts(
              retryState.connectionAttempts + 1
            );
            this.connectWebSocket();
          }
        }, backoffDelay);
      });
    } catch (error) {
      console.error('Failed to create WebSocket proxy connection:', error);
      this.callbacks.onStatusChange('error');
      this.callbacks.onConnectingChange(false);
      this.callbacks.onErrorChange(
        error instanceof Error
          ? error.message
          : 'WebSocket proxy connection failed'
      );
    }
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void {
    this.cleanup();

    const state = this.callbacks.getState();

    if (state.webSocketConnection) {
      state.webSocketConnection.close();
      this.callbacks.onConnectionChange(null);
      this.callbacks.onStatusChange('disconnected');
    }

    console.log('❌ WebSocket proxy disconnected');
  }

  /**
   * Reset WebSocket state and re-enable live data (useful for manual recovery)
   */
  resetWebSocketState(): void {
    const state = this.callbacks.getState();

    // Close existing connection if any
    if (state.webSocketConnection) {
      state.webSocketConnection.close();
    }

    console.log('🔄 Resetting WebSocket state and re-enabling live data');
    this.callbacks.onStatusChange('disconnected');
    this.callbacks.onConnectionChange(null);
    this.callbacks.onUpdateConnectionAttempts(0);
    this.callbacks.onConnectingChange(false);
    this.callbacks.onErrorChange(null);
    this.callbacks.onUpdateLastConnectionAttempt(0);

    // Note: Re-enabling live data should be handled by the store

    // Attempt to reconnect if we have stocks to watch
    if (state.watchedStocks.length > 0) {
      setTimeout(() => {
        const currentState = this.callbacks.getState();
        if (currentState.isLiveDataEnabled) {
          this.connectWebSocket();
        }
      }, 1000);
    }
  }
}
