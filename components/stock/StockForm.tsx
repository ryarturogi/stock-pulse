/**
 * Stock Form Component
 * ====================
 *
 * Left form component for adding stocks to watchlist with price alerts
 * following the React Developer test requirements.
 */

'use client';

import { Plus, TrendingUp, AlertCircle } from 'lucide-react';
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import type { HTMLSelectElement, HTMLInputElement } from 'react';

import { Button } from '@/components/ui/Button';
import { StockFormProps, StockOption, DEFAULT_STOCK_OPTIONS } from '@/types';
// import { stockService } from '@/services/stockService';

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
  const [errors, setErrors] = useState<{
    stock?: string;
    price?: string;
  }>({});

  // Filter out stocks that are already being watched
  const availableStocksToShow = availableStocks.filter(
    stock => !watchedStocks.some(watched => watched.symbol === stock.symbol)
  );

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
    setErrors({});
  };

  /**
   * Handle stock selection change
   */
  const handleStockChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedStock(e.target.value);
  };

  /**
   * Handle alert price change
   */
  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAlertPrice(value);
    }
  };


  return (
    <div
      className={`w-80 shadow-sm min-h-screen bg-white dark:bg-gray-800 ${className}`}
    >
      <div className='p-6'>
        {/* Header */}
        <div className='flex items-center mb-8 space-x-2'>
          <div className='flex justify-center items-center w-8 h-8 bg-blue-600 rounded-lg'>
            <TrendingUp className='w-4 h-4 text-white' />
          </div>
          <span
            className="font-semibold text-lg text-gray-900 dark:text-white"
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
                className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
              >
                Select Stock
              </label>
              <select
                id='stock-select'
                value={selectedStock}
                onChange={handleStockChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${errors.stock ? 'border-red-300' : ''}`}
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
                className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
              >
                Price Alert ($)
              </label>
              <input
                id='price-alert'
                type='text'
                placeholder='Enter alert price'
                value={alertPrice}
                onChange={handlePriceChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${errors.price ? 'border-red-300' : ''}`}
                disabled={isLoading}
              />
              {errors.price && (
                <div className='flex items-center mt-1 text-sm text-red-600'>
                  <AlertCircle className='mr-1 w-4 h-4' />
                  {errors.price}
                </div>
              )}
              <p className='mt-1 text-xs text-gray-500'>
                You&apos;ll be notified when the price goes above this level
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
          <div className='p-4 mt-6 bg-blue-50 rounded-lg'>
            <h3 className='mb-2 text-sm font-medium text-blue-900'>
              How it works:
            </h3>
            <ul className='space-y-1 text-xs text-blue-800'>
              <li>• Select a stock from the dropdown</li>
              <li>• Set your desired price alert level</li>
              <li>• Get real-time updates and notifications</li>
              <li>• Track price movements on the chart</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockForm;
