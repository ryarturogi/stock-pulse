/**
 * Stock Form Component
 * ====================
 *
 * Left form component for adding stocks to watchlist with price alerts
 * following the React Developer test requirements.
 */

'use client';

import React, { useEffect, FormEvent } from 'react';

import { Plus, TrendingUp, AlertCircle } from 'lucide-react';

import { DEFAULT_STOCK_OPTIONS } from '@/core/constants/constants';
import { StockFormProps, StockOption } from '@/core/types';
import { useStockForm } from '@/features/stocks/hooks';
import { stockService } from '@/features/stocks/services';
import { Button } from '@/shared/components/ui/Button';

import { InfiniteStockSelector } from './InfiniteStockSelector';
import { StockSearch } from './StockSearch';

/**
 * Stock Form Component
 *
 * Provides a form for selecting stocks and setting price alerts.
 * Includes validation and error handling.
 */
export const StockForm: React.FC<StockFormProps> = ({
  availableStocks = DEFAULT_STOCK_OPTIONS,
  onAddStock,
  watchedStocks = [],
  isLoading = false,
  className = '',
}) => {
  const [allAvailableStocks, setAllAvailableStocks] = React.useState<StockOption[]>(availableStocks);
  const [isLoadingStocks, setIsLoadingStocks] = React.useState(false);

  const {
    selectedStock,
    alertPrice,
    currentPrice,
    isLoadingPrice,
    errors,
    setSelectedStock,
    setAlertPrice,
    validateForm,
    resetForm,
    fetchCurrentPrice,
  } = useStockForm();

  // Load available stocks from Finnhub API (for legacy dropdown fallback)
  useEffect(() => {
    const loadAvailableStocks = async () => {
      setIsLoadingStocks(true);
      try {
        const stocks = await stockService.getAvailableStocksLegacy();
        setAllAvailableStocks(stocks);
      } catch (error) {
        console.error('Failed to load available stocks:', error);
        // Keep default stocks as fallback
        setAllAvailableStocks(availableStocks);
      } finally {
        setIsLoadingStocks(false);
      }
    };

    loadAvailableStocks();
  }, [availableStocks]);

  // Filter out stocks that are already being watched (for legacy dropdown)
  const availableStocksToShow = allAvailableStocks.filter(
    stock => !watchedStocks.some(watched => watched.symbol === stock.symbol)
  );

  // Fetch current price when stock is selected
  useEffect(() => {
    if (selectedStock) {
      fetchCurrentPrice(selectedStock);
    } else {
      setAlertPrice('');
    }
  }, [selectedStock, fetchCurrentPrice, setAlertPrice]);


  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Try to find stock info in the loaded stocks
    const selectedStockData = allAvailableStocks.find(
      stock => stock.symbol === selectedStock
    );

    const price = parseFloat(alertPrice);
    
    // Pass stock name if found, otherwise let handleAddStock figure it out
    const stockName = selectedStockData?.name;
    onAddStock(selectedStock, price, stockName);

    // Reset form
    resetForm();
  };

  /**
   * Handle stock selection from search
   */
  const handleSearchStockSelect = async (symbol: string, alertPrice: number, stockName?: string) => {
    // Call the parent's onAddStock function
    onAddStock(symbol, alertPrice, stockName);
  };

  /**
   * Handle alert price change
   */
  const handlePriceChange = (e: React.ChangeEvent<{ value: string }>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAlertPrice(value as string);
    }
  };


  return (
    <div
      className={`w-full h-full bg-white shadow-sm dark:bg-gray-800 ${className}`}
    >
      <div className='p-4 lg:p-6'>
        {/* Header - Hidden on mobile since it's in the main header */}
        <div className='hidden lg:flex items-center mb-8 space-x-2'>
          <div className='flex justify-center items-center w-8 h-8 bg-blue-600 rounded-lg'>
            <TrendingUp className='w-4 h-4 text-white' />
          </div>
          <span
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            StockPulse
          </span>
        </div>

        {/* Form */}
        <div className='space-y-4 lg:space-y-6'>
          <h2
            className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white"
          >
            Add Stock to Watch
          </h2>

          {/* Stock Search */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Search & Add Stock
            </label>
            <StockSearch
              onSelectStock={handleSearchStockSelect}
              watchedStocks={watchedStocks}
              className="mb-4"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Search for any stock symbol or company name
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                or select from popular stocks
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Enhanced Stock Selection with Infinite Loading */}
            <div>
              <label
                htmlFor='stock-selector'
                className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Select Stock
              </label>
              <InfiniteStockSelector
                value={selectedStock}
                onChange={setSelectedStock}
                placeholder="Choose a stock..."
                disabled={isLoading}
                error={errors.stock || ''}
                watchedStocks={watchedStocks}
              />
              {availableStocksToShow.length === 0 && !isLoadingStocks && (
                <div className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                  All default stocks are being watched. Use the search above to find more stocks.
                </div>
              )}
            </div>

            {/* Alert Price */}
            <div>
              <label
                htmlFor='price-alert'
                className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Price Alert ($)
              </label>
              <div className="relative">
                <input
                  id='price-alert'
                  type='text'
                  placeholder={currentPrice ? `Current: $${currentPrice.toFixed(2)}` : 'Enter alert price'}
                  value={alertPrice}
                  onChange={handlePriceChange}
                  className={`w-full px-3 py-2 pr-20 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 bg-white dark:text-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${errors.price ? 'border-red-300' : ''}`}
                  disabled={isLoading}
                />
                {currentPrice && !alertPrice && (
                  <button
                    type="button"
                    onClick={() => setAlertPrice(currentPrice.toFixed(2))}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                    disabled={isLoading}
                  >
                    Use Current
                  </button>
                )}
              </div>
              {currentPrice && (
                <p className='mt-1 text-xs text-green-600 dark:text-green-400'>
                  💰 Current price: ${currentPrice.toFixed(2)}
                  {isLoadingPrice && ' (loading...)'}
                </p>
              )}
              {errors.price && (
                <div className='flex items-center mt-1 text-sm text-red-600'>
                  <AlertCircle className='mr-1 w-4 h-4' />
                  {errors.price}
                </div>
              )}
              <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                You&apos;ll be notified when the price goes above this level
              </p>
              <p className='mt-1 text-xs text-blue-600 dark:text-blue-400'>
                💡 Enable notifications in the header to receive price alerts
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type='submit'
              variant='primary'
              size='lg'
              className='w-full'
              disabled={!selectedStock || !alertPrice || isLoading}
              loading={isLoading}
              leftIcon={<Plus className='w-4 h-4' />}
            >
              Add to Watchlist
            </Button>
          </form>

          {/* Help Text - Hidden on mobile to save space */}
          <div className='hidden lg:block p-4 mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
            <h3 className='mb-2 text-sm font-medium text-blue-900 dark:text-blue-300'>
              How it works:
            </h3>
            <ul className='space-y-1 text-xs text-blue-800 dark:text-blue-200'>
              <li>• Select a stock from the dropdown</li>
              <li>• Set your desired price alert level</li>
              <li>• Enable notifications in the header for alerts</li>
              <li>• Get real-time updates and price notifications</li>
              <li>• Track price movements on the chart</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockForm;
