/**
 * Stock Symbols API Route
 * ======================
 * 
 * Fetches available stock symbols from Finnhub API
 */

import { NextRequest } from 'next/server';

import { DEFAULT_STOCK_OPTIONS } from '@/core/constants/constants';
import { createSuccessResponse, handleApiError } from '@/core/utils/apiResponse';
import { paginateArray, parsePaginationParams } from '@/core/utils/pagination';

interface FinnhubSymbol {
  symbol: string;
  displaySymbol: string;
  description: string;
  type: string;
  currency?: string;
  figi?: string;
}

// Convert DEFAULT_STOCK_OPTIONS to FinnhubSymbol format for fallback
const DEFAULT_SYMBOLS: FinnhubSymbol[] = DEFAULT_STOCK_OPTIONS.map(stock => ({
  symbol: stock.symbol,
  displaySymbol: stock.symbol,
  description: stock.name,
  type: 'Common Stock'
}));

async function fetchWithRetry(url: string, options: Record<string, any>, maxRetries = 2): Promise<Response> {
  let lastError: Error = new Error('Unknown error');
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      console.log(`Attempting to fetch Finnhub symbols (attempt ${attempt}/${maxRetries + 1})`);
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000 + (attempt * 5000)), // Increasing timeout per attempt
      });
      
      if (response.ok) {
        return response;
      }
      
      if (response.status >= 400 && response.status < 500) {
        // Client error, don't retry
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Server error, retry
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`Fetch attempt ${attempt} failed:`, lastError.message);
      
      if (attempt <= maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

function buildFallbackResponse(symbols: FinnhubSymbol[], page: number, limit: number, search: string, exchange: string) {
  // Filter and transform to our format
  let stockOptions = symbols
    .filter(symbol => 
      symbol.type === 'Common Stock' && 
      symbol.symbol && 
      !symbol.symbol.includes('.') &&
      symbol.symbol.length <= 5 // Valid stock symbols
    )
    .map(symbol => ({
      symbol: symbol.symbol,
      name: symbol.description || symbol.displaySymbol,
      exchange: exchange,
      type: 'stock' as const
    }));

  // Apply search filter if provided
  if (search) {
    const searchTerm = search.toLowerCase();
    stockOptions = stockOptions.filter(stock =>
      stock.symbol.toLowerCase().includes(searchTerm) ||
      stock.name.toLowerCase().includes(searchTerm)
    );
  }

  // Sort alphabetically by symbol
  stockOptions.sort((a, b) => a.symbol.localeCompare(b.symbol));

  // Apply pagination using shared utility
  const { paginatedItems, pagination } = paginateArray(stockOptions, page, limit);

  return createSuccessResponse({
    items: paginatedItems,
    pagination,
    search: search || null,
    fallback: true // Indicate this is fallback data
  }, 'Fallback stock symbols loaded');
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    
    if (!apiKey) {
      console.warn('Finnhub API key not configured, using fallback symbols');
      // Return fallback symbols when no API key
      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const search = searchParams.get('search') || '';
      
      return buildFallbackResponse(DEFAULT_SYMBOLS, page, limit, search, 'US');
    }

    const searchParams = request.nextUrl.searchParams;
    const exchange = searchParams.get('exchange') || 'US';
    const { page, limit } = parsePaginationParams(searchParams);
    const search = searchParams.get('search') || '';
    
    try {
      const response = await fetchWithRetry(
        `https://finnhub.io/api/v1/stock/symbol?exchange=${exchange}&token=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Finnhub-Token': apiKey,
          },
        }
      );

      const symbols: FinnhubSymbol[] = await response.json();
      
      if (!Array.isArray(symbols) || symbols.length === 0) {
        console.warn('Empty or invalid response from Finnhub, using fallback');
        return buildFallbackResponse(DEFAULT_SYMBOLS, page, limit, search, exchange);
      }
      
      // Filter and transform to our format
      let stockOptions = symbols
        .filter(symbol => 
          symbol.type === 'Common Stock' && 
          symbol.symbol && 
          !symbol.symbol.includes('.') &&
          symbol.symbol.length <= 5 // Valid stock symbols
        )
        .map(symbol => ({
          symbol: symbol.symbol,
          name: symbol.description || symbol.displaySymbol,
          exchange: exchange,
          type: 'stock' as const
        }));

      // Apply search filter if provided
      if (search) {
        const searchTerm = search.toLowerCase();
        stockOptions = stockOptions.filter(stock =>
          stock.symbol.toLowerCase().includes(searchTerm) ||
          stock.name.toLowerCase().includes(searchTerm)
        );
      }

      // Sort alphabetically by symbol
      stockOptions.sort((a, b) => a.symbol.localeCompare(b.symbol));

      // Apply pagination using shared utility
      const { paginatedItems, pagination } = paginateArray(stockOptions, page, limit);

      return createSuccessResponse({
        items: paginatedItems,
        pagination,
        search: search || null
      }, `Found ${stockOptions.length} stock symbols`);
      
    } catch (apiError) {
      console.error('Finnhub API failed, using fallback symbols:', apiError);
      return buildFallbackResponse(DEFAULT_SYMBOLS, page, limit, search, exchange);
    }

  } catch (error) {
    return handleApiError(error, 'stock-symbols API');
  }
}