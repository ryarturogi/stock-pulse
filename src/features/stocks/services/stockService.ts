/**
 * Stock Service for API Integration
 * =================================
 * 
 * Service layer for handling stock data API calls and WebSocket connections
 * following the React Developer test requirements with Finnhub integration.
 */

import { DEFAULT_STOCK_OPTIONS } from '@/core/constants/constants';
import {
  type FinnhubStockQuote,
  type StockOption,
  isFinnhubStockQuote,
  isString,
  isNumber
} from '@/core/types';
import { isValidSymbol, isValidAlertPrice } from '@/core/utils/validation';

/**
 * Stock API service class
 */
export class StockService {
  private static instance: StockService;
  private baseUrl: string;
  // Request deduplication cache
  private requestCache = new Map<string, Promise<FinnhubStockQuote>>();
  private cacheTimeout = 2000; // 2 seconds cache for deduplication

  private constructor() {
    this.baseUrl = '/api';
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): StockService {
    if (!StockService.instance) {
      StockService.instance = new StockService();
    }
    return StockService.instance;
  }

  /**
   * Fetch stock quote from Finnhub API with request deduplication
   */
  async fetchStockQuote(symbol: string): Promise<FinnhubStockQuote> {
    if (!isString(symbol) || symbol.trim() === '') {
      throw new Error('Invalid stock symbol');
    }

    const cacheKey = `quote_${symbol.toUpperCase()}`;
    
    // Check if there's already a pending request for this symbol
    if (this.requestCache.has(cacheKey)) {
      console.log(`📦 [API] Using cached request for ${symbol}`, { symbol });
      return this.requestCache.get(cacheKey)!;
    }

    // Create new request and cache it
    const requestPromise = this._fetchStockQuoteInternal(symbol);
    this.requestCache.set(cacheKey, requestPromise);

    // Set timeout to clear cache
    setTimeout(() => {
      this.requestCache.delete(cacheKey);
    }, this.cacheTimeout);

    try {
      return await requestPromise;
    } catch (error) {
      // Remove failed request from cache immediately
      this.requestCache.delete(cacheKey);
      throw error;
    }
  }

