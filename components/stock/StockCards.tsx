/**
 * Stock Cards Component
 * =====================
 *
 * Container component for displaying multiple stock cards
 * following the React Developer test requirements.
 */

'use client';

import { TrendingUp } from 'lucide-react';
import React from 'react';

import { StockCardsProps } from '@/types';

import { StockCard } from './StockCard';

/**
 * Stock Cards Component
 *
 * Displays a grid of stock cards with responsive layout.
 * Shows empty state when no stocks are being watched.
 */
export const StockCards: React.FC<StockCardsProps> = ({
  stocks,
  onRemoveStock,
  className = '',
}) => {
  // Empty state when no stocks
  if (stocks.length === 0) {
    return (
      <div
        className={`rounded-lg p-8 shadow-sm text-center bg-white dark:bg-gray-800 ${className}`}
      >
        <TrendingUp className='mx-auto mb-4 w-16 h-16 text-gray-400' />
        <h3
          className="text-lg font-semibold mb-2 text-gray-900 dark:text-white"
        >
          No stocks being watched
        </h3>
        <p className="text-gray-500 dark:text-gray-300">
          Add a stock from the sidebar to get started with real-time tracking
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 ${className}`}
    >
      {stocks.map(stock => (
        <StockCard key={stock.id} stock={stock} onRemove={onRemoveStock} />
      ))}
    </div>
  );
};

export default StockCards;
