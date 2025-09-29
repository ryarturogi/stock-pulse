/**
 * WebSocket Test Endpoint
 * For debugging WebSocket proxy issues
 */

import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    
    return Response.json({
      success: true,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      timestamp: Date.now(),
      url: request.url,
      headers: {
        'content-type': request.headers.get('content-type'),
        'user-agent': request.headers.get('user-agent'),
        'accept': request.headers.get('accept')
      }
    });
    
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    }, { status: 500 });
  }
}