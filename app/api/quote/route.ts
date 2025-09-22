import { NextRequest } from 'next/server';

import { 
  createSuccessResponse, 
  createErrorResponse, 
  handleApiError, 
  validateApiKey, 
  validateRequiredParam 
} from '@/core/utils/apiResponse';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    
    // Validate required parameters
    const paramError = validateRequiredParam(symbol, 'symbol');
    if (paramError) return paramError;

    // Validate API key
    const apiKey = process.env.FINNHUB_API_KEY;
    const keyError = validateApiKey(apiKey, 'Finnhub');
    if (keyError) return keyError;

    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
      {
        headers: {
          'X-Finnhub-Token': apiKey!,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Debug logging (can be removed in production)
    console.debug('Finnhub response for', symbol, ':', data);
    
    // Check if we have valid data from Finnhub
    if (data.c === null || data.c === undefined) {
      return createErrorResponse(
        'No valid quote data available for this symbol',
        404,
        'Symbol not found or market data unavailable'
      );
    }
    
    const quoteData = {
      symbol: symbol!,
      current: data.c,
      change: data.d || 0,
      percentChange: data.dp || 0,
      high: data.h || data.c,
      low: data.l || data.c,
      open: data.o || data.c,
      previousClose: data.pc || data.c,
      timestamp: Date.now()
    };
    
    return createSuccessResponse(
      quoteData,
      `Quote data retrieved for ${symbol}`
    );
    
  } catch (error) {
    return handleApiError(error, 'quote API');
  }
}