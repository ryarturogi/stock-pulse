'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Search, 
  Moon, 
  RefreshCw,
  Bell,
  BellOff
} from 'lucide-react';
import { 
  StockForm, 
  StockCards, 
  StockChart,
  RefreshIntervalSelector,
  stockService,
  useStockStore
} from '@/features/stocks';
import { 
  DEFAULT_STOCK_OPTIONS
} from '@/core/types';
import { getNotificationService } from '@/features/notifications';

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
    setRefreshTimeInterval
  } = useStockStore();
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

  // Initialize PWA service and check notification permission
  useEffect(() => {
    const initializePWA = async () => {
      try {
        const notificationService = getNotificationService();
        
        // Load notification preference from localStorage
        const savedNotificationPref = localStorage.getItem('stockpulse_notifications_enabled');
        if (savedNotificationPref !== null) {
          setNotificationsEnabled(JSON.parse(savedNotificationPref));
        }
        
        // Check current notification permission status
        setNotificationPermission(notificationService.getPermissionStatus());
        
        console.log('PWA service initialized successfully');
        console.log('Webpush notification permission:', notificationService.getPermissionStatus());
        console.log('Notifications enabled preference:', savedNotificationPref !== null ? JSON.parse(savedNotificationPref) : true);
      } catch (error) {
        console.error('Failed to initialize PWA service:', error);
      }
    };

    initializePWA();
  }, []);

  /**
   * Handle manual notification permission request
   */
  const handleRequestNotificationPermission = async () => {
    try {
      const notificationService = getNotificationService();
      
      // Request webpush notification permission
      const permission = await notificationService.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        console.log('✅ Webpush notification permission granted! You will receive price alerts.');
        setNotificationsEnabled(true);
        localStorage.setItem('stockpulse_notifications_enabled', 'true');
      } else if (permission === 'denied') {
        console.log('❌ Notification permission denied. You can enable it later in browser settings.');
        setNotificationsEnabled(false);
        localStorage.setItem('stockpulse_notifications_enabled', 'false');
      } else {
        console.log('⏳ Notification permission dismissed. You can enable it later.');
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  };

  /**
   * Handle toggling webpush notifications on/off
   */
  const handleToggleNotifications = async () => {
    try {
      const notificationService = getNotificationService();
      
      if (notificationsEnabled) {
        // Disable notifications
        console.log('🔕 Disabling webpush notifications...');
        setNotificationsEnabled(false);
        localStorage.setItem('stockpulse_notifications_enabled', 'false');
        console.log('✅ Webpush notifications disabled.');
      } else {
        // Enable notifications (request permission if needed)
        console.log('🔔 Enabling webpush notifications...');
        
        if (notificationPermission !== 'granted') {
          const permission = await notificationService.requestPermission();
          setNotificationPermission(permission);
          
          if (permission === 'granted') {
            setNotificationsEnabled(true);
            localStorage.setItem('stockpulse_notifications_enabled', 'true');
            console.log('✅ Webpush notifications enabled!');
          } else {
            console.log('❌ Permission denied, cannot enable notifications');
            return;
          }
        } else {
          setNotificationsEnabled(true);
          localStorage.setItem('stockpulse_notifications_enabled', 'true');
          console.log('✅ Webpush notifications enabled!');
        }
      }
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
    }
  };

  // Use refs to track connection state and prevent multiple calls
  const isConnectedRef = useRef(false);
  const isRefreshingRef = useRef(false);

  // Connect WebSocket and start refresh when stocks are added
  useEffect(() => {
    if (watchedStocks.length > 0) {
      // Only connect if not already connected
      if (!isConnectedRef.current) {
        console.log('🔌 Initializing WebSocket and periodic refresh...');
        connectWebSocket();
        startPeriodicRefresh();
        isConnectedRef.current = true;
        isRefreshingRef.current = true;
      }
    } else {
      // If no stocks, disconnect and stop refresh
      if (isConnectedRef.current || isRefreshingRef.current) {
        console.log('🔌 Cleaning up WebSocket and periodic refresh...');
        disconnectWebSocket();
        stopPeriodicRefresh();
        isConnectedRef.current = false;
        isRefreshingRef.current = false;
      }
    }
    
    // Cleanup on unmount
    return () => {
      disconnectWebSocket();
      stopPeriodicRefresh();
      isConnectedRef.current = false;
      isRefreshingRef.current = false;
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
          const notificationService = getNotificationService();
          const permission = await notificationService.requestPermission();
          setNotificationPermission(permission);
          
          if (permission === 'granted') {
            console.log('✅ Webpush notification permission granted! You will receive price alerts.');
            setNotificationsEnabled(true);
            localStorage.setItem('stockpulse_notifications_enabled', 'true');
          } else if (permission === 'denied') {
            console.log('❌ Notification permission denied. You can enable it later in browser settings.');
            setNotificationsEnabled(false);
            localStorage.setItem('stockpulse_notifications_enabled', 'false');
          } else {
            console.log('⏳ Notification permission dismissed. You can enable it later.');
          }
        } catch (error) {
          console.error('Failed to request notification permission:', error);
        }
      }

      // Add stock to store (this will persist to localStorage)
      addStock(symbol, stock.name, alertPrice);

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
                    {/* Refresh Interval Selector */}
                    {watchedStocks.length > 0 && (
                      <RefreshIntervalSelector
                        currentInterval={refreshTimeInterval}
                        onIntervalChange={setRefreshTimeInterval}
                        className="mr-2"
                      />
                    )}

                    <button
                      onClick={handleManualRefresh}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
                      title="Refresh stock data"
                    >
                      <RefreshCw className="text-gray-500 dark:text-gray-400 w-5 h-5" />
                    </button>
                
                    {/* Webpush Notification Controls */}
                    {notificationPermission === 'default' && (
                      <button
                        onClick={handleRequestNotificationPermission}
                        className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                        title="Enable webpush notifications for price alerts"
                      >
                        <Bell className="w-4 h-4" />
                        <span>Enable Alerts</span>
                      </button>
                    )}
                    
                    {notificationPermission === 'granted' && (
                      <div className="flex items-center space-x-2">
                        {notificationsEnabled ? (
                          <button
                            onClick={handleToggleNotifications}
                            className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"
                            title="Disable webpush notifications"
                          >
                            <Bell className="w-4 h-4" />
                            <span>Alerts ON</span>
                          </button>
                        ) : (
                          <button
                            onClick={handleToggleNotifications}
                            className="flex items-center space-x-2 px-3 py-2 text-sm bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-colors"
                            title="Enable webpush notifications"
                          >
                            <BellOff className="w-4 h-4" />
                            <span>Alerts OFF</span>
                          </button>
                        )}
                      </div>
                    )}
                    
                    {notificationPermission === 'denied' && (
                      <div className="flex items-center space-x-2 px-3 py-2 text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
                        <BellOff className="w-4 h-4" />
                        <span>Alerts Disabled</span>
                      </div>
                    )}

                    <button
                      onClick={handleThemeToggle}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
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