  /**
   * Internal method for actual API call
   */
  private async _fetchStockQuoteInternal(symbol: string): Promise<FinnhubStockQuote> {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${this.baseUrl}/quote?symbol=${symbol}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle standardized API response format
      let quoteData;
      if (data.success && data.data) {
        // New standardized format
        quoteData = data.data;
      } else if (data.symbol && data.current !== undefined) {
        // Legacy direct format (for backward compatibility)
        quoteData = data;
      } else {
        throw new Error(data.error || 'Failed to fetch stock quote');
      }

      // Debug logging (can be removed in production)
      console.log(`✅ [API] Quote data received for ${symbol}`, { symbol, quote: quoteData });

      // Validate the quote data with better error handling
      if (!isFinnhubStockQuote(quoteData)) {
        const errorDetails = {
          symbol: quoteData?.symbol,
          current: quoteData?.current,
          change: quoteData?.change,
          percentChange: quoteData?.percentChange,
          hasSymbol: typeof quoteData?.symbol === 'string',
          hasCurrent: typeof quoteData?.current === 'number' && !isNaN(quoteData?.current),
          hasChange: typeof quoteData?.change === 'number' && !isNaN(quoteData?.change),
          hasPercentChange: typeof quoteData?.percentChange === 'number' && !isNaN(quoteData?.percentChange)
        };
        
        console.warn(`❌ [Validation] Quote validation failed for ${symbol}`, { symbol, errorDetails });
        
        // Try to provide a more helpful error message
        if (!errorDetails.hasSymbol) {
          throw new Error(`Invalid symbol in quote data for ${symbol}`);
        }
        if (!errorDetails.hasCurrent) {
          throw new Error(`Invalid current price data for ${symbol}. Market may be closed or symbol not found.`);
        }
        if (!errorDetails.hasChange || !errorDetails.hasPercentChange) {
          throw new Error(`Incomplete quote data for ${symbol}. Some values may be missing.`);
        }
        
        throw new Error(`Invalid quote data structure received for ${symbol}`);
      }

      return quoteData;

    } catch (error) {
      console.error(`❌ [API] Failed to fetch quote for ${symbol}`, { symbol, error });
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error(`Failed to fetch quote for ${symbol}`);
    }
  }

  /**
   * Fetch multiple stock quotes in parallel
   */
  async fetchMultipleQuotes(symbols: string[]): Promise<Record<string, FinnhubStockQuote>> {
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return {};
    }

    // Limit concurrent requests to avoid rate limiting
    const BATCH_SIZE = 5;
    const results: Record<string, FinnhubStockQuote> = {};

    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
      const batch = symbols.slice(i, i + BATCH_SIZE);
      
      const promises = batch.map(async (symbol) => {
        try {
          const quote = await this.fetchStockQuote(symbol);
          return { symbol, quote };
        } catch (error) {
          console.error(`❌ [API] Failed to fetch quote for ${symbol}`, { symbol, error });
          return { symbol, quote: null };
        }
      });

      const batchResults = await Promise.all(promises);
      
      batchResults.forEach(({ symbol, quote }) => {
        if (quote) {
          results[symbol] = quote;
        }
      });

      // Add delay between batches to respect rate limits
      if (i + BATCH_SIZE < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Get available stock options from Finnhub API with pagination
   */
  async getAvailableStocks(options: {
    exchange?: string;
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<{
    data: StockOption[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
    search?: string;
  }> {
    const { exchange = 'US', page = 1, limit = 50, search = '' } = options;
    
    try {
      const params = new URLSearchParams({
        exchange,
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (search) {
        params.append('search', search);
      }

      const url = `${this.baseUrl}/stock-symbols?${params}`;
      console.log('🔍 [API] Fetching stock symbols from:', url);

      // Create abort controller for timeout (fallback for environments without AbortSignal.timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('❌ [API] Failed to fetch stock symbols', { status: response.status, statusText: response.statusText });
        // Fallback to default options
        return {
          data: this.getDefaultStockOptions(),
          pagination: {
            page: 1,
            limit: 8,
            total: 8,
            totalPages: 1,
            hasMore: false
          }
        };
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Handle new standardized response format
        const responseData = data.data;
        
        if (responseData.items && Array.isArray(responseData.items)) {
          // New paginated response format
          return {
            data: responseData.items,
            pagination: responseData.pagination || {
              page: 1,
              limit: responseData.items.length,
              total: responseData.items.length,
              totalPages: 1,
              hasMore: false
            },
            search: responseData.search
          };
        } else if (Array.isArray(responseData)) {
          // Legacy array format
          return {
            data: responseData,
            pagination: {
              page: 1,
              limit: responseData.length,
              total: responseData.length,
              totalPages: 1,
              hasMore: false
            }
          };
        }
      }
      
      // Fallback to default options
      return {
        data: this.getDefaultStockOptions(),
        pagination: {
          page: 1,
          limit: 8,
          total: 8,
          totalPages: 1,
          hasMore: false
        }
      };
      
    } catch (error) {
      console.error('❌ [API] Error fetching available stocks', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        url: `${this.baseUrl}/stock-symbols?${new URLSearchParams({ exchange, page: page.toString(), limit: limit.toString() })}`,
        options: { exchange, page, limit, search }
      });
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('🌐 [API] Network error - likely development server not running');
      }
      
      // Fallback to default options
      return {
        data: this.getDefaultStockOptions(),
        pagination: {
          page: 1,
          limit: 8,
          total: 8,
          totalPages: 1,
          hasMore: false
        }
      };
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async getAvailableStocksLegacy(exchange: string = 'US'): Promise<StockOption[]> {
    const result = await this.getAvailableStocks({ exchange, limit: 1000 });
    return result.data;
  }

  /**
   * Get default stock options as fallback
   */
  private getDefaultStockOptions(): StockOption[] {
    return [...DEFAULT_STOCK_OPTIONS];
  }

  /**
   * Search for stocks using Finnhub API
   */
  async searchStocks(query: string): Promise<StockOption[]> {
    if (!isString(query) || query.trim().length < 1) {
      return [];
    }

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${this.baseUrl}/symbol-search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Failed to search stocks:', response.statusText);
        // Fallback to local search
        return this.searchStocksLocally(query);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
      
      // Fallback to local search
      return this.searchStocksLocally(query);
      
    } catch (error) {
      console.error('Error searching stocks:', error);
      // Fallback to local search
      return this.searchStocksLocally(query);
    }
  }

  /**
   * Local search fallback
   */
  private async searchStocksLocally(query: string): Promise<StockOption[]> {
    try {
      const availableStocks = await this.getDefaultStockOptions();
      const searchTerm = query.toLowerCase().trim();

      return availableStocks.filter(stock => 
        stock.symbol.toLowerCase().includes(searchTerm) ||
        stock.name.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Failed local stock search:', error);
      return [];
    }
  }

  /**
   * Validate stock symbol format
   */
  validateSymbol(symbol: string): boolean {
    return isValidSymbol(symbol);
  }

  /**
   * Validate alert price
   */
  validateAlertPrice(price: number | string): boolean {
    return isValidAlertPrice(price);
  }

  /**
   * Format price for display
   */
  formatPrice(price: number): string {
    if (!isNumber(price)) return '---.--';
    
    return price.toFixed(2);
  }

  /**
   * Format percentage change
   */
  formatPercentageChange(change: number): string {
    if (!isNumber(change)) return '--.--%';
    
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }

  /**
   * Get price change color class
   */
  getPriceChangeColor(change: number): string {
    if (!isNumber(change)) return 'text-gray-500';
    
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  }

  /**
   * Check if price is above alert
   */
  isPriceAboveAlert(currentPrice: number, alertPrice: number): boolean {
    if (!isNumber(currentPrice) || !isNumber(alertPrice)) return false;
    
    return currentPrice >= alertPrice;
  }

  /**
   * Check if price is below alert
   */
  isPriceBelowAlert(currentPrice: number, alertPrice: number): boolean {
    if (!isNumber(currentPrice) || !isNumber(alertPrice)) return false;
    
    return currentPrice < alertPrice;
  }

  /**
   * Get alert status
   */
  getAlertStatus(currentPrice: number, alertPrice: number): 'above' | 'below' | 'neutral' {
    if (!isNumber(currentPrice) || !isNumber(alertPrice)) return 'neutral';
    
    if (currentPrice >= alertPrice) return 'above';
    return 'below';
  }

  /**
   * Calculate price change from previous close
   */
  calculatePriceChange(currentPrice: number, previousClose: number): {
    change: number;
    percentChange: number;
  } {
    if (!isNumber(currentPrice) || !isNumber(previousClose) || previousClose === 0) {
      return { change: 0, percentChange: 0 };
    }

    const change = currentPrice - previousClose;
    const percentChange = (change / previousClose) * 100;

    return { change, percentChange };
  }

  // WebSocket functionality moved to stock store - methods removed

  // Historical data and health check methods removed - not currently used

  /**
   * Clear request cache manually (debug utility)
   */
  clearRequestCache(): void {
    console.log(`🧹 [API] Clearing ${this.requestCache.size} cached requests`, { cacheSize: this.requestCache.size });
    this.requestCache.clear();
  }

  /**
   * Get cache statistics (debug utility)
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.requestCache.size,
      keys: Array.from(this.requestCache.keys())
    };
  }
}

/**
 * Export singleton instance
 */
export const stockService = StockService.getInstance();

