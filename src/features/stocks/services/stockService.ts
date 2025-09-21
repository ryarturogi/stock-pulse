/**
 * Stock Service for API Integration
 * =================================
 * 
 * Service layer for handling stock data API calls and WebSocket connections
 * following the React Developer test requirements with Finnhub integration.
 */

import type {
  FinnhubStockQuote,
  StockOption
} from '@/core/types';
import { 
  isFinnhubStockQuote,
  isString,
  isNumber
} from '@/core/types';

/**
 * Stock API service class
 */
export class StockService {
  private static instance: StockService;
  private baseUrl: string;
  private apiKey: string;
  // Request deduplication cache
  private requestCache = new Map<string, Promise<any>>();
  private cacheTimeout = 2000; // 2 seconds cache for deduplication

  private constructor() {
    this.baseUrl = '/api';
    this.apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || '';
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
      console.log(`📦 Using cached request for ${symbol}`);
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
      const response = await fetch(`${this.baseUrl}/quote?symbol=${symbol}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle both response formats: direct data or wrapped in success/data
      let quoteData;
      if (data.data && data.success) {
        // Wrapped format
        quoteData = data.data;
      } else if (data.symbol && data.current !== undefined) {
        // Direct format
        quoteData = data;
      } else {
        throw new Error(data.error || 'Failed to fetch stock quote');
      }

      // Validate the quote data
      if (!isFinnhubStockQuote(quoteData)) {
        throw new Error('Invalid quote data received from API');
      }

      return quoteData;

    } catch (error) {
      console.error(`Failed to fetch quote for ${symbol}:`, error);
      
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
          console.error(`Failed to fetch quote for ${symbol}:`, error);
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
   * Get available stock options (for dropdown)
   */
  async getAvailableStocks(): Promise<StockOption[]> {
    try {
      // For now, return the default stock options
      // In a real app, this could fetch from an API
      return [
        { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
        { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ' },
        { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
        { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ' },
      ];
    } catch (error) {
      console.error('Failed to fetch available stocks:', error);
      throw new Error('Failed to fetch available stocks');
    }
  }

  /**
   * Search for stocks by symbol or name
   */
  async searchStocks(query: string): Promise<StockOption[]> {
    if (!isString(query) || query.trim().length < 2) {
      return [];
    }

    try {
      const availableStocks = await this.getAvailableStocks();
      const searchTerm = query.toLowerCase().trim();

      return availableStocks.filter(stock => 
        stock.symbol.toLowerCase().includes(searchTerm) ||
        stock.name.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Failed to search stocks:', error);
      return [];
    }
  }

  /**
   * Validate stock symbol format
   */
  validateSymbol(symbol: string): boolean {
    if (!isString(symbol)) return false;
    
    const trimmed = symbol.trim().toUpperCase();
    
    // Basic validation: 1-5 characters, letters only
    return /^[A-Z]{1,5}$/.test(trimmed);
  }

  /**
   * Validate alert price
   */
  validateAlertPrice(price: number | string): boolean {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    return isNumber(numPrice) && numPrice > 0 && numPrice < 1000000;
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

  /**
   * Get WebSocket connection URL
   */
  getWebSocketUrl(): string {
    if (!this.apiKey) {
      throw new Error('Finnhub API key not configured');
    }

    return `wss://ws.finnhub.io?token=${this.apiKey}`;
  }

  /**
   * Create WebSocket subscription message
   */
  createSubscriptionMessage(symbol: string): string {
    return JSON.stringify({
      type: 'subscribe',
      symbol: symbol.toUpperCase(),
    });
  }

  /**
   * Create WebSocket unsubscription message
   */
  createUnsubscriptionMessage(symbol: string): string {
    return JSON.stringify({
      type: 'unsubscribe',
      symbol: symbol.toUpperCase(),
    });
  }

  /**
   * Parse WebSocket trade message
   */
  parseTradeMessage(data: any): { symbol: string; price: number; timestamp: number } | null {
    try {
      if (data.type === 'trade' && data.data && Array.isArray(data.data)) {
        const trade = data.data[0]; // Get first trade
        if (trade && trade.s && trade.p && trade.t) {
          return {
            symbol: trade.s,
            price: trade.p,
            timestamp: trade.t,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to parse trade message:', error);
      return null;
    }
  }

  /**
   * Fetch historical data for a stock symbol
   */
  async fetchHistoricalData(
    symbol: string, 
    resolution: string = '1', 
    from: number, 
    to: number
  ): Promise<{ time: number; price: number; open: number; high: number; low: number; volume: number }[]> {
    try {
      const params = new URLSearchParams({
        symbol: symbol.toUpperCase(),
        resolution,
        from: from.toString(),
        to: to.toString(),
      });

      const response = await fetch(`/api/historical?${params}`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Historical data API error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Failed to fetch historical data: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.message === 'No historical data available for this symbol/range' || 
          data.message === 'Historical data not available on free tier') {
        console.log(`⚠️ No historical data available for ${symbol}: ${data.message}`);
        return [];
      }
      
      return data.data || [];
    } catch (error) {
      console.error(`Failed to fetch historical data for ${symbol}:`, error);
      throw new Error(`Failed to fetch historical data for ${symbol}`);
    }
  }

  /**
   * Health check for API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Clear request cache manually
   */
  clearRequestCache(): void {
    console.log(`🧹 Clearing ${this.requestCache.size} cached requests`);
    this.requestCache.clear();
  }

  /**
   * Get cache statistics
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

