import { NextRequest } from 'next/server';

// Global connection pool to prevent duplicate connections
const activeConnections = new Map<string, { webSocket: WebSocket | null; symbols: string[] }>();
const connectionCooldowns = new Map<string, number>();
const circuitBreaker = new Map<string, { failures: number; lastFailure: number; state: 'closed' | 'open' | 'half-open' }>();

// Emergency rate limiting - much more aggressive
const globalRateLimit = { 
  lastAttempt: 0, 
  attempts: 0,
  blocked: false,
  blockUntil: 0
};

export async function GET(request: NextRequest) {
  console.log('🔌 WebSocket proxy endpoint called');
  
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols');
  
  console.log('📊 Requested symbols:', symbols);
  
  // Create a connection key based on symbols to prevent duplicates
  const connectionKey = symbols || 'default';
  
  // EMERGENCY: Ultra-aggressive rate limiting
  const now = Date.now();
  
  // If we're in a global block period, reject all connections
  if (globalRateLimit.blocked && now < globalRateLimit.blockUntil) {
    const remainingTime = Math.ceil((globalRateLimit.blockUntil - now) / 1000);
    console.log(`🚫 EMERGENCY BLOCK: All connections blocked for ${remainingTime}s`);
    return new Response(JSON.stringify({
      type: 'error',
      message: `Emergency rate limit block active. Try again in ${remainingTime} seconds.`,
      code: 'EMERGENCY_BLOCK',
      remainingTime: remainingTime
    }), { 
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
  
  // Reset block if time has passed
  if (globalRateLimit.blocked && now >= globalRateLimit.blockUntil) {
    globalRateLimit.blocked = false;
    globalRateLimit.attempts = 0;
    console.log('🔄 Emergency block period ended, resetting rate limiter');
  }
  
  // Reset attempt counter if more than 5 minutes have passed since last attempt
  if (now - globalRateLimit.lastAttempt > 5 * 60 * 1000) {
    globalRateLimit.attempts = 0;
    console.log('🔄 Resetting rate limit counter due to time gap');
  }
  
  // Track attempts and block if too many
  globalRateLimit.attempts++;
  globalRateLimit.lastAttempt = now;
  
  // If more than 20 attempts in the last 5 minutes, block for 1 minute (less aggressive)
  if (globalRateLimit.attempts > 20) {
    globalRateLimit.blocked = true;
    globalRateLimit.blockUntil = now + (1 * 60 * 1000); // 1 minute
    console.log('🚫 Rate limit: Too many attempts, blocking connections for 1 minute');
    return new Response(JSON.stringify({
      type: 'error',
      message: 'Connection rate limited. Try again in 1 minute.',
      code: 'RATE_LIMITED',
      remainingTime: 60
    }), { 
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
  
  // Check if we already have an active connection for these symbols
  if (activeConnections.has(connectionKey)) {
    console.log('⚠️ Duplicate connection attempt blocked for symbols:', symbols);
    return new Response(JSON.stringify({
      type: 'error',
      message: 'Connection already exists for these symbols',
      code: 'DUPLICATE_CONNECTION',
      symbols: symbols
    }), { 
      status: 409,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
  
  // Check circuit breaker state
  const breaker = circuitBreaker.get(connectionKey);
  if (breaker && breaker.state === 'open') {
    const timeSinceLastFailure = Date.now() - breaker.lastFailure;
    const resetTimeout = 5 * 60 * 1000; // 5 minutes - more reasonable
    
    if (timeSinceLastFailure < resetTimeout) {
      const remainingTime = Math.ceil((resetTimeout - timeSinceLastFailure) / 1000);
      console.log(`🚫 Circuit breaker open for symbols: ${symbols}. ${remainingTime}s remaining.`);
      return new Response(JSON.stringify({
        type: 'error',
        message: `Circuit breaker open due to repeated failures. Try again in ${remainingTime} seconds.`,
        code: 'CIRCUIT_BREAKER_OPEN',
        remainingTime: remainingTime,
        symbols: symbols
      }), { 
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    } else {
      // Reset circuit breaker to half-open
      breaker.state = 'half-open';
      breaker.failures = 0;
    }
  }

  // Check cooldown period to prevent rapid reconnections
  const cooldownTime = connectionCooldowns.get(connectionKey);
  if (cooldownTime && Date.now() < cooldownTime) {
    const remainingTime = Math.ceil((cooldownTime - Date.now()) / 1000);
    console.log(`⏰ EMERGENCY: Connection cooldown active for symbols: ${symbols}. ${remainingTime}s remaining.`);
    return new Response(JSON.stringify({
      type: 'error',
      message: `Connection cooldown active. Try again in ${remainingTime} seconds.`,
      code: 'COOLDOWN_ACTIVE',
      remainingTime: remainingTime,
      symbols: symbols
    }), { 
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
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
      const sendEvent = (data: Record<string, unknown>) => {
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
            
            // Reset circuit breaker on successful connection
            const breaker = circuitBreaker.get(connectionKey);
            if (breaker) {
              breaker.failures = 0;
              breaker.state = 'closed';
              circuitBreaker.set(connectionKey, breaker);
            }
            
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
            
            // Track circuit breaker failures
            const breaker = circuitBreaker.get(connectionKey) || { failures: 0, lastFailure: 0, state: 'closed' as const };
            breaker.failures++;
            breaker.lastFailure = Date.now();
            
            // Check if this is a rate limiting error (429)
            if (error && typeof error === 'object' && 'message' in error && 
                typeof error.message === 'string' && error.message.includes('429')) {
              console.log('🚫 Rate limited by Finnhub API, setting longer cooldown');
              // Set reasonable cooldown for rate limiting
              const cooldownMs = 30000; // 30 seconds for rate limiting
              connectionCooldowns.set(connectionKey, Date.now() + cooldownMs);
              
              // Open circuit breaker after 3 failures
              if (breaker.failures >= 3) {
                breaker.state = 'open';
                console.log(`🚫 Circuit breaker opened for symbols: ${symbols} after ${breaker.failures} failures`);
              }
            }
            
            circuitBreaker.set(connectionKey, breaker);
          };

          webSocket.onclose = (event) => {
            console.log('❌ Finnhub WebSocket closed:', event.code, event.reason);
            
            // Check for rate limiting (429) or other permanent errors
            const isRateLimited = event.code === 1002 || event.code === 1006 || event.reason?.includes('429');
            const isPermanentError = event.code === 1002 || event.code === 1003 || event.code === 1007;
            
            // Don't reconnect if we've exceeded max attempts or if it's likely rate limited
            if (reconnectAttempts >= maxReconnectAttempts || isPermanentError) {
              console.log(`❌ Max reconnection attempts reached (${reconnectAttempts}/${maxReconnectAttempts}) or permanent error (code: ${event.code}). Stopping reconnection.`);
              // Remove from active connections and set cooldown
              activeConnections.delete(connectionKey);
              // Set reasonable cooldown periods
              const isDevelopment = process.env.NODE_ENV === 'development';
              const cooldownMs = isRateLimited 
                ? (isDevelopment ? 15000 : 30000) // 15s dev, 30s prod for rate limits
                : (isDevelopment ? 5000 : 15000); // 5s dev, 15s prod for other errors
              connectionCooldowns.set(connectionKey, Date.now() + cooldownMs);
              return;
            }
            
            reconnectAttempts++;
            
            // Reasonable exponential backoff: 5s, 15s, 45s, 90s, 180s
            const baseDelay = isRateLimited ? 5000 : 3000;
            const backoffDelay = Math.min(Math.pow(3, reconnectAttempts) * baseDelay, 180000); // Cap at 3 minutes
            
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
        if (webSocket && webSocket.readyState === WebSocket.OPEN) {
          try {
            webSocket.close();
          } catch {
            console.log('⚠️ WebSocket already closed during cleanup');
          }
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