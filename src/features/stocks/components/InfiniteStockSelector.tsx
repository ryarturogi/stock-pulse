/**
 * Infinite Stock Selector Component
 * ================================
 *
 * Enhanced stock selector with infinite loading and search functionality
 */

'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';

import { ChevronDown, Search, X, Loader2, AlertCircle } from 'lucide-react';

import { StockOption } from '@/core/types';
import { stockService } from '@/features/stocks/services';

interface InfiniteStockSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  watchedStocks?: { symbol: string }[];
  className?: string;
  'data-step'?: string;
  'data-desktop-step'?: string;
  'data-mobile-step'?: string;
  'data-intro'?: string;
  'data-title'?: string;
}

interface PaginationState {
  page: number;
  hasMore: boolean;
  total: number;
}

/**
 * Infinite Stock Selector Component
 *
 * Provides a searchable dropdown with infinite loading capabilities
 */
export const InfiniteStockSelector: React.FC<InfiniteStockSelectorProps> = ({
  value = '',
  onChange,
  placeholder = 'Choose a stock...',
  disabled = false,
  error = '',
  watchedStocks = [],
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stocks, setStocks] = useState<StockOption[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<StockOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    hasMore: true,
    total: 0,
  });
  const [loadError, setLoadError] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // Selected stock display
  const selectedStock = useMemo(() => {
    return stocks.find(stock => stock.symbol === value);
  }, [stocks, value]);

  // Filter out watched stocks
  const availableStocks = useMemo(() => {
    return stocks.filter(
      stock => !watchedStocks.some(watched => watched.symbol === stock.symbol)
    );
  }, [stocks, watchedStocks]);

  // Apply search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStocks(availableStocks);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredStocks(
        availableStocks.filter(
          stock =>
            stock.symbol.toLowerCase().includes(query) ||
            stock.name.toLowerCase().includes(query)
        )
      );
    }
    setSelectedIndex(-1);
  }, [availableStocks, searchQuery]);

  // Load stocks
  const loadStocks = useCallback(
    async (page: number, search: string = '', reset: boolean = false) => {
      try {
        if (page === 1) {
          setIsLoading(true);
          setLoadError('');
        } else {
          setIsLoadingMore(true);
        }

        const result = await stockService.getAvailableStocks({
          page,
          limit: 50,
          search: search.trim(),
        });

        // Defensive check for result structure
        if (!result || !Array.isArray(result.data)) {
          console.error('Invalid API response structure:', result);
          throw new Error('Invalid response from stock service');
        }

        if (reset || page === 1) {
          setStocks(result.data);
        } else {
          setStocks(prev => [...prev, ...result.data]);
        }

        // Defensive check for pagination object
        if (result.pagination && typeof result.pagination === 'object') {
          setPagination({
            page: result.pagination.page || page,
            hasMore: result.pagination.hasMore || false,
            total: result.pagination.total || result.data.length,
          });
        } else {
          // Fallback pagination if not provided
          console.warn('No pagination data in response, using fallback');
          setPagination({
            page: page,
            hasMore: result.data.length >= 50, // Assume more if we got a full page
            total: result.data.length,
          });
        }
      } catch (error) {
        console.error('Failed to load stocks:', error);
        setLoadError('Failed to load stocks. Please try again.');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    loadStocks(1);
  }, [loadStocks]);

  // Search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== '') {
        // Reset and search with API
        loadStocks(1, searchQuery, true);
      } else if (stocks.length === 0) {
        // Reload initial data if no stocks
        loadStocks(1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, loadStocks, stocks.length]);

  // Intersection Observer for infinite loading
  useEffect(() => {
    if (!loadMoreTriggerRef.current || !pagination.hasMore || isLoadingMore)
      return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && pagination.hasMore && !isLoadingMore) {
          loadStocks(pagination.page + 1, searchQuery);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreTriggerRef.current);

    return () => observer.disconnect();
  }, [
    pagination.hasMore,
    pagination.page,
    isLoadingMore,
    searchQuery,
    loadStocks,
  ]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
        setSelectedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        setSelectedIndex(-1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredStocks.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredStocks.length) {
          handleSelectStock(filteredStocks[selectedIndex]);
        }
        break;
    }
  };

  // Handle stock selection
  const handleSelectStock = (stock: StockOption) => {
    onChange(stock.symbol);
    setIsOpen(false);
    setSearchQuery('');
    setSelectedIndex(-1);
  };

  // Clear selection
  const clearSelection = () => {
    onChange('');
    setSearchQuery('');
  };

  // Open dropdown and focus search
  const openDropdown = () => {
    if (disabled) return;
    setIsOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`} {...props}>
      {/* Selector Container */}
      <div
        className={`relative w-full px-3 py-2 text-left bg-white dark:bg-gray-700 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-colors ${
          error
            ? 'border-red-300 dark:border-red-600'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className='flex items-center justify-between'>
          {/* Main clickable area */}
          <div
            className='flex-1 cursor-pointer'
            onClick={openDropdown}
            onKeyDown={handleKeyDown}
            tabIndex={disabled ? -1 : 0}
            role='button'
            aria-haspopup='listbox'
            aria-expanded={isOpen}
            aria-disabled={disabled}
          >
            <span
              className={`truncate block ${
                value
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {selectedStock
                ? `${selectedStock.symbol} - ${selectedStock.name}`
                : placeholder}
            </span>
          </div>

          {/* Action buttons */}
          <div className='flex items-center space-x-1 ml-2'>
            {value && !disabled && (
              <button
                type='button'
                onClick={clearSelection}
                className='p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors'
                aria-label='Clear selection'
              >
                <X className='w-4 h-4 text-gray-400' />
              </button>
            )}
            <div
              className='cursor-pointer p-1'
              onClick={openDropdown}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openDropdown();
                }
              }}
              role='button'
              tabIndex={0}
              aria-label='Open stock selector'
            >
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  isOpen ? 'transform rotate-180' : ''
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className='flex items-center mt-1 text-sm text-red-600 dark:text-red-400'>
          <AlertCircle className='mr-1 w-4 h-4' />
          {error}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className='absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-80 flex flex-col'>
          {/* Search Bar */}
          <div className='p-2 border-b border-gray-200 dark:border-gray-700'>
            <div className='relative'>
              <Search className='absolute left-3 top-2.5 w-4 h-4 text-gray-400' />
              <input
                ref={searchInputRef}
                type='text'
                placeholder='Search stocks...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className='w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400'
              />
            </div>
            {pagination.total > 0 && (
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                {filteredStocks.length} of {pagination.total} stocks
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            )}
          </div>

          {/* Options List */}
          <div ref={listRef} className='flex-1 overflow-y-auto'>
            {loadError && (
              <div className='p-4 text-center text-red-600 dark:text-red-400'>
                <AlertCircle className='w-6 h-6 mx-auto mb-2' />
                <p className='text-sm'>{loadError}</p>
                <button
                  onClick={() => loadStocks(1, searchQuery, true)}
                  className='mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline'
                >
                  Try again
                </button>
              </div>
            )}

            {isLoading && stocks.length === 0 ? (
              <div className='p-4 text-center'>
                <Loader2 className='w-6 h-6 mx-auto mb-2 animate-spin text-blue-600' />
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Loading stocks...
                </p>
              </div>
            ) : filteredStocks.length === 0 ? (
              <div className='p-4 text-center text-gray-500 dark:text-gray-400'>
                <p className='text-sm'>
                  {searchQuery
                    ? `No stocks found for "${searchQuery}"`
                    : 'No stocks available'}
                </p>
              </div>
            ) : (
              <>
                {filteredStocks.map((stock, index) => (
                  <button
                    key={stock.symbol}
                    type='button'
                    onClick={() => handleSelectStock(stock)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                      index === selectedIndex
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : ''
                    }`}
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
                    </div>
                  </button>
                ))}

                {/* Load More Trigger */}
                {pagination.hasMore && (
                  <div ref={loadMoreTriggerRef} className='p-4 text-center'>
                    {isLoadingMore ? (
                      <div className='flex items-center justify-center'>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin text-blue-600' />
                        <span className='text-sm text-gray-500 dark:text-gray-400'>
                          Loading more...
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          loadStocks(pagination.page + 1, searchQuery)
                        }
                        className='text-sm text-blue-600 dark:text-blue-400 hover:underline'
                      >
                        Load more stocks
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InfiniteStockSelector;
