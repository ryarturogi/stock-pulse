'use client';

import { TourStep } from './useTour';

// Desktop tour steps (reordered: intro → sidebar → header left to right → dashboard → chart → outro)
export const getDesktopTourSteps = (): TourStep[] => [
  {
    element: '[data-desktop-step="1"]',
    title: '👋 Welcome to StockPulse!',
    intro: `
      <div class="space-y-3">
        <p>Welcome to your real-time stock tracking dashboard! This tour will show you how to get the most out of StockPulse.</p>
        <p class="text-sm opacity-75">We'll walk you through adding stocks, setting up alerts, and monitoring your watchlist.</p>
      </div>
    `,
    position: 'bottom',
  },
  {
    element: '[data-desktop-step="2"]',
    title: '🔍 Search for Stocks',
    intro: `
      <div class="space-y-3">
        <p>Use the <strong>Stock Search</strong> to find any stock by symbol or company name. This gives you access to thousands of stocks beyond the popular ones.</p>
        <p class="text-sm opacity-75">Try searching for "AAPL", "Tesla", or "Microsoft" to see it in action.</p>
      </div>
    `,
    position: 'right',
  },
  {
    element: '[data-desktop-step="3"]',
    title: '📋 Select Stock',
    intro: `
      <div class="space-y-3">
        <p>Select a stock from the dropdown to add it to your watchlist. You can search for any stock by symbol or company name.</p>
        <p class="text-sm opacity-75">The dropdown will show available stocks that you haven't added yet.</p>
      </div>
    `,
    position: 'right',
  },
  {
    element: '[data-desktop-step="4"]',
    title: '💰 Set Price Alerts',
    intro: `
      <div class="space-y-3">
        <p>Set a <strong>price alert</strong> to get notified when a stock reaches your target price. The current price is automatically fetched to help you decide.</p>
        <p class="text-sm opacity-75">You'll receive browser notifications when your alerts trigger (make sure to enable them!).</p>
      </div>
    `,
    position: 'right',
  },
  {
    element: '[data-desktop-step="5"]',
    title: '🔍 Filter Your Stocks',
    intro: `
      <div class="space-y-3">
        <p>Use this <strong>search bar</strong> to filter your watched stocks by symbol or company name. This helps you quickly find specific stocks in your portfolio.</p>
        <p class="text-sm opacity-75">Try searching for "AAPL" or "Tesla" to see how it filters your results in real-time!</p>
      </div>
    `,
    position: 'bottom',
  },
  {
    element: '[data-desktop-step="6"]',
    title: '🔄 Live Data & Refresh',
    intro: `
      <div class="space-y-3">
        <p>Toggle <strong>Live Data</strong> to automatically refresh stock prices. You can also manually refresh anytime with this button.</p>
        <p class="text-sm opacity-75">Choose your refresh interval (15s, 30s, 1min, 5min) to control how often prices update.</p>
      </div>
    `,
    position: 'bottom',
  },
  {
    element: '[data-desktop-step="7"]',
    title: '📱 Enable Notifications',
    intro: `
      <div class="space-y-3">
        <p>Enable browser notifications to receive real-time alerts when your stocks hit target prices.</p>
        <p class="text-sm opacity-75">Click this button to grant notification permissions and stay updated on your investments.</p>
      </div>
    `,
    position: 'bottom',
  },
  {
    element: '[data-desktop-step="8"]',
    title: '🎨 Customize Your Experience',
    intro: `
      <div class="space-y-3">
        <p>Toggle between <strong>light and dark mode</strong> to customize your viewing experience.</p>
        <p class="text-sm opacity-75">Perfect for day trading or late-night market monitoring!</p>
      </div>
    `,
    position: 'bottom',
  },
  {
    element: '[data-desktop-step="9"]',
    title: '📊 Your Dashboard',
    intro: `
      <div class="space-y-3">
        <p>Your added stocks will appear here as <strong>interactive cards</strong> showing real-time prices, changes, and performance indicators.</p>
        <p class="text-sm opacity-75">Cards show green for gains, red for losses, and include percentage changes and absolute price movements.</p>
      </div>
    `,
    position: 'bottom',
    highlightClass: 'tour-highlight-dashboard',
  },
  {
    element: '[data-desktop-step="10"]',
    title: '📈 Price Chart',
    intro: `
      <div class="space-y-3">
        <p>The <strong>interactive chart</strong> below shows price trends for all your watched stocks. Perfect for tracking performance over time!</p>
        <p class="text-sm opacity-75">Hover over the chart to see detailed price information and compare multiple stocks.</p>
      </div>
    `,
    position: 'top',
  },
  {
    element: '[data-desktop-step="11"]',
    title: '🎉 You\'re All Set!',
    intro: `
      <div class="space-y-3">
        <p><strong>Congratulations!</strong> You now know how to use StockPulse effectively.</p>
        <div class="text-sm space-y-2">
          <p><strong>Quick tips:</strong></p>
          <ul class="list-disc list-inside space-y-1 opacity-75">
            <li>Use the search bar to filter your stocks</li>
            <li>Remove stocks by clicking the X on their cards</li>
            <li>Enable notifications for the best experience</li>
            <li>Check back regularly for real-time updates</li>
          </ul>
        </div>
        <p class="font-medium">Happy investing! 📈</p>
      </div>
    `,
    position: 'bottom',
    highlightClass: 'tour-highlight-final',
    tooltipClass: 'tour-tooltip-final',
  },
];

