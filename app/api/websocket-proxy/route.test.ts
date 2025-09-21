/**
 * Integration Tests for WebSocket Proxy API Route
 * ===============================================
 * 
 * Tests for the WebSocket to SSE proxy endpoint
 */

import { NextRequest } from 'next/server';

import { GET } from './route';

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

  constructor(public url: string) {
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen({ type: 'open' });
      }
    }, 10);
  }

  send(data: string) {
    // Mock sending data
    console.log('Mock WebSocket send:', data);
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

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
});

describe('/api/websocket-proxy', () => {
  const originalEnv = process.env;
  let mockWebSocketInstance: MockWebSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment
    process.env = {
      ...originalEnv,
      FINNHUB_API_KEY: 'test-api-key',
    };

    // Clear connection pools
    const route = require('./route');
    route.activeConnections?.clear?.();
    route.connectionCooldowns?.clear?.();

    // Mock WebSocket constructor to capture instance
    global.WebSocket = jest.fn().mockImplementation((url) => {
      mockWebSocketInstance = new MockWebSocket(url);
      return mockWebSocketInstance;
    }) as any;

    // Mock TextEncoder
    global.TextEncoder = jest.fn().mockImplementation(() => ({
      encode: jest.fn().mockImplementation((str) => new Uint8Array(Buffer.from(str))),
    }));

    // Mock setTimeout and clearTimeout
    jest.useFakeTimers();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.useRealTimers();
  });

  describe('Request Validation', () => {
    it('should return 400 when symbols parameter is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy');
      
      const response = await GET(request);
      
      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Symbols parameter required');
    });

    it('should return 500 when API key is not configured', async () => {
      delete process.env.FINNHUB_API_KEY;
      
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL');
      
      const response = await GET(request);
      
      expect(response.status).toBe(500);
      expect(await response.text()).toBe('API key not configured');
    });

    it('should accept valid symbols parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL,GOOGL');
      
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    });
  });

  describe('Connection Management', () => {
    it('should prevent duplicate connections for same symbols', async () => {
      const request1 = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL');
      const request2 = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL');
      
      const response1 = await GET(request1);
      expect(response1.status).toBe(200);
      
      const response2 = await GET(request2);
      expect(response2.status).toBe(409);
      expect(await response2.text()).toBe('Connection already exists for these symbols');
    });

    it('should allow different symbol combinations', async () => {
      const request1 = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL');
      const request2 = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=GOOGL');
      
      const response1 = await GET(request1);
      const response2 = await GET(request2);
      
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });

    it('should enforce cooldown periods', async () => {
      // Simulate a connection that sets a cooldown
      const route = require('./route');
      const connectionKey = 'AAPL';
      route.connectionCooldowns.set(connectionKey, Date.now() + 60000); // 1 minute cooldown
      
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL');
      
      const response = await GET(request);
      
      expect(response.status).toBe(429);
      expect(await response.text()).toContain('Connection cooldown active');
    });
  });

  describe('WebSocket Connection', () => {
    it('should create WebSocket connection to Finnhub', async () => {
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL');
      
      await GET(request);
      
      expect(global.WebSocket).toHaveBeenCalledWith('wss://ws.finnhub.io?token=test-api-key');
    });

    it('should handle WebSocket connection open', async () => {
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL');
      
      const response = await GET(request);
      
      // Fast-forward to trigger connection
      jest.advanceTimersByTime(100);
      
      expect(response.status).toBe(200);
      expect(console.log).toHaveBeenCalledWith('✅ Connected to Finnhub WebSocket');
    });

    it('should subscribe to symbols with rate limiting', async () => {
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL,GOOGL');
      
      await GET(request);
      
      // Mock the send method to track subscriptions
      const sendSpy = jest.spyOn(mockWebSocketInstance, 'send');
      
      // Fast-forward to trigger connection and subscriptions
      jest.advanceTimersByTime(200);
      
      expect(sendSpy).toHaveBeenCalledWith(JSON.stringify({
        type: 'subscribe',
        symbol: 'AAPL',
      }));
      expect(sendSpy).toHaveBeenCalledWith(JSON.stringify({
        type: 'subscribe',
        symbol: 'GOOGL',
      }));
    });
  });

  describe('Message Handling', () => {
    it('should handle trade messages', async () => {
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL');
      
      await GET(request);
      
      // Fast-forward to establish connection
      jest.advanceTimersByTime(100);
      
      // Simulate trade message from Finnhub
      mockWebSocketInstance.simulateMessage({
        type: 'trade',
        data: {
          s: 'AAPL',
          p: 155.50,
          t: 1640995200,
          v: 1000,
        },
      });
      
      expect(console.log).toHaveBeenCalledWith('💰 Real-time trade: AAPL = $155.5');
    });

    it('should handle malformed WebSocket messages', async () => {
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL');
      
      await GET(request);
      
      // Fast-forward to establish connection
      jest.advanceTimersByTime(100);
      
      // Simulate malformed message
      if (mockWebSocketInstance.onmessage) {
        mockWebSocketInstance.onmessage({ data: 'invalid json' });
      }
      
      expect(console.error).toHaveBeenCalledWith(
        'Failed to parse Finnhub WebSocket message:',
        expect.any(Error)
      );
    });

    it('should ignore non-trade messages', async () => {
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL');
      
      await GET(request);
      
      // Fast-forward to establish connection
      jest.advanceTimersByTime(100);
      
      // Simulate non-trade message
      mockWebSocketInstance.simulateMessage({
        type: 'ping',
        data: 'heartbeat',
      });
      
      // Should not log trade information
      expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('💰 Real-time trade:'));
    });
  });

  describe('Reconnection Logic', () => {
    it('should attempt reconnection on WebSocket close', async () => {
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL');
      
      await GET(request);
      
      // Fast-forward to establish connection
      jest.advanceTimersByTime(100);
      
      // Simulate WebSocket close
      mockWebSocketInstance.simulateClose(1006, 'Connection lost');
      
      // Fast-forward to trigger reconnection
      jest.advanceTimersByTime(5000);
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🔄 Attempting to reconnect to Finnhub WebSocket')
      );
    });

    it('should implement exponential backoff for reconnections', async () => {
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL');
      
      await GET(request);
      
      // Fast-forward to establish connection
      jest.advanceTimersByTime(100);
      
      // Simulate multiple connection failures
      for (let i = 1; i <= 3; i++) {
        mockWebSocketInstance.simulateClose(1006, 'Connection lost');
        const expectedDelay = Math.pow(3, i) * 5000;
        jest.advanceTimersByTime(expectedDelay);
      }
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🔄 Attempting to reconnect to Finnhub WebSocket... (attempt 3/5)')
      );
    });

    it('should stop reconnecting after max attempts', async () => {
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL');
      
      await GET(request);
      
      // Fast-forward to establish connection
      jest.advanceTimersByTime(100);
      
      // Simulate max reconnection attempts
      for (let i = 1; i <= 6; i++) {
        mockWebSocketInstance.simulateClose(1006, 'Connection lost');
        jest.advanceTimersByTime(Math.pow(3, i) * 5000);
      }
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('❌ Max reconnection attempts reached (5/5)')
      );
    });

    it('should set cooldown after rate limiting', async () => {
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL');
      
      await GET(request);
      
      // Fast-forward to establish connection
      jest.advanceTimersByTime(100);
      
      // Simulate rate limit close code
      mockWebSocketInstance.simulateClose(1002, 'Rate limited');
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('❌ Max reconnection attempts reached')
      );
    });
  });

  describe('Server-Sent Events', () => {
    it('should send initial connection event', async () => {
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL');
      
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
      expect(response.headers.get('Connection')).toBe('keep-alive');
    });

    it('should have correct CORS headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL');
      
      const response = await GET(request);
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Cache-Control');
    });
  });

  describe('Cleanup and Error Handling', () => {
    it('should handle WebSocket errors gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL');
      
      await GET(request);
      
      // Fast-forward to establish connection
      jest.advanceTimersByTime(100);
      
      // Simulate WebSocket error
      mockWebSocketInstance.simulateError();
      
      expect(console.error).toHaveBeenCalledWith(
        '❌ Finnhub WebSocket error:',
        expect.any(Object)
      );
    });

    it('should clean up on client disconnect', async () => {
      const mockAbortController = {
        signal: {
          addEventListener: jest.fn(),
          aborted: false,
        },
      };
      
      const request = {
        url: 'http://localhost:3000/api/websocket-proxy?symbols=AAPL',
        signal: mockAbortController.signal,
      } as any;
      
      await GET(request);
      
      // Simulate client disconnect
      const cleanupCallback = mockAbortController.signal.addEventListener.mock.calls[0][1];
      cleanupCallback();
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🧹 Cleaning up connection for symbols: AAPL')
      );
    });

    it('should handle WebSocket creation errors', async () => {
      // Mock WebSocket constructor to throw error
      global.WebSocket = jest.fn().mockImplementation(() => {
        throw new Error('WebSocket creation failed');
      }) as any;
      
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL');
      
      await GET(request);
      
      expect(console.error).toHaveBeenCalledWith(
        'Failed to create Finnhub WebSocket connection:',
        expect.any(Error)
      );
    });
  });

  describe('Symbol Processing', () => {
    it('should handle single symbol', async () => {
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL');
      
      await GET(request);
      
      expect(console.log).toHaveBeenCalledWith('📈 Processing symbols:', ['AAPL']);
    });

    it('should handle multiple symbols', async () => {
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL,GOOGL,MSFT');
      
      await GET(request);
      
      expect(console.log).toHaveBeenCalledWith('📈 Processing symbols:', ['AAPL', 'GOOGL', 'MSFT']);
    });

    it('should handle symbols with whitespace', async () => {
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL,%20GOOGL%20,MSFT');
      
      await GET(request);
      
      expect(console.log).toHaveBeenCalledWith('📈 Processing symbols:', ['AAPL', ' GOOGL ', 'MSFT']);
    });

    it('should handle URL encoded symbols', async () => {
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=BRK%2EA,BRK%2EB');
      
      await GET(request);
      
      expect(console.log).toHaveBeenCalledWith('📈 Processing symbols:', ['BRK.A', 'BRK.B']);
    });
  });

  describe('Rate Limiting and Performance', () => {
    it('should add delays between symbol subscriptions', async () => {
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL,GOOGL,MSFT');
      
      await GET(request);
      
      // Fast-forward to establish connection
      jest.advanceTimersByTime(100);
      
      const sendSpy = jest.spyOn(mockWebSocketInstance, 'send');
      
      // Fast-forward to trigger first subscription
      jest.advanceTimersByTime(100);
      expect(sendSpy).toHaveBeenCalledTimes(1);
      
      // Fast-forward to trigger second subscription
      jest.advanceTimersByTime(100);
      expect(sendSpy).toHaveBeenCalledTimes(2);
      
      // Fast-forward to trigger third subscription
      jest.advanceTimersByTime(100);
      expect(sendSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle many symbols efficiently', async () => {
      const symbols = Array.from({ length: 50 }, (_, i) => `STOCK${i}`).join(',');
      const request = new NextRequest(`http://localhost:3000/api/websocket-proxy?symbols=${symbols}`);
      
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(console.log).toHaveBeenCalledWith('📈 Processing symbols:', expect.arrayContaining(['STOCK0', 'STOCK49']));
    });
  });

  describe('Connection Pool Edge Cases', () => {
    it('should handle connection key collisions gracefully', async () => {
      const request1 = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL');
      const request2 = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=AAPL');
      
      const response1 = await GET(request1);
      expect(response1.status).toBe(200);
      
      // Immediate second request should be blocked
      const response2 = await GET(request2);
      expect(response2.status).toBe(409);
    });

    it('should handle empty symbols parameter edge case', async () => {
      const request = new NextRequest('http://localhost:3000/api/websocket-proxy?symbols=');
      
      const response = await GET(request);
      
      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Symbols parameter required');
    });
  });
});