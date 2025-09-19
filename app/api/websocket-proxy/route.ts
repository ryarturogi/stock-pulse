import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔌 WebSocket proxy endpoint called');
  
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols');
  
  console.log('📊 Requested symbols:', symbols);
  
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.error('❌ API key not configured');
    return new Response('API key not configured', { status: 500 });
  }

  if (!symbols) {
    console.error('❌ Symbols parameter required');
    return new Response('Symbols parameter required', { status: 400 });
  }

  const symbolList = symbols.split(',');
  console.log('📈 Processing symbols:', symbolList);

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial connection message
      const sendEvent = (data: any) => {
        try {
          const eventData = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(eventData));
        } catch (error) {
          console.error('❌ Error sending stream event:', error);
        }
      };

      sendEvent({ 
        type: 'connected', 
        message: 'Secure WebSocket proxy connected - Using real Finnhub data', 
        symbols: symbolList 
      });

      // Connect to Finnhub WebSocket
      let webSocket: WebSocket | null = null;
      let reconnectTimeout: NodeJS.Timeout | null = null;
      let isConnected = false;

      const connectToFinnhub = () => {
        try {
          const wsUrl = `wss://ws.finnhub.io?token=${apiKey}`;
          console.log('🔗 Connecting to Finnhub WebSocket:', wsUrl.replace(apiKey, '***'));

          webSocket = new WebSocket(wsUrl);

          webSocket.onopen = () => {
            console.log('✅ Connected to Finnhub WebSocket');
            isConnected = true;
            
            // Subscribe to all symbols
            symbolList.forEach(symbol => {
              const subscribeMessage = {
                type: 'subscribe',
                symbol: symbol
              };
              console.log(`📡 Subscribing to ${symbol}`);
              webSocket?.send(JSON.stringify(subscribeMessage));
            });
          };

          webSocket.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              console.log('📨 Finnhub WebSocket message:', data);

              if (data.type === 'trade' && data.data) {
                const trade = data.data;
                if (trade.s && trade.p) {
                  console.log(`💰 Real-time trade: ${trade.s} = $${trade.p}`);
                  
                  // Forward trade data to client
                  sendEvent({
                    type: 'trade',
                    data: {
                      symbol: trade.s,
                      price: trade.p,
                      timestamp: trade.t * 1000, // Convert to milliseconds
                      volume: trade.v || 0
                    }
                  });
                }
              }
            } catch (error) {
              console.error('Failed to parse Finnhub WebSocket message:', error);
            }
          };

          webSocket.onerror = (error) => {
            console.error('❌ Finnhub WebSocket error:', error);
            isConnected = false;
          };

          webSocket.onclose = (event) => {
            console.log('❌ Finnhub WebSocket closed:', event.code, event.reason);
            isConnected = false;
            
            // Attempt to reconnect after 5 seconds
            if (reconnectTimeout) {
              clearTimeout(reconnectTimeout);
            }
            reconnectTimeout = setTimeout(() => {
              console.log('🔄 Attempting to reconnect to Finnhub WebSocket...');
              connectToFinnhub();
            }, 5000);
          };

        } catch (error) {
          console.error('Failed to create Finnhub WebSocket connection:', error);
          sendEvent({ type: 'error', message: 'Failed to connect to Finnhub WebSocket' });
        }
      };

      // Start connection
      connectToFinnhub();

      // Clean up on close
      const cleanup = () => {
        if (webSocket) {
          webSocket.close();
        }
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
        controller.close();
      };

      // Handle client disconnect
      request.signal.addEventListener('abort', cleanup);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}