'use client';

import React, { useEffect, useState } from 'react';
import {
  Search,
  Moon,
  RefreshCw
} from 'lucide-react';
import { 
  StockForm, 
  StockCards, 
  StockChart 
} from '@/components/stock';
import { 
  DEFAULT_STOCK_OPTIONS
} from '@/types';
import { stockService } from '@/services';
import { useStockStore } from '@/stores/stockStore';

// Use default stock options from types
const availableStocks = DEFAULT_STOCK_OPTIONS;


export default function HomePage() {
  // Use Zustand store for persistence
  const { 
    watchedStocks, 
    webSocketStatus, 
    addStock, 
    removeStock, 
    updateStockPrice,
    connectWebSocket,
    disconnectWebSocket,
    clearError,
    error
  } = useStockStore();
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Connect WebSocket when component mounts
  useEffect(() => {
    if (watchedStocks.length > 0) {
      connectWebSocket();
    }
    
    // Cleanup on unmount
    return () => {
      disconnectWebSocket();
    };
  }, [watchedStocks.length, connectWebSocket, disconnectWebSocket]);

  /**
   * Handle adding a new stock to watchlist
   */
  const handleAddStock = async (symbol: string, alertPrice: number) => {
    const stock = availableStocks.find(s => s.symbol === symbol);
    if (!stock) {
      console.error('Stock not found:', symbol);
      return;
    }

    try {
      // Add stock to store (this will persist to localStorage)
      addStock(symbol, stock.name, alertPrice);

      // Fetch real data from Finnhub API
      try {
        const quoteData = await stockService.fetchStockQuote(symbol);
        
        if (quoteData && quoteData.current) {
          const now = Date.now();
          
          // Generate initial price history for the chart (last 20 data points)
          const priceHistory = [];
          const basePrice = quoteData.current;
          
          for (let i = 0; i < 20; i++) {
            const time = now - (i * 60000); // 1 minute intervals going back
            const price = basePrice + (Math.random() - 0.5) * (basePrice * 0.02); // 2% variation
            priceHistory.push({ time, price });
          }
          
          // Update stock with real data (this will also update price history)
          updateStockPrice(symbol, {
            symbol,
            current: quoteData.current,
            change: quoteData.change,
            percentChange: quoteData.percentChange,
            high: quoteData.high,
            low: quoteData.low,
            open: quoteData.open,
            previousClose: quoteData.previousClose,
            timestamp: now
          });
        } else {
          throw new Error('No data received from API');
        }
      } catch (apiError) {
        console.error('Failed to fetch stock data:', apiError);
        
        // Fallback to mock data if API fails
        const basePrice = 150 + Math.random() * 50;
        const now = Date.now();
        
        const mockPriceHistory = [];
        for (let i = 0; i < 20; i++) {
          const time = now - (i * 60000);
          const price = basePrice + (Math.random() - 0.5) * 10;
          mockPriceHistory.push({ time, price });
        }
        
        // Update with mock data
        updateStockPrice(symbol, {
          symbol,
          current: basePrice,
          change: (Math.random() - 0.5) * 5,
          percentChange: (Math.random() - 0.5) * 3,
          high: basePrice + 5,
          low: basePrice - 5,
          open: basePrice,
          previousClose: basePrice,
          timestamp: now
        });
      }

    } catch (error) {
      console.error('Failed to add stock:', error);
      // Remove the stock if there was an error
      removeStock(symbol);
    }
  };

  /**
   * Handle removing a stock
   */
  const handleRemoveStock = (symbol: string) => {
    removeStock(symbol);
  };

  /**
   * Handle manual refresh
   */
  const handleManualRefresh = async () => {
    // Refresh all watched stocks with real API data
    const refreshPromises = watchedStocks.map(async (stock) => {
      try {
        const quoteData = await stockService.fetchStockQuote(stock.symbol);
        
        if (quoteData && quoteData.current) {
          // Update stock price in store (this will persist to localStorage)
          updateStockPrice(stock.symbol, {
            symbol: stock.symbol,
            current: quoteData.current,
            change: quoteData.change,
            percentChange: quoteData.percentChange,
            high: quoteData.high,
            low: quoteData.low,
            open: quoteData.open,
            previousClose: quoteData.previousClose,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error(`Failed to refresh ${stock.symbol}:`, error);
      }
    });
    
    try {
      await Promise.all(refreshPromises);
    } catch (error) {
      console.error('Failed to refresh stocks:', error);
    }
  };

  /**
   * Handle theme toggle
   */
  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    // Toggle dark class on document element
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  /**
   * Handle search input change
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  /**
   * Filter watched stocks based on search query
   */
  const filteredWatchedStocks = watchedStocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Left Sidebar - Stock Form */}
        <StockForm
          availableStocks={availableStocks}
          onAddStock={handleAddStock}
          watchedStocks={watchedStocks}
        />

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Navigation */}
          <header className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm border-b">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search stocks..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-96 pl-10 pr-16 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-gray-500 dark:text-gray-400">⌘ K</span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleManualRefresh}
                  className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
                  title="Refresh stock data"
                >
                  <RefreshCw className="text-gray-500 w-5 h-5" />
                </button>


                <button 
                  onClick={handleThemeToggle}
                  className="p-2 hover:bg-gray-100 rounded"
                  title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  <Moon className="w-5 h-5 text-gray-500 dark:text-yellow-500" />
                </button>
              </div>
            </div>
              </header>

              {/* Error Display */}
              {error && (
                <div className="border-l-4 p-4 mx-6 mt-4 bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-500">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                    <div className="ml-auto pl-3">
                      <div className="-mx-1.5 -my-1.5">
                        <button
                          onClick={clearError}
                          className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 focus:ring-offset-red-50 dark:focus:ring-offset-gray-800"
                        >
                          <span className="sr-only">Dismiss</span>
                          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dashboard Content */}
              <main className="p-6">
                {/* Search Results Info */}
                {searchQuery && (
                  <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 dark:border dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      Showing {filteredWatchedStocks.length} of {watchedStocks.length} stocks matching "{searchQuery}"
                    </p>
                  </div>
                )}

                {/* Top Stock Cards */}
                <StockCards
                  stocks={filteredWatchedStocks}
                  onRemoveStock={handleRemoveStock}
                  className="mb-8"
                />

                {/* Stock Price Chart */}
                <StockChart
                  stocks={filteredWatchedStocks}
                  height={320}
                />
          </main>
        </div>
      </div>
    </div>
  );
}