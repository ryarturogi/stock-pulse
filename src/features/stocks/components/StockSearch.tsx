/**
 * Stock Search Component
 * =====================
 *
 * Search bar component for finding stocks using Finnhub API
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';

import { Search, X, Plus, TrendingUp } from 'lucide-react';

import { StockOption } from '@/core/types';
import { stockService } from '@/features/stocks/services';

interface StockSearchProps {
  onSelectStock: (
    _symbol: string,
    _alertPrice: number,
    _stockName?: string
  ) => void;
  watchedStocks?: { symbol: string }[];
  className?: string;
  'data-intro'?: string;
  'data-title'?: string;
  'data-step'?: string;
}

/**
 * Stock Search Component
 *
 * Provides real-time search functionality for stock symbols
 */
export const StockSearch: React.FC<StockSearchProps> = ({
  onSelectStock,
  watchedStocks = [],
  className = '',
  ...props
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Debounced search
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.trim().length < 1) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = await stockService.searchStocks(searchQuery);

        // Filter out already watched stocks and deduplicate by symbol
        const filteredResults = searchResults
          .filter(
            stock =>
              !watchedStocks.some(watched => watched.symbol === stock.symbol)
          )
          .reduce((acc, stock) => {
            // Check if we already have this symbol
            const existingIndex = acc.findIndex(
              item => item.symbol === stock.symbol
            );
            if (existingIndex === -1) {
              acc.push(stock);
            } else {
              // Update existing stock with better name if available
              const existing = acc[existingIndex];
              if (stock.name && stock.name.length > existing.name.length) {
                existing.name = stock.name;
              }
            }
            return acc;
          }, [] as StockOption[]);

        setResults(filteredResults);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [watchedStocks]
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isExpanded || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelectStock(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsExpanded(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle stock selection
  const handleSelectStock = async (stock: StockOption) => {
    try {
      // Fetch current price to suggest as alert price
      const quote = await stockService.fetchStockQuote(stock.symbol);
      const suggestedPrice = quote.current;

      onSelectStock(stock.symbol, suggestedPrice, stock.name);

      // Reset search
      setQuery('');
      setResults([]);
      setIsExpanded(false);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Failed to fetch stock price:', error);
      // Still add with default price
      onSelectStock(stock.symbol, 100, stock.name);

      // Reset search
      setQuery('');
      setResults([]);
      setIsExpanded(false);
      setSelectedIndex(-1);
    }
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsExpanded(false);
    setSelectedIndex(-1);
  };

  return (
    <div className={`relative ${className}`} {...props}>
      {/* Search Input */}
      <div className='relative'>
        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
          <Search className='h-4 w-4 text-gray-400' />
        </div>
        <input
          type='text'
          placeholder='Search stocks...'
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsExpanded(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsExpanded(true)}
          onKeyDown={handleKeyDown}
          className='w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white dark:text-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400'
        />
        {query && (
          <button
            onClick={clearSearch}
            className='absolute inset-y-0 right-0 pr-3 flex items-center'
          >
            <X className='h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300' />
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className='absolute top-full left-0 right-0 mt-1 p-2 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50'>
          <div className='flex items-center justify-center'>
            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600' />
            <span className='ml-2 text-sm text-gray-500 dark:text-gray-400'>
              Searching...
            </span>
          </div>
        </div>
      )}

      {/* Search Results */}
      {isExpanded && !isLoading && results.length > 0 && (
        <div className='absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto'>
          {results.map((stock, index) => (
            <div
              key={stock.symbol}
              className={`px-3 py-2 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                index === selectedIndex
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleSelectStock(stock)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectStock(stock);
                }
              }}
              role='button'
              tabIndex={0}
              aria-label={`Select ${stock.symbol} - ${stock.name}`}
            >
              <div className='flex items-center justify-between'>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center space-x-2'>
                    <span className='font-medium text-gray-900 dark:text-white'>
                      {stock.symbol}
                    </span>
                    <span className='text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded'>
                      {stock.exchange}
                    </span>
                  </div>
                  <p className='text-sm text-gray-500 dark:text-gray-400 truncate'>
                    {stock.name}
                  </p>
                </div>
                <Plus className='w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0' />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {isExpanded && !isLoading && query.trim() && results.length === 0 && (
        <div className='absolute top-full left-0 right-0 mt-1 p-3 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50'>
          <div className='text-center text-gray-500 dark:text-gray-400'>
            <TrendingUp className='w-8 h-8 mx-auto mb-2 opacity-50' />
            <p className='text-sm'>No stocks found for &ldquo;{query}&rdquo;</p>
            <p className='text-xs mt-1'>
              Try searching with a stock symbol or company name
            </p>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isExpanded && (
        <div
          className='fixed inset-0 z-40'
          onClick={() => {
            setIsExpanded(false);
            setSelectedIndex(-1);
          }}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              setIsExpanded(false);
              setSelectedIndex(-1);
            }
          }}
          role='button'
          tabIndex={0}
          aria-label='Close search results'
        />
      )}
    </div>
  );
};

export default StockSearch;
