/**
 * Unit Tests for Stock Types
 * ==========================
 *
 * Tests for type guards, constants, and type utilities
 */

import {
  // Type guards
  isFinnhubStockQuote,
  isWatchedStock,
  isTradeData,

  // Constants from constants file
  WEBSOCKET_CONFIG,
  PWA_CONFIG,
  REFRESH_INTERVALS,

  // Types for testing
  type FinnhubStockQuote,
  type WatchedStock,
  type TradeData,
  type RefreshInterval,
  type WebSocketStatus,
  type AlertCondition,
  type PriceDirection,
  type MarketStatus,
  type ChartTimeRange,
} from './stock';

import {
  // Constants from constants file
  DEFAULT_STOCK_OPTIONS,
  STOCK_COLORS,
  STORAGE_KEYS,
} from '../constants/constants';

describe('Stock Types', () => {
  describe('Type Guards', () => {
    describe('isFinnhubStockQuote', () => {
      it('should return true for valid FinnhubStockQuote', () => {
        const validQuote: FinnhubStockQuote = {
          symbol: 'AAPL',
          current: 150.0,
          change: 2.5,
          percentChange: 1.67,
          high: 152.0,
          low: 148.0,
          open: 149.0,
          previousClose: 147.5,
          timestamp: Date.now(),
        };

        expect(isFinnhubStockQuote(validQuote)).toBe(true);
      });

      it('should return false for invalid objects', () => {
        const invalidCases = [
          null,
          undefined,
          {},
          { symbol: 'AAPL' }, // missing required fields
          { symbol: 123, current: 150 }, // wrong types
          { symbol: 'AAPL', current: '150' }, // wrong type for current
          'not an object',
          123,
          [],
        ];

        invalidCases.forEach(testCase => {
          expect(isFinnhubStockQuote(testCase)).toBe(false);
        });
      });

      it('should require all core numeric fields', () => {
        const baseQuote = {
          symbol: 'AAPL',
          high: 152.0,
          low: 148.0,
          open: 149.0,
          previousClose: 147.5,
          timestamp: Date.now(),
        };

        // Missing current
        expect(isFinnhubStockQuote(baseQuote)).toBe(false);

        // Missing change
        expect(isFinnhubStockQuote({ ...baseQuote, current: 150 })).toBe(false);

        // Missing percentChange
        expect(
          isFinnhubStockQuote({
            ...baseQuote,
            current: 150,
            change: 2.5,
          })
        ).toBe(false);

        // All required fields present
        expect(
          isFinnhubStockQuote({
            ...baseQuote,
            current: 150,
            change: 2.5,
            percentChange: 1.67,
          })
        ).toBe(true);
      });
    });

    describe('isWatchedStock', () => {
      it('should return true for valid WatchedStock', () => {
        const validStock: WatchedStock = {
          id: 'stock-1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          alertPrice: 150.0,
        };

        expect(isWatchedStock(validStock)).toBe(true);
      });

      it('should accept optional fields', () => {
        const stockWithOptionals: WatchedStock = {
          id: 'stock-1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          alertPrice: 150.0,
          currentPrice: 152.0,
          change: 2.0,
          percentChange: 1.33,
          isLoading: false,
          lastUpdated: Date.now(),
        };

        expect(isWatchedStock(stockWithOptionals)).toBe(true);
      });

      it('should return false for invalid objects', () => {
        const invalidCases = [
          null,
          undefined,
          {},
          { id: 'stock-1' }, // missing required fields
          { id: 123, symbol: 'AAPL' }, // wrong types
          { id: 'stock-1', symbol: 'AAPL', name: 'Apple', alertPrice: '150' }, // wrong type
          'not an object',
          [],
        ];

        invalidCases.forEach(testCase => {
          expect(isWatchedStock(testCase)).toBe(false);
        });
      });

      it('should require all core fields', () => {
        const baseStock = {};

        // Add fields one by one
        expect(isWatchedStock(baseStock)).toBe(false);

        expect(isWatchedStock({ ...baseStock, id: 'stock-1' })).toBe(false);

        expect(
          isWatchedStock({
            ...baseStock,
            id: 'stock-1',
            symbol: 'AAPL',
          })
        ).toBe(false);

        expect(
          isWatchedStock({
            ...baseStock,
            id: 'stock-1',
            symbol: 'AAPL',
            name: 'Apple Inc.',
          })
        ).toBe(false);

        expect(
          isWatchedStock({
            ...baseStock,
            id: 'stock-1',
            symbol: 'AAPL',
            name: 'Apple Inc.',
            alertPrice: 150.0,
          })
        ).toBe(true);
      });
    });

    describe('isTradeData', () => {
      it('should return true for valid TradeData', () => {
        const validTrade: TradeData = {
          s: 'AAPL',
          p: 150.0,
          t: Date.now(),
        };

        expect(isTradeData(validTrade)).toBe(true);
      });

      it('should accept optional volume field', () => {
        const tradeWithVolume: TradeData = {
          s: 'AAPL',
          p: 150.0,
          t: Date.now(),
          v: 1000,
        };

        expect(isTradeData(tradeWithVolume)).toBe(true);
      });

      it('should return false for invalid objects', () => {
        const invalidCases = [
          null,
          undefined,
          {},
          { s: 'AAPL' }, // missing required fields
          { s: 123, p: 150 }, // wrong types
          { s: 'AAPL', p: '150', t: Date.now() }, // wrong type for price
          'not an object',
          [],
        ];

        invalidCases.forEach(testCase => {
          expect(isTradeData(testCase)).toBe(false);
        });
      });

      it('should require all core fields', () => {
        expect(isTradeData({ s: 'AAPL' })).toBe(false);
        expect(isTradeData({ s: 'AAPL', p: 150 })).toBe(false);
        expect(isTradeData({ s: 'AAPL', p: 150, t: Date.now() })).toBe(true);
      });
    });
  });

  describe('Constants', () => {
    describe('DEFAULT_STOCK_OPTIONS', () => {
      it('should contain expected stock symbols', () => {
        const symbols = DEFAULT_STOCK_OPTIONS.map(stock => stock.symbol);

        expect(symbols).toContain('AAPL');
        expect(symbols).toContain('GOOGL');
        expect(symbols).toContain('MSFT');
        expect(symbols).toContain('AMZN');
        expect(symbols).toContain('TSLA');
        expect(symbols).toContain('META');
        expect(symbols).toContain('NVDA');
        expect(symbols).toContain('NFLX');
      });

      it('should have valid structure for each stock option', () => {
        DEFAULT_STOCK_OPTIONS.forEach(stock => {
          expect(typeof stock.symbol).toBe('string');
          expect(typeof stock.name).toBe('string');
          expect(stock.symbol.length).toBeGreaterThan(0);
          expect(stock.name.length).toBeGreaterThan(0);

          if (stock.exchange) {
            expect(typeof stock.exchange).toBe('string');
          }
        });
      });

      it('should have all stocks from NASDAQ exchange', () => {
        DEFAULT_STOCK_OPTIONS.forEach(stock => {
          expect(stock.exchange).toBe('NASDAQ');
        });
      });
    });

    describe('STOCK_COLORS', () => {
      it('should have colors for default stock symbols', () => {
        const expectedSymbols = [
          'AAPL',
          'GOOGL',
          'MSFT',
          'AMZN',
          'TSLA',
          'META',
          'NVDA',
          'NFLX',
        ];

        expectedSymbols.forEach(symbol => {
          expect(STOCK_COLORS[symbol]).toBeDefined();
          expect(typeof STOCK_COLORS[symbol]).toBe('string');
          expect(STOCK_COLORS[symbol]).toMatch(/^#[0-9a-fA-F]{6}$/); // Valid hex color
        });
      });

      it('should have unique colors for each stock', () => {
        const colors = Object.values(STOCK_COLORS);
        const uniqueColors = [...new Set(colors)];

        expect(uniqueColors.length).toBe(colors.length);
      });
    });

    describe('WEBSOCKET_CONFIG', () => {
      it('should have required configuration properties', () => {
        expect(typeof WEBSOCKET_CONFIG.RECONNECT_INTERVAL).toBe('number');
        expect(typeof WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS).toBe('number');
        expect(typeof WEBSOCKET_CONFIG.PING_INTERVAL).toBe('number');
        expect(typeof WEBSOCKET_CONFIG.SUBSCRIPTION_LIMIT).toBe('number');
      });

      it('should have reasonable default values', () => {
        expect(WEBSOCKET_CONFIG.RECONNECT_INTERVAL).toBe(5000);
        expect(WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS).toBe(5);
        expect(WEBSOCKET_CONFIG.PING_INTERVAL).toBe(30000);
        expect(WEBSOCKET_CONFIG.SUBSCRIPTION_LIMIT).toBe(50);
      });

      it('should have immutable-like TypeScript behavior but mutable runtime', () => {
        // In JavaScript, 'as const' provides TypeScript readonly types but not runtime immutability
        // We can verify the initial values are correct
        expect(WEBSOCKET_CONFIG.RECONNECT_INTERVAL).toBe(5000);
        expect(WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS).toBe(5);
        expect(WEBSOCKET_CONFIG.PING_INTERVAL).toBe(30000);
        expect(WEBSOCKET_CONFIG.SUBSCRIPTION_LIMIT).toBe(50);

        // TypeScript should prevent modification in compiled code, but runtime allows it
        // This demonstrates that 'as const' is primarily a TypeScript feature
        const originalValue = WEBSOCKET_CONFIG.RECONNECT_INTERVAL;
        (WEBSOCKET_CONFIG as any).RECONNECT_INTERVAL = 1000;
        expect(WEBSOCKET_CONFIG.RECONNECT_INTERVAL).toBe(1000); // Runtime allows modification

        // Restore original value for other tests
        (WEBSOCKET_CONFIG as any).RECONNECT_INTERVAL = originalValue;
        expect(WEBSOCKET_CONFIG.RECONNECT_INTERVAL).toBe(5000);
      });
    });

    describe('STORAGE_KEYS', () => {
      it('should have required storage key properties', () => {
        expect(typeof STORAGE_KEYS.WATCHED_STOCKS).toBe('string');
        expect(typeof STORAGE_KEYS.LAST_SYNC).toBe('string');
        expect(typeof STORAGE_KEYS.VERSION).toBe('string');
      });

      it('should have stockpulse prefixed keys', () => {
        Object.values(STORAGE_KEYS).forEach(key => {
          expect(key).toMatch(/^stockpulse_/);
        });
      });

      it('should have expected key values', () => {
        expect(STORAGE_KEYS.WATCHED_STOCKS).toBe('stockpulse_watched_stocks');
        expect(STORAGE_KEYS.LAST_SYNC).toBe('stockpulse_last_sync');
        expect(STORAGE_KEYS.VERSION).toBe('stockpulse_version');
      });
    });

    describe('PWA_CONFIG', () => {
      it('should have required PWA configuration properties', () => {
        expect(typeof PWA_CONFIG.VERSION).toBe('string');
        expect(typeof PWA_CONFIG.CACHE_NAME).toBe('string');
        expect(typeof PWA_CONFIG.SYNC_INTERVAL).toBe('number');
        expect(typeof PWA_CONFIG.MAX_STORAGE_ITEMS).toBe('number');
      });

      it('should have reasonable default values', () => {
        expect(PWA_CONFIG.VERSION).toBe('1.0.0');
        expect(PWA_CONFIG.CACHE_NAME).toBe('stockpulse-v1');
        expect(PWA_CONFIG.SYNC_INTERVAL).toBe(30000);
        expect(PWA_CONFIG.MAX_STORAGE_ITEMS).toBe(100);
      });
    });

    describe('REFRESH_INTERVALS', () => {
      it('should contain expected interval options', () => {
        const expectedValues: RefreshInterval[] = [
          '30s',
          '1m',
          '2m',
          '5m',
          '10m',
          '30m',
          '1h',
        ];

        expectedValues.forEach(value => {
          const config = REFRESH_INTERVALS.find(
            interval => interval.value === value
          );
          expect(config).toBeDefined();
        });
      });

      it('should have valid structure for each interval', () => {
        REFRESH_INTERVALS.forEach(interval => {
          expect(typeof interval.value).toBe('string');
          expect(typeof interval.label).toBe('string');
          expect(typeof interval.milliseconds).toBe('number');
          expect(interval.milliseconds).toBeGreaterThan(0);
        });
      });

      it('should have ascending millisecond values', () => {
        for (let i = 1; i < REFRESH_INTERVALS.length; i++) {
          expect(REFRESH_INTERVALS[i].milliseconds).toBeGreaterThan(
            REFRESH_INTERVALS[i - 1].milliseconds
          );
        }
      });

      it('should have correct millisecond calculations', () => {
        const expectations = [
          { value: '30s', ms: 30 * 1000 },
          { value: '1m', ms: 60 * 1000 },
          { value: '2m', ms: 2 * 60 * 1000 },
          { value: '5m', ms: 5 * 60 * 1000 },
          { value: '10m', ms: 10 * 60 * 1000 },
          { value: '30m', ms: 30 * 60 * 1000 },
          { value: '1h', ms: 60 * 60 * 1000 },
        ];

        expectations.forEach(({ value, ms }) => {
          const config = REFRESH_INTERVALS.find(
            interval => interval.value === value
          );
          expect(config?.milliseconds).toBe(ms);
        });
      });
    });
  });

  describe('Type Definitions', () => {
    describe('WebSocketStatus', () => {
      it('should accept valid status values', () => {
        const validStatuses: WebSocketStatus[] = [
          'disconnected',
          'connecting',
          'connected',
          'error',
        ];

        // This test verifies TypeScript compilation more than runtime behavior
        validStatuses.forEach(status => {
          const testStatus: WebSocketStatus = status;
          expect(testStatus).toBe(status);
        });
      });
    });

    describe('RefreshInterval', () => {
      it('should accept valid interval values', () => {
        const validIntervals: RefreshInterval[] = [
          '30s',
          '1m',
          '2m',
          '5m',
          '10m',
          '30m',
          '1h',
        ];

        validIntervals.forEach(interval => {
          const testInterval: RefreshInterval = interval;
          expect(testInterval).toBe(interval);
        });
      });
    });

    describe('AlertCondition', () => {
      it('should accept valid condition values', () => {
        const validConditions: AlertCondition[] = ['above', 'below'];

        validConditions.forEach(condition => {
          const testCondition: AlertCondition = condition;
          expect(testCondition).toBe(condition);
        });
      });
    });

    describe('PriceDirection', () => {
      it('should accept valid direction values', () => {
        const validDirections: PriceDirection[] = ['up', 'down', 'neutral'];

        validDirections.forEach(direction => {
          const testDirection: PriceDirection = direction;
          expect(testDirection).toBe(direction);
        });
      });
    });

    describe('MarketStatus', () => {
      it('should accept valid market status values', () => {
        const validStatuses: MarketStatus[] = [
          'open',
          'closed',
          'pre-market',
          'after-hours',
        ];

        validStatuses.forEach(status => {
          const testStatus: MarketStatus = status;
          expect(testStatus).toBe(status);
        });
      });
    });

    describe('ChartTimeRange', () => {
      it('should accept valid time range values', () => {
        const validRanges: ChartTimeRange[] = [
          '1H',
          '1D',
          '1W',
          '1M',
          '3M',
          '1Y',
        ];

        validRanges.forEach(range => {
          const testRange: ChartTimeRange = range;
          expect(testRange).toBe(range);
        });
      });
    });
  });

  describe('Complex Type Scenarios', () => {
    it('should handle complete WatchedStock with all optional fields', () => {
      const completeStock: WatchedStock = {
        id: 'stock-1',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        alertPrice: 150.0,
        currentPrice: 152.5,
        change: 2.5,
        percentChange: 1.67,
        high: 155.0,
        low: 148.0,
        open: 149.0,
        previousClose: 147.5,
        isLoading: false,
        lastUpdated: Date.now(),
        priceHistory: [
          { time: Date.now() - 60000, price: 149.0 },
          { time: Date.now(), price: 152.5 },
        ],
        isAlertTriggered: true,
        alertTriggeredAt: Date.now(),
      };

      expect(isWatchedStock(completeStock)).toBe(true);
    });

    it('should handle TradeData with volume', () => {
      const tradeWithVolume: TradeData = {
        s: 'AAPL',
        p: 150.25,
        t: 1640995200000,
        v: 5000,
      };

      expect(isTradeData(tradeWithVolume)).toBe(true);
    });

    it('should validate nested object structures', () => {
      // Test with realistic data that might come from API
      const apiQuote = {
        symbol: 'AAPL',
        current: 150.25,
        change: 2.15,
        percentChange: 1.45,
        high: 152.0,
        low: 148.5,
        open: 149.0,
        previousClose: 148.1,
        timestamp: 1640995200000,
        // Extra fields that shouldn't break the type guard
        extraField: 'should be ignored',
        volume: 1000000,
      };

      expect(isFinnhubStockQuote(apiQuote)).toBe(true);
    });
  });
});
