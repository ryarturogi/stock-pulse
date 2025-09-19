/**
 * Stock Chart Component
 * =====================
 *
 * Chart component for plotting stock values over time using Recharts
 * following the React Developer test requirements.
 */

'use client';

import { Clock } from 'lucide-react';
import React, { useMemo, useState, useCallback } from 'react';
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
  // Time range state
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    'Live' | '1H' | '1D' | '1W'
  >('Live');
  // Memoize stocks with data to prevent unnecessary recalculations
  const stocksWithData = useMemo(() => {
    return stocks.filter(
      stock => (stock.priceHistory && stock.priceHistory.length > 0) || stock.currentPrice
    );
  }, [stocks]);

  // Memoize stock symbols to prevent unnecessary chart line recalculations
  const stockSymbols = useMemo(() => {
    return stocksWithData.map(stock => stock.symbol);
  }, [stocksWithData]);

  // Helper function to format timestamps based on time range
  const formatTimestampForTimeRange = useCallback((timestamp: number, timeRange: string): string => {
    const date = new Date(timestamp);
    
    switch (timeRange) {
      case 'Live':
      case '1H':
        // For live and 1 hour: show time only (HH:MM)
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      case '1D':
        // For 1 day: show time with AM/PM
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      case '1W':
        // For 1 week: show month/day and time
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      default:
        return date.toLocaleTimeString();
    }
  }, []);

  // Generate chart data from stock price history - optimized for live updates
  const chartData = useMemo((): ChartDataPoint[] => {
    if (stocksWithData.length === 0) return [];

    const now = Date.now();

    // For Live mode, use actual price history data for real-time updates
    if (selectedTimeRange === 'Live') {
      // Get all unique timestamps from all stocks
      const allTimestamps = new Set<number>();
      stocksWithData.forEach(stock => {
        stock.priceHistory?.forEach(point => {
          allTimestamps.add(point.time);
        });
      });

      // Convert to array and sort chronologically
      const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);
      
      // Keep only the last 50 data points for live view, but ensure minimum 30
      let recentTimestamps = sortedTimestamps.slice(-50);
      if (recentTimestamps.length < 30 && sortedTimestamps.length >= 30) {
        recentTimestamps = sortedTimestamps.slice(-30);
        console.log(`📊 Live mode: Adjusted to show minimum 30 data points`);
      }
      
      // If no price history available, create a single point with current prices
      if (recentTimestamps.length === 0) {
        console.log(`⚠️ No price history found for Live mode, showing current prices only`);
        return [{
          timestamp: formatTimestampForTimeRange(now, selectedTimeRange),
          price: 0,
          ...Object.fromEntries(
            stocksWithData.map(stock => [stock.symbol, stock.currentPrice || 0])
          )
        }];
      }

      return recentTimestamps.map(timestamp => {
        const dataPoint: ChartDataPoint = {
          timestamp: formatTimestampForTimeRange(timestamp, selectedTimeRange),
          price: 0, // Default price
        };

        // Add actual price data for each stock at this timestamp
        stocksWithData.forEach(stock => {
          const pricePoint = stock.priceHistory?.find(point => point.time === timestamp);
          if (pricePoint) {
            (dataPoint as Record<string, number>)[stock.symbol] = pricePoint.price;
          } else {
            // Find the most recent price before this timestamp
            const previousPrice = stock.priceHistory?.filter(point => point.time < timestamp)
              .sort((a, b) => b.time - a.time)[0]; // Most recent first
              
            if (previousPrice) {
              (dataPoint as Record<string, number>)[stock.symbol] = previousPrice.price;
            } else if (stock.currentPrice) {
              // Fallback to current price if no historical data
              (dataPoint as Record<string, number>)[stock.symbol] = stock.currentPrice;
            }
          }
        });

        return dataPoint;
      });
    }

    // For historical views (1H, 1D, 1W), use actual price history within the time range
    let timeRangeMs: number;
    let maxDataPoints: number;

    // Calculate time range based on selection - increased data points for better visualization
    switch (selectedTimeRange) {
      case '1H':
        timeRangeMs = 60 * 60 * 1000; // 1 hour
        maxDataPoints = 60; // 1 data point per minute
        break;
      case '1D':
        timeRangeMs = 24 * 60 * 60 * 1000; // 24 hours
        maxDataPoints = 96; // 1 data point per 15 minutes
        break;
      case '1W':
        timeRangeMs = 7 * 24 * 60 * 60 * 1000; // 7 days
        maxDataPoints = 168; // 1 data point per hour
        break;
      default:
        timeRangeMs = 60 * 60 * 1000; // 1 hour
        maxDataPoints = 60;
        break;
    }

    const cutoffTime = now - timeRangeMs;
    
    console.log(`🔍 Debugging ${selectedTimeRange} range:`);
    console.log(`  - Now: ${new Date(now).toLocaleString()}`);
    console.log(`  - Cutoff: ${new Date(cutoffTime).toLocaleString()}`);
    console.log(`  - Time range: ${timeRangeMs / (1000 * 60 * 60)} hours`);
    
    // Get all timestamps from actual price history within the time range
    const allTimestamps = new Set<number>();
    stocksWithData.forEach(stock => {
      console.log(`  - ${stock.symbol}: ${stock.priceHistory?.length || 0} data points`);
      stock.priceHistory?.forEach(point => {
        if (point.time >= cutoffTime && point.time <= now) {
          allTimestamps.add(point.time);
        }
      });
    });
    
    console.log(`  - Found ${allTimestamps.size} timestamps in range`);

    // If no historical data in range, show current prices as single point
    if (allTimestamps.size === 0) {
      console.log(`⚠️ No historical data found for ${selectedTimeRange} range, showing current prices only`);
      console.log(`💡 Tip: Data will accumulate over time as prices update. Try a shorter time range or wait for more data points.`);
      return [{
        timestamp: formatTimestampForTimeRange(now, selectedTimeRange),
        price: 0,
        ...Object.fromEntries(
          stocksWithData.map(stock => [stock.symbol, stock.currentPrice || 0])
        )
      }];
    }

    // Convert to array, sort chronologically, and limit data points
    let sortedTimestamps = Array.from(allTimestamps)
      .sort((a, b) => a - b)
      .slice(-maxDataPoints);
    
    // Ensure we have at least 30 data points for meaningful visualization
    if (sortedTimestamps.length < 30 && allTimestamps.size >= 30) {
      sortedTimestamps = Array.from(allTimestamps)
        .sort((a, b) => a - b)
        .slice(-30);
      console.log(`📊 Adjusted to show minimum 30 data points (was ${sortedTimestamps.length})`);
    }

    console.log(`📈 Found ${sortedTimestamps.length} data points for ${selectedTimeRange} range`);

    return sortedTimestamps.map(timestamp => {
      const dataPoint: ChartDataPoint = {
        timestamp: formatTimestampForTimeRange(timestamp, selectedTimeRange),
        price: 0, // Default price
      };

      // Add actual price data for each stock at this exact timestamp
      stocksWithData.forEach(stock => {
        const pricePoint = stock.priceHistory?.find(point => point.time === timestamp);
        if (pricePoint) {
          (dataPoint as Record<string, number>)[stock.symbol] = pricePoint.price;
        } else {
          // Find the most recent price before this timestamp within the time range
          const previousPrice = stock.priceHistory?.filter(point => 
            point.time < timestamp && point.time >= cutoffTime
          ).sort((a, b) => b.time - a.time)[0]; // Most recent first
            
          if (previousPrice) {
            (dataPoint as Record<string, number>)[stock.symbol] = previousPrice.price;
          } else if (stock.currentPrice) {
            // Fallback to current price if no historical data in range
            (dataPoint as Record<string, number>)[stock.symbol] = stock.currentPrice;
          }
        }
      });

      return dataPoint;
    });
  }, [stocksWithData, selectedTimeRange, formatTimestampForTimeRange]);

  // Get color for stock line - memoized for performance
  const getStockColor = useCallback((symbol: string): string => {
    return STOCK_COLORS[symbol] || '#6b7280';
  }, []);

  // Memoize chart lines to prevent unnecessary rerenders
  const chartLines = useMemo(() => {
    return stocksWithData.map(stock => (
      <Line
        key={stock.symbol}
        type='monotone'
        dataKey={stock.symbol}
        stroke={getStockColor(stock.symbol)}
        strokeWidth={2}
        dot={false}
        connectNulls={false}
        name={stock.symbol}
      />
    ));
  }, [stocksWithData, getStockColor]);

  // Custom tooltip formatter
  const formatTooltipValue = (value: number, name: string) => {
    if (typeof value !== 'number') return ['N/A', name];
    return [`$${value.toFixed(2)}`, name];
  };

  // Custom tooltip label formatter
  const formatTooltipLabel = (label: string | number) => {
    if (typeof label === 'string') {
      // If it's already a formatted string, return as is
      return label;
    }
    if (typeof label === 'number') {
      return new Date(label).toLocaleString();
    }
    return 'N/A';
  };

  // Custom Y-axis formatter
  const formatYAxisValue = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  // Custom X-axis formatter
  const formatXAxisValue = (value: string) => {
    // The timestamp is already properly formatted for the time range
    // For longer labels, truncate to prevent overlap
    return value.length > 12 ? value.substring(0, 12) + '...' : value;
  };

  // Check if we have any data to display
  const hasData = stocksWithData.length > 0;

  // Empty state when no data
  if (!hasData) {
    return (
      <div
        className={`p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800 ${className}`}
      >
        <div className='flex justify-between items-center mb-6'>
          <h3
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            Stock Price Chart
          </h3>
          <div className='flex space-x-4'>
            <button
              onClick={() => setSelectedTimeRange('Live')}
              className={`pb-1 border-b-2 transition-colors ${
                selectedTimeRange === 'Live'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 border-transparent'
              }`}
            >
              Live Data
            </button>
            <button
              onClick={() => setSelectedTimeRange('1H')}
              className={`pb-1 border-b-2 transition-colors ${
                selectedTimeRange === '1H'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 border-transparent'
              }`}
            >
              1H
            </button>
            <button
              onClick={() => setSelectedTimeRange('1D')}
              className={`pb-1 border-b-2 transition-colors ${
                selectedTimeRange === '1D'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 border-transparent'
              }`}
            >
              1D
            </button>
            <button
              onClick={() => setSelectedTimeRange('1W')}
              className={`pb-1 border-b-2 transition-colors ${
                selectedTimeRange === '1W'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 border-transparent'
              }`}
            >
              1W
            </button>
          </div>
        </div>

        <div
          className='flex justify-center items-center text-gray-500'
          style={{ height: `${height}px` }}
        >
          <div className='text-center'>
            <Clock className='mx-auto mb-4 w-16 h-16 text-gray-400' />
            <p className='mb-2 text-lg font-medium'>Collecting price data...</p>
            <p className='text-sm'>Chart will update as data comes in</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800 ${className}`}
    >
      {/* Header */}
      <div className='flex justify-between items-center mb-6'>
        <h3
          className="text-lg font-semibold text-gray-900 dark:text-white"
        >
          Stock Price Chart
        </h3>
        <div className='flex space-x-4'>
          <button
            onClick={() => setSelectedTimeRange('Live')}
            className={`pb-1 border-b-2 transition-colors ${
              selectedTimeRange === 'Live'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 border-transparent'
            }`}
          >
            Live Data
          </button>
          <button
            onClick={() => setSelectedTimeRange('1H')}
            className={`pb-1 border-b-2 transition-colors ${
              selectedTimeRange === '1H'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 border-transparent'
            }`}
          >
            1H
          </button>
          <button
            onClick={() => setSelectedTimeRange('1D')}
            className={`pb-1 border-b-2 transition-colors ${
              selectedTimeRange === '1D'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 border-transparent'
            }`}
          >
            1D
          </button>
          <button
            onClick={() => setSelectedTimeRange('1W')}
            className={`pb-1 border-b-2 transition-colors ${
              selectedTimeRange === '1W'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 border-transparent'
            }`}
          >
            1W
          </button>
        </div>
      </div>

      {/* Chart Info */}
      <div className='mb-6'>
        <p className='text-sm text-gray-600 dark:text-gray-400'>
          {selectedTimeRange === 'Live' ? 'Live' : selectedTimeRange} price
          tracking for: {stockSymbols.join(', ')}
        </p>
        <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
          Showing{' '}
          {selectedTimeRange === 'Live'
            ? 'last 50 data points (live updates, min 30)'
            : selectedTimeRange === '1H'
              ? 'last hour (60 data points, min 30)'
              : selectedTimeRange === '1D'
                ? 'last 24 hours (96 data points, min 30)'
                : 'last week (168 data points, min 30)'}{' '}
          - Found {chartData.length} data points
        </p>
        {chartData.length <= 1 && (
          <div className='mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md'>
            <p className='text-xs text-yellow-800 dark:text-yellow-300'>
              ⚠️ Limited data available. Chart will populate as more price updates are received.
              Try refreshing or wait for the next update cycle.
            </p>
          </div>
        )}
        {chartData.length >= 30 && (
          <div className='mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md'>
            <p className='text-xs text-green-800 dark:text-green-300'>
              ✅ Showing {chartData.length} data points from the {selectedTimeRange} time range (minimum 30 required)
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

      {/* Chart */}
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray='3 3' 
              stroke='#f0f0f0' 
              className="dark:stroke-gray-700"
            />

            <XAxis
              dataKey='timestamp'
              tickFormatter={formatXAxisValue}
              stroke='#6b7280'
              className="dark:stroke-gray-400"
              fontSize={12}
            />

            <YAxis
              domain={['dataMin - 1', 'dataMax + 1']}
              tickFormatter={formatYAxisValue}
              stroke='#6b7280'
              className="dark:stroke-gray-400"
              fontSize={12}
            />

            <Tooltip
              labelFormatter={formatTooltipLabel}
              formatter={formatTooltipValue}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />

            <Legend />

            {/* Render memoized lines for each stock */}
            {chartLines}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend */}
      <div className='flex flex-wrap gap-4 mt-4'>
        {stocksWithData.map(stock => (
          <div key={stock.symbol} className='flex items-center space-x-2'>
            <div
              className='w-3 h-3 rounded-full'
              style={{ backgroundColor: getStockColor(stock.symbol) }}
            />
            <span className='text-sm text-gray-600 dark:text-gray-300'>{stock.symbol}</span>
            {stock.currentPrice && (
              <span className='text-sm font-medium text-gray-900 dark:text-white'>
                ${stock.currentPrice.toFixed(2)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockChart;
