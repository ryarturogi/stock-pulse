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
  isFinnhubStockQuote
} from '@/types';

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
      isLoading: false,
      error: null,

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
          priceHistory: [],
          isAlertTriggered: false,
        };

        set(state => ({
          watchedStocks: [...state.watchedStocks, newStock],
          error: null,
        }));

        // Subscribe to WebSocket if connected
        const { webSocketConnection } = get();
        if (webSocketConnection && webSocketConnection.readyState === WebSocket.OPEN) {
          webSocketConnection.send(JSON.stringify({
            type: 'subscribe',
            symbol: symbol,
          }));
        }
      },

      removeStock: (symbol: string) => {
        const state = get();
        
        set({
          watchedStocks: state.watchedStocks.filter(stock => stock.symbol !== symbol),
        });

        // Unsubscribe from WebSocket if connected
        const { webSocketConnection } = get();
        if (webSocketConnection && webSocketConnection.readyState === WebSocket.OPEN) {
          webSocketConnection.send(JSON.stringify({
            type: 'unsubscribe',
            symbol: symbol,
          }));
        }
      },

      updateStockPrice: (symbol: string, quote: FinnhubStockQuote) => {
        if (!isFinnhubStockQuote(quote)) {
          console.error('Invalid quote data:', quote);
          return;
        }

        set(state => ({
          watchedStocks: state.watchedStocks.map(stock => {
            if (stock.symbol !== symbol) return stock;

            const now = Date.now();
            const isAlertTriggered = stock.alertPrice && 
              ((quote.current >= stock.alertPrice && !stock.isAlertTriggered) ||
               (quote.current < stock.alertPrice && !stock.isAlertTriggered));

            return {
              ...stock,
              currentPrice: quote.current,
              change: quote.change,
              changePercent: quote.percentChange,
              high: quote.high,
              low: quote.low,
              open: quote.open,
              previousClose: quote.previousClose,
              isLoading: false,
              lastUpdated: now,
              isAlertTriggered: isAlertTriggered || stock.isAlertTriggered || false,
              priceHistory: [
                ...(stock.priceHistory || []),
                { time: now, price: quote.current }
              ].slice(-50), // Keep last 50 data points
            };
          }),
        }));
      },

      // WebSocket connection management
      setWebSocketStatus: (status: WebSocketStatus) => {
        set({ webSocketStatus: status });
      },

      setWebSocketConnection: (connection: WebSocket | null) => {
        set({ webSocketConnection: connection });
      },

      // UI state management
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      // WebSocket actions
      connectWebSocket: async () => {
        // Don't create WebSocket on server side
        if (typeof window === 'undefined') {
          return;
        }

        const state = get();
        
        if (state.webSocketConnection?.readyState === WebSocket.OPEN) {
          return; // Already connected
        }

        // For demo purposes, skip WebSocket connection and use manual refresh mode
        // Finnhub free tier may not support WebSocket connections
        console.log('WebSocket connection skipped for demo. Using manual refresh mode.');
        set({ 
          webSocketStatus: 'disconnected',
          error: null,
        });
        return;

        // Original WebSocket code commented out for demo
        /*
        set({ webSocketStatus: 'connecting' });

        try {
          // Get WebSocket connection info from our API route
          const response = await fetch('/api/websocket');
          if (!response.ok) {
            throw new Error(`Failed to get WebSocket connection info: ${response.status} ${response.statusText}`);
          }
          
          const connectionInfo = await response.json();
          if (!connectionInfo.websocketUrl) {
            throw new Error('WebSocket URL not available');
          }

          console.log('Connecting to WebSocket:', connectionInfo.websocketUrl);
          const ws = new WebSocket(connectionInfo.websocketUrl);

          // Set a timeout for WebSocket connection
          const connectionTimeout = setTimeout(() => {
            if (ws.readyState === WebSocket.CONNECTING) {
              console.error('WebSocket connection timeout');
              ws.close();
              set({ 
                webSocketStatus: 'error',
                error: 'WebSocket connection timeout',
              });
            }
          }, 10000); // 10 second timeout

          ws.onopen = () => {
            clearTimeout(connectionTimeout);
            console.log('WebSocket connected to Finnhub');
            set({ 
              webSocketStatus: 'connected',
              webSocketConnection: ws,
              error: null,
            });

            // Subscribe to all watched stocks
            state.watchedStocks.forEach(stock => {
              ws.send(JSON.stringify({
                type: 'subscribe',
                symbol: stock.symbol,
              }));
            });
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              
                  if (data.type === 'trade' && data.data) {
                    data.data.forEach((trade: any) => {
                      if (trade.s && trade.p && trade.t) {
                        const quote: FinnhubStockQuote = {
                          symbol: trade.s,
                          current: trade.p,
                          change: 0, // Will be calculated
                          percentChange: 0, // Will be calculated
                          high: 0, // Not available in trade data
                          low: 0, // Not available in trade data
                          open: 0, // Not available in trade data
                          previousClose: 0, // Not available in trade data
                          timestamp: trade.t,
                        };

                        get().updateStockPrice(trade.s, quote);
                      }
                    });
                  }
            } catch (error) {
              console.error('Error parsing WebSocket message:', error);
            }
          };

          ws.onclose = () => {
            console.log('WebSocket disconnected');
            set({ 
              webSocketStatus: 'disconnected',
              webSocketConnection: null,
            });

            // Attempt to reconnect after 5 seconds
            setTimeout(() => {
              const currentState = get();
              if (currentState.watchedStocks.length > 0) {
                get().connectWebSocket();
              }
            }, 5000);
          };

          ws.onerror = (error) => {
            clearTimeout(connectionTimeout);
            console.error('WebSocket error:', error);
            console.error('WebSocket readyState:', ws.readyState);
            console.error('WebSocket URL:', connectionInfo.websocketUrl);
            
            // For demo purposes, we'll fall back to disconnected state
            // In production, you might want to implement retry logic or alternative data sources
            console.warn('WebSocket connection failed. Falling back to manual refresh mode.');
            set({ 
              webSocketStatus: 'disconnected',
              error: null, // Don't show error to user, just fall back gracefully
            });
          };

        } catch (error) {
          console.error('Failed to connect WebSocket:', error);
          console.warn('WebSocket connection failed. Falling back to manual refresh mode.');
          set({ 
            webSocketStatus: 'disconnected',
            error: null, // Don't show error to user, just fall back gracefully
          });
        }
        */
      },

      disconnectWebSocket: () => {
        // Don't access WebSocket on server side
        if (typeof window === 'undefined') {
          return;
        }

        const { webSocketConnection } = get();
        
        if (webSocketConnection) {
          webSocketConnection.close();
          set({ 
            webSocketConnection: null,
            webSocketStatus: 'disconnected',
          });
        }
      },

      subscribeToStock: (symbol: string) => {
        const { webSocketConnection } = get();
        
        if (webSocketConnection && webSocketConnection.readyState === WebSocket.OPEN) {
          webSocketConnection.send(JSON.stringify({
            type: 'subscribe',
            symbol: symbol,
          }));
        }
      },

      unsubscribeFromStock: (symbol: string) => {
        const { webSocketConnection } = get();
        
        if (webSocketConnection && webSocketConnection.readyState === WebSocket.OPEN) {
          webSocketConnection.send(JSON.stringify({
            type: 'unsubscribe',
            symbol: symbol,
          }));
        }
      },
    }),
    {
      name: STORAGE_KEYS.WATCHED_STOCKS,
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        // Return a no-op storage for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        watchedStocks: state.watchedStocks.map(stock => ({
          ...stock,
          // Don't persist WebSocket connection or temporary state
          webSocketConnection: null,
          isLoading: false,
        })),
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle migration if needed
        if (version === 0) {
          // Migrate from version 0 to 1
          return {
            ...persistedState,
            watchedStocks: persistedState.watchedStocks?.map((stock: any) => ({
              ...stock,
              id: stock.id || generateStockId(),
              priceHistory: stock.priceHistory || [],
              isAlertTriggered: false,
            })) || [],
          };
        }
        return persistedState;
      },
    }
  )
);

/**
 * Selectors for optimized re-renders
 */
export const useWatchedStocks = () => useStockStore(state => state.watchedStocks);
export const useWebSocketStatus = () => useStockStore(state => state.webSocketStatus);
export const useStockLoading = () => useStockStore(state => state.isLoading);
export const useStockError = () => useStockStore(state => state.error);

/**
 * Action selectors
 */
export const useStockActions = () => useStockStore(state => ({
  addStock: state.addStock,
  removeStock: state.removeStock,
  updateStockPrice: state.updateStockPrice,
  setError: state.setError,
  clearError: state.clearError,
  connectWebSocket: state.connectWebSocket,
  disconnectWebSocket: state.disconnectWebSocket,
}));

/**
 * WebSocket action selectors
 */
export const useWebSocketActions = () => useStockStore(state => ({
  connectWebSocket: state.connectWebSocket,
  disconnectWebSocket: state.disconnectWebSocket,
  subscribeToStock: state.subscribeToStock,
  unsubscribeFromStock: state.unsubscribeFromStock,
  setWebSocketStatus: state.setWebSocketStatus,
}));
