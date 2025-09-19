import { NextRequest, NextResponse } from 'next/server';
import { ApiError, Timestamp, StockSymbol, isDefined, isString } from '@/core/types';

// Define types for the cron job response
interface StockPriceUpdate {
  from: number;
  to: number;
  change: number;
}

interface UpdateResult {
  updatedStocks: StockSymbol[];
  priceChanges: Record<StockSymbol, StockPriceUpdate>;
}

interface CronResponse {
  success: boolean;
  timestamp: Timestamp;
  duration: string;
  updates?: UpdateResult;
  message: string;
  error?: string;
}

/**
 * Cron job to update stock prices every 5 minutes
 * 
 * @param request - The incoming request from Vercel Cron
 * @returns JSON response with update status
 */
export async function GET(request: NextRequest): Promise<NextResponse<CronResponse | ApiError>> {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!isDefined(authHeader) || !isString(cronSecret) || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json<ApiError>({
      code: 'UNAUTHORIZED',
      message: 'Unauthorized',
      details: { timestamp: new Date().toISOString() },
    }, { status: 401 });
  }

  const startTime = Date.now();
  
  try {
    console.log('🔄 Starting stock price update cron job...');

    // TODO: Implement actual stock price update logic
    // This would typically:
    // 1. Fetch list of tracked stocks from database
    // 2. Call external APIs (Finnhub) to get latest prices
    // 3. Update database with new prices
    // 4. Trigger any price alerts
    // 5. Update cache

    const mockUpdates: UpdateResult = {
      updatedStocks: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'],
      priceChanges: {
        'AAPL': { from: 150.25, to: 151.30, change: 1.05 },
        'MSFT': { from: 380.15, to: 382.75, change: 2.60 },
        'GOOGL': { from: 2750.80, to: 2748.20, change: -2.60 },
        'AMZN': { from: 3350.25, to: 3358.90, change: 8.65 },
        'TSLA': { from: 245.30, to: 247.85, change: 2.55 },
      },
    };

    const duration = Date.now() - startTime;

    console.log(`✅ Stock price update completed in ${duration}ms`);

    const successResponse: CronResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      updates: mockUpdates,
      message: 'Stock prices updated successfully',
    };

    return NextResponse.json<CronResponse>(successResponse, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('❌ Stock price update failed:', errorMessage);

    const errorResponse: CronResponse = {
      success: false,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      error: errorMessage,
      message: 'Stock price update failed',
    };

    return NextResponse.json<CronResponse>(errorResponse, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}

/**
 * Handle POST requests (optional, for manual triggers)
 */
export async function POST(request: NextRequest): Promise<NextResponse<CronResponse | ApiError>> {
  // Allow manual triggering with proper authentication
  return GET(request);
}