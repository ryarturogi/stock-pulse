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
import { logger } from '@/core/utils/logger';

/**
 * Stock API service class
 */
export class StockService {
  private static instance: StockService;
  private baseUrl: string;
  // Request deduplication cache
  private requestCache = new Map<string, Promise<FinnhubStockQuote>>();
  private cacheTimeout = 2000; // 2 seconds cache for deduplication
  // Stock list cache
  private stockListCache = new Map<string, { data: any; timestamp: number }>();
  private stockListPendingRequests = new Map<string, Promise<any>>();
  private readonly STOCK_LIST_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly TIMEOUT_MS = 60000; // 1 minute
  // Performance optimization: request queue with priority
  private requestQueue: Array<{ symbol: string; priority: number; resolve: (value: FinnhubStockQuote) => void; reject: (error: Error) => void }> = [];
  private isProcessingQueue = false;

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
   * Process request queue with priority
   */
  private async processRequestQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Sort by priority (higher priority first)
      this.requestQueue.sort((a, b) => b.priority - a.priority);

      // Process up to 3 requests concurrently
      const concurrentLimit = 3;
      const batch = this.requestQueue.splice(0, concurrentLimit);

      const promises = batch.map(async ({ symbol, resolve, reject }) => {
        try {
          const result = await this._fetchStockQuoteInternal(symbol);
          resolve(result);
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Unknown error'));
        }
      });

      await Promise.allSettled(promises);

