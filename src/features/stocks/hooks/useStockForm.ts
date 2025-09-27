/**
 * useStockForm Hook
 * =================
 *
 * Custom hook for managing stock form state and validation.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

import { validateStockForm } from '@/core/utils/validation';
import { stockService } from '@/features/stocks/services/stockService';

export interface StockFormState {
  selectedStock: string;
  alertPrice: string;
  currentPrice: number | null;
  isLoadingPrice: boolean;
  errors: {
    stock?: string;
    price?: string;
  };
  setSelectedStock: (_stock: string) => void;
  setAlertPrice: (_price: string) => void;
  validateForm: () => boolean;
  resetForm: () => void;
  fetchCurrentPrice: (_symbol: string) => Promise<void>;
}

/**
 * useStockForm Hook
 *
 * Provides stock form management with:
 * - Form state management
 * - Price fetching
 * - Form validation
 * - Error handling
 *
 * @returns StockFormState object with form state and actions
 */
export const useStockForm = (): StockFormState => {
  const [selectedStock, setSelectedStock] = useState('');
  const [alertPrice, setAlertPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [errors, setErrors] = useState<{
    stock?: string;
    price?: string;
  }>({});

  // Clear errors when inputs change
  useEffect(() => {
    if (errors.stock && selectedStock.trim()) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.stock;
        return newErrors;
      });
    }
  }, [selectedStock, errors.stock]);

  useEffect(() => {
    if (errors.price && alertPrice.trim()) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.price;
        return newErrors;
      });
    }
  }, [alertPrice, errors.price]);

  // Fetch current price for selected stock
  const fetchCurrentPrice = useCallback(async (symbol: string) => {
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
  }, []);

  // Validate form inputs
  const validateForm = useCallback((): boolean => {
    const validation = validateStockForm({
      symbol: selectedStock,
      alertPrice: alertPrice,
    });

    const newErrors: typeof errors = {};

    if (!validation.isValid) {
      if (validation.errors.symbol) {
        newErrors.stock = validation.errors.symbol;
      }
      if (validation.errors.alertPrice) {
        newErrors.price = validation.errors.alertPrice;
      }
    }

    setErrors(newErrors);
    return validation.isValid;
  }, [selectedStock, alertPrice]);

  // Reset form
  const resetForm = useCallback(() => {
    setSelectedStock('');
    setAlertPrice('');
    setCurrentPrice(null);
    setErrors({});
  }, []);

  return {
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
  };
};

export default useStockForm;
