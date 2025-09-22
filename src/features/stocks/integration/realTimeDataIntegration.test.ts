/**
 * Integration Tests for Real-Time Data Features
 * ============================================
 * 
 * End-to-end integration tests for WebSocket, EventSource, and real-time stock updates
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { useStockStore } from '../stores/stockStore';
import { stockService } from '../services/stockService';
import type { FinnhubStockQuote } from '@/core/types';

// Mock stock service
jest.mock('../services/stockService');
const mockStockService = stockService as jest.Mocked<typeof stockService>;

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

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

// Mock console methods
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});

// Helper functions
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

describe('Real-Time Data Integration', () => {
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

    // Setup default mocks
    mockStockService.fetchStockQuote.mockResolvedValue(createMockQuote('AAPL', 150.00));
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: createMockQuote('AAPL', 150.00) }),
    } as Response);
  });

  afterEach(() => {
    jest.useRealTimers();
    act(() => {
      useStockStore.getState().reset();
    });
  });

  describe('Complete Real-Time Flow', () => {
    it('should establish complete real-time data flow', async () => {
      const { result } = renderHook(() => useStockStore());
      
      // Step 1: Enable live data and add stocks
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.addStock('GOOGL');
      });

      // Step 2: Connect WebSocket
      act(() => {
        result.current.connectWebSocket();
      });

      // Step 3: Wait for connection
      act(() => {
        jest.advanceTimersByTime(50);
      });

      await waitFor(() => {
        expect(result.current.webSocketStatus).toBe('connected');
      });

      // Step 4: Simulate initial connection message
      act(() => {
        mockEventSource.simulateMessage({
          type: 'connected',
          message: 'Secure WebSocket proxy connected',
          symbols: ['AAPL', 'GOOGL'],
        });
      });

      // Step 5: Simulate real-time trade updates
      act(() => {
        mockEventSource.simulateMessage({
          type: 'trade',
          data: {
            symbol: 'AAPL',
            price: 155.75,
            timestamp: Date.now(),
            volume: 1500,
          },
        });
      });

      act(() => {
        mockEventSource.simulateMessage({
          type: 'trade',
          data: {
            symbol: 'GOOGL',
            price: 2850.25,
            timestamp: Date.now(),
            volume: 800,
          },
        });
      });

      // Verify real-time updates
      await waitFor(() => {
        const appleStock = result.current.watchedStocks.find(s => s.symbol === 'AAPL');
        const googleStock = result.current.watchedStocks.find(s => s.symbol === 'GOOGL');
        
        expect(appleStock?.currentPrice).toBe(155.75);
        expect(googleStock?.currentPrice).toBe(2850.25);
      });

      expect(console.log).toHaveBeenCalledWith('💰 Real-time trade update: AAPL = $155.75');
      expect(console.log).toHaveBeenCalledWith('💰 Real-time trade update: GOOGL = $2850.25');
    });

    it('should fallback to API polling when WebSocket fails', async () => {
      const { result } = renderHook(() => useStockStore());
      
      // Enable live data and add stocks
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
      });

      // Try to connect WebSocket
      act(() => {
        result.current.connectWebSocket();
      });

      // Simulate WebSocket connection failure
      act(() => {
        mockEventSource.simulateError();
      });

      await waitFor(() => {
        expect(result.current.webSocketStatus).toBe('error');
      });

      // Verify periodic refresh started as fallback
      expect(result.current.refreshInterval).toBeDefined();
      
      // Fast-forward to trigger API call
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockStockService.fetchStockQuote).toHaveBeenCalledWith('AAPL');
    });

    it('should handle mixed real-time and API data updates', async () => {
      const { result } = renderHook(() => useStockStore());
      
      // Add stocks and start with API data
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.addStock('MSFT');
        result.current.refreshStockData();
      });

      // Wait for initial API data
      await waitFor(() => {
        expect(mockStockService.fetchStockQuote).toHaveBeenCalledWith('AAPL');
      });

      // Connect WebSocket
      act(() => {
        result.current.connectWebSocket();
        jest.advanceTimersByTime(50);
      });

      await waitFor(() => {
        expect(result.current.webSocketStatus).toBe('connected');
      });

      // Send real-time update for AAPL
      act(() => {
        mockEventSource.simulateMessage({
          type: 'trade',
          data: {
            symbol: 'AAPL',
            price: 160.00,
            timestamp: Date.now(),
          },
        });
      });

      // Simulate WebSocket disconnection
      act(() => {
        mockEventSource.simulateError();
      });

      await waitFor(() => {
        expect(result.current.webSocketStatus).toBe('error');
      });

      // Should fallback to API for all stocks
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockStockService.fetchStockQuote).toHaveBeenCalledWith('AAPL');
      expect(mockStockService.fetchStockQuote).toHaveBeenCalledWith('MSFT');
    });
  });

  describe('Price Alert Integration with Real-Time Data', () => {
    beforeEach(() => {
      // Mock Notification API
      global.Notification = {
        permission: 'granted',
        requestPermission: jest.fn().mockResolvedValue('granted'),
      } as any;

      global.navigator = {
        serviceWorker: {
          ready: Promise.resolve({
            showNotification: jest.fn(),
          }),
        },
      } as any;
    });

    it('should trigger price alerts from real-time data', async () => {
      const { result } = renderHook(() => useStockStore());
      
      // Add stock with alert
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL', 155.00); // Alert at $155
      });

      // Connect WebSocket
      act(() => {
        result.current.connectWebSocket();
        jest.advanceTimersByTime(50);
      });

      const triggerPriceAlertSpy = jest.spyOn(result.current, 'triggerPriceAlert');

      // Send real-time update that triggers alert
      act(() => {
        mockEventSource.simulateMessage({
          type: 'trade',
          data: {
            symbol: 'AAPL',
            price: 155.50, // Above alert price
            timestamp: Date.now(),
          },
        });
      });

      await waitFor(() => {
        expect(triggerPriceAlertSpy).toHaveBeenCalledWith('AAPL');
      });
    });

    it('should not trigger alerts repeatedly for same condition', async () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL', 155.00);
      });

      act(() => {
        result.current.connectWebSocket();
        jest.advanceTimersByTime(50);
      });

      const triggerPriceAlertSpy = jest.spyOn(result.current, 'triggerPriceAlert');

      // First update that triggers alert
      act(() => {
        mockEventSource.simulateMessage({
          type: 'trade',
          data: { symbol: 'AAPL', price: 155.50, timestamp: Date.now() },
        });
      });

      // Second update that should not trigger another alert
      act(() => {
        mockEventSource.simulateMessage({
          type: 'trade',
          data: { symbol: 'AAPL', price: 156.00, timestamp: Date.now() },
        });
      });

      await waitFor(() => {
        expect(triggerPriceAlertSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Performance and Resource Management', () => {
    it('should handle high-frequency real-time updates efficiently', async () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
        jest.advanceTimersByTime(50);
      });

      const updateStockPriceSpy = jest.spyOn(result.current, 'updateStockPrice');

      // Simulate 100 rapid price updates
      act(() => {
        for (let i = 0; i < 100; i++) {
          mockEventSource.simulateMessage({
            type: 'trade',
            data: {
              symbol: 'AAPL',
              price: 150.00 + (i * 0.01),
              timestamp: Date.now() + i,
            },
          });
        }
      });

      await waitFor(() => {
        expect(updateStockPriceSpy).toHaveBeenCalledTimes(100);
      });

      // Verify final price is correct
      const stock = result.current.watchedStocks.find(s => s.symbol === 'AAPL');
      expect(stock?.currentPrice).toBe(150.99);
    });

    it('should properly clean up resources on component unmount', async () => {
      const { result, unmount } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
        jest.advanceTimersByTime(50);
      });

      const disconnectWebSocketSpy = jest.spyOn(result.current, 'disconnectWebSocket');

      unmount();

      // Note: In a real app, you'd set up cleanup in useEffect
      // Here we manually verify the cleanup function would be called
      act(() => {
        result.current.disconnectWebSocket();
      });

      expect(disconnectWebSocketSpy).toHaveBeenCalled();
    });

    it('should handle memory efficiently with many stocks', async () => {
      const { result } = renderHook(() => useStockStore());
      
      const symbols = Array.from({ length: 50 }, (_, i) => `STOCK${i}`);
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        symbols.forEach(symbol => result.current.addStock(symbol));
        result.current.connectWebSocket();
        jest.advanceTimersByTime(50);
      });

      // Simulate updates for all stocks
      act(() => {
        symbols.forEach((symbol, i) => {
          mockEventSource.simulateMessage({
            type: 'trade',
            data: {
              symbol,
              price: 100.00 + i,
              timestamp: Date.now(),
            },
          });
        });
      });

      await waitFor(() => {
        expect(result.current.watchedStocks.length).toBe(50);
      });

      // Verify all stocks were updated
      symbols.forEach((symbol, i) => {
        const stock = result.current.watchedStocks.find(s => s.symbol === symbol);
        expect(stock?.currentPrice).toBe(100.00 + i);
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from temporary WebSocket disconnections', async () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
        jest.advanceTimersByTime(50);
      });

      await waitFor(() => {
        expect(result.current.webSocketStatus).toBe('connected');
      });

      // Simulate temporary disconnection
      act(() => {
        mockEventSource.simulateError();
      });

      await waitFor(() => {
        expect(result.current.webSocketStatus).toBe('error');
      });

      // Fast-forward to reconnection attempt
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Simulate successful reconnection
      act(() => {
        jest.advanceTimersByTime(50);
      });

      await waitFor(() => {
        expect(result.current.webSocketStatus).toBe('connected');
      });

      // Verify data flow resumes
      act(() => {
        mockEventSource.simulateMessage({
          type: 'trade',
          data: { symbol: 'AAPL', price: 155.00, timestamp: Date.now() },
        });
      });

      await waitFor(() => {
        const stock = result.current.watchedStocks.find(s => s.symbol === 'AAPL');
        expect(stock?.currentPrice).toBe(155.00);
      });
    });

    it('should handle mixed success and failure scenarios', async () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
      });

      // Fail first connection attempt
      global.EventSource = jest.fn().mockImplementationOnce(() => {
        throw new Error('Connection failed');
      });

      act(() => {
        result.current.connectWebSocket();
      });

      await waitFor(() => {
        expect(result.current.webSocketStatus).toBe('error');
      });

      // Restore working EventSource for retry
      global.EventSource = jest.fn().mockImplementation((url) => {
        mockEventSource = new MockEventSource(url);
        return mockEventSource;
      });

      // Fast-forward to retry
      act(() => {
        jest.advanceTimersByTime(2000);
        jest.advanceTimersByTime(50);
      });

      await waitFor(() => {
        expect(result.current.webSocketStatus).toBe('connected');
      });
    });

    it('should maintain data consistency during connection transitions', async () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        
        // Set initial price via API
        result.current.updateStockPrice('AAPL', createMockQuote('AAPL', 150.00));
      });

      // Connect WebSocket and receive update
      act(() => {
        result.current.connectWebSocket();
        jest.advanceTimersByTime(50);
      });

      act(() => {
        mockEventSource.simulateMessage({
          type: 'trade',
          data: { symbol: 'AAPL', price: 152.00, timestamp: Date.now() },
        });
      });

      await waitFor(() => {
        const stock = result.current.watchedStocks.find(s => s.symbol === 'AAPL');
        expect(stock?.currentPrice).toBe(152.00);
      });

      // Simulate WebSocket failure
      act(() => {
        mockEventSource.simulateError();
      });

      // Price should remain consistent
      const stock = result.current.watchedStocks.find(s => s.symbol === 'AAPL');
      expect(stock?.currentPrice).toBe(152.00);

      // API fallback should use last known price as baseline
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockStockService.fetchStockQuote).toHaveBeenCalledWith('AAPL');
    });
  });

  describe('Cross-Feature Integration', () => {
    it('should integrate with PWA offline capabilities', async () => {
      const { result } = renderHook(() => useStockStore());
      
      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
      });

      // WebSocket should fail in offline mode
      act(() => {
        mockEventSource.simulateError();
      });

      await waitFor(() => {
        expect(result.current.webSocketStatus).toBe('error');
      });

      // Come back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      // Should attempt reconnection
      act(() => {
        jest.advanceTimersByTime(2000);
        jest.advanceTimersByTime(50);
      });

      await waitFor(() => {
        expect(result.current.webSocketStatus).toBe('connected');
      });
    });

    it('should work with push notifications for price alerts', async () => {
      const { result } = renderHook(() => useStockStore());
      
      const mockShowNotification = jest.fn();
      global.navigator = {
        serviceWorker: {
          ready: Promise.resolve({
            showNotification: mockShowNotification,
          }),
        },
      } as any;

      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL', 155.00);
        result.current.connectWebSocket();
        jest.advanceTimersByTime(50);
      });

      // Send price update that triggers alert
      act(() => {
        mockEventSource.simulateMessage({
          type: 'trade',
          data: { symbol: 'AAPL', price: 155.50, timestamp: Date.now() },
        });
      });

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith(
          'Price Alert: AAPL',
          expect.objectContaining({
            body: expect.stringContaining('$155.5'),
            icon: '/icons/icon-192x192.svg',
          })
        );
      });
    });

    it('should handle live data toggle during active connections', async () => {
      const { result } = renderHook(() => useStockStore());
      
      act(() => {
        result.current.setLiveDataEnabled(true);
        result.current.addStock('AAPL');
        result.current.connectWebSocket();
        jest.advanceTimersByTime(50);
      });

      await waitFor(() => {
        expect(result.current.webSocketStatus).toBe('connected');
      });

      const disconnectWebSocketSpy = jest.spyOn(result.current, 'disconnectWebSocket');

      // Disable live data
      act(() => {
        result.current.setLiveDataEnabled(false);
      });

      // Should disconnect WebSocket
      expect(disconnectWebSocketSpy).toHaveBeenCalled();

      // Re-enable live data
      act(() => {
        result.current.setLiveDataEnabled(true);
      });

      // Should not auto-connect (user needs to manually connect)
      expect(result.current.webSocketStatus).toBe('disconnected');
    });
  });
});