/**
 * Stock Cards Component
 * =====================
 *
 * Container component for displaying multiple stock cards
 * following the React Developer test requirements.
 */

'use client';

import React from 'react';

import { TrendingUp } from 'lucide-react';

import { StockCardsProps } from '@/core/types';

import { StockCard } from './StockCard';

/**
 * Stock Cards Component
 *
 * Displays a grid of stock cards with responsive layout.
 * Shows empty state when no stocks are being watched.
 */
export const StockCards: React.FC<StockCardsProps & { 
  'data-intro'?: string;
  'data-title'?: string;
  'data-step'?: string;
  'data-desktop-step'?: string;
  'data-mobile-step'?: string;
}> = ({
  stocks,
  onRemoveStock,
  className = '',
  ...props
}) => {
  // Empty state when no stocks
  if (stocks.length === 0) {
    return (
      <div
        className={`p-8 text-center bg-white rounded-lg shadow-sm dark:bg-gray-800 ${className}`}
        {...props}
      >
        <TrendingUp className='mx-auto mb-4 w-16 h-16 text-gray-400' />
        <h3
          className="mb-2 text-lg font-semibold text-gray-900 dark:text-white"
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
      className={`grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 ${className}`}
      {...props}
    >
      {stocks.map(stock => (
        <StockCard 
          key={`${stock.id}-${stock.lastUpdated || 0}`} 
          stock={stock} 
          onRemove={onRemoveStock}
        />
      ))}
    </div>
  );
};

export default StockCards;
