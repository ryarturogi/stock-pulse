/**
 * Unit Tests for Types Index
 * ==========================
 *
 * Tests for type exports and interface validation
 */

import * as TypesIndex from './index';
import {
  // Re-exported function types
  isDefined,
  isString,
  isNumber,
  // Re-exported utility types
  type StockQuote,
  type PortfolioHolding,
  type Portfolio,
  type WatchlistItem,
  type PriceAlert,
  type NewsArticle,
  type UserPreferences,
  type TimeRange,
  type StockSearchResult,
  type Notification,
  type ApiResponse,
  type AsyncState,
} from './index';

describe('Types Index', () => {
  describe('Type Exports', () => {
    it('should export all utility types from utils', () => {
      expect(typeof isDefined).toBe('function');
      expect(typeof isString).toBe('function');
      expect(typeof isNumber).toBe('function');
    });

    it('should export all stock types from stock', () => {
      // Type guards should be functions
      expect(typeof TypesIndex.isFinnhubStockQuote).toBe('function');
      expect(typeof TypesIndex.isWatchedStock).toBe('function');
      expect(typeof TypesIndex.isTradeData).toBe('function');
    });
  });

  describe('Domain-Specific Type Validation', () => {
    describe('StockQuote', () => {
      it('should validate a complete StockQuote object', () => {
        const stockQuote: StockQuote = {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          price: 150.25,
          change: 2.5,
          changePercent: 1.69,
          volume: 1000000,
          marketCap: 2500000000000,
          pe: 25.5,
          dividendYield: 0.5,
          high52Week: 180.0,
          low52Week: 120.0,
          timestamp: '2023-12-01T10:00:00Z',
        };

        expect(stockQuote.symbol).toBe('AAPL');
        expect(stockQuote.price).toBe(150.25);
        expect(typeof stockQuote.timestamp).toBe('string');
      });

      it('should validate a minimal StockQuote object', () => {
        const stockQuote: StockQuote = {
          symbol: 'MSFT',
          name: 'Microsoft Corporation',
          price: 350.0,
          change: -5.0,
          changePercent: -1.4,
          volume: 500000,
          timestamp: '2023-12-01T10:00:00Z',
        };

        expect(stockQuote.symbol).toBe('MSFT');
        expect(stockQuote.marketCap).toBeUndefined();
        expect(stockQuote.pe).toBeUndefined();
      });
    });

    describe('PortfolioHolding', () => {
      it('should validate PortfolioHolding structure', () => {
        const holding: PortfolioHolding = {
          id: 'holding_123',
          symbol: 'AAPL',
          shares: 100,
          averageCost: 140.0,
          currentPrice: 150.0,
          totalValue: 15000.0,
          totalGainLoss: 1000.0,
          totalGainLossPercent: 7.14,
          addedAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-12-01T10:00:00Z',
        };

        expect(holding.id).toBe('holding_123');
        expect(holding.shares).toBe(100);
        expect(holding.totalGainLoss).toBe(1000.0);
      });
    });

    describe('Portfolio', () => {
      it('should validate Portfolio structure', () => {
        const portfolio: Portfolio = {
          id: 'portfolio_123',
          name: 'My Portfolio',
          totalValue: 50000.0,
          totalGainLoss: 5000.0,
          totalGainLossPercent: 11.11,
          holdings: [],
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-12-01T10:00:00Z',
        };

        expect(portfolio.name).toBe('My Portfolio');
        expect(Array.isArray(portfolio.holdings)).toBe(true);
        expect(portfolio.totalValue).toBe(50000.0);
      });
    });

    describe('WatchlistItem', () => {
      it('should validate WatchlistItem with optional fields', () => {
        const item: WatchlistItem = {
          id: 'watch_123',
          symbol: 'TSLA',
          name: 'Tesla Inc.',
          targetPrice: 200.0,
          notes: 'Watching for EV trends',
          addedAt: '2023-12-01T10:00:00Z',
        };

        expect(item.symbol).toBe('TSLA');
        expect(item.targetPrice).toBe(200.0);
        expect(item.notes).toBe('Watching for EV trends');
      });

      it('should validate WatchlistItem without optional fields', () => {
        const item: WatchlistItem = {
          id: 'watch_456',
          symbol: 'NVDA',
          name: 'NVIDIA Corporation',
          addedAt: '2023-12-01T10:00:00Z',
        };

        expect(item.symbol).toBe('NVDA');
        expect(item.targetPrice).toBeUndefined();
        expect(item.notes).toBeUndefined();
      });
    });

    describe('PriceAlert', () => {
      it('should validate PriceAlert structure', () => {
        const alert: PriceAlert = {
          id: 'alert_123',
          symbol: 'AAPL',
          condition: 'above',
          targetPrice: 160.0,
          isActive: true,
          createdAt: '2023-12-01T10:00:00Z',
          triggeredAt: '2023-12-01T15:00:00Z',
        };

        expect(alert.condition).toBe('above');
        expect(alert.isActive).toBe(true);
        expect(alert.triggeredAt).toBeDefined();
      });

      it('should validate alert conditions', () => {
        const aboveAlert: PriceAlert = {
          id: 'alert_1',
          symbol: 'AAPL',
          condition: 'above',
          targetPrice: 160.0,
          isActive: true,
          createdAt: '2023-12-01T10:00:00Z',
        };

        const belowAlert: PriceAlert = {
          id: 'alert_2',
          symbol: 'AAPL',
          condition: 'below',
          targetPrice: 140.0,
          isActive: false,
          createdAt: '2023-12-01T10:00:00Z',
        };

        expect(aboveAlert.condition).toBe('above');
        expect(belowAlert.condition).toBe('below');
        expect(belowAlert.isActive).toBe(false);
      });
    });

    describe('NewsArticle', () => {
      it('should validate NewsArticle structure', () => {
        const article: NewsArticle = {
          id: 'news_123',
          title: 'Apple Reaches New Heights',
          summary: 'Apple stock reaches record highs...',
          url: 'https://example.com/article',
          source: 'Finance News',
          publishedAt: '2023-12-01T10:00:00Z',
          relatedSymbols: ['AAPL', 'MSFT'],
          imageUrl: 'https://example.com/image.jpg',
        };

        expect(article.title).toBe('Apple Reaches New Heights');
        expect(Array.isArray(article.relatedSymbols)).toBe(true);
        expect(article.relatedSymbols).toContain('AAPL');
        expect(article.imageUrl).toBeDefined();
      });
    });

    describe('UserPreferences', () => {
      it('should validate UserPreferences structure', () => {
        const preferences: UserPreferences = {
          theme: 'dark',
          currency: 'USD',
          language: 'en',
          notifications: {
            email: true,
            push: false,
            priceAlerts: true,
            news: false,
          },
          refreshInterval: 30000,
        };

        expect(preferences.theme).toBe('dark');
        expect(preferences.notifications.email).toBe(true);
        expect(preferences.notifications.push).toBe(false);
        expect(preferences.refreshInterval).toBe(30000);
      });

      it('should validate theme options', () => {
        const lightTheme: UserPreferences['theme'] = 'light';
        const darkTheme: UserPreferences['theme'] = 'dark';
        const systemTheme: UserPreferences['theme'] = 'system';

        expect(lightTheme).toBe('light');
        expect(darkTheme).toBe('dark');
        expect(systemTheme).toBe('system');
      });
    });

    describe('TimeRange', () => {
      it('should validate TimeRange union type', () => {
        const ranges: TimeRange[] = [
          '1D',
          '5D',
          '1M',
          '3M',
          '6M',
          '1Y',
          '5Y',
          'MAX',
        ];

        ranges.forEach(range => {
          expect(typeof range).toBe('string');
          expect(['1D', '5D', '1M', '3M', '6M', '1Y', '5Y', 'MAX']).toContain(
            range
          );
        });
      });
    });

    describe('StockSearchResult', () => {
      it('should validate StockSearchResult structure', () => {
        const result: StockSearchResult = {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          exchange: 'NASDAQ',
          type: 'stock',
        };

        expect(result.type).toBe('stock');
        expect(['stock', 'etf', 'mutual_fund']).toContain(result.type);
      });

      it('should validate different asset types', () => {
        const stock: StockSearchResult['type'] = 'stock';
        const etf: StockSearchResult['type'] = 'etf';
        const mutualFund: StockSearchResult['type'] = 'mutual_fund';

        expect(stock).toBe('stock');
        expect(etf).toBe('etf');
        expect(mutualFund).toBe('mutual_fund');
      });
    });

    describe('Notification', () => {
      it('should validate Notification structure', () => {
        const notification: Notification = {
          id: 'notif_123',
          type: 'success',
          title: 'Price Alert Triggered',
          message: 'AAPL has reached your target price',
          timestamp: '2023-12-01T10:00:00Z',
          read: false,
          actionUrl: '/portfolio',
        };

        expect(notification.type).toBe('success');
        expect(notification.read).toBe(false);
        expect(notification.actionUrl).toBe('/portfolio');
      });

      it('should validate notification types', () => {
        const types: Notification['type'][] = [
          'info',
          'success',
          'warning',
          'error',
        ];

        types.forEach(type => {
          expect(['info', 'success', 'warning', 'error']).toContain(type);
        });
      });
    });
  });

  describe('Legacy Types', () => {
    it('should validate LegacyApiResponse structure', () => {
      const response: ApiResponse<string> = {
        data: 'test data',
        success: true,
        message: 'Success',
        timestamp: '2023-01-01T00:00:00.000Z',
      };

      expect(response.success).toBe(true);
      expect(response.data).toBe('test data');
      expect(response.message).toBe('Success');
    });
  });

  describe('Utility Type Integration', () => {
    it('should work with imported utility types', () => {
      const apiResponse: ApiResponse<StockQuote> = {
        success: true,
        data: {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          price: 150.0,
          change: 2.5,
          changePercent: 1.67,
          volume: 1000000,
          timestamp: '2023-12-01T10:00:00Z',
        },
        timestamp: '2023-12-01T10:00:00Z',
      };

      expect(apiResponse.success).toBe(true);
      expect(apiResponse.data?.symbol).toBe('AAPL');
    });

    it('should work with AsyncState utility type', () => {
      const loadingState: AsyncState<StockQuote[]> = {
        loading: true,
      };

      const loadedState: AsyncState<StockQuote[]> = {
        loading: false,
        data: [
          {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            price: 150.0,
            change: 2.5,
            changePercent: 1.67,
            volume: 1000000,
            timestamp: '2023-12-01T10:00:00Z',
          },
        ],
      };

      expect(loadingState.loading).toBe(true);
      expect(loadedState.data).toHaveLength(1);
    });
  });

  describe('Type Safety', () => {
    it('should enforce required fields', () => {
      // This test validates that TypeScript compilation enforces required fields
      const stockQuote: StockQuote = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 150.0,
        change: 2.5,
        changePercent: 1.67,
        volume: 1000000,
        timestamp: '2023-12-01T10:00:00Z',
        // Optional fields can be omitted
      };

      expect(stockQuote.symbol).toBeDefined();
      expect(stockQuote.name).toBeDefined();
      expect(stockQuote.price).toBeDefined();
      expect(stockQuote.timestamp).toBeDefined();
    });

    it('should allow optional fields to be undefined', () => {
      const watchlistItem: WatchlistItem = {
        id: 'watch_123',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        addedAt: '2023-12-01T10:00:00Z',
        // targetPrice and notes are optional
      };

      expect(watchlistItem.targetPrice).toBeUndefined();
      expect(watchlistItem.notes).toBeUndefined();
    });
  });
});
