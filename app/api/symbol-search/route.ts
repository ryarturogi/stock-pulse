/**
 * Symbol Search API Route
 * ======================
 * 
 * Searches for stock symbols using Finnhub API
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSearchQuery, sanitizeHtml } from '@/core/utils/validation';

interface FinnhubSearchResult {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}

interface FinnhubSearchResponse {
  count: number;
  result: FinnhubSearchResult[];
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    
    if (!query || query.trim().length < 1) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Validate search query using enhanced validation
    const queryValidation = validateSearchQuery(query);
    if (!queryValidation.isValid) {
      return NextResponse.json(
        { error: queryValidation.error },
        { status: 400 }
      );
    }

    // Sanitize query to prevent XSS and injection attacks
    const sanitizedQuery = sanitizeHtml(query.trim());

    const response = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(sanitizedQuery)}&token=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'StockPulse/1.0',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    if (!response.ok) {
      // Don't expose internal error details
      const errorMessage = response.status === 401 
        ? 'API authentication failed' 
        : response.status === 429 
        ? 'Rate limit exceeded' 
        : 'External API error';
      
      if (process.env.NODE_ENV === 'development') {
        console.error('Finnhub search API error:', response.status, errorMessage);
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const searchResponse: FinnhubSearchResponse = await response.json();
    
    // Transform to our format and deduplicate by symbol
    const stockOptions = searchResponse.result
      .filter(item => 
        item.type === 'Common Stock' && 
        item.symbol && 
        !item.symbol.includes('.')
      )
      .reduce((acc, item) => {
        // Check if we already have this symbol
        const existingIndex = acc.findIndex(stock => stock.symbol === item.symbol);
        if (existingIndex === -1) {
          // Add new stock
          acc.push({
            symbol: item.symbol,
            name: item.description || item.displaySymbol,
            exchange: 'US',
            type: 'stock' as const
          });
        } else {
          // Update existing stock with better description if available
          const existing = acc[existingIndex];
          if (item.description && item.description.length > existing.name.length) {
            existing.name = item.description;
          }
        }
        return acc;
      }, [] as Array<{
        symbol: string;
        name: string;
        exchange: string;
        type: 'stock';
      }>)
      .slice(0, 50); // Limit results

    return NextResponse.json({
      success: true,
      data: stockOptions,
      count: stockOptions.length,
      query: query
    });

  } catch (error) {
    console.error('Symbol search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search symbols' },
      { status: 500 }
    );
  }
}