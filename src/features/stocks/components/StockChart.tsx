/**
 * Stock Chart Component
 * =====================
 *
 * Chart component for plotting stock values over time using Recharts
 * following the React Developer test requirements.
 */

'use client';

import { Clock } from 'lucide-react';
import React, { useMemo, useCallback, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { StockChartProps, ChartDataPoint, STOCK_COLORS } from '@/core/types';
import { useStockStore } from '@/features/stocks/stores';

/**
 * Stock Chart Component
 *
 * Displays a line chart of stock prices over time using Recharts.
 * Shows real-time data for all watched stocks.
 */
export const StockChart: React.FC<StockChartProps> = ({
  stocks,
  height = 320,
  className = '',
}) => {
  // Get stock store methods
  const { fetchHistoricalDataForRange } = useStockStore();
  
  // Memoize stocks with data to prevent unnecessary recalculations
  const stocksWithData = useMemo(() => {
    return stocks.filter(
      stock => (stock.priceHistory && stock.priceHistory.length > 0) || stock.currentPrice
    );
  }, [stocks]);
  
  // Fetch initial historical data for new stocks
  useEffect(() => {
    stocksWithData.forEach(stock => {
      // Check if we already have data for this stock
      const hasData = stock.priceHistory && stock.priceHistory.length > 0;
      if (!hasData) {
        console.log(`📊 Fetching initial historical data for ${stock.symbol}`);
        fetchHistoricalDataForRange(stock.symbol, '1W'); // Fetch 1 week of data
      }
    });
  }, [stocksWithData, fetchHistoricalDataForRange]);

  // Memoize stock symbols to prevent unnecessary chart line recalculations
  const stockSymbols = useMemo(() => {
    return stocksWithData.map(stock => stock.symbol);
  }, [stocksWithData]);

  // Generate chart data from stock price history - simplified for live data only
  const chartData = useMemo((): ChartDataPoint[] => {
    if (stocksWithData.length === 0) return [];

    const now = Date.now();
    console.log(`📊 Generating chart data for ${stocksWithData.length} stocks`);

    // Get all unique timestamps from all stocks
    const allTimestamps = new Set<number>();
    stocksWithData.forEach(stock => {
      console.log(`  - ${stock.symbol}: ${stock.priceHistory?.length || 0} data points`);
      stock.priceHistory?.forEach(point => {
        allTimestamps.add(point.time);
      });
    });
    
    console.log(`  - Found ${allTimestamps.size} total timestamps`);

    // If no historical data, show current prices as single point
    if (allTimestamps.size === 0) {
      console.log(`⚠️ No historical data found, showing current prices only`);
      return [{
        timestamp: new Date(now).toLocaleTimeString(),
        price: 0,
        ...Object.fromEntries(
          stocksWithData.map(stock => [stock.symbol, stock.currentPrice || 0])
        )
      }];
    }

    // Convert to array, sort chronologically, and limit to last 100 data points
    const sortedTimestamps = Array.from(allTimestamps)
      .sort((a, b) => a - b)
      .slice(-100); // Show last 100 data points

    console.log(`📈 Showing ${sortedTimestamps.length} data points`);

    // Create chart data points
    return sortedTimestamps.map(timestamp => {
      const dataPoint: ChartDataPoint = {
        timestamp: new Date(timestamp).toLocaleTimeString(),
        price: 0, // This will be overridden by individual stock prices
      };

      // Add price data for each stock at this timestamp
      stocksWithData.forEach(stock => {
        const pricePoint = stock.priceHistory?.find(point => point.time === timestamp);
        dataPoint[stock.symbol] = pricePoint?.price || stock.currentPrice || 0;
      });

      return dataPoint;
    });
  }, [stocksWithData]);

  // Custom tooltip formatter
  const formatTooltipValue = useCallback((value: number, name: string) => {
    return [`$${value.toFixed(2)}`, name];
  }, []);

  // Custom tooltip label formatter
  const formatTooltipLabel = useCallback((label: string) => {
    return `Time: ${label}`;
  }, []);

  if (stocksWithData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-${height} bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="text-center">
          <Clock className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            No stocks to display
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Add stocks to your watchlist to see the chart
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Stock Price Chart
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Real-time price data for {stocksWithData.length} stock{stocksWithData.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      <div className="p-4">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="timestamp" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip
              formatter={formatTooltipValue}
              labelFormatter={formatTooltipLabel}
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f9fafb',
              }}
            />
            <Legend />
            {stockSymbols.map((symbol) => (
              <Line
                key={symbol}
                type="monotone"
                dataKey={symbol}
                stroke={STOCK_COLORS[symbol] || '#6b7280'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        
        {/* Data availability indicators */}
        {chartData.length <= 1 && (
          <div className='mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md'>
            <p className='text-xs text-yellow-800 dark:text-yellow-300'>
              ⚠️ Limited data available. Chart will populate as more price updates are received.
              Try refreshing or wait for the next update cycle.
            </p>
          </div>
        )}
        {chartData.length > 1 && chartData.length < 30 && (
          <div className='mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md'>
            <p className='text-xs text-orange-800 dark:text-orange-300'>
              ⚠️ Showing {chartData.length} data points (less than recommended minimum of 30)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockChart;