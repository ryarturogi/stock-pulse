/**
 * Stock Form Component
 * ====================
 *
 * Left form component for adding stocks to watchlist with price alerts
 * following the React Developer test requirements.
 */

'use client';

import { Plus, TrendingUp, AlertCircle } from 'lucide-react';
import React, { useState, useEffect, FormEvent } from 'react';

import { Button } from '@/shared/components/ui/Button';
import { StockFormProps, DEFAULT_STOCK_OPTIONS } from '@/core/types';
import { stockService } from '@/features/stocks/services/stockService';

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
  const [selectedStock, setSelectedStock] = useState('');
  const [alertPrice, setAlertPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [errors, setErrors] = useState<{
    stock?: string;
    price?: string;
  }>({});

  // Filter out stocks that are already being watched
  const availableStocksToShow = availableStocks.filter(
    stock => !watchedStocks.some(watched => watched.symbol === stock.symbol)
  );

  // Fetch current price when stock is selected
  useEffect(() => {
    if (selectedStock) {
      fetchCurrentPrice(selectedStock);
    } else {
      setCurrentPrice(null);
      setAlertPrice('');
    }
  }, [selectedStock]);

  // Clear errors when inputs change
  useEffect(() => {
    if (errors.stock && selectedStock) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.stock;
        return newErrors;
      });
    }
  }, [selectedStock, errors.stock]);

  useEffect(() => {
    if (errors.price && alertPrice) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.price;
        return newErrors;
      });
    }
  }, [alertPrice, errors.price]);

  /**
   * Fetch current price for selected stock
   */
  const fetchCurrentPrice = async (symbol: string) => {
    setIsLoadingPrice(true);
    try {
      const quote = await stockService.fetchStockQuote(symbol);
      setCurrentPrice(quote.current);
      console.log(`💰 Current price for ${symbol}: $${quote.current}`);
    } catch (error) {
      console.error(`Failed to fetch current price for ${symbol}:`, error);
      setCurrentPrice(null);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate stock selection
    if (!selectedStock.trim()) {
      newErrors.stock = 'Please select a stock';
    }

    // Validate alert price
    if (!alertPrice.trim()) {
      newErrors.price = 'Please enter an alert price';
    } else {
      const price = parseFloat(alertPrice);
      if (isNaN(price) || price <= 0 || price > 999999.99) {
        newErrors.price = 'Please enter a valid price (0.01 - 999,999.99)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const selectedStockData = availableStocks.find(
      stock => stock.symbol === selectedStock
    );
    if (!selectedStockData) {
      setErrors({ stock: 'Selected stock not found' });
      return;
    }

    const price = parseFloat(alertPrice);
    onAddStock(selectedStock, price);

    // Reset form
    setSelectedStock('');
    setAlertPrice('');
    setCurrentPrice(null);
    setErrors({});
  };

  /**
   * Handle stock selection change
   */
  const handleStockChange = (e: React.ChangeEvent<{ value: string }>) => {
    setSelectedStock(e.target.value);
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
      className={`w-80 min-h-screen bg-white shadow-sm dark:bg-gray-800 ${className}`}
    >
      <div className='p-6'>
        {/* Header */}
        <div className='flex items-center mb-8 space-x-2'>
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
        <div className='space-y-6'>
          <h2
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            Add Stock to Watch
          </h2>

          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Stock Selection */}
            <div>
              <label
                htmlFor='stock-select'
                className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Select Stock
              </label>
              <select
                id='stock-select'
                value={selectedStock}
                onChange={handleStockChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white dark:text-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${errors.stock ? 'border-red-300' : ''}`}
                disabled={isLoading}
              >
                <option value=''>Choose a stock...</option>
                {availableStocksToShow.length > 0 ? (
                  availableStocksToShow.map(stock => (
                    <option key={stock.symbol} value={stock.symbol}>
                      {stock.symbol} - {stock.name}
                    </option>
                  ))
                ) : (
                  <option value='' disabled>
                    All stocks are already being watched
                  </option>
                )}
              </select>
              {errors.stock && (
                <div className='flex items-center mt-1 text-sm text-red-600'>
                  <AlertCircle className='mr-1 w-4 h-4' />
                  {errors.stock}
                </div>
              )}
              {availableStocksToShow.length === 0 && (
                <div className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                  All available stocks are already being watched
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

          {/* Help Text */}
          <div className='p-4 mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
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
