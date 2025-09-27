/**
 * Unit Tests for Stock Service
 * ============================
 *
 * Tests for API integration and request deduplication
 */

import { stockService, StockService } from './stockService';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock AbortSignal.timeout
global.AbortSignal.timeout = jest.fn(() => ({
  aborted: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
})) as any;

describe('StockService', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Clear request cache before each test
    stockService.clearRequestCache();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = StockService.getInstance();
      const instance2 = StockService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should use the exported singleton', () => {
      const instance = StockService.getInstance();
      expect(stockService).toBe(instance);
    });
  });

  describe('fetchStockQuote', () => {
    const mockQuoteResponse = {
      success: true,
      data: {
        symbol: 'AAPL',
        current: 150.25,
        change: 2.5,
        percentChange: 1.69,
        high: 152.0,
        low: 148.0,
        open: 149.0,
        previousClose: 147.75,
        timestamp: Date.now(),
      },
    };

    it('should fetch stock quote successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuoteResponse,
      });

      const result = await stockService.fetchStockQuote('AAPL');

      expect(mockFetch).toHaveBeenCalledWith('/api/quote?symbol=AAPL', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: expect.any(Object),
      });
      expect(result).toEqual(mockQuoteResponse.data);
    });

    it('should handle direct response format', async () => {
      const directResponse = {
        symbol: 'AAPL',
        current: 150.25,
        change: 2.5,
        percentChange: 1.69,
        high: 152.0,
        low: 148.0,
        open: 149.0,
        previousClose: 147.75,
        timestamp: Date.now(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => directResponse,
      });

      const result = await stockService.fetchStockQuote('AAPL');
      expect(result).toEqual(directResponse);
    });

    it('should throw error for invalid symbol', async () => {
      await expect(stockService.fetchStockQuote('')).rejects.toThrow(
        'Invalid stock symbol'
      );
      await expect(stockService.fetchStockQuote(null as any)).rejects.toThrow(
        'Invalid stock symbol'
      );
    });

    it('should handle API error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Stock not found' }),
      });

      await expect(stockService.fetchStockQuote('INVALID')).rejects.toThrow(
        'Stock not found'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(stockService.fetchStockQuote('AAPL')).rejects.toThrow(
        'Network error'
      );
    });

    it('should validate quote data format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { invalid: 'data' }, // This will pass initial check but fail validation
        }),
      });

      await expect(stockService.fetchStockQuote('AAPL')).rejects.toThrow(
        'Invalid symbol in quote data for AAPL'
      );
    });

    it('should deduplicate concurrent requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockQuoteResponse,
      });

      // Make multiple concurrent requests for the same symbol
      const promises = [
        stockService.fetchStockQuote('AAPL'),
        stockService.fetchStockQuote('AAPL'),
        stockService.fetchStockQuote('AAPL'),
      ];

      await Promise.all(promises);

      // Should only make one actual fetch call due to deduplication
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should clear cache after timeout', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockQuoteResponse,
      });

      await stockService.fetchStockQuote('AAPL');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Advance time beyond cache timeout
      jest.advanceTimersByTime(3000);

      await stockService.fetchStockQuote('AAPL');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should clear cache on error', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockQuoteResponse,
        });

      // First request fails
      await expect(stockService.fetchStockQuote('AAPL')).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second request should work (cache cleared on error)
      await stockService.fetchStockQuote('AAPL');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('fetchMultipleQuotes', () => {
    it('should fetch multiple quotes in batches', async () => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT'];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            symbol: 'AAPL',
            current: 150.25,
            change: 2.5,
            percentChange: 1.69,
            high: 152.0,
            low: 148.0,
            open: 149.0,
            previousClose: 147.75,
            timestamp: Date.now(),
          },
        }),
      });

      const results = await stockService.fetchMultipleQuotes(symbols);

      expect(Object.keys(results)).toHaveLength(3);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should handle empty symbol array', async () => {
      const results = await stockService.fetchMultipleQuotes([]);
      expect(results).toEqual({});
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle individual quote failures', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              symbol: 'AAPL',
              current: 150.25,
              change: 2.5,
              percentChange: 1.69,
            },
          }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const results = await stockService.fetchMultipleQuotes([
        'AAPL',
        'INVALID',
      ]);

      expect(Object.keys(results)).toHaveLength(1);
      expect(results.AAPL).toBeDefined();
      expect(results.INVALID).toBeUndefined();
    });

    it('should batch requests correctly', async () => {
      // Use real timers for this test to avoid timer conflicts
      jest.useRealTimers();

      const symbols = Array.from({ length: 12 }, (_, i) => `STOCK${i}`);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { symbol: 'STOCK0', current: 100, change: 1, percentChange: 1 },
        }),
      });

      await stockService.fetchMultipleQuotes(symbols);

      // Should batch in groups of 3 (dynamic batch size for 12 symbols: Math.min(Math.max(3, Math.floor(12/4)), 8) = 3)
      expect(mockFetch).toHaveBeenCalledTimes(12);

      // Restore fake timers for other tests
      jest.useFakeTimers();
    });
  });

  describe('getAvailableStocks', () => {
    it('should return default stock options', async () => {
      const result = await stockService.getAvailableStocks();
      const stocks = result.data;

      expect(stocks).toHaveLength(8);
      expect(stocks[0]).toMatchObject({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        exchange: 'NASDAQ',
      });
    });
  });

  describe('searchStocks', () => {
    it('should search stocks by symbol', async () => {
      const results = await stockService.searchStocks('app');
      expect(results).toHaveLength(1);
      expect(results[0].symbol).toBe('AAPL');
    });

    it('should search stocks by name', async () => {
      const results = await stockService.searchStocks('apple');
      expect(results).toHaveLength(1);
      expect(results[0].symbol).toBe('AAPL');
    });

    it('should return empty array for short queries', async () => {
      const results = await stockService.searchStocks('a');
      expect(results).toEqual([]);
    });

    it('should handle empty queries', async () => {
      const results = await stockService.searchStocks('');
      expect(results).toEqual([]);
    });
  });

  describe('Validation Methods', () => {
    describe('validateSymbol', () => {
      it('should validate correct symbols', () => {
        expect(stockService.validateSymbol('AAPL')).toBe(true);
        expect(stockService.validateSymbol('GOOGL')).toBe(true);
        expect(stockService.validateSymbol('A')).toBe(true);
      });

      it('should reject invalid symbols', () => {
        expect(stockService.validateSymbol('')).toBe(false);
        expect(stockService.validateSymbol('TOOLONG')).toBe(false);
        expect(stockService.validateSymbol('123')).toBe(false);
        expect(stockService.validateSymbol('APL-123')).toBe(false);
        expect(stockService.validateSymbol(null as any)).toBe(false);
      });
    });

    describe('validateAlertPrice', () => {
      it('should validate correct prices', () => {
        expect(stockService.validateAlertPrice(100)).toBe(true);
        expect(stockService.validateAlertPrice('150.50')).toBe(true);
        expect(stockService.validateAlertPrice(0.01)).toBe(true);
      });

      it('should reject invalid prices', () => {
        expect(stockService.validateAlertPrice(0)).toBe(false);
        expect(stockService.validateAlertPrice(-100)).toBe(false);
        expect(stockService.validateAlertPrice(2000000)).toBe(false);
        expect(stockService.validateAlertPrice('invalid')).toBe(false);
        expect(stockService.validateAlertPrice(null as any)).toBe(false);
      });
    });
  });

  describe('Formatting Methods', () => {
    it('should format prices correctly', () => {
      expect(stockService.formatPrice(150.123)).toBe('150.12');
      expect(stockService.formatPrice(0)).toBe('0.00');
      expect(stockService.formatPrice(null as any)).toBe('---.--');
    });

    it('should format percentage changes correctly', () => {
      expect(stockService.formatPercentageChange(2.5)).toBe('+2.50%');
      expect(stockService.formatPercentageChange(-1.75)).toBe('-1.75%');
      expect(stockService.formatPercentageChange(0)).toBe('+0.00%');
      expect(stockService.formatPercentageChange(null as any)).toBe('--.--%');
    });

    it('should get correct price change colors', () => {
      expect(stockService.getPriceChangeColor(2.5)).toBe('text-green-600');
      expect(stockService.getPriceChangeColor(-1.75)).toBe('text-red-600');
      expect(stockService.getPriceChangeColor(0)).toBe('text-gray-500');
      expect(stockService.getPriceChangeColor(null as any)).toBe(
        'text-gray-500'
      );
    });
  });

  describe('Alert Methods', () => {
    it('should check if price is above alert', () => {
      expect(stockService.isPriceAboveAlert(155, 150)).toBe(true);
      expect(stockService.isPriceAboveAlert(150, 150)).toBe(true);
      expect(stockService.isPriceAboveAlert(145, 150)).toBe(false);
    });

    it('should check if price is below alert', () => {
      expect(stockService.isPriceBelowAlert(145, 150)).toBe(true);
      expect(stockService.isPriceBelowAlert(150, 150)).toBe(false);
      expect(stockService.isPriceBelowAlert(155, 150)).toBe(false);
    });

    it('should get alert status correctly', () => {
      expect(stockService.getAlertStatus(155, 150)).toBe('above');
      expect(stockService.getAlertStatus(145, 150)).toBe('below');
      expect(stockService.getAlertStatus(null as any, 150)).toBe('neutral');
    });
  });

  describe('Price Calculation', () => {
    it('should calculate price change correctly', () => {
      const result = stockService.calculatePriceChange(155, 150);
      expect(result.change).toBe(5);
      expect(result.percentChange).toBeCloseTo(3.33, 2);
    });

    it('should handle zero previous close', () => {
      const result = stockService.calculatePriceChange(155, 0);
      expect(result.change).toBe(0);
      expect(result.percentChange).toBe(0);
    });

    it('should handle invalid inputs', () => {
      const result = stockService.calculatePriceChange(null as any, 150);
      expect(result.change).toBe(0);
      expect(result.percentChange).toBe(0);
    });
  });

  describe('WebSocket Utilities', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_FINNHUB_API_KEY = 'test-api-key';
    });

    it('should get WebSocket URL', () => {
      const url = stockService.getWebSocketUrl();
      expect(url).toBe('wss://ws.finnhub.io?token=test-api-key');
    });

    it('should throw error if API key is missing', () => {
      delete process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
      expect(() => stockService.getWebSocketUrl()).toThrow(
        'Finnhub API key not configured'
      );
    });

    it('should create subscription message', () => {
      const message = stockService.createSubscriptionMessage('AAPL');
      expect(JSON.parse(message)).toEqual({
        type: 'subscribe',
        symbol: 'AAPL',
      });
    });

    it('should create unsubscription message', () => {
      const message = stockService.createUnsubscriptionMessage('aapl');
      expect(JSON.parse(message)).toEqual({
        type: 'unsubscribe',
        symbol: 'AAPL',
      });
    });

    it('should parse trade message correctly', () => {
      const tradeData = {
        type: 'trade',
        data: [{ s: 'AAPL', p: 150.25, t: 1234567890 }],
      };

      const result = stockService.parseTradeMessage(tradeData);
      expect(result).toEqual({
        symbol: 'AAPL',
        price: 150.25,
        timestamp: 1234567890,
      });
    });

    it('should return null for invalid trade message', () => {
      expect(stockService.parseTradeMessage({})).toBeNull();
      expect(stockService.parseTradeMessage({ type: 'invalid' })).toBeNull();
      expect(stockService.parseTradeMessage(null)).toBeNull();
    });
  });

  describe('Health Check', () => {
    it('should return true for successful health check', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const result = await stockService.healthCheck();
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/health', {
        method: 'GET',
        signal: expect.any(Object),
      });
    });

    it('should return false for failed health check', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });

      const result = await stockService.healthCheck();
      expect(result).toBe(false);
    });

    it('should return false for network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await stockService.healthCheck();
      expect(result).toBe(false);
    });
  });

  describe('Cache Management', () => {
    it('should clear request cache manually', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            symbol: 'AAPL',
            current: 150.0,
            change: 1.5,
            percentChange: 1.0,
          },
        }),
      });

      // Make a request to populate cache
      await stockService.fetchStockQuote('AAPL');

      const statsBeforeClear = stockService.getCacheStats();
      expect(statsBeforeClear.size).toBe(1);
      expect(statsBeforeClear.keys).toContain('quote_AAPL');

      stockService.clearRequestCache();

      const statsAfterClear = stockService.getCacheStats();
      expect(statsAfterClear.size).toBe(0);
      expect(statsAfterClear.keys).toEqual([]);
    });

    it('should provide cache statistics', () => {
      const stats = stockService.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(Array.isArray(stats.keys)).toBe(true);
    });
  });
});
