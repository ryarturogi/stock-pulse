/**
 * Stock Chart Component
 * =====================
 *
 * Chart component for plotting stock values over time using Recharts
 * following the React Developer test requirements.
 */

'use client';

import React, { useMemo, useCallback } from 'react';

import { Clock } from 'lucide-react';
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
  // Use CSS classes for responsive behavior instead of JavaScript
  
  // Get stock store methods (no methods needed for chart)
  
  // Memoize stocks with data to prevent unnecessary recalculations
  // Only recalculate when stocks array changes or when price history actually changes
  const stocksWithData = useMemo(() => {
    return stocks.filter(
      stock => (stock.priceHistory && stock.priceHistory.length > 0) || stock.currentPrice
    );
  }, [stocks]);
  

  // Memoize stock symbols to prevent unnecessary chart line recalculations
  const stockSymbols = useMemo(() => {
    return stocksWithData.map(stock => stock.symbol);
  }, [stocksWithData]);

  // Generate chart data from stock price history - fixed to properly show real-time updates
  const chartData = useMemo((): ChartDataPoint[] => {
    if (stocksWithData.length === 0) return [];

    const now = Date.now();
    // Only log in development and when there are actual changes
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Chart data recalculating for', stocksWithData.length, 'stocks');
    }

    // Get all unique timestamps from all stocks
    const allTimestamps = new Set<number>();
    stocksWithData.forEach(stock => {
      stock.priceHistory?.forEach(point => {
        allTimestamps.add(point.time);
      });
    });

    // If no historical data, show current prices as single point
    if (allTimestamps.size === 0) {
      return [{
        timestamp: new Date(now).toLocaleTimeString(),
        price: 0,
        ...Object.fromEntries(
          stocksWithData.map(stock => [stock.symbol, stock.currentPrice || 0])
        )
      }];
    }

    // Convert to array, sort chronologically, and show all data points for better UX
    const sortedTimestamps = Array.from(allTimestamps)
      .sort((a, b) => a - b); // Show all collected data points

    // Create chart data points with unique timestamp formatting
    return sortedTimestamps.map((timestamp, index) => {
      const date = new Date(timestamp);
      // Create unique time labels to prevent duplicate timestamps
      // Use milliseconds for precision when multiple points in same second
      const timeLabel = sortedTimestamps.length > 20 
        ? `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.${String(timestamp % 1000).padStart(3, '0')}`
        : `${date.toLocaleTimeString()}.${String(timestamp % 1000).padStart(3, '0')}`;
      
      const dataPoint: ChartDataPoint = {
        timestamp: timeLabel,
        price: 0, // This will be overridden by individual stock prices
      };

      // Add price data for each stock at this timestamp
      stocksWithData.forEach(stock => {
        const pricePoint = stock.priceHistory?.find(point => point.time === timestamp);
        if (pricePoint) {
          dataPoint[stock.symbol] = pricePoint.price;
        } else {
          // For missing data points, use the most recent available price
          const sortedHistory = stock.priceHistory?.sort((a, b) => a.time - b.time) || [];
          const mostRecentPoint = sortedHistory.find(point => point.time <= timestamp) || 
                                 sortedHistory[sortedHistory.length - 1];
          dataPoint[stock.symbol] = mostRecentPoint?.price || stock.currentPrice || 0;
        }
      });

      return dataPoint;
    });
  }, [stocksWithData, stocksWithData.map(s => s.priceHistory?.length || 0).join(','), stocksWithData.map(s => s.lastUpdated || 0).join(',')]);



  // Custom tooltip component for better visibility
  const CustomTooltip = useCallback(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 dark:bg-gray-800 dark:border-gray-600">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{`Time: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 mb-1 last:mb-0">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {entry.dataKey}: ${entry.value.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  }, []);

  if (stocksWithData.length === 0) {
    return (
      <div className={`flex justify-center items-center bg-gray-50 rounded-lg h-${height} dark:bg-gray-800 ${className}`}>
        <div className="text-center">
          <Clock className="mx-auto mb-4 w-12 h-12 text-gray-400 dark:text-gray-500" />
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
            No stocks to display
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            Add stocks to your watchlist to see the chart
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 ${className}`}>
      <div className="p-3 border-b border-gray-200 lg:p-4 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-base font-semibold text-gray-900 lg:text-lg dark:text-white">
              Stock Price Chart
            </h3>
            <p className="mt-1 text-xs text-gray-500 lg:text-sm dark:text-gray-400">
              Real-time price data for {stocksWithData.length} stock{stocksWithData.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {chartData.length} data points
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {chartData.length > 0 && `Latest: ${chartData[chartData.length - 1]?.timestamp}`}
            </p>
            <div className="flex items-center space-x-1 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-600 dark:text-green-400">Live</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-2 lg:p-4">
        <ResponsiveContainer width="100%" height={height} className="h-64 lg:h-80">
          <LineChart 
            data={chartData} 
            margin={{ 
              top: 5, 
              right: 30, 
              left: 20, 
              bottom: 5 
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="timestamp" 
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval={chartData.length > 20 ? 'preserveStartEnd' : 0}
              angle={chartData.length > 10 ? -45 : 0}
              textAnchor={chartData.length > 10 ? 'end' : 'middle'}
              height={chartData.length > 10 ? 60 : 30}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {stockSymbols.map((symbol) => (
              <Line
                key={symbol}
                type="monotone"
                dataKey={symbol}
                stroke={STOCK_COLORS[symbol] || '#6b7280'}
                strokeWidth={2}
                dot={{ r: 2, strokeWidth: 1, fill: STOCK_COLORS[symbol] || '#6b7280' }}
                activeDot={{ r: 6, strokeWidth: 2, fill: STOCK_COLORS[symbol] || '#6b7280' }}
                connectNulls={false}
                animationDuration={300}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        
        {/* Data availability indicators */}
        {chartData.length <= 1 && (
          <div className='p-2 mt-2 bg-yellow-50 rounded-md border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'>
            <p className='text-xs text-yellow-800 dark:text-yellow-300'>
              📊 Building chart data... Add more stocks or wait for updates to see trends.
            </p>
          </div>
        )}
        {chartData.length > 1 && chartData.length < 10 && (
          <div className='p-2 mt-2 bg-blue-50 rounded-md border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'>
            <p className='text-xs text-blue-800 dark:text-blue-300'>
              📈 Showing all {chartData.length} collected data points. Chart will improve as more data arrives.
            </p>
          </div>
        )}
        {chartData.length >= 10 && (
          <div className='p-2 mt-2 bg-green-50 rounded-md border border-green-200 dark:bg-green-900/20 dark:border-green-800'>
            <p className='text-xs text-green-800 dark:text-green-300'>
              ✅ Displaying all {chartData.length} data points with full price history and real-time updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockChart;