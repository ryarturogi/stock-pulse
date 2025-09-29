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
  Brush,
} from 'recharts';

import { STOCK_COLORS } from '@/core/constants/constants';
import {
  StockChartProps,
  ChartDataPoint,
  WatchedStock,
  PriceDataPoint,
} from '@/core/types';
import {
  normalizeTimestamp,
  formatChartTimeLabel,
} from '@/core/utils/dateUtils';

/**
 * Stock Chart Component
 *
 * Displays a line chart of stock prices over time using Recharts.
 * Shows real-time data for all watched stocks.
 */
export const StockChart: React.FC<
  StockChartProps & {
    'data-intro'?: string;
    'data-title'?: string;
    'data-step'?: string;
    'data-desktop-step'?: string;
    'data-mobile-step'?: string;
  }
> = ({ stocks, height = 320, className = '', ...props }) => {
  // Use CSS classes for responsive behavior instead of JavaScript

  // Get stock store methods (no methods needed for chart)

  // Memoize stocks with data - use a more efficient dependency
  const stocksWithData = useMemo(() => {
    return stocks.filter(
      stock =>
        (stock.priceHistory && stock.priceHistory.length > 0) ||
        stock.currentPrice
    );
  }, [stocks]);

  // Memoize stock symbols to prevent unnecessary chart line recalculations
  const stockSymbols = useMemo(() => {
    return stocksWithData.map(stock => stock.symbol);
  }, [stocksWithData]);

  // Helper function to safely convert and validate numeric values
  const safeNumber = useCallback((value: unknown, fallback = 0): number => {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? fallback : num;
  }, []);

  // Helper function to get price for a stock at a specific timestamp
  const getStockPriceAtTimestamp = useCallback(
    (
      stock: WatchedStock,
      timestamp: number,
      isLatestTimestamp: boolean
    ): number | undefined => {
      // First, try to find exact timestamp match
      const exactMatch = stock.priceHistory?.find(
        (point: PriceDataPoint) => normalizeTimestamp(point.time) === timestamp
      );

      if (exactMatch) {
        return safeNumber(exactMatch.price);
      }

      // If no exact match, use last known price before this timestamp
      const historicalPoints =
        stock.priceHistory
          ?.filter(
            (point: PriceDataPoint) =>
              normalizeTimestamp(point.time) <= timestamp
          )
          .sort(
            (a: PriceDataPoint, b: PriceDataPoint) =>
              normalizeTimestamp(a.time) - normalizeTimestamp(b.time)
          ) || [];

      const lastKnownPoint = historicalPoints[historicalPoints.length - 1];

      if (lastKnownPoint) {
        return safeNumber(lastKnownPoint.price);
      }

      // For the latest timestamp, use current price if available
      if (isLatestTimestamp && stock.currentPrice !== undefined) {
        return safeNumber(stock.currentPrice);
      }

      // No data available for this timestamp
      return undefined;
    },
    [safeNumber]
  );

  // Generate chart data from stock price history with improved logic
  const chartData = useMemo((): ChartDataPoint[] => {
    if (stocksWithData.length === 0) return [];

    const now = Date.now();

    if (process.env.NODE_ENV === 'development') {
      console.log(
        '📊 Chart data recalculating for',
        stocksWithData.length,
        'stocks'
      );
    }

    // Collect all unique timestamps from all stocks, normalizing them
    const allTimestamps = new Set<number>();

    stocksWithData.forEach(stock => {
      // Add timestamps from price history
      stock.priceHistory?.forEach(point => {
        const normalizedTime = normalizeTimestamp(point.time);
        allTimestamps.add(normalizedTime);
      });

      // Add current timestamp if we have current price
      if (stock.currentPrice !== undefined && stock.lastUpdated) {
        const normalizedTime = normalizeTimestamp(stock.lastUpdated);
        allTimestamps.add(normalizedTime);
      }
    });

    // If no timestamps, create a single point with current data
    if (allTimestamps.size === 0) {
      const currentPoint: ChartDataPoint = {
        timestamp: new Date(now).toLocaleTimeString(),
        index: 0,
        price: 0,
      };

      stocksWithData.forEach(stock => {
        currentPoint[stock.symbol] = safeNumber(stock.currentPrice);
      });

      return [currentPoint];
    }

    // Sort timestamps chronologically
    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    // Create chart data points using helper functions
    return sortedTimestamps
      .map((timestamp, index) => {
        const dataPoint: ChartDataPoint = {
          timestamp: formatChartTimeLabel(timestamp, sortedTimestamps.length),
          index,
          price: 0,
        };

        const isLatestTimestamp =
          timestamp === sortedTimestamps[sortedTimestamps.length - 1];

        // Add price data for each stock at this timestamp
        stocksWithData.forEach(stock => {
          const price = getStockPriceAtTimestamp(
            stock,
            timestamp,
            isLatestTimestamp
          );
          if (price !== undefined) {
            dataPoint[stock.symbol] = price;
          }
        });

        return dataPoint;
      })
      .filter(dataPoint => {
        // Ensure dataPoint has at least one stock price and all values are valid
        const stockPrices = Object.entries(dataPoint)
          .filter(([key]) => !['timestamp', 'index', 'price'].includes(key))
          .map(([, value]) => value);

        return (
          stockPrices.length > 0 &&
          Object.values(dataPoint).every(
            value =>
              typeof value === 'string' ||
              (typeof value === 'number' && isFinite(value))
          )
        );
      });
  }, [stocksWithData, safeNumber, getStockPriceAtTimestamp]);

  // Custom tooltip component for better visibility
  const CustomTooltip = useCallback(
    ({
      active,
      payload,
      label,
    }: {
      active?: boolean;
      payload?: Array<{
        dataKey: string;
        value: number;
        color: string;
        name: string;
      }>;
      label?: string;
    }) => {
      if (active && payload && payload.length) {
        return (
          <div className='bg-white border border-gray-300 rounded-lg shadow-lg p-3 dark:bg-gray-800 dark:border-gray-600'>
            <p className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              {label}
            </p>
            {payload.map((entry, index: number) => (
              <div
                key={index}
                className='flex items-center space-x-2 mb-1 last:mb-0'
              >
                <div
                  className='w-3 h-3 rounded-full'
                  style={{ backgroundColor: entry.color }}
                />
                <span className='text-sm font-medium text-gray-900 dark:text-white'>
                  {entry.dataKey}: ${entry.value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        );
      }
      return null;
    },
    []
  );

  if (stocksWithData.length === 0) {
    return (
      <div
        className={`flex justify-center items-center bg-gray-50 rounded-lg px-4 py-8 h-${height} dark:bg-gray-800 ${className}`}
        {...props}
      >
        <div className='text-center'>
          <Clock className='mx-auto mb-4 w-12 h-12 text-gray-400 dark:text-gray-500' />
          <p className='text-lg font-medium text-gray-500 dark:text-gray-400'>
            No stocks to display
          </p>
          <p className='mt-2 text-sm text-gray-400 dark:text-gray-500'>
            Add stocks to your watchlist to see the chart
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 ${className}`}
      {...props}
    >
      <div className='p-3 border-b border-gray-200 lg:p-4 dark:border-gray-700'>
        <div className='flex justify-between items-start'>
          <div>
            <h3 className='text-base font-semibold text-gray-900 lg:text-lg dark:text-white'>
              Stock Price Chart
            </h3>
            <p className='mt-1 text-xs text-gray-500 lg:text-sm dark:text-gray-400'>
              Real-time price data for {stocksWithData.length} stock
              {stocksWithData.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className='text-right'>
            <p className='text-xs font-medium text-gray-700 dark:text-gray-300'>
              {chartData.length} data points
            </p>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              {chartData.length > 0 &&
                chartData[chartData.length - 1]?.timestamp &&
                `Latest: ${chartData[chartData.length - 1].timestamp}`}
            </p>
          </div>
        </div>
      </div>

      <div className='p-2 lg:p-4'>
        <ResponsiveContainer
          width='100%'
          height={height}
          className='h-64 lg:h-80'
        >
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 40,
            }}
          >
            <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
            <XAxis
              dataKey='timestamp'
              stroke='#6b7280'
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval={chartData.length > 20 ? 'preserveStartEnd' : 0}
              angle={chartData.length > 10 ? -45 : 0}
              textAnchor={chartData.length > 10 ? 'end' : 'middle'}
              height={chartData.length > 10 ? 60 : 30}
            />
            <YAxis
              stroke='#6b7280'
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={value => `$${value.toFixed(2)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {stockSymbols.map(symbol => (
              <Line
                key={symbol}
                type='monotone'
                dataKey={symbol}
                stroke={STOCK_COLORS[symbol] || '#6b7280'}
                strokeWidth={2}
                dot={{
                  r: 2,
                  strokeWidth: 1,
                  fill: STOCK_COLORS[symbol] || '#6b7280',
                }}
                activeDot={{
                  r: 6,
                  strokeWidth: 2,
                  fill: STOCK_COLORS[symbol] || '#6b7280',
                }}
                connectNulls={false}
                animationDuration={300}
              />
            ))}

            {/* Only show Brush when there's enough data */}
            {chartData.length > 5 && (
              <Brush
                dataKey='index'
                height={30}
                stroke='#8884d8'
                startIndex={Math.max(
                  0,
                  chartData.length - Math.min(20, chartData.length)
                )}
                endIndex={chartData.length - 1}
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Data availability indicators */}
        {chartData.length <= 1 && (
          <div className='p-2 mt-2 bg-yellow-50 rounded-md border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'>
            <p className='text-xs text-yellow-800 dark:text-yellow-300'>
              📊 Building chart data... Add more stocks or wait for updates to
              see trends.
            </p>
          </div>
        )}
        {chartData.length > 1 && chartData.length < 10 && (
          <div className='p-2 mt-2 bg-blue-50 rounded-md border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'>
            <p className='text-xs text-blue-800 dark:text-blue-300'>
              📈 Showing all {chartData.length} collected data points. Chart
              will improve as more data arrives.
            </p>
          </div>
        )}
        {chartData.length >= 10 && (
          <div className='p-2 mt-2 bg-green-50 rounded-md border border-green-200 dark:bg-green-900/20 dark:border-green-800'>
            <p className='text-xs text-green-800 dark:text-green-300'>
              ✅ Displaying all {chartData.length} data points with full price
              history and real-time updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockChart;
