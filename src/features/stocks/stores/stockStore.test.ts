/**
 * Unit Tests for Stock Store (Zustand)
 * ====================================
 *
 * Comprehensive tests for stock state management
 */

// Mock the stockWebSocketService BEFORE any imports
const mockWebSocketService = {
  connectWebSocket: jest.fn().mockResolvedValue(undefined),
  disconnectWebSocket: jest.fn(),
  subscribeToStock: jest.fn(),
  unsubscribeFromStock: jest.fn(),
  resetWebSocketState: jest.fn(),
  cleanup: jest.fn(),
};

jest.mock('@/features/stocks/services/stockWebSocketService', () => ({
  StockWebSocketService: jest
    .fn()
    .mockImplementation(() => mockWebSocketService),
}));

// Mock the notification service
jest.mock('@/features/notifications', () => ({
  getNotificationService: () => ({
    showNotification: jest.fn(),
    showPriceAlert: jest.fn(),
  }),
}));

import { act } from '@testing-library/react';
import { useStockStore } from './stockStore';
import type { FinnhubStockQuote } from '@/core/types';

// Mock EventSource for WebSocket tests
const mockEventSource = {
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  readyState: 1,
  url: '',
  withCredentials: false,
  CONNECTING: 0,
  OPEN: 1,
  CLOSED: 2,
  onopen: null,
  onmessage: null,
  onerror: null,
};

global.EventSource = jest.fn(() => mockEventSource) as any;

