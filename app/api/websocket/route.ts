import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols');
  
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return new Response('API key not configured', { status: 500 });
  }

  // Return WebSocket connection info
  return Response.json({
    message: 'WebSocket endpoint ready',
    symbols: symbols ? symbols.split(',') : [],
    websocketUrl: `wss://ws.finnhub.io?token=${apiKey}`,
    status: 'ready'
  });
}