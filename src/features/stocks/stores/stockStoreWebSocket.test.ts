/**
 * Integration Tests for Stock Store WebSocket Functionality
 * ========================================================
 * 
 * Tests for WebSocket connection management in the Zustand store
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { useStockStore } from './stockStore';
import { stockService } from '../services/stockService';
import type { FinnhubStockQuote } from '@/core/types';

// Mock dependencies
jest.mock('../services/stockService');
const mockStockService = stockService as jest.Mocked<typeof stockService>;

// Mock EventSource
class MockEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  public readyState = MockEventSource.CONNECTING;
  public onopen: ((event: any) => void) | null = null;
  public onmessage: ((event: any) => void) | null = null;
  public onerror: ((event: any) => void) | null = null;
  public url: string;

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockEventSource.OPEN;
      if (this.onopen) {
        this.onopen({ type: 'open' });
      }
    }, 10);
  }

  close() {
    this.readyState = MockEventSource.CLOSED;
  }

  // Helper methods for testing
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror({ type: 'error' });
    }
  }
}

global.EventSource = MockEventSource as any;

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
});

// Helper to create mock stock quote
const createMockQuote = (symbol: string, price: number): FinnhubStockQuote => ({
  symbol,
  current: price,
  change: price * 0.01,
  percentChange: 1.0,
  high: price * 1.02,
  low: price * 0.98,
  open: price * 0.99,
  previousClose: price * 0.99,
  timestamp: Date.now(),
});

describe('Stock Store WebSocket Integration', () => {
  let mockEventSource: MockEventSource;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Reset store
    useStockStore.getState().reset();
    
    // Setup mock EventSource
    global.EventSource = jest.fn().mockImplementation((url) => {
      mockEventSource = new MockEventSource(url);
      return mockEventSource;
    });

    // Setup default stock service mocks
    mockStockService.fetchStockQuote.mockResolvedValue(createMockQuote('AAPL', 150.00));
  });

  afterEach(() => {
    jest.useRealTimers();
    act(() => {
      useStockStore.getState().reset();
    });
  });

  describe('WebSocket Connection Management', () => {
    it('should not connect WebSocket when live data is disabled', async () => {
      const { result } = renderHook(() => useStockStore());
      
      // Add a stock but keep live data disabled
      act(() => {
        result.current.addStock('AAPL');
        result.current.setLiveDataEnabled(false);
      });

      act(() => {
        result.current.connectWebSocket();
      });

      expect(global.EventSource).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('⚠️ Live data is disabled, skipping WebSocket connection');
    });

    it('should not connect WebSocket when no stocks are watched', async () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.connectWebSocket();
      });

      expect(global.EventSource).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('⚠️ No stocks to connect to');
    });

    it('should create WebSocket connection when conditions are met', async () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
      });

      expect(global.EventSource).toHaveBeenCalledWith('/api/websocket-proxy?symbols=AAPL');
      expect(result.current.webSocketStatus).toBe('connecting');
      expect(result.current.isConnecting).toBe(true);
    });

    it('should connect to multiple stocks', async () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.addStock('GOOGL');
        result.current.addStock('MSFT');
        result.current.connectWebSocket();
      });

      expect(global.EventSource).toHaveBeenCalledWith('/api/websocket-proxy?symbols=AAPL,GOOGL,MSFT');
    });

    it('should not create duplicate connections', async () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
      });

      // Try to connect again
      act(() => {
        result.current.connectWebSocket();
      });

      expect(global.EventSource).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith('✅ WebSocket already connected');
    });

    it('should close existing connection before creating new one', async () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
      });

      const firstConnection = mockEventSource;
      const closeSpy = jest.spyOn(firstConnection, 'close');

      // Add another stock and reconnect
      act(() => {
        result.current.addStock('GOOGL');
        result.current.connectWebSocket();
      });

      expect(closeSpy).toHaveBeenCalled();
      expect(global.EventSource).toHaveBeenCalledTimes(2);
    });
  });

  describe('WebSocket Connection Events', () => {
    it('should handle successful connection', async () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
      });

      // Fast-forward to trigger connection
      act(() => {
        jest.advanceTimersByTime(50);
      });

      await waitFor(() => {
        expect(result.current.webSocketStatus).toBe('connected');
        expect(result.current.isConnecting).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.connectionAttempts).toBe(0);
      });

      expect(console.log).toHaveBeenCalledWith('✅ Connected to secure WebSocket proxy');
    });

    it('should handle connection timeout', async () => {
      const { result } = renderHook(() => useStockStore());
      
      // Mock EventSource that never connects
      global.EventSource = jest.fn().mockImplementation((url) => {
        mockEventSource = new MockEventSource(url);
        mockEventSource.readyState = MockEventSource.CONNECTING; // Stay connecting
        return mockEventSource;
      });

      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
      });

      // Fast-forward past timeout
      act(() => {
        jest.advanceTimersByTime(16000);
      });

      await waitFor(() => {
        expect(result.current.webSocketStatus).toBe('error');
        expect(result.current.isConnecting).toBe(false);
        expect(result.current.error).toBe('Connection timeout - using API fallback');
      });

      expect(console.log).toHaveBeenCalledWith('⏰ WebSocket proxy connection timeout, switching to API mode...');
    });

    it('should start periodic refresh on connection timeout', async () => {
      const { result } = renderHook(() => useStockStore());
      
      // Mock EventSource that never connects
      global.EventSource = jest.fn().mockImplementation((url) => {
        mockEventSource = new MockEventSource(url);
        mockEventSource.readyState = MockEventSource.CONNECTING;
        return mockEventSource;
      });

      const startPeriodicRefreshSpy = jest.spyOn(result.current, 'startPeriodicRefresh');

      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
      });

      // Fast-forward past timeout
      act(() => {
        jest.advanceTimersByTime(16000);
      });

      await waitFor(() => {
        expect(startPeriodicRefreshSpy).toHaveBeenCalled();
      });
    });
  });

  describe('WebSocket Message Handling', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
      });

      // Wait for connection
      act(() => {
        jest.advanceTimersByTime(50);
      });

      await waitFor(() => {
        expect(result.current.webSocketStatus).toBe('connected');
      });
    });

    it('should handle trade messages and update stock prices', async () => {
      const { result } = renderHook(() => useStockStore());

      // Simulate trade message
      act(() => {
        mockEventSource.simulateMessage({
          type: 'trade',
          data: {
            symbol: 'AAPL',
            price: 155.50,
            timestamp: Date.now(),
            volume: 1000,
          },
        });
      });

      await waitFor(() => {
        const stock = result.current.watchedStocks.find(s => s.symbol === 'AAPL');
        expect(stock?.currentPrice).toBe(155.50);
      });

      expect(console.log).toHaveBeenCalledWith('💰 Real-time trade update: AAPL = $155.5');
    });

    it('should calculate price changes from previous data', async () => {
      const { result } = renderHook(() => useStockStore());

      // Set initial price
      act(() => {
        result.current.updateStockPrice('AAPL', createMockQuote('AAPL', 150.00));
      });

      // Simulate trade message with new price
      act(() => {
        mockEventSource.simulateMessage({
          type: 'trade',
          data: {
            symbol: 'AAPL',
            price: 155.50,
            timestamp: Date.now(),
          },
        });
      });

      await waitFor(() => {
        const stock = result.current.watchedStocks.find(s => s.symbol === 'AAPL');
        expect(stock?.currentPrice).toBe(155.50);
        expect(stock?.change).toBeCloseTo(5.50, 2);
        expect(stock?.percentChange).toBeCloseTo(3.67, 2);
      });
    });

    it('should update high and low prices', async () => {
      const { result } = renderHook(() => useStockStore());

      // Set initial stock with existing high/low
      act(() => {
        result.current.updateStockPrice('AAPL', {
          ...createMockQuote('AAPL', 150.00),
          high: 152.00,
          low: 148.00,
        });
      });

      // Simulate trade with new high
      act(() => {
        mockEventSource.simulateMessage({
          type: 'trade',
          data: {
            symbol: 'AAPL',
            price: 156.00,
            timestamp: Date.now(),
          },
        });
      });

      await waitFor(() => {
        const stock = result.current.watchedStocks.find(s => s.symbol === 'AAPL');
        expect(stock?.high).toBe(156.00);
        expect(stock?.low).toBe(148.00);
      });

      // Simulate trade with new low
      act(() => {
        mockEventSource.simulateMessage({
          type: 'trade',
          data: {
            symbol: 'AAPL',
            price: 145.00,
            timestamp: Date.now(),
          },
        });
      });

      await waitFor(() => {
        const stock = result.current.watchedStocks.find(s => s.symbol === 'AAPL');
        expect(stock?.high).toBe(156.00);
        expect(stock?.low).toBe(145.00);
      });
    });

    it('should ignore trade messages for unwatched stocks', async () => {
      const { result } = renderHook(() => useStockStore());

      const initialStocksCount = result.current.watchedStocks.length;

      // Simulate trade message for unwatched stock
      act(() => {
        mockEventSource.simulateMessage({
          type: 'trade',
          data: {
            symbol: 'GOOGL',
            price: 2800.00,
            timestamp: Date.now(),
          },
        });
      });

      // Should not create new stock or update existing
      expect(result.current.watchedStocks.length).toBe(initialStocksCount);
      expect(result.current.watchedStocks.find(s => s.symbol === 'GOOGL')).toBeUndefined();
    });

    it('should handle connected messages', async () => {
      const { result } = renderHook(() => useStockStore());

      act(() => {
        mockEventSource.simulateMessage({
          type: 'connected',
          message: 'Secure WebSocket proxy connected',
          symbols: ['AAPL'],
        });
      });

      expect(console.log).toHaveBeenCalledWith('✅ WebSocket proxy connected:', 'Secure WebSocket proxy connected');
    });

    it('should handle error messages', async () => {
      const { result } = renderHook(() => useStockStore());

      act(() => {
        mockEventSource.simulateMessage({
          type: 'error',
          message: 'Connection failed',
        });
      });

      await waitFor(() => {
        expect(result.current.webSocketStatus).toBe('error');
        expect(result.current.isConnecting).toBe(false);
        expect(result.current.error).toBe('Connection failed');
      });

      expect(console.warn).toHaveBeenCalledWith('⚠️ WebSocket proxy message:', 'Connection failed');
    });

    it('should handle malformed JSON messages', async () => {
      const { result } = renderHook(() => useStockStore());

      // Mock onmessage to send invalid JSON
      act(() => {
        if (mockEventSource.onmessage) {
          mockEventSource.onmessage({ data: 'invalid json' });
        }
      });

      expect(console.error).toHaveBeenCalledWith('Failed to parse WebSocket proxy message:', expect.any(Error));
    });
  });

  describe('WebSocket Error Handling and Reconnection', () => {
    it('should handle connection errors gracefully', async () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
      });

      // Simulate connection error
      act(() => {
        mockEventSource.simulateError();
      });

      await waitFor(() => {
        expect(result.current.webSocketStatus).toBe('error');
        expect(result.current.isConnecting).toBe(false);
      });

      expect(console.warn).toHaveBeenCalledWith('⚠️ WebSocket proxy connection issue (likely rate limited or cooldown active)');
    });

    it('should attempt reconnection with exponential backoff', async () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
      });

      // Wait for connection
      act(() => {
        jest.advanceTimersByTime(50);
      });

      // Simulate error
      act(() => {
        mockEventSource.simulateError();
      });

      const connectWebSocketSpy = jest.spyOn(result.current, 'connectWebSocket');

      // Fast-forward to trigger reconnection
      act(() => {
        jest.advanceTimersByTime(2000); // First attempt after 1s backoff
      });

      await waitFor(() => {
        expect(connectWebSocketSpy).toHaveBeenCalled();
        expect(result.current.connectionAttempts).toBe(1);
      });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🔄 Attempting to reconnect WebSocket proxy... (attempt 1')
      );
    });

    it('should increase backoff delay on subsequent reconnection attempts', async () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
      });

      // Simulate multiple failures
      for (let i = 0; i < 3; i++) {
        act(() => {
          jest.advanceTimersByTime(50);
          mockEventSource.simulateError();
          jest.advanceTimersByTime(Math.pow(2, i) * 1000 + 100);
        });
      }

      await waitFor(() => {
        expect(result.current.connectionAttempts).toBe(3);
      });
    });

    it('should start periodic refresh as fallback on connection error', async () => {
      const { result } = renderHook(() => useStockStore());
      
      const startPeriodicRefreshSpy = jest.spyOn(result.current, 'startPeriodicRefresh');

      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
      });

      // Simulate error
      act(() => {
        mockEventSource.simulateError();
      });

      await waitFor(() => {
        expect(startPeriodicRefreshSpy).toHaveBeenCalled();
      });
    });

    it('should not reconnect when no stocks are watched', async () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
      });

      // Remove all stocks
      act(() => {
        result.current.removeStock('AAPL');
      });

      // Simulate error
      act(() => {
        mockEventSource.simulateError();
      });

      const connectWebSocketSpy = jest.spyOn(result.current, 'connectWebSocket');

      // Fast-forward past reconnection delay
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(connectWebSocketSpy).not.toHaveBeenCalled();
    });

    it('should not reconnect when already connected', async () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
      });

      // Wait for connection
      act(() => {
        jest.advanceTimersByTime(50);
      });

      // Set connection attempts to trigger reconnection logic
      act(() => {
        result.current.connectionAttempts = 1;
      });

      const connectWebSocketSpy = jest.spyOn(result.current, 'connectWebSocket');

      // Fast-forward past reconnection delay
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(connectWebSocketSpy).not.toHaveBeenCalled();
    });
  });

  describe('WebSocket Disconnection', () => {
    it('should disconnect WebSocket properly', async () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
      });

      // Wait for connection
      act(() => {
        jest.advanceTimersByTime(50);
      });

      const closeSpy = jest.spyOn(mockEventSource, 'close');

      act(() => {
        result.current.disconnectWebSocket();
      });

      expect(closeSpy).toHaveBeenCalled();
      expect(result.current.webSocketConnection).toBeNull();
      expect(result.current.webSocketStatus).toBe('disconnected');
      expect(console.log).toHaveBeenCalledWith('❌ WebSocket proxy disconnected');
    });

    it('should handle disconnection when no connection exists', () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.disconnectWebSocket();
      });

      expect(result.current.webSocketConnection).toBeNull();
      expect(console.log).toHaveBeenCalledWith('❌ WebSocket proxy disconnected');
    });
  });

  describe('Integration with Periodic Refresh', () => {
    it('should stop periodic refresh when WebSocket connects', async () => {
      const { result } = renderHook(() => useStockStore());
      
      // Start with periodic refresh
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.startPeriodicRefresh();
      });

      const stopPeriodicRefreshSpy = jest.spyOn(result.current, 'stopPeriodicRefresh');

      // Connect WebSocket
      act(() => {
        result.current.connectWebSocket();
      });

      // Wait for connection
      act(() => {
        jest.advanceTimersByTime(50);
      });

      await waitFor(() => {
        expect(stopPeriodicRefreshSpy).toHaveBeenCalled();
      });

      expect(console.log).toHaveBeenCalledWith('🔌 WebSocket connected, stopping periodic refresh - switching to real-time data');
    });

    it('should not start periodic refresh when WebSocket is connected', () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
      });

      // Wait for connection
      act(() => {
        jest.advanceTimersByTime(50);
      });

      // Try to start periodic refresh
      act(() => {
        result.current.startPeriodicRefresh();
      });

      expect(console.log).toHaveBeenCalledWith('🔌 WebSocket is connected, skipping periodic refresh - using real-time data');
    });
  });

  describe('Server-Side Rendering Compatibility', () => {
    it('should not create WebSocket connection on server side', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
      });

      expect(global.EventSource).not.toHaveBeenCalled();

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('Edge Cases and Error Recovery', () => {
    it('should handle EventSource creation errors', async () => {
      const { result } = renderHook(() => useStockStore());
      
      // Mock EventSource constructor to throw
      global.EventSource = jest.fn().mockImplementation(() => {
        throw new Error('EventSource creation failed');
      });

      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
      });

      await waitFor(() => {
        expect(result.current.webSocketStatus).toBe('error');
        expect(result.current.error).toBe('EventSource creation failed');
      });

      expect(console.error).toHaveBeenCalledWith('Failed to create WebSocket proxy connection:', expect.any(Error));
    });

    it('should reset connection attempts on successful connection', async () => {
      const { result } = renderHook(() => useStockStore());
      
      // Set some connection attempts
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectionAttempts = 3;
        result.current.connectWebSocket();
      });

      // Wait for connection
      act(() => {
        jest.advanceTimersByTime(50);
      });

      await waitFor(() => {
        expect(result.current.connectionAttempts).toBe(0);
      });
    });

    it('should handle rapid connection/disconnection cycles', async () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
      });

      // Rapid connect/disconnect cycles
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.connectWebSocket();
          jest.advanceTimersByTime(10);
          result.current.disconnectWebSocket();
        });
      }

      // Final connection
      act(() => {
        result.current.connectWebSocket();
        jest.advanceTimersByTime(50);
      });

      await waitFor(() => {
        expect(result.current.webSocketStatus).toBe('connected');
      });

      expect(global.EventSource).toHaveBeenCalled();
    });
  });
});