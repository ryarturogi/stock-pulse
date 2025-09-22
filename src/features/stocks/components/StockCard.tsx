/**
 * Stock Card Component
 * ====================
 * 
 * Individual stock card component for displaying stock information
 * following the React Developer test requirements.
 */

'use client';

import React, { useState, useEffect } from 'react';

import { TrendingUp, TrendingDown, Clock, X, Edit2, Check, X as XIcon } from 'lucide-react';

import { 
  StockCardProps, 
  STOCK_COLORS
} from '@/core/types';
import { useStockStore } from '@/features/stocks/stores/stockStore';
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
    percentChange,
    alertPrice,
    isLoading,
    lastUpdated,
    high,
    low,
  } = stock;

  // Edit state for alert price
  const [isEditingAlert, setIsEditingAlert] = useState(false);
  const [editAlertValue, setEditAlertValue] = useState(alertPrice.toString());
  
  // Get stock actions
  const updateAlertPrice = useStockStore(state => state.updateAlertPrice);

  // Sync edit value with prop changes
  useEffect(() => {
    if (!isEditingAlert) {
      setEditAlertValue(alertPrice.toString());
    }
  }, [alertPrice, isEditingAlert]);

  // Handle alert price editing
  const handleEditAlert = () => {
    console.log('🔧 Edit alert clicked for', symbol, 'current price:', alertPrice);
    setIsEditingAlert(true);
    setEditAlertValue(alertPrice.toString());
  };

  const handleSaveAlert = () => {
    const newPrice = parseFloat(editAlertValue);
    if (!isNaN(newPrice) && newPrice > 0) {
      console.log(`💾 Saving new alert price for ${symbol}: $${newPrice} (previous: $${alertPrice})`);
      updateAlertPrice(symbol, newPrice);
      setIsEditingAlert(false);
      
      // Reset edit value to ensure it syncs with the new price
      setEditAlertValue(newPrice.toString());
    } else {
      console.warn(`❌ Invalid alert price for ${symbol}: "${editAlertValue}"`);
      // Optional: Show user feedback for invalid input
      setEditAlertValue(alertPrice.toString()); // Reset to current valid value
    }
  };

  const handleCancelAlert = () => {
    setIsEditingAlert(false);
    setEditAlertValue(alertPrice.toString());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveAlert();
    } else if (e.key === 'Escape') {
      handleCancelAlert();
    }
  };

  // Use percentChange if available, otherwise fall back to stock.percentChange
  const displayChangePercent = percentChange ?? stock.percentChange;

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
    if (isLoading) return 'border-blue-300 dark:border-blue-600';
    if (isAboveAlert) return 'border-green-500 dark:border-green-400';
    if (isBelowAlert) return 'border-red-500 dark:border-red-400';
    return 'border-gray-300 dark:border-gray-600';
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12" />
      </div>
      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-3" />
      <div className="flex justify-between items-center">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
      </div>
    </div>
  );

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
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-1 lg:space-y-2">
          {/* Current Price */}
          <p className={`text-xl lg:text-2xl font-bold text-gray-900 dark:text-white 
          ${wasJustUpdated ? 'text-blue-600 transition-colors duration-300' : ''}`}>
            <span className={wasJustUpdated ? 'animate-pulse' : ''}>
              {formattedPrice}
            </span>
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
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 dark:text-gray-400">Alert:</span>
              {isEditingAlert ? (
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={editAlertValue}
                    onChange={(e) => setEditAlertValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="w-24 px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveAlert}
                    className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                    title="Save"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelAlert}
                    className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Cancel"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEditAlert}
                  className="flex items-center space-x-2 text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-all group px-2 py-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                  title="Click to edit alert price"
                >
                  <span className="font-medium">${alertPrice.toFixed(2)}</span>
                  <Edit2 className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>
            {getAlertBadge()}
          </div>

          {/* Last Updated with real-time indicator */}
          {lastUpdated && (
            <div className="flex items-center justify-between pt-1">
              <div className={`flex items-center ${wasRecentlyUpdated ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}`}>
                <Clock className={`mr-1 w-3 h-3 ${wasRecentlyUpdated ? 'text-green-500' : ''}`} />
                <span className="hidden sm:inline">{new Date(lastUpdated).toLocaleTimeString()}</span>
                <span className="sm:hidden">{new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          )}
        </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="mt-4">
          <div className="w-full h-1 bg-gray-200 rounded-full">
            <div className="h-1 bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default StockCard;
