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

  // Determine alert status and colors
  const isAboveAlert = currentPrice && currentPrice >= alertPrice;
  const isBelowAlert = currentPrice && currentPrice < alertPrice;
  
  // Get stock color
  const stockColor = STOCK_COLORS[symbol] || '#6b7280';
  
  // Format data
  const formattedPrice = currentPrice ? `$${currentPrice.toFixed(2)}` : '---.--';
  const formattedChange = changePercent !== undefined ? `${changePercent.toFixed(2)}%` : '--.--%';
  const changeColor = changePercent !== undefined 
    ? (changePercent >= 0 ? 'text-green-600' : 'text-red-600')
    : 'text-gray-500';
  
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

  return (
    <div 
      className={`p-6 bg-white rounded-lg border-l-4 shadow-sm ${getBorderColor()} dark:bg-gray-800 ${className}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          {/* Stock Icon */}
          <div 
            className="flex justify-center items-center w-10 h-10 text-sm font-bold text-white rounded-full"
            style={{ backgroundColor: stockColor }}
          >
            {symbol.charAt(0)}
          </div>
          
          {/* Stock Info */}
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{symbol}</p>
            <p className="text-sm text-gray-500 truncate max-w-32 dark:text-gray-400">
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
      <div className="space-y-2">
        {/* Current Price */}
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {isLoading ? (
            <span className="text-gray-500 dark:text-gray-400">Loading...</span>
          ) : (
            `$${formattedPrice}`
          )}
        </p>

        {/* Change Percentage */}
        <p className={`flex items-center text-sm ${changeColor}`}>
          {changePercent !== undefined ? (
            <>
              {changePercent >= 0 ? (
                <TrendingUp className="mr-1 w-4 h-4" />
              ) : (
                <TrendingDown className="mr-1 w-4 h-4" />
              )}
              {formattedChange}
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">--.--%</span>
          )}
        </p>

        {/* Alert Information */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400">Alert: ${alertPrice.toFixed(2)}</span>
            {getAlertBadge()}
          </div>

          {/* Day Range */}
          {high && low && (
            <div className="text-gray-400 dark:text-gray-500">
              Day: ${low.toFixed(2)} - ${high.toFixed(2)}
            </div>
          )}

          {/* Last Updated */}
          {lastUpdated && (
            <div className="flex items-center text-gray-400 dark:text-gray-500">
              <Clock className="mr-1 w-3 h-3" />
              {new Date(lastUpdated).toLocaleTimeString()}
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