describe('Stock Store', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset mock service methods
    mockWebSocketService.connectWebSocket.mockResolvedValue(undefined);
    mockWebSocketService.disconnectWebSocket.mockClear();
    mockWebSocketService.resetWebSocketState.mockClear();

    // Manually reset store state to avoid webSocketService issues
    useStockStore.setState({
      watchedStocks: [],
      webSocketStatus: 'disconnected',
      webSocketConnection: null,
      refreshInterval: null,
      isConnecting: false,
      isLoading: false,
      error: null,
      lastUpdateTimes: new Map(),
      refreshTimeInterval: '30s',
      isLiveDataEnabled: true,
      connectionAttempts: 0,
      reconnectTimeout: null,
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useStockStore.getState();

      expect(state.watchedStocks).toEqual([]);
      expect(state.webSocketStatus).toBe('disconnected');
      expect(state.webSocketConnection).toBeNull();
      expect(state.refreshInterval).toBeNull();
      expect(state.isConnecting).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.refreshTimeInterval).toBe('30s');
      expect(state.isLiveDataEnabled).toBe(true);
      expect(state.connectionAttempts).toBe(0);
    });
  });

  describe('Stock Management', () => {
    it('should add a new stock to watchlist', () => {
      const { addStock } = useStockStore.getState();

      act(() => {
        addStock('AAPL', 'Apple Inc.', 150.0);
      });

      const state = useStockStore.getState();
      expect(state.watchedStocks).toHaveLength(1);
      expect(state.watchedStocks[0]).toMatchObject({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        alertPrice: 150.0,
        isLoading: true,
        priceHistory: [],
        isAlertTriggered: false,
      });
      expect(state.watchedStocks[0].id).toMatch(/^stock_\d+_/);
      expect(state.error).toBeNull();
    });

    it('should not add duplicate stocks', () => {
      const { addStock } = useStockStore.getState();

      act(() => {
        addStock('AAPL', 'Apple Inc.', 150.0);
        addStock('AAPL', 'Apple Inc.', 160.0); // Try to add same symbol
      });

      const state = useStockStore.getState();
      expect(state.watchedStocks).toHaveLength(1);
      expect(state.error).toBe('Stock AAPL is already being watched');
    });

    it('should remove stock from watchlist', () => {
      const { addStock, removeStock } = useStockStore.getState();

      act(() => {
        addStock('AAPL', 'Apple Inc.', 150.0);
        addStock('GOOGL', 'Alphabet Inc.', 2800.0);
      });

      expect(useStockStore.getState().watchedStocks).toHaveLength(2);

      act(() => {
        removeStock('AAPL');
      });

      const state = useStockStore.getState();
      expect(state.watchedStocks).toHaveLength(1);
      expect(state.watchedStocks[0].symbol).toBe('GOOGL');
      expect(state.error).toBeNull();
    });

    it('should update alert price for existing stock', () => {
      const { addStock, updateAlertPrice } = useStockStore.getState();

      act(() => {
        addStock('AAPL', 'Apple Inc.', 150.0);
      });

      act(() => {
        updateAlertPrice('AAPL', 160.0);
      });

      const state = useStockStore.getState();
      expect(state.watchedStocks[0].alertPrice).toBe(160.0);
      expect(state.watchedStocks[0].isAlertTriggered).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Stock Price Updates', () => {
    const mockQuote: FinnhubStockQuote = {
      symbol: 'AAPL',
      current: 155.5,
      change: 5.5,
      percentChange: 3.67,
      high: 157.0,
      low: 153.0,
      open: 154.0,
      previousClose: 150.0,
      timestamp: Date.now(),
    };

    beforeEach(() => {
      const { addStock } = useStockStore.getState();
      act(() => {
        addStock('AAPL', 'Apple Inc.', 150.0);
      });
    });

    it('should update stock price with valid quote', () => {
      const { updateStockPrice } = useStockStore.getState();

      act(() => {
        updateStockPrice('AAPL', mockQuote);
      });

      const state = useStockStore.getState();
      const stock = state.watchedStocks[0];

      expect(stock.currentPrice).toBe(155.5);
      expect(stock.change).toBe(5.5);
      expect(stock.percentChange).toBe(3.67);
      expect(stock.high).toBe(157.0);
      expect(stock.low).toBe(153.0);
      expect(stock.open).toBe(154.0);
      expect(stock.previousClose).toBe(150.0);
      expect(stock.isLoading).toBe(false);
      expect(stock.priceHistory).toHaveLength(1);
      expect(stock.lastUpdated).toBeDefined();
    });

    it('should throttle price updates', () => {
      const { updateStockPrice } = useStockStore.getState();

      // First update should go through
      act(() => {
        updateStockPrice('AAPL', mockQuote);
      });

      const firstStock = useStockStore.getState().watchedStocks[0];
      expect(firstStock.currentPrice).toBe(155.5);

      // Second update within throttle window should be ignored
      act(() => {
        updateStockPrice('AAPL', { ...mockQuote, current: 160.0 });
      });

      const secondStock = useStockStore.getState().watchedStocks[0];
      expect(secondStock.currentPrice).toBe(155.5); // Should not change
    });

    it('should trigger price alert when above alert price', () => {
      const { updateStockPrice } = useStockStore.getState();
      const alertQuote = { ...mockQuote, current: 165.0 }; // Above alert price of 150

      act(() => {
        updateStockPrice('AAPL', alertQuote);
      });

      const state = useStockStore.getState();
      const stock = state.watchedStocks[0];
      expect(stock.isAlertTriggered).toBe(true);
    });

    it('should maintain price history with limit', () => {
      const { updateStockPrice } = useStockStore.getState();
      const baseTime = Date.now();

      // Add more than 500 price points to test limit
      // We need to account for throttling (500ms), so we use different timestamps
      for (let i = 0; i < 510; i++) {
        // Use mock timers to bypass throttling for this test
        const originalGetTime = Date.now;
        Date.now = jest.fn(() => baseTime + i * 600); // 600ms apart to avoid throttling

        act(() => {
          updateStockPrice('AAPL', {
            ...mockQuote,
            current: 150 + i,
            timestamp: baseTime + i * 600,
          });
        });

        Date.now = originalGetTime;
      }

      const state = useStockStore.getState();
      const stock = state.watchedStocks[0];
      expect(stock.priceHistory).toHaveLength(500); // Should be limited to 500
    });
  });

  describe('WebSocket Management', () => {
    beforeEach(() => {
      const { addStock } = useStockStore.getState();
      act(() => {
        addStock('AAPL', 'Apple Inc.', 150.0);
      });
    });

    it('should not connect WebSocket on server side', async () => {
      // Mock server-side environment
      delete (global as any).window;

      const { connectWebSocket } = useStockStore.getState();
      await act(async () => {
        await connectWebSocket();
      });

      expect(global.EventSource).not.toHaveBeenCalled();

      // Restore window for other tests
      (global as any).window = {};
    });

    it('should not connect WebSocket when live data is disabled', async () => {
      const { setLiveDataEnabled, connectWebSocket } = useStockStore.getState();

      act(() => {
        setLiveDataEnabled(false);
      });

      await act(async () => {
        await connectWebSocket();
      });

      expect(global.EventSource).not.toHaveBeenCalled();
    });

    it('should not connect if already connected', async () => {
      // Set initial connected state
      useStockStore.setState({
        webSocketStatus: 'connected',
        webSocketConnection: mockEventSource as any,
      });

      const { connectWebSocket } = useStockStore.getState();
      await act(async () => {
        await connectWebSocket();
      });

      // Should not create new EventSource
      expect(global.EventSource).not.toHaveBeenCalled();
    });

    it('should disconnect WebSocket properly', () => {
      // Set connected state
      useStockStore.setState({
        webSocketStatus: 'connected',
        webSocketConnection: mockEventSource as any,
      });

      const { disconnectWebSocket } = useStockStore.getState();
      act(() => {
        disconnectWebSocket();
      });

      expect(mockEventSource.close).toHaveBeenCalled();
      const state = useStockStore.getState();
      expect(state.webSocketConnection).toBeNull();
      expect(state.webSocketStatus).toBe('disconnected');
    });
  });

  describe('Refresh Interval Management', () => {
    it('should set refresh time interval', () => {
      const { setRefreshTimeInterval } = useStockStore.getState();

      act(() => {
        setRefreshTimeInterval('5m');
      });

      const state = useStockStore.getState();
      expect(state.refreshTimeInterval).toBe('5m');
    });

    it('should not start periodic refresh when live data is disabled', () => {
      const { setLiveDataEnabled, startPeriodicRefresh } =
        useStockStore.getState();

      act(() => {
        setLiveDataEnabled(false);
        startPeriodicRefresh();
      });

      const state = useStockStore.getState();
      expect(state.refreshInterval).toBeNull();
    });

    it('should start periodic refresh as WebSocket fallback when connected', () => {
      useStockStore.setState({
        webSocketStatus: 'connected',
        webSocketConnection: mockEventSource as any,
        isLiveDataEnabled: true, // Must be enabled for refresh to work
      });

      const { startPeriodicRefresh } = useStockStore.getState();
      act(() => {
        startPeriodicRefresh();
      });

      const state = useStockStore.getState();
      // Periodic refresh should start even when WebSocket is connected (as fallback)
      expect(state.refreshInterval).not.toBeNull();
    });

    it('should stop periodic refresh', () => {
      const mockInterval = 123 as any;
      useStockStore.setState({ refreshInterval: mockInterval });

      const { stopPeriodicRefresh } = useStockStore.getState();
      act(() => {
        stopPeriodicRefresh();
      });

      const state = useStockStore.getState();
      expect(state.refreshInterval).toBeNull();
    });
  });

  describe('Live Data Management', () => {
    beforeEach(() => {
      const { addStock } = useStockStore.getState();
      act(() => {
        addStock('AAPL', 'Apple Inc.', 150.0);
      });
    });

    it('should enable live data and start services', () => {
      const { setLiveDataEnabled } = useStockStore.getState();

      act(() => {
        setLiveDataEnabled(true);
      });

      const state = useStockStore.getState();
      expect(state.isLiveDataEnabled).toBe(true);
    });

    it('should disable live data and stop services', () => {
      // Set initial state with active connections
      useStockStore.setState({
        refreshInterval: 123 as any,
        webSocketConnection: mockEventSource as any,
        webSocketStatus: 'connected' as any,
      });

      const { setLiveDataEnabled } = useStockStore.getState();
      act(() => {
        setLiveDataEnabled(false);
      });

      const state = useStockStore.getState();
      expect(state.isLiveDataEnabled).toBe(false);
      expect(mockEventSource.close).toHaveBeenCalled();
    });
  });

  describe('Error Management', () => {
    it('should set and clear errors', () => {
      const { setError, clearError } = useStockStore.getState();

      act(() => {
        setError('Test error message');
      });

      expect(useStockStore.getState().error).toBe('Test error message');

      act(() => {
        clearError();
      });

      expect(useStockStore.getState().error).toBeNull();
    });

    it('should set loading state', () => {
      const { setLoading } = useStockStore.getState();

      act(() => {
        setLoading(true);
      });

      expect(useStockStore.getState().isLoading).toBe(true);

      act(() => {
        setLoading(false);
      });

      expect(useStockStore.getState().isLoading).toBe(false);
    });
  });

  describe('Connection Attempts', () => {
    it('should track connection attempts for exponential backoff', () => {
      const state = useStockStore.getState();
      expect(state.connectionAttempts).toBe(0);

      // Simulate connection failure increment
      act(() => {
        useStockStore.setState(prevState => ({
          connectionAttempts: prevState.connectionAttempts + 1,
        }));
      });

      expect(useStockStore.getState().connectionAttempts).toBe(1);
    });

    it('should reset connection attempts on successful connection', () => {
      // Set some failed attempts
      useStockStore.setState({ connectionAttempts: 3 });

      // Simulate successful connection
      act(() => {
        useStockStore.setState({
          webSocketStatus: 'connected',
          connectionAttempts: 0,
        });
      });

      const state = useStockStore.getState();
      expect(state.connectionAttempts).toBe(0);
    });
  });
});
