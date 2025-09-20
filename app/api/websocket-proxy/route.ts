import { NextRequest } from 'next/server';

// Global connection pool to prevent duplicate connections
const activeConnections = new Map<string, any>();
const connectionCooldowns = new Map<string, number>();

export async function GET(request: NextRequest) {
  console.log('🔌 WebSocket proxy endpoint called');
  
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols');
  
  console.log('📊 Requested symbols:', symbols);
  
  // Create a connection key based on symbols to prevent duplicates
  const connectionKey = symbols || 'default';
  
  // Check if we already have an active connection for these symbols
  if (activeConnections.has(connectionKey)) {
    console.log('⚠️ Duplicate connection attempt blocked for symbols:', symbols);
    return new Response('Connection already exists for these symbols', { status: 409 });
  }
  
  // Check cooldown period to prevent rapid reconnections
  const cooldownTime = connectionCooldowns.get(connectionKey);
  if (cooldownTime && Date.now() < cooldownTime) {
    const remainingTime = Math.ceil((cooldownTime - Date.now()) / 1000);
    console.log(`⏰ Connection cooldown active for symbols: ${symbols}. ${remainingTime}s remaining.`);
    return new Response(`Connection cooldown active. Try again in ${remainingTime} seconds.`, { status: 429 });
  }
  
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
      let reconnectAttempts = 0;
      const maxReconnectAttempts = 5;

      const connectToFinnhub = () => {
        try {
          const wsUrl = `wss://ws.finnhub.io?token=${apiKey}`;
          console.log('🔗 Connecting to Finnhub WebSocket:', wsUrl.replace(apiKey, '***'));

          webSocket = new WebSocket(wsUrl);

          webSocket.onopen = () => {
            console.log('✅ Connected to Finnhub WebSocket');
            reconnectAttempts = 0; // Reset attempts on successful connection
            
            // Subscribe to all symbols with rate limiting
            symbolList.forEach((symbol, index) => {
              const subscribeMessage = {
                type: 'subscribe',
                symbol: symbol
              };
              console.log(`📡 Subscribing to ${symbol}`);
              
              // Add delay between subscriptions to avoid rate limiting
              setTimeout(() => {
                if (webSocket && webSocket.readyState === WebSocket.OPEN) {
                  webSocket.send(JSON.stringify(subscribeMessage));
                }
              }, index * 100); // 100ms delay between each subscription
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
          };

          webSocket.onclose = (event) => {
            console.log('❌ Finnhub WebSocket closed:', event.code, event.reason);
            
            // Don't reconnect if we've exceeded max attempts or if it's likely rate limited
            if (reconnectAttempts >= maxReconnectAttempts || event.code === 1002 || event.code === 1006) {
              console.log(`❌ Max reconnection attempts reached (${reconnectAttempts}/${maxReconnectAttempts}) or rate limited (code: ${event.code}). Stopping reconnection.`);
              // Remove from active connections and set cooldown
              activeConnections.delete(connectionKey);
              // Set 10 minute cooldown for rate limited connections
              connectionCooldowns.set(connectionKey, Date.now() + 600000);
              return;
            }
            
            reconnectAttempts++;
            
            // Longer exponential backoff for rate limiting: 5s, 15s, 45s, 90s, 180s
            const backoffDelay = Math.min(Math.pow(3, reconnectAttempts) * 5000, 300000); // Cap at 5 minutes
            
            if (reconnectTimeout) {
              clearTimeout(reconnectTimeout);
            }
            reconnectTimeout = setTimeout(() => {
              console.log(`🔄 Attempting to reconnect to Finnhub WebSocket... (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
              connectToFinnhub();
            }, backoffDelay);
          };

        } catch (error) {
          console.error('Failed to create Finnhub WebSocket connection:', error);
          sendEvent({ type: 'error', message: 'Failed to connect to Finnhub WebSocket' });
        }
      };

      // Start connection
      connectToFinnhub();

      // Register this connection
      activeConnections.set(connectionKey, { webSocket, symbols: symbolList });
      
      // Clean up on close
      const cleanup = () => {
        console.log(`🧹 Cleaning up connection for symbols: ${symbols}`);
        if (webSocket) {
          webSocket.close();
        }
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
        // Remove from active connections
        activeConnections.delete(connectionKey);
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