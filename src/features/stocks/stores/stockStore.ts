/**
 * Stock Tracking Store with Zustand
 * =================================
 * 
 * Centralized state management for stock tracking functionality
 * following the React Developer test requirements.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { STORAGE_KEYS } from '@/core/constants/constants';
import {
  StockStoreState,
  WatchedStock,
  FinnhubStockQuote,
  WebSocketStatus,
  RefreshInterval,
  REFRESH_INTERVALS
} from '@/core/types';
import { getNotificationService } from '@/features/notifications';
import { StockWebSocketService } from '@/features/stocks/services/stockWebSocketService';

/**
 * Generate unique ID for watched stocks
 */
const generateStockId = (): string => {
  return `stock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * WebSocket service instance for the stock store
 */
let webSocketService: StockWebSocketService | null = null;

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
      // lastConnectionAttempt is optional and will be set when needed

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


      // Connect to real-time updates using dedicated WebSocket service
      connectWebSocket: async () => {
        // Initialize WebSocket service if needed
        if (!webSocketService) {
          webSocketService = new StockWebSocketService({
            onStatusChange: (status) => set({ webSocketStatus: status }),
            onConnectionChange: (connection) => set({ webSocketConnection: connection }),
            onConnectingChange: (isConnecting) => set({ isConnecting }),
            onErrorChange: (error) => set({ error }),
            onUpdateConnectionAttempts: (attempts) => set({ connectionAttempts: attempts }),
            onUpdateLastConnectionAttempt: (timestamp) => set({ lastConnectionAttempt: timestamp }),
            onDisableLiveData: () => set({ isLiveDataEnabled: false }),
            onStartPeriodicRefresh: () => get().startPeriodicRefresh(),
            onUpdateStockPrice: (symbol, quote) => get().updateStockPrice(symbol, quote),
            getWatchedStocks: () => get().watchedStocks,
            getState: () => {
              const state = get();
              const result: {
                isLiveDataEnabled: boolean;
                webSocketStatus: WebSocketStatus;
                webSocketConnection: EventSource | null;
                isConnecting: boolean;
                connectionAttempts: number;
                lastConnectionAttempt?: number;
                watchedStocks: WatchedStock[];
              } = {
                isLiveDataEnabled: state.isLiveDataEnabled,
                webSocketStatus: state.webSocketStatus,
                webSocketConnection: state.webSocketConnection,
                isConnecting: state.isConnecting,
                connectionAttempts: state.connectionAttempts,
                watchedStocks: state.watchedStocks
              };
              
              // Only include lastConnectionAttempt if it has a value
              if (state.lastConnectionAttempt !== undefined) {
                result.lastConnectionAttempt = state.lastConnectionAttempt;
              }
              
              return result;
            }
          });
        }

        await webSocketService.connectWebSocket();
      },

      // Disconnect WebSocket
      disconnectWebSocket: () => {
        if (webSocketService) {
          webSocketService.disconnectWebSocket();
        } else {
          // Fallback if service not initialized
          const { webSocketConnection } = get();
          if (webSocketConnection) {
            (webSocketConnection as EventSource).close();
            set({ 
              webSocketConnection: null, 
              webSocketStatus: 'disconnected' 
            });
          }
        }
      },

      // Reset WebSocket state and re-enable live data
      resetWebSocketState: () => {
        if (webSocketService) {
          webSocketService.resetWebSocketState();
          // Re-enable live data in the store as well
          set({ isLiveDataEnabled: true });
        } else {
          // Fallback if service not initialized
          const { webSocketConnection } = get();
          if (webSocketConnection) {
            (webSocketConnection as EventSource).close();
          }
          
          // Reset all WebSocket-related state
          set({
            webSocketConnection: null,
            webSocketStatus: 'disconnected',
            connectionAttempts: 0,
            isConnecting: false,
            error: null,
            isLiveDataEnabled: true
          });
          
          console.log('🔄 WebSocket state reset and live data re-enabled');
        }
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

      setWebSocketConnection: (connection: EventSource | null) => {
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
      migrate: (persistedState: unknown, version: number) => {
        try {
          // Handle migration from older versions
          if (version === 0) {
            // If no version exists, this is a fresh install or old format
            // Return default state structure
            const state = persistedState as Record<string, unknown> | null;
            return {
              watchedStocks: state?.watchedStocks || [],
              refreshTimeInterval: state?.refreshTimeInterval || '30s',
              isLiveDataEnabled: state?.isLiveDataEnabled ?? true,
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
  resetWebSocketState: useStockStore(state => state.resetWebSocketState),
  startPeriodicRefresh: useStockStore(state => state.startPeriodicRefresh),
  stopPeriodicRefresh: useStockStore(state => state.stopPeriodicRefresh),
});