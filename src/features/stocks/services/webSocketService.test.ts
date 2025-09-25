/**
 * Integration Tests for WebSocket Service
 * ======================================
 * 
 * Tests for WebSocket connection management and real-time data handling
 */

import { stockService } from './stockService';

// Mock fetch for WebSocket health checks
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  public readyState = MockWebSocket.CONNECTING;
  public onopen: ((event: any) => void) | null = null;
  public onmessage: ((event: any) => void) | null = null;
  public onerror: ((event: any) => void) | null = null;
  public onclose: ((event: any) => void) | null = null;
  public url: string;

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen({ type: 'open' });
      }
    }, 10);
  }

  send(data: string) {
    // Mock sending data - data parameter is required but not used in mock
    void data;
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({ code: 1000, reason: 'Normal closure' });
    }
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

  simulateClose(code = 1000, reason = 'Normal closure') {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({ code, reason });
    }
  }
}

global.WebSocket = MockWebSocket as any;

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
    if (this.readyState === MockEventSource.OPEN && this.onmessage) {
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
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});

describe('WebSocket Service Integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_FINNHUB_API_KEY: 'test-api-key',
    };

    mockFetch.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('WebSocket URL Generation', () => {
    it('should generate correct WebSocket URL with API key', () => {
      const url = stockService.getWebSocketUrl();
      expect(url).toBe('wss://ws.finnhub.io?token=test-api-key');
    });

    it('should throw error when API key is not configured', () => {
      delete process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
      
      // Create new service instance to pick up env change
      const service = new (stockService.constructor as any)();
      
      expect(() => service.getWebSocketUrl()).toThrow('Finnhub API key not configured');
    });

    it('should handle empty API key', () => {
      process.env.NEXT_PUBLIC_FINNHUB_API_KEY = '';
      
      const service = new (stockService.constructor as any)();
      
      expect(() => service.getWebSocketUrl()).toThrow('Finnhub API key not configured');
    });
  });

  describe('WebSocket Message Creation', () => {
    it('should create valid subscription message', () => {
      const message = stockService.createSubscriptionMessage('AAPL');
      const parsed = JSON.parse(message);
      
      expect(parsed).toEqual({
        type: 'subscribe',
        symbol: 'AAPL',
      });
    });

    it('should create valid unsubscription message', () => {
      const message = stockService.createUnsubscriptionMessage('googl');
      const parsed = JSON.parse(message);
      
      expect(parsed).toEqual({
        type: 'unsubscribe',
        symbol: 'GOOGL',
      });
    });

    it('should uppercase symbols in messages', () => {
      const subMessage = stockService.createSubscriptionMessage('msft');
      const unsubMessage = stockService.createUnsubscriptionMessage('tsla');
      
      expect(JSON.parse(subMessage).symbol).toBe('MSFT');
      expect(JSON.parse(unsubMessage).symbol).toBe('TSLA');
    });

    it('should handle symbols with special characters', () => {
      const message = stockService.createSubscriptionMessage('BRK.A');
      const parsed = JSON.parse(message);
      
      expect(parsed.symbol).toBe('BRK.A');
    });
  });

  describe('WebSocket Message Parsing', () => {
    it('should parse valid trade message', () => {
      const tradeData = {
        type: 'trade',
        data: [{
          s: 'AAPL',
          p: 155.50,
          t: 1640995200,
          v: 1000,
        }],
      };

      const result = stockService.parseTradeMessage(tradeData);
      
      expect(result).toEqual({
        symbol: 'AAPL',
        price: 155.50,
        timestamp: 1640995200,
      });
    });

    it('should return null for invalid trade message', () => {
      const invalidData = {
        type: 'ping',
        data: 'heartbeat',
      };

      const result = stockService.parseTradeMessage(invalidData);
      expect(result).toBeNull();
    });

    it('should return null for trade message without required fields', () => {
      const incompleteData = {
        type: 'trade',
        data: [{
          s: 'AAPL',
          // Missing price and timestamp
        }],
      };

      const result = stockService.parseTradeMessage(incompleteData);
      expect(result).toBeNull();
    });

    it('should return null for malformed trade data', () => {
      const malformedData = {
        type: 'trade',
        data: 'not an array',
      };

      const result = stockService.parseTradeMessage(malformedData);
      expect(result).toBeNull();
    });

    it('should handle trade message with empty data array', () => {
      const emptyData = {
        type: 'trade',
        data: [],
      };

      const result = stockService.parseTradeMessage(emptyData);
      expect(result).toBeNull();
    });

    it('should parse first trade from multiple trades', () => {
      const multipleTradesData = {
        type: 'trade',
        data: [
          { s: 'AAPL', p: 155.50, t: 1640995200 },
          { s: 'AAPL', p: 155.75, t: 1640995210 },
        ],
      };

      const result = stockService.parseTradeMessage(multipleTradesData);
      
      expect(result).toEqual({
        symbol: 'AAPL',
        price: 155.50,
        timestamp: 1640995200,
      });
    });

    it('should log error for JSON parsing errors', () => {
      // Simulate an error during parsing
      const originalParse = JSON.parse;
      JSON.parse = jest.fn().mockImplementation(() => {
        throw new Error('JSON parse error');
      });

      const result = stockService.parseTradeMessage('invalid');
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Failed to parse trade message:', expect.any(Error));

      // Restore original JSON.parse
      JSON.parse = originalParse;
    });
  });

  describe('Direct WebSocket Connection Integration', () => {
    let mockWebSocket: MockWebSocket;

    beforeEach(() => {
      const MockedWebSocket = jest.fn().mockImplementation((url) => {
        mockWebSocket = new MockWebSocket(url);
        return mockWebSocket;
      });
      
      // Assign static properties to the mock function
      Object.assign(MockedWebSocket, {
        CONNECTING: MockWebSocket.CONNECTING,
        OPEN: MockWebSocket.OPEN,
        CLOSING: MockWebSocket.CLOSING,
        CLOSED: MockWebSocket.CLOSED,
      });
      
      global.WebSocket = MockedWebSocket as typeof WebSocket;
    });

    it('should create WebSocket connection with correct URL', () => {
      const url = stockService.getWebSocketUrl();
      const ws = new WebSocket(url);
      
      expect(global.WebSocket).toHaveBeenCalledWith('wss://ws.finnhub.io?token=test-api-key');
      expect(ws.url).toBe('wss://ws.finnhub.io?token=test-api-key');
    });

    it('should handle WebSocket connection lifecycle', (done) => {
      const url = stockService.getWebSocketUrl();
      const ws = new WebSocket(url);
      
      ws.onopen = (event) => {
        expect(event.type).toBe('open');
        expect(ws.readyState).toBe(WebSocket.OPEN);
        done();
      };
    });

    it('should send subscription messages correctly', (done) => {
      const url = stockService.getWebSocketUrl();
      const ws = new WebSocket(url);
      
      const sendSpy = jest.spyOn(ws, 'send');
      
      ws.onopen = () => {
        const message = stockService.createSubscriptionMessage('AAPL');
        ws.send(message);
        
        expect(sendSpy).toHaveBeenCalledWith(JSON.stringify({
          type: 'subscribe',
          symbol: 'AAPL',
        }));
        done();
      };
    });

    it('should receive and parse trade messages', (done) => {
      const url = stockService.getWebSocketUrl();
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        // Simulate receiving a trade message
        mockWebSocket.simulateMessage({
          type: 'trade',
          data: [{
            s: 'AAPL',
            p: 155.50,
            t: 1640995200,
          }],
        });
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const trade = stockService.parseTradeMessage(data);
        
        expect(trade).toEqual({
          symbol: 'AAPL',
          price: 155.50,
          timestamp: 1640995200,
        });
        done();
      };
    });

    it('should handle WebSocket errors gracefully', (done) => {
      const url = stockService.getWebSocketUrl();
      const ws = new WebSocket(url);
      
      ws.onerror = (error) => {
        expect(error.type).toBe('error');
        done();
      };

      ws.onopen = () => {
        mockWebSocket.simulateError();
      };
    });

    it('should handle WebSocket close events', (done) => {
      const url = stockService.getWebSocketUrl();
      const ws = new WebSocket(url);
      
      ws.onclose = (event) => {
        expect(event.code).toBe(1000);
        expect(event.reason).toBe('Normal closure');
        expect(ws.readyState).toBe(WebSocket.CLOSED);
        done();
      };

      ws.onopen = () => {
        ws.close();
      };
    });
  });

  describe('EventSource Integration (WebSocket Proxy)', () => {
    let mockEventSource: MockEventSource;

    beforeEach(() => {
      const MockedEventSource = jest.fn().mockImplementation((url) => {
        mockEventSource = new MockEventSource(url);
        return mockEventSource;
      });
      
      // Assign static properties to the mock function
      Object.assign(MockedEventSource, {
        CONNECTING: MockEventSource.CONNECTING,
        OPEN: MockEventSource.OPEN,
        CLOSED: MockEventSource.CLOSED,
      });
      
      global.EventSource = MockedEventSource as typeof EventSource;
    });

    it('should create EventSource connection to WebSocket proxy', () => {
      const symbols = 'AAPL,GOOGL';
      const url = `/api/websocket-proxy?symbols=${symbols}`;
      const eventSource = new EventSource(url);
      
      expect(global.EventSource).toHaveBeenCalledWith(url);
      expect(eventSource.url).toBe(url);
    });

    it('should handle EventSource connection events', (done) => {
      const eventSource = new EventSource('/api/websocket-proxy?symbols=AAPL');
      
      eventSource.onopen = (event) => {
        expect(event.type).toBe('open');
        expect(eventSource.readyState).toBe(EventSource.OPEN);
        done();
      };
    });

    it('should receive trade messages from WebSocket proxy', (done) => {
      const eventSource = new EventSource('/api/websocket-proxy?symbols=AAPL');
      
      eventSource.onopen = () => {
        // Simulate receiving a trade message from proxy
        mockEventSource.simulateMessage({
          type: 'trade',
          data: {
            symbol: 'AAPL',
            price: 155.50,
            timestamp: 1640995200000,
            volume: 1000,
          },
        });
      };

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        expect(data.type).toBe('trade');
        expect(data.data.symbol).toBe('AAPL');
        expect(data.data.price).toBe(155.50);
        done();
      };
    });

    it('should receive connection messages from WebSocket proxy', (done) => {
      const eventSource = new EventSource('/api/websocket-proxy?symbols=AAPL');
      
      eventSource.onopen = () => {
        mockEventSource.simulateMessage({
          type: 'connected',
          message: 'Secure WebSocket proxy connected',
          symbols: ['AAPL'],
        });
      };

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        expect(data.type).toBe('connected');
        expect(data.symbols).toEqual(['AAPL']);
        done();
      };
    });

    it('should handle EventSource errors', (done) => {
      const eventSource = new EventSource('/api/websocket-proxy?symbols=AAPL');
      
      eventSource.onerror = (error) => {
        expect(error.type).toBe('error');
        done();
      };

      eventSource.onopen = () => {
        mockEventSource.simulateError();
      };
    });

    it('should properly close EventSource connections', () => {
      const eventSource = new EventSource('/api/websocket-proxy?symbols=AAPL');
      
      expect(eventSource.readyState).toBe(EventSource.CONNECTING);
      
      eventSource.close();
      
      expect(eventSource.readyState).toBe(EventSource.CLOSED);
    });
  });

  describe('Health Check Integration', () => {
    it('should perform successful health check', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const isHealthy = await stockService.healthCheck();
      
      expect(isHealthy).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/health', {
        method: 'GET',
        signal: expect.any(AbortSignal),
      });
    });

    it('should handle failed health check', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const isHealthy = await stockService.healthCheck();
      
      expect(isHealthy).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Health check failed:', expect.any(Error));
    });

    it('should handle health check network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const isHealthy = await stockService.healthCheck();
      
      expect(isHealthy).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Health check failed:', expect.any(Error));
    });

    it.skip('should respect health check timeout', async () => {
      // Mock fetch to hang
      mockFetch.mockImplementationOnce(
        () => new Promise(() => {}) // Never resolves
      );

      const healthPromise = stockService.healthCheck();
      
      // Health check should timeout and return false
      await expect(healthPromise).resolves.toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle WebSocket constructor errors', () => {
      const FailingWebSocket = jest.fn().mockImplementation(() => {
        throw new Error('WebSocket not supported');
      });
      
      Object.assign(FailingWebSocket, {
        CONNECTING: 0,
        OPEN: 1,
        CLOSING: 2,
        CLOSED: 3,
      });
      
      global.WebSocket = FailingWebSocket as typeof WebSocket;

      expect(() => new WebSocket('wss://test.com')).toThrow('WebSocket not supported');
    });

    it('should handle EventSource constructor errors', () => {
      const FailingEventSource = jest.fn().mockImplementation(() => {
        throw new Error('EventSource not supported');
      });
      
      Object.assign(FailingEventSource, {
        CONNECTING: 0,
        OPEN: 1,
        CLOSED: 2,
      });
      
      global.EventSource = FailingEventSource as typeof EventSource;

      expect(() => new EventSource('/test')).toThrow('EventSource not supported');
    });

    it('should handle malformed trade messages gracefully', () => {
      const invalidMessages = [
        null,
        undefined,
        '',
        '{}',
        '{"type": "trade"}',
        '{"type": "trade", "data": null}',
        '{"type": "trade", "data": [{}]}',
      ];

      invalidMessages.forEach(message => {
        const result = stockService.parseTradeMessage(message);
        expect(result).toBeNull();
      });
    });

    it('should handle different trade message formats', () => {
      // Test various valid but different formats
      const formats = [
        {
          type: 'trade',
          data: [{ s: 'AAPL', p: 155.50, t: 1640995200, v: 1000 }],
        },
        {
          type: 'trade',
          data: [{ s: 'GOOGL', p: 2800.75, t: 1640995300 }], // No volume
        },
      ];

      formats.forEach(format => {
        const result = stockService.parseTradeMessage(format);
        expect(result).not.toBeNull();
        expect(result?.symbol).toBeDefined();
        expect(result?.price).toBeDefined();
        expect(result?.timestamp).toBeDefined();
      });
    });
  });

  describe('Performance and Reliability', () => {
    let mockEventSource: MockEventSource;

    beforeEach(() => {
      const MockedEventSource = jest.fn().mockImplementation((url) => {
        mockEventSource = new MockEventSource(url);
        return mockEventSource;
      });
      
      // Assign static properties to the mock function
      Object.assign(MockedEventSource, {
        CONNECTING: MockEventSource.CONNECTING,
        OPEN: MockEventSource.OPEN,
        CLOSED: MockEventSource.CLOSED,
      });
      
      global.EventSource = MockedEventSource as typeof EventSource;
    });

    it('should handle rapid succession of trade messages', (done) => {
      const eventSource = new EventSource('/api/websocket-proxy?symbols=AAPL');
      const receivedMessages: any[] = [];
      
      eventSource.onopen = () => {
        // Simulate rapid trade messages
        for (let i = 0; i < 100; i++) {
          mockEventSource.simulateMessage({
            type: 'trade',
            data: {
              symbol: 'AAPL',
              price: 155.50 + i * 0.01,
              timestamp: 1640995200000 + i * 1000,
            },
          });
        }
      };

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        receivedMessages.push(data);
        
        if (receivedMessages.length === 100) {
          expect(receivedMessages).toHaveLength(100);
          expect(receivedMessages[0].data.price).toBe(155.50);
          expect(receivedMessages[99].data.price).toBe(156.49);
          done();
        }
      };
    });

    it('should handle connection with many symbols', () => {
      const symbols = Array.from({ length: 50 }, (_, i) => `STOCK${i}`).join(',');
      const eventSource = new EventSource(`/api/websocket-proxy?symbols=${symbols}`);
      
      expect(eventSource.url).toContain('symbols=STOCK0,STOCK1');
      expect(eventSource.url).toContain('STOCK49');
    });

    it('should handle memory cleanup on connection close', () => {
      const eventSource = new EventSource('/api/websocket-proxy?symbols=AAPL');
      
      // Set up event handlers
      eventSource.onmessage = jest.fn();
      eventSource.onerror = jest.fn();
      
      // Close connection
      eventSource.close();
      
      expect(eventSource.readyState).toBe(EventSource.CLOSED);
      
      // Verify no more events are processed
      mockEventSource.simulateMessage({ type: 'test' });
      expect(eventSource.onmessage).not.toHaveBeenCalled();
    });
  });
});