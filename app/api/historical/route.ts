import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const resolution = searchParams.get('resolution') || '1'; // 1 minute default
  const from = searchParams.get('from'); // Unix timestamp
  const to = searchParams.get('to'); // Unix timestamp
  
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return new Response('API key not configured', { status: 500 });
  }

  if (!symbol || !from || !to) {
    return new Response('Missing required parameters: symbol, from, to', { status: 400 });
  }

  // Check if this is a free tier limitation
  console.log(`📊 Historical data request for ${symbol} - checking free tier limitations`);

  try {
    console.log(`📊 Fetching historical data for ${symbol} from ${new Date(parseInt(from) * 1000).toISOString()} to ${new Date(parseInt(to) * 1000).toISOString()}`);
    console.log(`🔑 Using API key: ${apiKey ? 'Present' : 'Missing'}`);
    
    const apiUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`;
    console.log(`🔗 API URL: ${apiUrl.replace(apiKey, '***')}`);
    
    const response = await fetch(apiUrl, { 
      headers: { 'X-Finnhub-Token': apiKey },
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to fetch historical data for ${symbol}:`, {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      
      // Handle 403 Forbidden - likely free tier limitation
      if (response.status === 403) {
        console.log(`⚠️ Historical data not available on free tier for ${symbol}`);
        return Response.json({
          symbol,
          resolution,
          from: parseInt(from),
          to: parseInt(to),
          data: [],
          count: 0,
          message: 'Historical data not available on free tier',
          error: 'Free tier limitation - upgrade required for historical data'
        });
      }
      
      return new Response(`Failed to fetch historical data: ${response.statusText} (${errorText})`, { status: response.status });
    }
    
    const data = await response.json();
    
    if (data.s !== 'ok') {
      console.error(`Finnhub API error for ${symbol}:`, data);
      
      // Handle specific error cases
      if (data.s === 'no_data') {
        console.log(`⚠️ No historical data available for ${symbol} in the requested range`);
        return Response.json({
          symbol,
          resolution,
          from: parseInt(from),
          to: parseInt(to),
          data: [],
          count: 0,
          message: 'No historical data available for this symbol/range'
        });
      }
      
      return new Response(`API error: ${data.s}`, { status: 400 });
    }
    
    // Transform Finnhub candlestick data to our format
    const historicalData = data.t.map((timestamp: number, index: number) => ({
      time: timestamp * 1000, // Convert to milliseconds
      price: data.c[index], // Close price
      open: data.o[index],
      high: data.h[index],
      low: data.l[index],
      volume: data.v[index]
    }));
    
    console.log(`📈 Retrieved ${historicalData.length} historical data points for ${symbol}`);
    
    return Response.json({
      symbol,
      resolution,
      from: parseInt(from),
      to: parseInt(to),
      data: historicalData,
      count: historicalData.length
    });
    
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return new Response('Internal server error', { status: 500 });
  }
}
