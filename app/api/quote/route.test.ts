/**
 * Integration Tests for Quote API Route
 * ====================================
 *
 * Tests for the stock quote API endpoint
 */

import { NextRequest } from 'next/server';

import { GET } from './route';

// Mock fetch globally
global.fetch = jest.fn();

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('/api/quote', () => {
  const mockFinnhubResponse = {
    c: 155.5, // current price
    d: 5.5, // change
    dp: 3.67, // percent change
    h: 157.0, // high
    l: 153.0, // low
    o: 154.0, // open
    pc: 150.0, // previous close
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FINNHUB_API_KEY = 'test-api-key';

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockFinnhubResponse),
    });
  });

  afterEach(() => {
    delete process.env.FINNHUB_API_KEY;
  });

  describe('Successful Requests', () => {
    it('should return stock quote for valid symbol', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        symbol: 'AAPL',
        current: 155.5,
        change: 5.5,
        percentChange: 3.67,
        high: 157.0,
        low: 153.0,
        open: 154.0,
        previousClose: 150.0,
        timestamp: expect.any(Number),
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://finnhub.io/api/v1/quote?symbol=AAPL&token=test-api-key',
        {
          headers: {
            'X-Finnhub-Token': 'test-api-key',
          },
        }
      );
    });

    it('should handle symbols with special characters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=BRK.A'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.symbol).toBe('BRK.A');
      expect(fetch).toHaveBeenCalledWith(
        'https://finnhub.io/api/v1/quote?symbol=BRK.A&token=test-api-key',
        expect.any(Object)
      );
    });

    it('should handle URL encoded symbols', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=BRK%2EA'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.symbol).toBe('BRK.A');
    });

    it('should include current timestamp', async () => {
      const beforeTimestamp = Date.now();
      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL'
      );

      const response = await GET(request);
      const data = await response.json();
      const afterTimestamp = Date.now();

      expect(data.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(data.timestamp).toBeLessThanOrEqual(afterTimestamp);
    });
  });

  describe('Request Validation', () => {
    it('should return 400 when symbol parameter is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/quote');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Symbol parameter is required',
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should return 400 when symbol parameter is empty', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol='
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Symbol parameter is required',
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only symbol', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=%20%20%20'
      );

      const response = await GET(request);

      // Should still proceed with the whitespace symbol (let Finnhub handle validation)
      expect(response.status).toBe(200);
      expect(fetch).toHaveBeenCalledWith(
        'https://finnhub.io/api/v1/quote?symbol=   &token=test-api-key',
        expect.any(Object)
      );
    });

    it('should handle multiple symbol parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL&symbol=GOOGL'
      );

      const response = await GET(request);
      const data = await response.json();

      // Should use the first symbol parameter
      expect(response.status).toBe(200);
      expect(data.symbol).toBe('AAPL');
    });
  });

  describe('Configuration Errors', () => {
    it('should return 500 when API key is not configured', async () => {
      delete process.env.FINNHUB_API_KEY;

      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Finnhub API key not configured',
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should return 500 when API key is empty string', async () => {
      process.env.FINNHUB_API_KEY = '';

      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Finnhub API key not configured',
      });
    });
  });

  describe('Finnhub API Errors', () => {
    it('should handle Finnhub API 404 error', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=INVALID'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to fetch stock quote',
      });
      expect(console.error).toHaveBeenCalledWith(
        'Stock quote API error:',
        expect.any(Error)
      );
    });

    it('should handle Finnhub API 401 unauthorized', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to fetch stock quote',
      });
    });

    it('should handle Finnhub API 429 rate limit', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to fetch stock quote',
      });
    });

    it('should handle Finnhub API 500 server error', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to fetch stock quote',
      });
    });
  });

  describe('Network Errors', () => {
    it('should handle network timeout', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network timeout'));

      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to fetch stock quote',
      });
      expect(console.error).toHaveBeenCalledWith(
        'Stock quote API error:',
        expect.any(Error)
      );
    });

    it('should handle DNS resolution failure', async () => {
      (fetch as jest.Mock).mockRejectedValue(
        new Error('getaddrinfo ENOTFOUND finnhub.io')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to fetch stock quote',
      });
    });

    it('should handle connection refused', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('connect ECONNREFUSED'));

      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to fetch stock quote',
      });
    });
  });

  describe('Response Data Handling', () => {
    it('should handle malformed JSON response', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to fetch stock quote',
      });
    });

    it('should handle null response data', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(null),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        symbol: 'AAPL',
        current: null,
        change: null,
        percentChange: null,
        high: null,
        low: null,
        open: null,
        previousClose: null,
        timestamp: expect.any(Number),
      });
    });

    it('should handle partial response data', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            c: 155.5,
            d: 5.5,
            // Missing other fields
          }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        symbol: 'AAPL',
        current: 155.5,
        change: 5.5,
        percentChange: undefined,
        high: undefined,
        low: undefined,
        open: undefined,
        previousClose: undefined,
        timestamp: expect.any(Number),
      });
    });

    it('should handle zero values in response', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            c: 0,
            d: 0,
            dp: 0,
            h: 0,
            l: 0,
            o: 0,
            pc: 0,
          }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        symbol: 'AAPL',
        current: 0,
        change: 0,
        percentChange: 0,
        high: 0,
        low: 0,
        open: 0,
        previousClose: 0,
        timestamp: expect.any(Number),
      });
    });

    it('should handle negative values in response', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            c: 145.5,
            d: -4.5,
            dp: -3.01,
            h: 147.0,
            l: 143.0,
            o: 149.0,
            pc: 150.0,
          }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        symbol: 'AAPL',
        current: 145.5,
        change: -4.5,
        percentChange: -3.01,
        high: 147.0,
        low: 143.0,
        open: 149.0,
        previousClose: 150.0,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long symbol names', async () => {
      const longSymbol = 'A'.repeat(100);
      const request = new NextRequest(
        `http://localhost:3000/api/quote?symbol=${longSymbol}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.symbol).toBe(longSymbol);
      expect(fetch).toHaveBeenCalledWith(
        `https://finnhub.io/api/v1/quote?symbol=${longSymbol}&token=test-api-key`,
        expect.any(Object)
      );
    });

    it('should handle symbols with unicode characters', async () => {
      const unicodeSymbol = 'AAPL™';
      const encodedSymbol = encodeURIComponent(unicodeSymbol);
      const request = new NextRequest(
        `http://localhost:3000/api/quote?symbol=${encodedSymbol}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.symbol).toBe(unicodeSymbol);
    });

    it('should handle malformed URLs gracefully', async () => {
      // NextRequest constructor should handle this, but test edge case
      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL&invalid=param&'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.symbol).toBe('AAPL');
    });
  });

  describe('Headers and Authentication', () => {
    it('should include correct headers in Finnhub request', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL'
      );

      await GET(request);

      expect(fetch).toHaveBeenCalledWith(
        'https://finnhub.io/api/v1/quote?symbol=AAPL&token=test-api-key',
        {
          headers: {
            'X-Finnhub-Token': 'test-api-key',
          },
        }
      );
    });

    it('should handle different API key formats', async () => {
      process.env.FINNHUB_API_KEY = 'different-format-key-123';

      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL'
      );

      await GET(request);

      expect(fetch).toHaveBeenCalledWith(
        'https://finnhub.io/api/v1/quote?symbol=AAPL&token=different-format-key-123',
        {
          headers: {
            'X-Finnhub-Token': 'different-format-key-123',
          },
        }
      );
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent requests', async () => {
      const request1 = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL'
      );
      const request2 = new NextRequest(
        'http://localhost:3000/api/quote?symbol=GOOGL'
      );
      const request3 = new NextRequest(
        'http://localhost:3000/api/quote?symbol=MSFT'
      );

      const [response1, response2, response3] = await Promise.all([
        GET(request1),
        GET(request2),
        GET(request3),
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response3.status).toBe(200);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle slow API responses', async () => {
      (fetch as jest.Mock).mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve(mockFinnhubResponse),
                }),
              100
            )
          )
      );

      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL'
      );

      const startTime = Date.now();
      const response = await GET(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Response Format Consistency', () => {
    it('should always return consistent JSON structure', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL'
      );

      const response = await GET(request);
      const data = await response.json();

      const expectedKeys = [
        'symbol',
        'current',
        'change',
        'percentChange',
        'high',
        'low',
        'open',
        'previousClose',
        'timestamp',
      ];

      expectedKeys.forEach(key => {
        expect(data).toHaveProperty(key);
      });
    });

    it('should have correct Content-Type header', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/quote?symbol=AAPL'
      );

      const response = await GET(request);

      expect(response.headers.get('Content-Type')).toContain(
        'application/json'
      );
    });
  });
});
