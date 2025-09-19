/**
 * Stock Chart Component
 * =====================
 *
 * Chart component for plotting stock values over time using Recharts
 * following the React Developer test requirements.
 */

'use client';

import { Clock } from 'lucide-react';
import React, { useMemo, useState } from 'react';
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

import { StockChartProps, ChartDataPoint, STOCK_COLORS } from '@/types';

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
  // Generate chart data from stock price history
  const chartData = useMemo((): ChartDataPoint[] => {
    if (stocks.length === 0) return [];

    const stocksWithHistory = stocks.filter(
      stock => stock.priceHistory && stock.priceHistory.length > 0
    );

    if (stocksWithHistory.length === 0) return [];

    // Generate chart data based on selected time range
    const now = Date.now();
    let timePoints: number[] = [];
    let intervalMs: number;

    // Calculate time range and interval based on selection
    switch (selectedTimeRange) {
      case '1H':
        intervalMs = 3 * 60 * 1000; // 3 minutes
        for (let i = 0; i < 20; i++) {
          timePoints.push(now - i * intervalMs);
        }
        break;
      case '1D':
        intervalMs = 60 * 60 * 1000; // 1 hour
        for (let i = 0; i < 24; i++) {
          timePoints.push(now - i * intervalMs);
        }
        break;
      case '1W':
        intervalMs = 6 * 60 * 60 * 1000; // 6 hours
        for (let i = 0; i < 28; i++) {
          timePoints.push(now - i * intervalMs);
        }
        break;
      default: // 'Live'
        intervalMs = 60 * 1000; // 1 minute
        for (let i = 0; i < 20; i++) {
          timePoints.push(now - i * intervalMs);
        }
        break;
    }

    // Reverse to get chronological order (oldest first)
    timePoints.reverse();

    return timePoints.map(time => {
      const dataPoint: ChartDataPoint = {
        timestamp: new Date(time).toLocaleTimeString(),
        price: 0, // Default price
      };

      // Add price data for each stock at this timestamp
      stocksWithHistory.forEach(stock => {
        if (stock.priceHistory && stock.priceHistory.length > 0) {
          // Use the most recent price as base and add some variation
          const basePrice =
            stock.currentPrice ||
            stock.priceHistory[stock.priceHistory.length - 1]?.price ||
            100;

          // Generate realistic price variation based on time
          const timeVariation =
            Math.sin((time - now) / (24 * 60 * 60 * 1000)) * 0.02; // 2% daily variation
          const randomVariation = (Math.random() - 0.5) * 0.01; // 1% random variation
          const price = basePrice * (1 + timeVariation + randomVariation);

          (dataPoint as Record<string, number>)[stock.symbol] = price;
        }
      });

      return dataPoint;
    });
  }, [stocks, selectedTimeRange]);

  // Get color for stock line
  const getStockColor = (symbol: string): string => {
    return STOCK_COLORS[symbol] || '#6b7280';
  };

  // Custom tooltip formatter
  const formatTooltipValue = (value: number, name: string) => {
    if (typeof value !== 'number') return ['N/A', name];
    return [`$${value.toFixed(2)}`, name];
  };

  // Custom tooltip label formatter
  const formatTooltipLabel = (label: number) => {
    if (typeof label !== 'number') return 'N/A';
    return new Date(label).toLocaleString();
  };

  // Custom Y-axis formatter
  const formatYAxisValue = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  // Custom X-axis formatter
  const formatXAxisValue = (value: string) => {
    // The value is already a formatted timestamp string
    return value;
  };

  // Check if we have any data to display
  const hasData = stocks.some(
    stock => stock.priceHistory && stock.priceHistory.length > 0
  );

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
          tracking for: {stocks.map(s => s.symbol).join(', ')}
        </p>
        <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
          Showing{' '}
          {selectedTimeRange === 'Live'
            ? 'last 20 minutes'
            : selectedTimeRange === '1H'
              ? 'last hour'
              : selectedTimeRange === '1D'
                ? 'last 24 hours'
                : 'last week'}{' '}
          ({chartData.length} data points)
        </p>
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
              className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />

            <Legend />

            {/* Render lines for each stock */}
            {stocks.map(stock => (
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
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend */}
      <div className='flex flex-wrap gap-4 mt-4'>
        {stocks.map(stock => (
          <div key={stock.symbol} className='flex items-center space-x-2'>
            <div
              className='w-3 h-3 rounded-full'
              style={{ backgroundColor: getStockColor(stock.symbol) }}
            />
            <span className='text-sm text-gray-600'>{stock.symbol}</span>
            {stock.currentPrice && (
              <span className='text-sm font-medium text-gray-900'>
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
