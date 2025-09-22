/**
 * Stock Tracking Store with Zustand
 * =================================
 * 
 * Centralized state management for stock tracking functionality
 * following the React Developer test requirements.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import {
  StockStoreState,
  WatchedStock,
  FinnhubStockQuote,
  WebSocketStatus,
  STORAGE_KEYS,
  RefreshInterval,
  REFRESH_INTERVALS
} from '@/core/types';
import { getNotificationService } from '@/features/notifications';

/**
 * Generate unique ID for watched stocks
 */
const generateStockId = (): string => {
  return `stock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Stock tracking store implementation
 */
export const useStockStore = create<StockStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      watchedStocks: [],
      webSocketStatus: 'disconnected',
      webSocketConnection: null,
      refreshInterval: null,
      isConnecting: false,
      isLoading: false,
      error: null,
      lastUpdateTimes: new Map<string, number>(),
      refreshTimeInterval: '30s', // Default to 30 seconds for timely updates
      isLiveDataEnabled: true, // Default to live data enabled
      connectionAttempts: 0, // Track connection attempts for exponential backoff
      lastConnectionAttempt: 0, // Track last connection attempt timestamp

      // Stock management actions
      addStock: (symbol: string, name: string, alertPrice: number) => {
        const state = get();
        
        // Check if stock is already being watched
        if (state.watchedStocks.some(stock => stock.symbol === symbol)) {
          set({ error: `Stock ${symbol} is already being watched` });
          return;
        }

        const newStock: WatchedStock = {
          id: generateStockId(),
          symbol,
          name,
          alertPrice,
          isLoading: true,
          priceHistory: [], // Will be populated when first price update comes in
          isAlertTriggered: false,
        };

        set(state => ({
          watchedStocks: [...state.watchedStocks, newStock],
          error: null,
        }));

        // Only reconnect WebSocket if we're currently connected and live data is enabled
        const { webSocketStatus, webSocketConnection, isLiveDataEnabled } = get();
        if (webSocketStatus === 'connected' && webSocketConnection && isLiveDataEnabled) {
          console.log(`📡 Reconnecting WebSocket to include ${symbol}`);
          // Immediate disconnect and reconnect with new symbol
          (webSocketConnection as EventSource).close();
          set({ 
            webSocketConnection: null, 
            webSocketStatus: 'disconnected' 
          });
          
          // Reconnect after a short delay to allow UI to update
          setTimeout(() => {
            const currentState = get();
            if (currentState.watchedStocks.some(s => s.symbol === symbol) && currentState.isLiveDataEnabled) {
              currentState.connectWebSocket();
            }
          }, 5000); // 5 seconds - reasonable delay
        }
        // Note: If not connected, the useEffect in the main page will handle the connection
      },

      removeStock: (symbol: string) => {
        set(state => ({
          watchedStocks: state.watchedStocks.filter(stock => stock.symbol !== symbol),
          error: null,
        }));

        // Reconnect WebSocket to remove stock from subscription (with proper cleanup)
        const { webSocketStatus, webSocketConnection } = get();
        if (webSocketStatus === 'connected' && webSocketConnection) {
          console.log(`📡 Reconnecting WebSocket to remove ${symbol}`);
          // Immediate disconnect and reconnect with remaining symbols
          (webSocketConnection as EventSource).close();
          set({ 
            webSocketConnection: null, 
            webSocketStatus: 'disconnected' 
          });
          
          // Reconnect after a short delay if there are still stocks to watch
          setTimeout(() => {
            const currentState = get();
            if (currentState.watchedStocks.length > 0) {
              currentState.connectWebSocket();
            }
          }, 300);
        }
      },

      // Update alert price for a watched stock
      updateAlertPrice: (symbol: string, newAlertPrice: number) => {
        set(state => ({
          watchedStocks: state.watchedStocks.map(stock => {
            if (stock.symbol === symbol) {
              return {
                ...stock,
                alertPrice: newAlertPrice,
                isAlertTriggered: false, // Reset alert status when price is changed
              };
            }
            return stock;
          }),
          error: null,
        }));

        console.log(`📝 Updated alert price for ${symbol}: $${newAlertPrice.toFixed(2)}`);
      },

      // Update stock price with throttling to prevent excessive updates
      updateStockPrice: (symbol: string, quote: FinnhubStockQuote) => {
        const state = get();
        const now = Date.now();
        const lastUpdate = state.lastUpdateTimes.get(symbol) || 0;
        const throttleMs = 500; // Reduced to 500ms for better chart responsiveness

        // Throttle updates to prevent excessive re-renders but allow chart updates
        if (now - lastUpdate < throttleMs) {
          return;
        }

        // Update last update time
        set(state => ({
          lastUpdateTimes: new Map(state.lastUpdateTimes).set(symbol, now)
        }));

        console.log(`💰 Updating price for ${symbol}: $${quote.current} ${new Date().toLocaleTimeString()}`);

        set(state => ({
          watchedStocks: state.watchedStocks.map(stock => {
            if (stock.symbol === symbol) {
              const newPriceHistory = [
                ...(stock.priceHistory || []),
                { time: quote.timestamp || now, price: quote.current }
              ].slice(-500); // Keep last 500 data points

              return {
                ...stock,
                currentPrice: quote.current,
                change: quote.change,
                percentChange: quote.percentChange,
                high: quote.high || stock.high || quote.current,
                low: quote.low || stock.low || quote.current,
                open: quote.open || stock.open || quote.current,
                previousClose: quote.previousClose || stock.previousClose || quote.current,
                priceHistory: newPriceHistory,
                isLoading: false,
                lastUpdated: now,
                isAlertTriggered: stock.alertPrice && quote.current >= stock.alertPrice ? true : stock.isAlertTriggered,
              };
            }
            return stock;
          }),
        }));

        // Check for price alerts
        const stock = get().watchedStocks.find(s => s.symbol === symbol);
        if (stock && stock.alertPrice && quote.current >= stock.alertPrice && !stock.isAlertTriggered) {
          getNotificationService().showNotification({
            title: `Price Alert: ${symbol}`,
            body: `${symbol} has reached your target price of $${stock.alertPrice}. Current price: $${quote.current}`,
            icon: '/icons/icon-192x192.svg',
            badge: '/icons/icon-72x72.svg',
            data: {
              symbol: symbol,
              currentPrice: quote.current,
              alertPrice: stock.alertPrice,
              type: 'above'
            }
          });
        }
      },


      // Connect to real-time updates using secure WebSocket proxy
      connectWebSocket: async () => {
        // Don't create connections on server side
        if (typeof window === 'undefined') {
          return;
        }

        const state = get();
        
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
          console.log('⚠️ WebSocket connection already in progress, skipping duplicate attempt');
          return;
        }

        // Check if we're in a cooldown period from previous failures
        const lastConnectionAttempt = state.lastConnectionAttempt || 0;
        const timeSinceLastAttempt = Date.now() - lastConnectionAttempt;
        const minConnectionInterval = 30 * 1000; // 30 seconds minimum between connection attempts
        
        if (timeSinceLastAttempt < minConnectionInterval) {
          const remainingTime = Math.ceil((minConnectionInterval - timeSinceLastAttempt) / 1000);
          console.log(`⏰ Connection attempt too soon, waiting ${remainingTime}s before retry`);
          return;
        }

        // If we're in an error state, wait even longer before retrying
        if (state.webSocketStatus === 'error') {
          const errorCooldown = 60 * 1000; // 1 minute for error state
          if (timeSinceLastAttempt < errorCooldown) {
            const remainingTime = Math.ceil((errorCooldown - timeSinceLastAttempt) / 1000);
            console.log(`⏰ Error state cooldown active, waiting ${remainingTime}s before retry`);
            return;
          }
        }

        // If we've had too many connection attempts, disable WebSocket temporarily
        const maxConnectionAttempts = 5;
        if (state.connectionAttempts >= maxConnectionAttempts) {
          console.log('🚫 EMERGENCY: Too many connection attempts, disabling WebSocket and using API only');
          set({
            webSocketStatus: 'error',
            isConnecting: false,
            error: 'WebSocket disabled due to repeated failures - using API fallback',
            webSocketConnection: null,
            isLiveDataEnabled: false // Disable live data to prevent further attempts
          });
          return;
        }

        // Close existing connection if any
        if (state.webSocketConnection) {
          (state.webSocketConnection as EventSource).close();
        }

        if (state.watchedStocks.length === 0) {
          console.log('⚠️ No stocks to connect to');
          return;
        }

        console.log('🔌 Connecting to secure WebSocket proxy...');
        set({ 
          webSocketStatus: 'connecting', 
          isConnecting: true,
          error: null,
          lastConnectionAttempt: Date.now()
        });

        try {
          const symbols = state.watchedStocks.map(stock => stock.symbol).join(',');
          const proxyUrl = `/api/websocket-proxy?symbols=${symbols}`;
          console.log('🔗 Proxy URL:', proxyUrl);

          const eventSource = new EventSource(proxyUrl);
          
          // Set connection timeout
          const connectionTimeout = setTimeout(() => {
            if (get().webSocketStatus === 'connecting') {
              console.log('⏰ WebSocket proxy connection timeout, switching to API mode...');
              eventSource.close();
              set({
                webSocketStatus: 'error',
                isConnecting: false,
                error: 'Connection timeout - using API fallback',
                webSocketConnection: null
              });
              
              // Start periodic refresh as fallback
              const errorState = get();
              if (errorState.isLiveDataEnabled && errorState.watchedStocks.length > 0) {
                errorState.startPeriodicRefresh();
              }
            }
          }, 60000); // 60 second timeout (increased for better reliability and rate limit handling)

          eventSource.onopen = () => {
            console.log('✅ Connected to secure WebSocket proxy');
            clearTimeout(connectionTimeout);
            set({ 
              webSocketStatus: 'connected', 
              isConnecting: false, 
              error: null,
              webSocketConnection: eventSource,
              connectionAttempts: 0 // Reset connection attempts on successful connection
            });
            
            // WebSocket connected - real-time data is now available, but keep periodic refresh running
            // for reliability and to honor user's refresh interval preference
            console.log('🔌 WebSocket connected - real-time data active, periodic refresh continues for reliability');
          };

          eventSource.onerror = (error) => {
            console.error('❌ WebSocket proxy connection error:', error);
            clearTimeout(connectionTimeout);
            
            // Check if this is a connection error (409, 429, 503)
            if (eventSource.readyState === EventSource.CLOSED) {
              console.log('🔌 WebSocket connection closed, likely due to rate limiting or circuit breaker');
              set({
                webSocketStatus: 'error',
                isConnecting: false,
                error: 'Connection blocked - using API fallback',
                webSocketConnection: null,
                lastConnectionAttempt: Date.now()
              });
              
              // Start periodic refresh as fallback
              const errorState = get();
              if (errorState.isLiveDataEnabled && errorState.watchedStocks.length > 0) {
                errorState.startPeriodicRefresh();
              }
            }
          };

          eventSource.onclose = (event) => {
            console.log('🔌 WebSocket proxy connection closed:', event);
            clearTimeout(connectionTimeout);
            
            // Only attempt reconnection if we're not in an error state and live data is enabled
            const currentState = get();
            if (currentState.isLiveDataEnabled && currentState.watchedStocks.length > 0 && 
                currentState.webSocketStatus !== 'error') {
              
              // Implement exponential backoff for reconnection with longer delays
              const attempts = currentState.connectionAttempts || 0;
              const maxAttempts = 3; // Reduced max attempts
              
              if (attempts < maxAttempts) {
                // Exponential backoff: 5s, 10s, 20s (reasonable delays)
                const backoffDelay = Math.min(Math.pow(2, attempts) * 5000, 30000); // 5s, 10s, 20s, max 30s
                console.log(`🔄 WebSocket connection closed, retrying in ${backoffDelay/1000}s (attempt ${attempts + 1}/${maxAttempts})`);
                
                set({ 
                  webSocketStatus: 'disconnected',
                  isConnecting: false,
                  connectionAttempts: attempts + 1,
                  lastConnectionAttempt: Date.now()
                });
                
                setTimeout(() => {
                  const retryState = get();
                  if (retryState.isLiveDataEnabled && retryState.watchedStocks.length > 0) {
                    retryState.connectWebSocket();
                  }
                }, backoffDelay);
              } else {
                console.log('❌ Max WebSocket reconnection attempts reached, switching to API mode');
                set({
                  webSocketStatus: 'error',
                  isConnecting: false,
                  error: 'Connection failed - using API fallback',
                  webSocketConnection: null,
                  connectionAttempts: 0,
                  lastConnectionAttempt: Date.now()
                });
                
                // Start periodic refresh as fallback
                const errorState = get();
                if (errorState.isLiveDataEnabled && errorState.watchedStocks.length > 0) {
                  errorState.startPeriodicRefresh();
                }
              }
            }
          };

          eventSource.onmessage = (event) => {
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
                  const currentState = get();
                  const stock = currentState.watchedStocks.find(s => s.symbol === symbol);
                  if (stock) {
                    // Calculate change if we have previous data
                    const previousPrice = stock.previousClose || stock.currentPrice || price;
                    const change = price - previousPrice;
                    const percentChange = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
                    
                    currentState.updateStockPrice(symbol, {
                      symbol,
                      current: price,
                      change: change,
                      percentChange: percentChange,
                      high: Math.max(stock.high || price, price),
                      low: Math.min(stock.low || price, price),
                      open: stock.open || price,
                      previousClose: stock.previousClose || price,
                      timestamp: trade.timestamp || Date.now()
                    });
                  }
                }
              } else if (data.type === 'connected') {
                console.log('✅ WebSocket proxy connected:', data.message);
              } else if (data.type === 'error') {
                console.warn('⚠️ WebSocket proxy message:', data.message);
                set({ 
                  webSocketStatus: 'error', 
                  isConnecting: false, 
                  error: data.message 
                });
              }
            } catch (error) {
              console.error('Failed to parse WebSocket proxy message:', error);
            }
          };

          eventSource.onerror = (error) => {
            console.warn('⚠️ WebSocket proxy connection issue (likely rate limited or cooldown active)');
            if (error instanceof ErrorEvent && error.message) {
              console.info('Connection details:', {
                message: error.message,
                type: 'EventSource error'
              });
            }
            clearTimeout(connectionTimeout);
            
            // Check if this is just an initial connection error
            const currentState = get();
            if (currentState.webSocketStatus === 'connecting') {
              console.log('⚠️ Initial WebSocket proxy connection error, will retry...');
              return;
            }
            
            // Check EventSource readyState for more specific error info
            const readyStateText = eventSource.readyState === 0 ? 'CONNECTING' : 
                                  eventSource.readyState === 1 ? 'OPEN' : 'CLOSED';
            console.log(`EventSource readyState: ${readyStateText} (${eventSource.readyState})`);
            
            // Determine error message based on likely causes
            let errorMessage = `WebSocket proxy connection failed (${readyStateText})`;
            if (readyStateText === 'CLOSED') {
              errorMessage = 'WebSocket proxy disconnected - likely rate limited or cooldown active';
            }
            
            set({
              webSocketStatus: 'error',
              isConnecting: false,
              error: errorMessage,
              webSocketConnection: null
            });

            // Start periodic refresh as fallback when WebSocket fails
            const errorState = get();
            if (errorState.isLiveDataEnabled && errorState.watchedStocks.length > 0) {
              errorState.startPeriodicRefresh();
            }

            // Attempt to reconnect after exponential backoff delay
            const reconnectState = get();
            const backoffDelay = Math.min(1000 * Math.pow(2, reconnectState.connectionAttempts), 30000); // Max 30s
            
            setTimeout(() => {
              const retryState = get();
              if (retryState.watchedStocks.length > 0 && 
                  retryState.webSocketStatus !== 'connecting' && 
                  retryState.webSocketStatus !== 'connected') {
                console.log(`🔄 Attempting to reconnect WebSocket proxy... (attempt ${retryState.connectionAttempts + 1}, delay: ${backoffDelay}ms)`);
                set(prevState => ({ connectionAttempts: prevState.connectionAttempts + 1 }));
                retryState.connectWebSocket();
              }
            }, backoffDelay);
          };

        } catch (error) {
          console.error('Failed to create WebSocket proxy connection:', error);
          set({ 
            webSocketStatus: 'error', 
            isConnecting: false, 
            error: error instanceof Error ? error.message : 'WebSocket proxy connection failed' 
          });
        }
      },

      // Disconnect WebSocket
      disconnectWebSocket: () => {
        const { webSocketConnection } = get();
        
        if (webSocketConnection) {
          (webSocketConnection as EventSource).close();
          set({ 
            webSocketConnection: null, 
            webSocketStatus: 'disconnected' 
          });
        }
        
        console.log('❌ WebSocket proxy disconnected');
      },

      // Start periodic refresh only as fallback when WebSocket is not connected
      startPeriodicRefresh: () => {
        if (typeof window === 'undefined') {
          return;
        }

        const state = get();

        // Only start periodic refresh if live data is enabled
        if (!state.isLiveDataEnabled) {
          console.log(`⚠️ Periodic refresh only works when live data is enabled`);
          return;
        }

        // WebSocket provides real-time data, but we still want periodic refresh for reliability
        // and to respect user's chosen refresh interval
        console.log(`🔄 Starting periodic refresh every ${state.refreshTimeInterval} (WebSocket: ${state.webSocketStatus})`);  

        // Clear any existing interval
        if (state.refreshInterval) {
          clearInterval(state.refreshInterval);
        }

        // Get the current refresh interval configuration
        const intervalConfig = REFRESH_INTERVALS.find(config => config.value === state.refreshTimeInterval);
        let intervalMs = intervalConfig?.milliseconds || 120000; // Default to 2 minutes to respect rate limits
        
        // Enforce minimum interval based on number of watched stocks to respect API limits
        // Finnhub free tier: ~60 calls/minute, so with N stocks we need at least N seconds between calls
        const minIntervalMs = Math.max(state.watchedStocks.length * 1000, 30000); // Minimum 30s, or 1s per stock
        if (intervalMs < minIntervalMs) {
          intervalMs = minIntervalMs;
          console.log(`⚠️ Increasing refresh interval to ${intervalMs/1000}s to respect API limits with ${state.watchedStocks.length} stocks`);
        }

        // Start new interval as WebSocket fallback
        console.log(`📊 Current refresh interval: ${state.refreshTimeInterval}`);
        const interval = setInterval(async () => {
          const currentState = get();
          
          if (currentState.watchedStocks.length > 0) {
            console.log(`🔄 Periodic refresh executing (${currentState.refreshTimeInterval}) - WebSocket: ${currentState.webSocketStatus}`);
            
            // Use Promise.all for concurrent API calls
            const refreshPromises = currentState.watchedStocks.map(async (stock) => {
              try {
                const response = await fetch(`/api/quote?symbol=${stock.symbol}`);
                if (response.ok) {
                  const data = await response.json();
                  // Check if response has the expected structure
                  if (data.current) {
                    currentState.updateStockPrice(stock.symbol, data);
                  } else if (data.data && data.data.current) {
                    currentState.updateStockPrice(stock.symbol, data.data);
                  }
                }
              } catch (error) {
                console.warn(`Failed to refresh ${stock.symbol}:`, error);
              }
            });
            
            await Promise.all(refreshPromises);
          }
        }, intervalMs);

        set({ refreshInterval: interval });
      },

      // Stop periodic refresh
      stopPeriodicRefresh: () => {
        const { refreshInterval } = get();
        
        if (refreshInterval) {
          clearInterval(refreshInterval);
          set({ refreshInterval: null });
        }
      },

      // Set refresh time interval
      setRefreshTimeInterval: (interval: RefreshInterval) => {
        console.log(`🔄 Changing refresh interval from ${get().refreshTimeInterval} to ${interval}`);
        set({ refreshTimeInterval: interval });
        
        // Restart periodic refresh with new interval if live data is enabled
        const state = get();
        if (state.watchedStocks.length > 0 && state.isLiveDataEnabled) {
          console.log(`🔄 Restarting periodic refresh with new interval: ${interval} (Live data enabled)`);
          state.stopPeriodicRefresh();
          state.startPeriodicRefresh();
        } else if (!state.isLiveDataEnabled) {
          console.log(`⚠️ Refresh interval change ignored - live data is disabled`);
        } else if (state.watchedStocks.length === 0) {
          console.log(`⚠️ Refresh interval change ignored - no stocks to watch`);
        }
      },

      // Set live data enabled/disabled
      setLiveDataEnabled: (enabled: boolean) => {
        console.log(`📊 ${enabled ? 'Enabling' : 'Disabling'} live data`);
        set({ isLiveDataEnabled: enabled });
        
        const state = get();
        
        // Handle refresh intervals and WebSocket connections based on live data toggle
        if (enabled) {
          // Always start periodic refresh when enabling live data (regardless of WebSocket status)
          if (state.watchedStocks.length > 0) {
            console.log(`🔄 Starting periodic refresh - live data enabled`);
            state.startPeriodicRefresh();
          }
          // Connect to WebSocket when enabling live data (runs in parallel with periodic refresh)
          if (state.watchedStocks.length > 0) {
            console.log(`🔌 Connecting to WebSocket - live data enabled`);
            state.connectWebSocket();
          }
        } else {
          // Stop periodic refresh when disabling live data
          if (state.refreshInterval) {
            console.log(`⏹️ Stopping periodic refresh - live data disabled`);
            state.stopPeriodicRefresh();
          }
          // Disconnect WebSocket when disabling live data
          if (state.webSocketConnection) {
            console.log(`🔌 Disconnecting WebSocket - live data disabled`);
            state.disconnectWebSocket();
          }
        }
      },


      // WebSocket status management
      setWebSocketStatus: (status: WebSocketStatus) => {
        set({ webSocketStatus: status });
      },

      setWebSocketConnection: (connection: any) => {
        set({ webSocketConnection: connection });
      },

      // Loading state management
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Error management
      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: STORAGE_KEYS.WATCHED_STOCKS,
      storage: createJSONStorage(() => {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          // Server-side rendering - use in-memory storage
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        
        // Browser environment - use localStorage
        try {
          return localStorage;
        } catch (error) {
          // Fallback to in-memory storage if localStorage is not available
          console.warn('localStorage not available, using in-memory storage:', error);
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
      }),
      version: 1, // Current version of the persisted state
      migrate: (persistedState: any, version: number) => {
        try {
          // Handle migration from older versions
          if (version === 0) {
            // If no version exists, this is a fresh install or old format
            // Return default state structure
            return {
              watchedStocks: persistedState?.watchedStocks || [],
              refreshTimeInterval: persistedState?.refreshTimeInterval || '30s',
              isLiveDataEnabled: persistedState?.isLiveDataEnabled ?? true,
            };
          }
          
          // For current version, return as-is
          return persistedState;
        } catch (error) {
          console.warn('Failed to migrate persisted state, using defaults:', error);
          // Return safe defaults if migration fails
          return {
            watchedStocks: [],
            refreshTimeInterval: '30s',
            isLiveDataEnabled: true,
          };
        }
      },
      partialize: (state) => ({
        watchedStocks: state.watchedStocks,
        refreshTimeInterval: state.refreshTimeInterval,
        isLiveDataEnabled: state.isLiveDataEnabled,
      }),
      onRehydrateStorage: () => {
        return (_state, error) => {
          if (error) {
            console.warn('Failed to rehydrate store state:', error);
          } else {
            console.log('Store state rehydrated successfully');
          }
        };
      },
    }
  )
);

// Export store actions for external use
export const {
  addStock: addStockToWatchlist,
  removeStock: removeStockFromWatchlist,
  updateStockPrice: updateStockPriceInStore,
  connectWebSocket: connectToWebSocket,
  disconnectWebSocket: disconnectFromWebSocket,
  startPeriodicRefresh: startStockRefresh,
  stopPeriodicRefresh: stopStockRefresh,
} = useStockStore.getState();

// Custom hooks for easier component usage
export const useWatchedStocks = () => useStockStore(state => state.watchedStocks);
export const useWebSocketStatus = () => useStockStore(state => state.webSocketStatus);
export const useStockLoading = () => useStockStore(state => state.isLoading);
export const useStockError = () => useStockStore(state => state.error);

// Stock management actions hook
export const useStockActions = () => ({
  addStock: useStockStore(state => state.addStock),
  removeStock: useStockStore(state => state.removeStock),
  updateAlertPrice: useStockStore(state => state.updateAlertPrice),
  setRefreshTimeInterval: useStockStore(state => state.setRefreshTimeInterval),
  setLiveDataEnabled: useStockStore(state => state.setLiveDataEnabled),
  clearError: useStockStore(state => state.clearError),
});

// WebSocket management actions hook
export const useWebSocketActions = () => ({
  connectWebSocket: useStockStore(state => state.connectWebSocket),
  disconnectWebSocket: useStockStore(state => state.disconnectWebSocket),
  startPeriodicRefresh: useStockStore(state => state.startPeriodicRefresh),
  stopPeriodicRefresh: useStockStore(state => state.stopPeriodicRefresh),
});