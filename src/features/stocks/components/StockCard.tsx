/**
 * Stock Card Component
 * ====================
 * 
 * Individual stock card component for displaying stock information
 * following the React Developer test requirements.
 */

'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Clock, X } from 'lucide-react';
import { 
  StockCardProps, 
  STOCK_COLORS
} from '@/core/types';
// import { stockService } from '@/services/stockService';

/**
 * Stock Card Component
 * 
 * Displays individual stock information with price, change, and alert status.
 * Color-coded based on alert conditions (green above, red below).
 */
export const StockCard: React.FC<StockCardProps> = ({
  stock,
  onRemove,
  className = '',
}) => {
  const {
    symbol,
    name,
    currentPrice,
    changePercent,
    alertPrice,
    isLoading,
    lastUpdated,
    high,
    low,
  } = stock;

  // Use changePercent if available, otherwise fall back to percentChange
  const displayChangePercent = changePercent ?? stock.percentChange;

  // Determine alert status and colors
  const isAboveAlert = currentPrice && currentPrice >= alertPrice;
  const isBelowAlert = currentPrice && currentPrice < alertPrice;
  
  // Get stock color
  const stockColor = STOCK_COLORS[symbol] || '#6b7280';
  
  // Format data - Finnhub style
  const formattedPrice = currentPrice ? `$${currentPrice.toFixed(2)}` : '---.--';
  const formattedChange = displayChangePercent !== undefined ? `${displayChangePercent.toFixed(2)}%` : '--.--%';
  const formattedDollarChange = stock.change !== undefined ? `${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}` : '---.--';
  
  // Finnhub-style color coding
  const changeColor = displayChangePercent !== undefined 
    ? (displayChangePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')
    : 'text-gray-500 dark:text-gray-400';
    
  const priceChangeColor = displayChangePercent !== undefined 
    ? (displayChangePercent >= 0 ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400')
    : 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
  
  // Get border color based on alert status
  const getBorderColor = () => {
    if (isLoading) return 'border-gray-300';
    if (isAboveAlert) return 'border-green-500';
    if (isBelowAlert) return 'border-red-500';
    return 'border-gray-300';
  };

  // Get alert badge
  const getAlertBadge = () => {
    if (!currentPrice) return null;
    
    if (isAboveAlert) {
      return (
        <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
          Above Alert
        </span>
      );
    }
    
    if (isBelowAlert) {
      return (
        <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
          Below Alert
        </span>
      );
    }
    
    return null;
  };

  // Add real-time update indicators like Finnhub
  const wasRecentlyUpdated = lastUpdated && (Date.now() - lastUpdated < 5000); // 5 seconds
  const wasJustUpdated = lastUpdated && (Date.now() - lastUpdated < 1000); // 1 second

  return (
    <div 
      className={`p-4 lg:p-6 bg-white rounded-lg border-l-4 shadow-sm ${getBorderColor()} dark:bg-gray-800 ${className} 
        ${wasJustUpdated ? 'ring-2 ring-blue-500 ring-opacity-50 transition-all duration-500' : ''}
        ${wasRecentlyUpdated ? 'shadow-md' : ''}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3 lg:mb-4">
        <div className="flex items-center space-x-2 lg:space-x-3">
          {/* Stock Icon */}
          <div 
            className="flex justify-center items-center w-8 h-8 lg:w-10 lg:h-10 text-xs lg:text-sm font-bold text-white rounded-full"
            style={{ backgroundColor: stockColor }}
          >
            {symbol.charAt(0)}
          </div>
          
          {/* Stock Info */}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 dark:text-white text-sm lg:text-base">{symbol}</p>
            <p className="text-xs lg:text-sm text-gray-500 truncate dark:text-gray-400">
              {name.split(' ')[0]}
            </p>
          </div>
        </div>

        {/* Remove Button */}
        {onRemove && (
          <button
            onClick={() => onRemove(symbol)}
            className="p-1 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Remove from watchlist"
          >
            <X className="w-4 h-4 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300" />
          </button>
        )}
      </div>

      {/* Price Information */}
      <div className="space-y-1 lg:space-y-2">
        {/* Current Price */}
        <p className={`text-xl lg:text-2xl font-bold text-gray-900 dark:text-white 
          ${wasJustUpdated ? 'text-blue-600 transition-colors duration-300' : ''}`}>
          {isLoading ? (
            <span className="text-gray-500 dark:text-gray-400">Loading...</span>
          ) : (
            <span className={wasJustUpdated ? 'animate-pulse' : ''}>
              {formattedPrice}
            </span>
          )}
        </p>

        {/* Change Amount and Percentage - Finnhub Style */}
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-md text-sm font-medium ${priceChangeColor} 
            ${wasJustUpdated ? 'ring-1 ring-blue-300' : ''}`}>
            {formattedDollarChange}
          </span>
          
          <span className={`flex items-center text-sm font-medium ${changeColor}`}>
            {displayChangePercent !== undefined ? (
              <>
                {displayChangePercent >= 0 ? (
                  <TrendingUp className="mr-1 w-4 h-4" />
                ) : (
                  <TrendingDown className="mr-1 w-4 h-4" />
                )}
                {formattedChange}
              </>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">--.--%</span>
            )}
          </span>
        </div>

        {/* Market Data - Finnhub Style */}
        <div className="space-y-1 text-xs">
          {/* Open and Previous Close */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Open: </span>
              <span className="text-gray-900 dark:text-white">
                {stock.open ? `$${stock.open.toFixed(2)}` : '---.--'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Prev: </span>
              <span className="text-gray-900 dark:text-white">
                {stock.previousClose ? `$${stock.previousClose.toFixed(2)}` : '---.--'}
              </span>
            </div>
          </div>

          {/* Day Range */}
          {high && low && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Day Range: </span>
              <span className="text-gray-900 dark:text-white">
                ${low.toFixed(2)} - ${high.toFixed(2)}
              </span>
            </div>
          )}

          {/* Alert Information */}
          <div className="flex justify-between items-center pt-1 border-t border-gray-200 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">Alert: ${alertPrice.toFixed(2)}</span>
            {getAlertBadge()}
          </div>

          {/* Last Updated with real-time indicator */}
          {lastUpdated && (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center text-gray-400 dark:text-gray-500">
                <Clock className={`mr-1 w-3 h-3 ${wasRecentlyUpdated ? 'text-green-500' : ''}`} />
                <span className="hidden sm:inline">{new Date(lastUpdated).toLocaleTimeString()}</span>
                <span className="sm:hidden">{new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {wasRecentlyUpdated && (
                <div className="flex items-center">
                  <span className="text-xs text-green-500 mr-1">LIVE</span>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="mt-4">
          <div className="w-full h-1 bg-gray-200 rounded-full">
            <div className="h-1 bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockCard;
