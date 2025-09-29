import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔌 WebSocket proxy endpoint called');

  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols');

  console.log('📊 Requested symbols:', symbols);

  if (!symbols) {
    console.error('❌ Symbols parameter required');
    return new Response(
      JSON.stringify({
        type: 'error',
        message: 'Symbols parameter required',
        code: 'MISSING_SYMBOLS',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    );
  }

  const symbolList = symbols.split(',');
  console.log('📈 Processing symbols:', symbolList);

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Add overall timeout to prevent hanging
      const overallTimeout = setTimeout(() => {
        console.error('❌ WebSocket proxy timeout - closing connection');
        sendEvent({
          type: 'error',
          message: 'Connection timeout - please try again',
          code: 'CONNECTION_TIMEOUT',
        });
        controller.close();
      }, 30000); // 30 second overall timeout

      // Send initial connection message
      const sendEvent = (data: Record<string, unknown>) => {
        try {
          const eventData = `data: ${JSON.stringify(data)}\n\n`;
          console.log('📤 Sending SSE event:', data.type, data.message);
          controller.enqueue(encoder.encode(eventData));
        } catch (error) {
          console.error('❌ Error sending stream event:', error);
          // Try to send error event instead
          try {
            const errorData = `data: ${JSON.stringify({
              type: 'error',
              message: 'Failed to send event data',
              code: 'SSE_SEND_ERROR',
            })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
          } catch (secondaryError) {
            console.error('❌ Secondary error in sendEvent:', secondaryError);
            controller.close();
          }
        }
      };

      // Send initial connection message with error handling
      try {
        sendEvent({
          type: 'connected',
          message:
            'WebSocket proxy connected - Using reliable Finnhub REST API',
          symbols: symbolList,
        });
      } catch (error) {
        console.error('❌ Failed to send initial connection message:', error);
        controller.close();
        return;
      }

      // Mock data fallback function
      const startMockData = () => {
        console.log('📡 Starting mock data mode as fallback');
        sendEvent({
          type: 'connected',
          message: 'Using mock data (Finnhub API unavailable)',
          symbols: symbolList,
        });

        // Send mock trade data every 5 seconds
        const mockInterval = setInterval(() => {
          try {
            symbolList.forEach((symbol, index) => {
              const basePrice = 100 + index * 50; // Different base prices for different symbols
              const mockPrice = basePrice + (Math.random() - 0.5) * 10; // ±5 price variation
              sendEvent({
                type: 'trade',
                data: {
                  symbol: symbol,
                  price: Math.round(mockPrice * 100) / 100, // Round to 2 decimal places
                  timestamp: Date.now(),
                  volume: Math.floor(Math.random() * 1000) + 100,
                },
              });
            });
          } catch (error) {
            console.error('❌ Error sending mock data:', error);
            clearInterval(mockInterval);
          }
        }, 5000);
      };

      // Use reliable Finnhub REST API instead of WebSocket
      const apiKey =
        process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
      let updateInterval: NodeJS.Timeout | null = null;

      if (!apiKey) {
        console.log('❌ No API key found - using mock data');
        startMockData();
        return;
      }

      console.log('🔗 Using reliable Finnhub REST API for real-time data');

      // Function to fetch real quote data from Finnhub REST API
      const fetchRealQuoteData = async (symbol: string) => {
        try {
          const response = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`,
            {
              headers: {
                'X-Finnhub-Token': apiKey,
                'User-Agent': 'StockPulse/1.0',
              },
              signal: AbortSignal.timeout(10000), // 10 second timeout
            }
          );

          if (!response.ok) {
            console.error(
              `❌ Failed to fetch quote for ${symbol}:`,
              response.status,
              response.statusText
            );
            return null;
          }

          const data = await response.json();

          // Check if we have valid data
          if (data.c === null || data.c === undefined) {
            console.warn(`⚠️ No valid quote data for ${symbol}`);
            return null;
          }

          return {
            symbol: symbol,
            price: data.c,
            change: data.d || 0,
            percentChange: data.dp || 0,
            high: data.h || data.c,
            low: data.l || data.c,
            open: data.o || data.c,
            previousClose: data.pc || data.c,
            timestamp: Date.now(),
            volume: data.v || 0,
          };
        } catch (error) {
          console.error(`❌ Error fetching quote for ${symbol}:`, error);
          return null;
        }
      };

      // Function to update all symbols with real data
      const updateAllSymbols = async () => {
        try {
          console.log('📊 Fetching real-time data for all symbols...');

          // Fetch all symbols concurrently
          const quotePromises = symbolList.map(symbol =>
            fetchRealQuoteData(symbol)
          );
          const results = await Promise.all(quotePromises);

          // Send updates for all successful results
          results.forEach((quoteData, index) => {
            if (quoteData) {
              console.log(
                `💰 Real-time update: ${quoteData.symbol} = $${quoteData.price}`
              );
              sendEvent({
                type: 'trade',
                data: {
                  symbol: quoteData.symbol,
                  price: quoteData.price,
                  timestamp: quoteData.timestamp,
                  volume: quoteData.volume,
                  change: quoteData.change,
                  percentChange: quoteData.percentChange,
                },
              });
            } else {
              console.warn(`⚠️ No data available for ${symbolList[index]}`);
            }
          });
        } catch (error) {
          console.error('❌ Error updating symbols:', error);
        }
      };

      // Start real-time updates using REST API
      updateInterval = setInterval(updateAllSymbols, 5000); // Update every 5 seconds

      // Initial update
      updateAllSymbols();

      // Cleanup function
      const cleanup = () => {
        clearTimeout(overallTimeout);
        if (updateInterval) clearInterval(updateInterval);
      };

      // Handle client disconnect
      const originalClose = controller.close;
      controller.close = () => {
        cleanup();
        originalClose.call(controller);
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