      // Process next batch if queue has more items
      if (this.requestQueue.length > 0) {
        setTimeout(() => this.processRequestQueue(), 100);
      }
    } finally {
      this.isProcessingQueue = false;
    }
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

      // Debug logging (development only)
      logger.api(`Quote data received for ${symbol}`, { symbol, quote: quoteData });

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

    // Dynamic batch size based on total requests to optimize performance
    const BATCH_SIZE = Math.min(Math.max(3, Math.floor(symbols.length / 4)), 8);
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

      // Add dynamic delay between batches based on batch size and rate limits
      if (i + BATCH_SIZE < symbols.length) {
        const delay = Math.min(50 + (batch.length * 10), 200); // Dynamic delay: 50-200ms
        await new Promise(resolve => setTimeout(resolve, delay));
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
    const requestId = Math.random().toString(36).substr(2, 9);
    
    // Create cache key
    const cacheKey = `${exchange}-${page}-${limit}-${search}`;
    
    // Check cache first
    const cached = this.stockListCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.STOCK_LIST_CACHE_TTL)) {
      console.log(`📋 [API] [${requestId}] Using cached stock list for ${cacheKey}`);
      return cached.data;
    }
    
    // Check if there's already a pending request for this exact query
    const pendingRequest = this.stockListPendingRequests.get(cacheKey);
    if (pendingRequest) {
      console.log(`⏳ [API] [${requestId}] Waiting for pending request ${cacheKey}`);
      return pendingRequest;
    }
    
    // Create new request and cache the promise
    const requestPromise = this._fetchStockList(exchange, page, limit, search, requestId);
    this.stockListPendingRequests.set(cacheKey, requestPromise);
    
    try {
      const result = await requestPromise;
      // Cache the result
      this.stockListCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } finally {
      // Remove from pending requests
      this.stockListPendingRequests.delete(cacheKey);
    }
  }

  private async _fetchStockList(exchange: string, page: number, limit: number, search: string, requestId: string): Promise<{
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
      console.log(`🔍 [API] [${requestId}] Fetching stock symbols from:`, url);

      // Create abort controller for timeout - 1 minute for very slow external APIs
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn(`⏰ [API] [${requestId}] Request timeout after ${this.TIMEOUT_MS/1000}s, aborting...`);
        controller.abort();
      }, this.TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

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
      
      // Add debugging to understand response structure
      if (process.env.NODE_ENV === 'development') {
        console.log('📄 [API] Raw response data:', {
          success: data.success,
          hasData: !!data.data,
          dataType: typeof data.data,
          dataKeys: data.data ? Object.keys(data.data) : [],
          dataStructure: data.data
        });
      }
      
      if (data.success && data.data) {
        // Handle new standardized response format
        const responseData = data.data;
        
        if (responseData.items && Array.isArray(responseData.items)) {
          // New paginated response format
          console.log(`✅ [API] [${requestId}] Using paginated response format with`, responseData.items.length, 'items');
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
          console.log('✅ [API] Using legacy array format with', responseData.length, 'items');
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
        } else {
          console.warn('⚠️ [API] Unexpected response data structure:', responseData);
        }
      } else {
        console.warn('⚠️ [API] Response not successful or missing data:', {
          success: data.success,
          hasData: !!data.data,
          message: data.message
        });
      }
      
      // Fallback to default options
      console.log('🔄 [API] Using fallback stock options');
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
      // Handle AbortError specifically
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn(`⏰ [API] [${requestId}] Request timed out after ${this.TIMEOUT_MS/1000}s - using fallback data:`, {
          url: `${this.baseUrl}/stock-symbols?${new URLSearchParams({ exchange, page: page.toString(), limit: limit.toString() })}`,
          options: { exchange, page, limit, search }
        });
        // Don't log this as an error since timeout is expected with slow APIs
      } else {
        console.error(`❌ [API] [${requestId}] Error fetching available stocks:`, error);
        console.error(`❌ [API] [${requestId}] Error details:`, { 
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          stack: error instanceof Error ? error.stack : undefined,
          url: `${this.baseUrl}/stock-symbols?${new URLSearchParams({ exchange, page: page.toString(), limit: limit.toString() })}`,
          options: { exchange, page, limit, search }
        });
      }
      
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
    // Reduced limit to prevent timeouts - use pagination if more data is needed
    const result = await this.getAvailableStocks({ exchange, limit: 200 });
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
    if (!isString(query) || query.trim().length < 2) {
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
      const availableStocks = this.getDefaultStockOptions();
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
   * Health check for API connectivity (detailed version)
   */
  async healthCheckDetailed(): Promise<{ status: 'ok' | 'error'; message: string; timestamp: number }> {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return {
          status: 'ok',
          message: data.message || 'API is healthy',
          timestamp: Date.now()
        };
      } else {
        return {
          status: 'error',
          message: `API health check failed: ${response.status} ${response.statusText}`,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown health check error';
      return {
        status: 'error',
        message: `API health check failed: ${message}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Health check for API connectivity (simple boolean version for tests)
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10);

      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Health check failed:', new Error(`HTTP ${response.status}`));
        return false;
      }

      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

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

  /**
   * Generate WebSocket URL for Finnhub
   */
  getWebSocketUrl(): string {
    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Finnhub API key not configured');
    }
    return `wss://ws.finnhub.io?token=${apiKey}`;
  }

  /**
   * Create WebSocket subscription message
   */
  createSubscriptionMessage(symbol: string): string {
    return JSON.stringify({
      type: 'subscribe',
      symbol: symbol.toUpperCase()
    });
  }

  /**
   * Create WebSocket unsubscription message
   */
  createUnsubscriptionMessage(symbol: string): string {
    return JSON.stringify({
      type: 'unsubscribe',
      symbol: symbol.toUpperCase()
    });
  }

  /**
   * Parse WebSocket trade message
   */
  parseTradeMessage(message: string | object | null | undefined): { symbol: string; price: number; timestamp: number } | null {
    try {
      if (message === null || message === undefined) {
        return null;
      }
      
      let data;
      if (typeof message === 'string') {
        data = JSON.parse(message);
      } else {
        data = message;
      }
      
      if (data.type === 'trade' && data.data && data.data.length > 0) {
        const trade = data.data[0];
        
        // Check if all required fields are present
        if (!trade.s || typeof trade.p !== 'number' || typeof trade.t !== 'number') {
          return null;
        }
        
        return {
          symbol: trade.s,
          price: trade.p,
          timestamp: trade.t
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to parse trade message:', error);
      return null;
    }
  }
}

/**
 * Export singleton instance
 */
export const stockService = StockService.getInstance();

