import { NextRequest } from 'next/server';

import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  validateApiKey,
  validateRequiredParam,
} from '@/core/utils/apiResponse';
import { isValidSymbol } from '@/core/utils/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    // Validate required parameters
    const paramError = validateRequiredParam(symbol, 'symbol');
    if (paramError) return paramError;

    // Validate symbol format to prevent injection attacks
    if (!isValidSymbol(symbol!)) {
      return createErrorResponse(
        'Invalid symbol format',
        400,
        'Symbol must be 1-10 characters, letters and numbers only'
      );
    }

    // Validate API key
    const apiKey = process.env.FINNHUB_API_KEY;
    const keyError = validateApiKey(apiKey, 'Finnhub');
    if (keyError) return keyError;

    // Sanitize symbol for URL encoding
    const sanitizedSymbol = encodeURIComponent(symbol!);

    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${sanitizedSymbol}&token=${apiKey}`,
      {
        headers: {
          'X-Finnhub-Token': apiKey!,
          'User-Agent': 'StockPulse/1.0',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    if (!response.ok) {
      // Don't expose internal error details
      const errorMessage =
        response.status === 401
          ? 'API authentication failed'
          : response.status === 429
            ? 'Rate limit exceeded'
            : 'External API error';
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Remove debug logging in production
    if (process.env.NODE_ENV === 'development') {
      console.debug('Finnhub response for', symbol, ':', data);
    }

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
      timestamp: Date.now(),
    };

    return createSuccessResponse(
      quoteData,
      `Quote data retrieved for ${symbol}`
    );
  } catch (error) {
    return handleApiError(error, 'quote API');
  }
}
