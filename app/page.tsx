'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Search, 
  Moon, 
  RefreshCw,
  Bell,
  BellOff,
  Menu,
  X,
  TrendingUp,
  Plus
} from 'lucide-react';
import { 
  StockForm, 
  StockCards, 
  StockChart,
  RefreshIntervalSelector,
  SlideOutSidebar,
  stockService,
  useStockStore
} from '@/features/stocks';
import { 
  DEFAULT_STOCK_OPTIONS
} from '@/core/types';
import { 
  useSidebar, 
  useTheme, 
  useNotifications, 
  useSearch 
} from '@/shared/hooks';

// Use default stock options from types
const availableStocks = DEFAULT_STOCK_OPTIONS;


export default function HomePage() {
  // Use Zustand store for persistence
  const { 
    watchedStocks, 
    addStock, 
    removeStock, 
    updateStockPrice, 
    connectWebSocket, 
    disconnectWebSocket, 
    startPeriodicRefresh,
    stopPeriodicRefresh,
    clearError, 
    error,
    refreshTimeInterval,
    setRefreshTimeInterval,
    webSocketStatus,
    isLiveDataEnabled,
    setLiveDataEnabled
  } = useStockStore();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Custom hooks
  const { isOpen: isSidebarOpen, open: openSidebar, close: closeSidebar } = useSidebar();
  const { isDarkMode, toggle: toggleTheme } = useTheme();
  const { 
    permission: notificationPermission, 
    isEnabled: notificationsEnabled, 
    requestPermission: requestNotificationPermission,
    toggleNotifications: handleToggleNotifications 
  } = useNotifications();
  
  // Search functionality
  const { query: searchQuery, setQuery: setSearchQuery, filteredItems: filteredWatchedStocks } = useSearch(
    watchedStocks,
    (stock, query) => 
      stock.symbol.toLowerCase().includes(query) ||
      stock.name.toLowerCase().includes(query)
  );


  // Use ref to track connection state and prevent multiple calls
  const isConnectedRef = useRef(false);

  // Connect WebSocket when stocks are added (periodic refresh as fallback)
  useEffect(() => {
    if (watchedStocks.length > 0) {
      // Only connect if not already connected
      if (!isConnectedRef.current) {
        console.log('🔌 Initializing WebSocket connection for real-time data...');
        connectWebSocket();
        isConnectedRef.current = true;
      }
    } else {
      // If no stocks, disconnect and stop refresh
      if (isConnectedRef.current) {
        console.log('🔌 Cleaning up WebSocket connection...');
        disconnectWebSocket();
        stopPeriodicRefresh();
        isConnectedRef.current = false;
      }
    }
    
    // Cleanup on unmount
    return () => {
      disconnectWebSocket();
      stopPeriodicRefresh();
      isConnectedRef.current = false;
    };
  }, [watchedStocks.length]); // Only depend on watchedStocks.length

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
      // Request notification permission when user adds their first stock
      if (watchedStocks.length === 0) {
        try {
          const permission = await requestNotificationPermission();
          
          if (permission === 'granted') {
            console.log('✅ Webpush notification permission granted! You will receive price alerts.');
          } else if (permission === 'denied') {
            console.log('❌ Notification permission denied. You can enable it later in browser settings.');
          } else {
            console.log('⏳ Notification permission dismissed. You can enable it later.');
          }
        } catch (error) {
          console.error('Failed to request notification permission:', error);
        }
      }

      // Add stock to store (this will persist to localStorage)
      addStock(symbol, stock.name, alertPrice);
      
      // Close sidebar on mobile/tablet after adding stock
      closeSidebar();

      // Immediately fetch real data for the new stock
      console.log(`✅ Added ${symbol} to watchlist. Fetching initial data...`);
      
      // Small delay to ensure the stock appears in UI before data loads
      setTimeout(async () => {
        try {
          const quoteData = await stockService.fetchStockQuote(symbol);
          
          if (quoteData && quoteData.current) {
            // Update stock price in store (this will persist to localStorage)
            updateStockPrice(symbol, {
              symbol: symbol,
              current: quoteData.current,
              change: quoteData.change,
              percentChange: quoteData.percentChange,
              high: quoteData.high,
              low: quoteData.low,
              open: quoteData.open,
              previousClose: quoteData.previousClose,
              timestamp: Date.now()
            });
            console.log(`💰 Initial data loaded for ${symbol}: $${quoteData.current}`);
          }
        } catch (error) {
          console.error(`Failed to fetch initial data for ${symbol}:`, error);
          // Don't throw error - periodic refresh will retry
        }
      }, 100);

    } catch (error) {
      console.error('Failed to add stock:', error);
    }
  };

  /**
   * Handle removing a stock
   */
  const handleRemoveStock = (symbol: string) => {
    removeStock(symbol);
  };

  // Add debouncing to prevent rapid manual refresh calls
  const lastManualRefreshRef = useRef<number>(0);
  const manualRefreshCooldown = 5000; // 5 second cooldown

  /**
   * Handle manual refresh with debouncing
   */
  const handleManualRefresh = useCallback(async () => {
    const now = Date.now();
    
    // Check if cooldown period has passed
    if (now - lastManualRefreshRef.current < manualRefreshCooldown) {
      console.log('⏱️ Manual refresh on cooldown, skipping...');
      return;
    }
    
    lastManualRefreshRef.current = now;
    console.log('🔄 Manual refresh triggered...');
    
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
  }, [watchedStocks, updateStockPrice]);


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col lg:flex-row">
        {/* Slide Out Sidebar - Stock Form */}
        <SlideOutSidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          className="lg:w-80"
        >
          <StockForm
            availableStocks={availableStocks}
            onAddStock={handleAddStock}
            watchedStocks={watchedStocks}
          />
        </SlideOutSidebar>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Responsive Header */}
          <header className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm border-b">
            {/* Desktop Header */}
            <div className="hidden lg:block">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  {/* Left Section - Search */}
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search stocks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Center Section - Status & Controls */}
                  <div className="flex items-center space-x-6">
                    {/* WebSocket Status */}
                    {watchedStocks.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          webSocketStatus === 'connected' ? 'bg-green-500' :
                          webSocketStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                          webSocketStatus === 'error' ? 'bg-red-500' :
                          'bg-gray-400'
                        }`} />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {webSocketStatus === 'connected' ? 'Live' :
                           webSocketStatus === 'connecting' ? 'Connecting...' :
                           webSocketStatus === 'error' ? 'Error' :
                           'Offline'}
                        </span>
                      </div>
                    )}

                    {/* Live Data Toggle */}
                    {watchedStocks.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isLiveDataEnabled}
                            onChange={(e) => setLiveDataEnabled(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Live Data
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Refresh Interval */}
                    {watchedStocks.length > 0 && isLiveDataEnabled && (
                      <RefreshIntervalSelector
                        currentInterval={refreshTimeInterval}
                        onIntervalChange={setRefreshTimeInterval}
                      />
                    )}
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex items-center space-x-3">
                    {/* Manual Refresh */}
                    <button
                      onClick={handleManualRefresh}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Refresh stock data"
                    >
                      <RefreshCw className="text-gray-500 dark:text-gray-400 w-5 h-5" />
                    </button>

                    {/* Notifications */}
                    {notificationPermission === 'default' && (
                      <button
                        onClick={requestNotificationPermission}
                        className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                        title="Enable webpush notifications for price alerts"
                      >
                        <Bell className="w-4 h-4" />
                        <span>Enable Alerts</span>
                      </button>
                    )}
                    
                    {notificationPermission === 'granted' && (
                      <button
                        onClick={handleToggleNotifications}
                        className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                          notificationsEnabled 
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/30'
                            : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/30'
                        }`}
                        title={notificationsEnabled ? 'Disable webpush notifications' : 'Enable webpush notifications'}
                      >
                        {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        <span>{notificationsEnabled ? 'Alerts ON' : 'Alerts OFF'}</span>
                      </button>
                    )}
                    
                    {notificationPermission === 'denied' && (
                      <div className="flex items-center space-x-2 px-3 py-2 text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
                        <BellOff className="w-4 h-4" />
                        <span>Alerts Disabled</span>
                      </div>
                    )}

                    {/* Theme Toggle */}
                    <button
                      onClick={toggleTheme}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                      <Moon className="w-5 h-5 text-gray-500 dark:text-yellow-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Header */}
            <div className="lg:hidden">
              {/* Top Row - Logo, Status, Menu */}
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Sidebar Toggle Button */}
                  <button
                    onClick={openSidebar}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Open sidebar"
                  >
                    <Plus className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                  
                  <div className="flex justify-center items-center w-8 h-8 bg-blue-600 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">StockPulse</span>
                  
                  {/* Mobile Status Indicator */}
                  {watchedStocks.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${
                        webSocketStatus === 'connected' ? 'bg-green-500' :
                        webSocketStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                        webSocketStatus === 'error' ? 'bg-red-500' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {webSocketStatus === 'connected' ? 'Live' :
                         webSocketStatus === 'connecting' ? 'Connecting' :
                         webSocketStatus === 'error' ? 'Error' :
                         'Offline'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {/* Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    <Moon className="w-5 h-5 text-gray-500 dark:text-yellow-500" />
                  </button>

                  {/* Mobile Menu Toggle */}
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Toggle menu"
                  >
                    {isMobileMenuOpen ? (
                      <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <Menu className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="px-4 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search stocks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Mobile Menu Dropdown */}
              {isMobileMenuOpen && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <div className="px-4 py-3 space-y-3">
                    {/* Live Data Toggle */}
                    {watchedStocks.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Live Data</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isLiveDataEnabled}
                            onChange={(e) => setLiveDataEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    )}

                    {/* Refresh Interval */}
                    {watchedStocks.length > 0 && isLiveDataEnabled && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Refresh Interval</span>
                        <RefreshIntervalSelector
                          currentInterval={refreshTimeInterval}
                          onIntervalChange={setRefreshTimeInterval}
                        />
                      </div>
                    )}

                    {/* Manual Refresh */}
                    <button
                      onClick={handleManualRefresh}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Refresh Data</span>
                    </button>

                    {/* Notifications */}
                    {notificationPermission === 'default' && (
                      <button
                        onClick={requestNotificationPermission}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        <Bell className="w-4 h-4" />
                        <span>Enable Alerts</span>
                      </button>
                    )}
                    
                    {notificationPermission === 'granted' && (
                      <button
                        onClick={handleToggleNotifications}
                        className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                          notificationsEnabled 
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/30'
                            : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/30'
                        }`}
                      >
                        {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        <span>{notificationsEnabled ? 'Alerts ON' : 'Alerts OFF'}</span>
                      </button>
                    )}
                    
                    {notificationPermission === 'denied' && (
                      <div className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
                        <BellOff className="w-4 h-4" />
                        <span>Alerts Disabled</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </header>

              {/* Error Display */}
              {error && (
                <div className="border-l-4 p-4 mx-4 lg:mx-6 mt-4 bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-500">
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
              <main className="p-4 lg:p-6">
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