// Mobile/tablet tour steps (reordered: intro → sidebar → header → dashboard → chart → outro)
export const getMobileTourSteps = (): TourStep[] => [
  {
    element: '[data-mobile-step="1"]',
    title: '👋 Welcome to StockPulse Mobile!',
    intro: `
      <div class="space-y-3">
        <p>Welcome to your mobile stock tracking dashboard! This tour will show you how to use StockPulse on mobile.</p>
        <p class="text-sm opacity-75">We'll walk you through the mobile interface, adding stocks, and managing your watchlist.</p>
      </div>
    `,
    position: 'bottom',
  },
  {
    element: '[data-mobile-step="2"]',
    title: '➕ Add Stocks',
    intro: `
      <div class="space-y-3">
        <p>Tap the <strong>Plus (+)</strong> button to open the stock form drawer from the left side.</p>
        <p class="text-sm opacity-75">On mobile, the form slides out as a full-height drawer that you can easily access.</p>
      </div>
    `,
    position: 'bottom',
  },
  {
    element: '[data-mobile-step="3"]',
    title: '📋 Select Stock',
    intro: `
      <div class="space-y-3">
        <p>Select a stock from the dropdown to add it to your watchlist. You can search for any stock by symbol or company name.</p>
        <p class="text-sm opacity-75">The dropdown will show available stocks that you haven't added yet.</p>
      </div>
    `,
    position: 'right',
  },
  {
    element: '[data-mobile-step="4"]',
    title: '☰ Mobile Menu',
    intro: `
      <div class="space-y-3">
        <p>Tap the <strong>menu button</strong> to access additional controls like Live Data, refresh intervals, and notifications.</p>
        <p class="text-sm opacity-75">This keeps the mobile interface clean while giving you full access to all features.</p>
      </div>
    `,
    position: 'bottom',
  },
  {
    element: '[data-mobile-step="5"]',
    title: '📊 Your Mobile Dashboard',
    intro: `
      <div class="space-y-3">
        <p>Your stocks appear as <strong>mobile-optimized cards</strong> that are easy to read and interact with on touch screens.</p>
        <p class="text-sm opacity-75">Swipe and tap to interact with your portfolio. Cards automatically adapt to your screen size.</p>
      </div>
    `,
    position: 'top',
  },
  {
    element: '[data-mobile-step="6"]',
    title: '📈 Price Chart',
    intro: `
      <div class="space-y-3">
        <p>The <strong>interactive chart</strong> below shows price trends for all your watched stocks. Perfect for tracking performance over time!</p>
        <p class="text-sm opacity-75">Hover over the chart to see detailed price information and compare multiple stocks.</p>
      </div>
    `,
    position: 'top',
  },
  {
    element: '[data-mobile-step="7"]',
    title: '🎉 Mobile Ready!',
    intro: `
      <div class="space-y-3">
        <p><strong>Great!</strong> You're ready to use StockPulse on mobile.</p>
        <div class="text-sm space-y-2">
          <p><strong>Mobile tips:</strong></p>
          <ul class="list-disc list-inside space-y-1 opacity-75">
            <li>Use the drawer for adding stocks quickly</li>
            <li>Access the mobile menu for settings</li>
            <li>Enable notifications for mobile alerts</li>
            <li>Works great in landscape mode too!</li>
          </ul>
        </div>
        <p class="font-medium">Happy mobile trading! 📱📈</p>
      </div>
    `,
    position: 'bottom',
    highlightClass: 'tour-highlight-final',
    tooltipClass: 'tour-tooltip-final',
  },
];

// Get appropriate tour steps based on screen size
export const getTourSteps = (isMobile: boolean): TourStep[] => {
  return isMobile ? getMobileTourSteps() : getDesktopTourSteps();
};

// Check if tour should be shown (only show once per device type)
export const shouldShowTour = (isMobileOrTablet: boolean): boolean => {
  if (typeof window === 'undefined') return false;
  
  const tourKey = isMobileOrTablet ? 'stockpulse-tour-mobile-completed' : 'stockpulse-tour-desktop-completed';
  return !localStorage.getItem(tourKey);
};

// Mark tour as completed
export const markTourAsCompleted = (isMobileOrTablet: boolean): void => {
  if (typeof window === 'undefined') return;
  
  const tourKey = isMobileOrTablet ? 'stockpulse-tour-mobile-completed' : 'stockpulse-tour-desktop-completed';
  localStorage.setItem(tourKey, 'true');
};

// Reset tour completion status (for debugging)
export const resetTour = (): void => {
  if (typeof window === 'undefined') return;
  
  // Clear both mobile and desktop tour completion flags
  localStorage.removeItem('stockpulse-tour-mobile-completed');
  localStorage.removeItem('stockpulse-tour-desktop-completed');
};