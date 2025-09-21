/**
 * Unit Tests for Application Constants
 * ===================================
 * 
 * Tests for all application-wide constants and configuration
 */

import {
  API_CONFIG,
  EXTERNAL_APIS,
  ROUTES,
  STORAGE_KEYS,
  DEFAULTS,
  MARKET_HOURS,
  CHART_CONFIG,
  NOTIFICATIONS,
  EXCHANGES,
  POPULAR_STOCKS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from './constants';

describe('Application Constants', () => {
  describe('API_CONFIG', () => {
    it('should have all required API configuration properties', () => {
      expect(typeof API_CONFIG.BASE_URL).toBe('string');
      expect(typeof API_CONFIG.TIMEOUT).toBe('number');
      expect(typeof API_CONFIG.RETRY_ATTEMPTS).toBe('number');
      expect(typeof API_CONFIG.RATE_LIMIT).toBe('object');
    });

    it('should have valid default values', () => {
      expect(API_CONFIG.RETRY_ATTEMPTS).toBe(3);
      expect(API_CONFIG.RATE_LIMIT.REQUESTS_PER_MINUTE).toBe(60);
      expect(API_CONFIG.RATE_LIMIT.REQUESTS_PER_HOUR).toBe(1000);
    });

    it('should have valid timeout value', () => {
      expect(API_CONFIG.TIMEOUT).toBeGreaterThan(0);
      expect(API_CONFIG.TIMEOUT).toBeLessThanOrEqual(30000); // Reasonable max timeout
    });

    it('should have valid base URL format', () => {
      expect(API_CONFIG.BASE_URL).toMatch(/^https?:\/\/.+/);
    });

    it('should handle environment variables for timeout', () => {
      // The timeout should be a parsed number from env or default
      expect(typeof API_CONFIG.TIMEOUT).toBe('number');
      expect(!isNaN(API_CONFIG.TIMEOUT)).toBe(true);
    });
  });

  describe('EXTERNAL_APIS', () => {
    it('should have Finnhub API configuration', () => {
      expect(EXTERNAL_APIS.FINNHUB).toBeDefined();
      expect(typeof EXTERNAL_APIS.FINNHUB.BASE_URL).toBe('string');
      expect(EXTERNAL_APIS.FINNHUB.BASE_URL).toBe('https://finnhub.io/api/v1');
    });

    it('should handle environment variable for API key', () => {
      // API key can be undefined if not set in env
      if (EXTERNAL_APIS.FINNHUB.API_KEY) {
        expect(typeof EXTERNAL_APIS.FINNHUB.API_KEY).toBe('string');
      }
    });

    it('should have valid Finnhub URL format', () => {
      expect(EXTERNAL_APIS.FINNHUB.BASE_URL).toMatch(/^https:\/\/finnhub\.io\/api\/v\d+$/);
    });
  });

  describe('ROUTES', () => {
    it('should have all expected route properties', () => {
      const expectedRoutes = [
        'HOME', 'PORTFOLIO', 'WATCHLIST', 'ALERTS', 'NEWS', 'SEARCH',
        'STOCK_DETAIL', 'SETTINGS', 'LOGIN', 'REGISTER'
      ];

      expectedRoutes.forEach(route => {
        expect(ROUTES[route as keyof typeof ROUTES]).toBeDefined();
        expect(typeof ROUTES[route as keyof typeof ROUTES]).toBe('string');
      });
    });

    it('should have valid route paths', () => {
      Object.values(ROUTES).forEach(route => {
        expect(route).toMatch(/^\/.*$/); // Should start with /
        expect(route.length).toBeGreaterThan(0);
      });
    });

    it('should have specific expected route values', () => {
      expect(ROUTES.HOME).toBe('/');
      expect(ROUTES.PORTFOLIO).toBe('/portfolio');
      expect(ROUTES.WATCHLIST).toBe('/watchlist');
      expect(ROUTES.LOGIN).toBe('/auth/login');
      expect(ROUTES.REGISTER).toBe('/auth/register');
    });

    it('should have unique route paths', () => {
      const routes = Object.values(ROUTES);
      const uniqueRoutes = [...new Set(routes)];
      expect(uniqueRoutes.length).toBe(routes.length);
    });
  });

  describe('STORAGE_KEYS', () => {
    it('should have all expected storage key properties', () => {
      const expectedKeys = [
        'USER_PREFERENCES', 'PORTFOLIO_DATA', 'WATCHLIST_DATA',
        'THEME', 'AUTH_TOKEN', 'REFRESH_TOKEN'
      ];

      expectedKeys.forEach(key => {
        expect(STORAGE_KEYS[key as keyof typeof STORAGE_KEYS]).toBeDefined();
        expect(typeof STORAGE_KEYS[key as keyof typeof STORAGE_KEYS]).toBe('string');
      });
    });

    it('should have stockpulse prefix for all keys', () => {
      Object.values(STORAGE_KEYS).forEach(key => {
        expect(key).toMatch(/^stockpulse_/);
      });
    });

    it('should have unique storage keys', () => {
      const keys = Object.values(STORAGE_KEYS);
      const uniqueKeys = [...new Set(keys)];
      expect(uniqueKeys.length).toBe(keys.length);
    });

    it('should have descriptive key names', () => {
      Object.values(STORAGE_KEYS).forEach(key => {
        expect(key.length).toBeGreaterThan(10); // Should be descriptive
        expect(key).not.toContain(' '); // Should not contain spaces
      });
    });
  });

  describe('DEFAULTS', () => {
    it('should have all expected default properties', () => {
      const expectedDefaults = [
        'REFRESH_INTERVAL', 'CHART_POINTS', 'PAGINATION_LIMIT',
        'PRICE_DECIMAL_PLACES', 'PERCENTAGE_DECIMAL_PLACES',
        'CURRENCY', 'LANGUAGE', 'THEME'
      ];

      expectedDefaults.forEach(defaultKey => {
        expect(DEFAULTS[defaultKey as keyof typeof DEFAULTS]).toBeDefined();
      });
    });

    it('should have reasonable numeric defaults', () => {
      expect(DEFAULTS.REFRESH_INTERVAL).toBe(30000);
      expect(DEFAULTS.CHART_POINTS).toBe(100);
      expect(DEFAULTS.PAGINATION_LIMIT).toBe(20);
      expect(DEFAULTS.PRICE_DECIMAL_PLACES).toBe(2);
      expect(DEFAULTS.PERCENTAGE_DECIMAL_PLACES).toBe(2);
    });

    it('should have valid string defaults', () => {
      expect(DEFAULTS.CURRENCY).toBe('USD');
      expect(DEFAULTS.LANGUAGE).toBe('en');
      expect(DEFAULTS.THEME).toBe('light');
    });

    it('should have positive numeric values', () => {
      expect(DEFAULTS.REFRESH_INTERVAL).toBeGreaterThan(0);
      expect(DEFAULTS.CHART_POINTS).toBeGreaterThan(0);
      expect(DEFAULTS.PAGINATION_LIMIT).toBeGreaterThan(0);
      expect(DEFAULTS.PRICE_DECIMAL_PLACES).toBeGreaterThanOrEqual(0);
      expect(DEFAULTS.PERCENTAGE_DECIMAL_PLACES).toBeGreaterThanOrEqual(0);
    });
  });

  describe('MARKET_HOURS', () => {
    it('should have all market hour properties', () => {
      expect(typeof MARKET_HOURS.OPEN_HOUR).toBe('number');
      expect(typeof MARKET_HOURS.OPEN_MINUTE).toBe('number');
      expect(typeof MARKET_HOURS.CLOSE_HOUR).toBe('number');
      expect(typeof MARKET_HOURS.CLOSE_MINUTE).toBe('number');
      expect(typeof MARKET_HOURS.TIMEZONE).toBe('string');
    });

    it('should have valid market hours (EST)', () => {
      expect(MARKET_HOURS.OPEN_HOUR).toBe(9);
      expect(MARKET_HOURS.OPEN_MINUTE).toBe(30);
      expect(MARKET_HOURS.CLOSE_HOUR).toBe(16);
      expect(MARKET_HOURS.CLOSE_MINUTE).toBe(0);
      expect(MARKET_HOURS.TIMEZONE).toBe('America/New_York');
    });

    it('should have valid hour ranges', () => {
      expect(MARKET_HOURS.OPEN_HOUR).toBeGreaterThanOrEqual(0);
      expect(MARKET_HOURS.OPEN_HOUR).toBeLessThan(24);
      expect(MARKET_HOURS.CLOSE_HOUR).toBeGreaterThanOrEqual(0);
      expect(MARKET_HOURS.CLOSE_HOUR).toBeLessThan(24);
    });

    it('should have valid minute ranges', () => {
      expect(MARKET_HOURS.OPEN_MINUTE).toBeGreaterThanOrEqual(0);
      expect(MARKET_HOURS.OPEN_MINUTE).toBeLessThan(60);
      expect(MARKET_HOURS.CLOSE_MINUTE).toBeGreaterThanOrEqual(0);
      expect(MARKET_HOURS.CLOSE_MINUTE).toBeLessThan(60);
    });

    it('should have market close after market open', () => {
      const openTime = MARKET_HOURS.OPEN_HOUR * 60 + MARKET_HOURS.OPEN_MINUTE;
      const closeTime = MARKET_HOURS.CLOSE_HOUR * 60 + MARKET_HOURS.CLOSE_MINUTE;
      expect(closeTime).toBeGreaterThan(openTime);
    });
  });

  describe('CHART_CONFIG', () => {
    it('should have colors configuration', () => {
      expect(CHART_CONFIG.COLORS).toBeDefined();
      expect(typeof CHART_CONFIG.COLORS.POSITIVE).toBe('string');
      expect(typeof CHART_CONFIG.COLORS.NEGATIVE).toBe('string');
      expect(typeof CHART_CONFIG.COLORS.NEUTRAL).toBe('string');
      expect(typeof CHART_CONFIG.COLORS.BACKGROUND).toBe('string');
      expect(typeof CHART_CONFIG.COLORS.GRID).toBe('string');
    });

    it('should have valid hex colors', () => {
      Object.values(CHART_CONFIG.COLORS).forEach(color => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it('should have time ranges configuration', () => {
      expect(CHART_CONFIG.TIME_RANGES).toBeDefined();
      const expectedRanges = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y', 'MAX'];
      
      expectedRanges.forEach(range => {
        expect(CHART_CONFIG.TIME_RANGES[range as keyof typeof CHART_CONFIG.TIME_RANGES]).toBeDefined();
      });
    });

    it('should have valid time range structure', () => {
      Object.values(CHART_CONFIG.TIME_RANGES).forEach(range => {
        if (range.days !== null) {
          expect(typeof range.days).toBe('number');
          expect(range.days).toBeGreaterThan(0);
        }
        expect(typeof range.interval).toBe('string');
        expect(range.interval.length).toBeGreaterThan(0);
      });
    });

    it('should have ascending time ranges (where applicable)', () => {
      const rangesWithDays = Object.values(CHART_CONFIG.TIME_RANGES)
        .filter(range => range.days !== null)
        .map(range => range.days as number)
        .sort((a, b) => a - b);

      for (let i = 1; i < rangesWithDays.length; i++) {
        expect(rangesWithDays[i]).toBeGreaterThan(rangesWithDays[i - 1]);
      }
    });
  });

  describe('NOTIFICATIONS', () => {
    it('should have all notification configuration sections', () => {
      expect(NOTIFICATIONS.TYPES).toBeDefined();
      expect(NOTIFICATIONS.PRIORITIES).toBeDefined();
      expect(NOTIFICATIONS.DISPLAY_DURATION).toBeDefined();
    });

    it('should have expected notification types', () => {
      const expectedTypes = ['PRICE_ALERT', 'NEWS', 'PORTFOLIO_UPDATE', 'SYSTEM'];
      expectedTypes.forEach(type => {
        expect(NOTIFICATIONS.TYPES[type as keyof typeof NOTIFICATIONS.TYPES]).toBeDefined();
        expect(typeof NOTIFICATIONS.TYPES[type as keyof typeof NOTIFICATIONS.TYPES]).toBe('string');
      });
    });

    it('should have expected priority levels', () => {
      const expectedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      expectedPriorities.forEach(priority => {
        expect(NOTIFICATIONS.PRIORITIES[priority as keyof typeof NOTIFICATIONS.PRIORITIES]).toBeDefined();
        expect(typeof NOTIFICATIONS.PRIORITIES[priority as keyof typeof NOTIFICATIONS.PRIORITIES]).toBe('string');
      });
    });

    it('should have valid display durations', () => {
      const durations = Object.values(NOTIFICATIONS.DISPLAY_DURATION);
      durations.forEach(duration => {
        expect(typeof duration).toBe('number');
        expect(duration).toBeGreaterThan(0);
        expect(duration).toBeLessThanOrEqual(30000); // Reasonable max duration
      });
    });

    it('should have ascending display durations by severity', () => {
      expect(NOTIFICATIONS.DISPLAY_DURATION.SUCCESS).toBeLessThan(NOTIFICATIONS.DISPLAY_DURATION.INFO);
      expect(NOTIFICATIONS.DISPLAY_DURATION.INFO).toBeLessThan(NOTIFICATIONS.DISPLAY_DURATION.WARNING);
      expect(NOTIFICATIONS.DISPLAY_DURATION.WARNING).toBeLessThan(NOTIFICATIONS.DISPLAY_DURATION.ERROR);
    });
  });

  describe('EXCHANGES', () => {
    it('should have expected stock exchanges', () => {
      const expectedExchanges = ['NYSE', 'NASDAQ', 'AMEX', 'OTC', 'LSE', 'TSE', 'TSX'];
      expectedExchanges.forEach(exchange => {
        expect(EXCHANGES[exchange as keyof typeof EXCHANGES]).toBeDefined();
        expect(typeof EXCHANGES[exchange as keyof typeof EXCHANGES]).toBe('string');
      });
    });

    it('should have descriptive exchange names', () => {
      Object.values(EXCHANGES).forEach(exchangeName => {
        expect(exchangeName.length).toBeGreaterThan(3);
        expect(exchangeName).toMatch(/[A-Za-z\s]/); // Should contain letters/spaces
      });
    });

    it('should have specific expected exchange values', () => {
      expect(EXCHANGES.NYSE).toBe('New York Stock Exchange');
      expect(EXCHANGES.NASDAQ).toBe('NASDAQ');
      expect(EXCHANGES.LSE).toBe('London Stock Exchange');
      expect(EXCHANGES.TSE).toBe('Tokyo Stock Exchange');
    });
  });

  describe('POPULAR_STOCKS', () => {
    it('should be an array of stock objects', () => {
      expect(Array.isArray(POPULAR_STOCKS)).toBe(true);
      expect(POPULAR_STOCKS.length).toBeGreaterThan(0);
    });

    it('should have valid stock structure', () => {
      POPULAR_STOCKS.forEach(stock => {
        expect(typeof stock.symbol).toBe('string');
        expect(typeof stock.name).toBe('string');
        expect(stock.symbol.length).toBeGreaterThan(0);
        expect(stock.name.length).toBeGreaterThan(0);
      });
    });

    it('should contain expected major stocks', () => {
      const symbols = POPULAR_STOCKS.map(stock => stock.symbol);
      const expectedSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
      
      expectedSymbols.forEach(symbol => {
        expect(symbols).toContain(symbol);
      });
    });

    it('should have unique stock symbols', () => {
      const symbols = POPULAR_STOCKS.map(stock => stock.symbol);
      const uniqueSymbols = [...new Set(symbols)];
      expect(uniqueSymbols.length).toBe(symbols.length);
    });

    it('should have uppercase stock symbols', () => {
      POPULAR_STOCKS.forEach(stock => {
        expect(stock.symbol).toBe(stock.symbol.toUpperCase());
      });
    });

    it('should have reasonable number of popular stocks', () => {
      expect(POPULAR_STOCKS.length).toBeGreaterThanOrEqual(5);
      expect(POPULAR_STOCKS.length).toBeLessThanOrEqual(50); // Not too many
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should have all expected error message types', () => {
      const expectedErrors = [
        'NETWORK_ERROR', 'API_ERROR', 'INVALID_SYMBOL', 'UNAUTHORIZED',
        'NOT_FOUND', 'RATE_LIMITED', 'VALIDATION_ERROR', 'UNKNOWN_ERROR'
      ];

      expectedErrors.forEach(errorType => {
        expect(ERROR_MESSAGES[errorType as keyof typeof ERROR_MESSAGES]).toBeDefined();
        expect(typeof ERROR_MESSAGES[errorType as keyof typeof ERROR_MESSAGES]).toBe('string');
      });
    });

    it('should have user-friendly error messages', () => {
      Object.values(ERROR_MESSAGES).forEach(message => {
        expect(message.length).toBeGreaterThan(10); // Should be descriptive
        expect(message.endsWith('.')).toBe(true); // Should end with period
        expect(message.charAt(0)).toBe(message.charAt(0).toUpperCase()); // Should start with capital
      });
    });

    it('should have specific expected error messages', () => {
      expect(ERROR_MESSAGES.NETWORK_ERROR).toContain('Network error');
      expect(ERROR_MESSAGES.UNAUTHORIZED).toContain('not authorized');
      expect(ERROR_MESSAGES.NOT_FOUND).toContain('not found');
      expect(ERROR_MESSAGES.RATE_LIMITED).toContain('Too many requests');
    });
  });

  describe('SUCCESS_MESSAGES', () => {
    it('should have all expected success message types', () => {
      const expectedSuccess = [
        'PORTFOLIO_UPDATED', 'STOCK_ADDED', 'STOCK_REMOVED',
        'ALERT_CREATED', 'ALERT_DELETED', 'PREFERENCES_SAVED'
      ];

      expectedSuccess.forEach(successType => {
        expect(SUCCESS_MESSAGES[successType as keyof typeof SUCCESS_MESSAGES]).toBeDefined();
        expect(typeof SUCCESS_MESSAGES[successType as keyof typeof SUCCESS_MESSAGES]).toBe('string');
      });
    });

    it('should have user-friendly success messages', () => {
      Object.values(SUCCESS_MESSAGES).forEach(message => {
        expect(message.length).toBeGreaterThan(10); // Should be descriptive
        expect(message.endsWith('.')).toBe(true); // Should end with period
        expect(message.charAt(0)).toBe(message.charAt(0).toUpperCase()); // Should start with capital
      });
    });

    it('should contain positive language', () => {
      Object.values(SUCCESS_MESSAGES).forEach(message => {
        const positiveWords = ['successfully', 'added', 'updated', 'created', 'saved', 'removed', 'deleted'];
        const hasPositiveWord = positiveWords.some(word => 
          message.toLowerCase().includes(word)
        );
        expect(hasPositiveWord).toBe(true);
      });
    });
  });

  describe('Constant Immutability', () => {
    it('should maintain readonly behavior for key constants', () => {
      // Test that constants have expected values that don't change during tests
      expect(API_CONFIG.RETRY_ATTEMPTS).toBe(3);
      expect(ROUTES.HOME).toBe('/');
      expect(DEFAULTS.CURRENCY).toBe('USD');
      expect(MARKET_HOURS.TIMEZONE).toBe('America/New_York');
    });

    it('should have consistent nested object structures', () => {
      // Verify that nested objects maintain their structure
      expect(typeof CHART_CONFIG.COLORS).toBe('object');
      expect(typeof NOTIFICATIONS.TYPES).toBe('object');
      expect(typeof API_CONFIG.RATE_LIMIT).toBe('object');
    });
  });
});