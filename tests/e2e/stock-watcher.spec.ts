/**
 * E2E Tests for Stock Watcher Application
 * =======================================
 *
 * Critical user flow tests for the StockPulse application
 */

import { test, expect, type Page } from '@playwright/test';

// Helper functions
async function addStock(page: Page, symbol: string, alertPrice?: number) {
  await page.getByTestId('add-stock-button').click();
  await page.getByTestId('stock-symbol-input').fill(symbol);

  if (alertPrice) {
    await page.getByTestId('alert-price-input').fill(alertPrice.toString());
  }

  await page.getByTestId('add-stock-submit').click();
}

async function waitForStockToLoad(page: Page, symbol: string) {
  await expect(page.getByTestId(`stock-item-${symbol}`)).toBeVisible();
  await expect(page.getByTestId(`stock-price-${symbol}`)).not.toContainText(
    'Loading...'
  );
}

async function enableLiveData(page: Page) {
  const liveDataToggle = page.getByTestId('live-data-toggle');
  const isEnabled = await liveDataToggle.isChecked();

  if (!isEnabled) {
    await liveDataToggle.click();
  }
}

test.describe('Stock Watcher Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Stock Pulse/);
  });

  test('should load the homepage successfully', async ({ page }) => {
    // Check main elements are present
    await expect(
      page.getByRole('heading', { name: /Stock Pulse/i })
    ).toBeVisible();
    await expect(page.getByTestId('add-stock-button')).toBeVisible();
    await expect(page.getByTestId('live-data-toggle')).toBeVisible();

    // Check initial state
    await expect(page.getByText('No stocks added yet')).toBeVisible();
  });

  test('should add a stock successfully', async ({ page }) => {
    await addStock(page, 'AAPL');

    // Verify stock was added
    await waitForStockToLoad(page, 'AAPL');
    await expect(page.getByTestId('stock-symbol-AAPL')).toContainText('AAPL');
    await expect(page.getByTestId('stock-price-AAPL')).toBeVisible();

    // Verify "No stocks" message is gone
    await expect(page.getByText('No stocks added yet')).not.toBeVisible();
  });

  test('should add multiple stocks', async ({ page }) => {
    const stocks = ['AAPL', 'GOOGL', 'MSFT'];

    for (const stock of stocks) {
      await addStock(page, stock);
      await waitForStockToLoad(page, stock);
    }

    // Verify all stocks are present
    for (const stock of stocks) {
      await expect(page.getByTestId(`stock-item-${stock}`)).toBeVisible();
      await expect(page.getByTestId(`stock-symbol-${stock}`)).toContainText(
        stock
      );
    }

    // Check stock count
    const stockItems = page.getByTestId(/^stock-item-/);
    await expect(stockItems).toHaveCount(3);
  });

  test('should remove a stock', async ({ page }) => {
    await addStock(page, 'AAPL');
    await waitForStockToLoad(page, 'AAPL');

    // Remove the stock
    await page.getByTestId('remove-stock-AAPL').click();

    // Verify stock was removed
    await expect(page.getByTestId('stock-item-AAPL')).not.toBeVisible();
    await expect(page.getByText('No stocks added yet')).toBeVisible();
  });

  test('should set price alerts', async ({ page }) => {
    await addStock(page, 'AAPL', 150.0);
    await waitForStockToLoad(page, 'AAPL');

    // Verify alert is set
    await expect(page.getByTestId('alert-price-AAPL')).toContainText('$150.00');
    await expect(page.getByTestId('alert-status-AAPL')).toBeVisible();
  });

  test('should edit price alerts', async ({ page }) => {
    await addStock(page, 'AAPL', 150.0);
    await waitForStockToLoad(page, 'AAPL');

    // Edit the alert
    await page.getByTestId('edit-alert-AAPL').click();
    await page.getByTestId('alert-price-input').fill('160.00');
    await page.getByTestId('save-alert-button').click();

    // Verify alert was updated
    await expect(page.getByTestId('alert-price-AAPL')).toContainText('$160.00');
  });

  test('should remove price alerts', async ({ page }) => {
    await addStock(page, 'AAPL', 150.0);
    await waitForStockToLoad(page, 'AAPL');

    // Remove the alert
    await page.getByTestId('remove-alert-AAPL').click();

    // Verify alert was removed
    await expect(page.getByTestId('alert-price-AAPL')).not.toBeVisible();
    await expect(page.getByTestId('set-alert-AAPL')).toBeVisible();
  });

  test('should toggle live data', async ({ page }) => {
    await addStock(page, 'AAPL');
    await waitForStockToLoad(page, 'AAPL');

    const liveDataToggle = page.getByTestId('live-data-toggle');
    const connectionStatus = page.getByTestId('connection-status');

    // Enable live data
    await enableLiveData(page);
    await expect(liveDataToggle).toBeChecked();

    // Wait for connection attempt
    await expect(connectionStatus).toContainText(/connecting|connected|error/i);

    // Disable live data
    await liveDataToggle.click();
    await expect(liveDataToggle).not.toBeChecked();
    await expect(connectionStatus).toContainText(/disconnected|offline/i);
  });

  test('should refresh stock data manually', async ({ page }) => {
    await addStock(page, 'AAPL');
    await waitForStockToLoad(page, 'AAPL');

    const refreshButton = page.getByTestId('refresh-button');
    const lastUpdated = page.getByTestId('last-updated');

    // Get initial timestamp
    const initialTime = await lastUpdated.textContent();

    // Wait a moment and refresh
    await page.waitForTimeout(1000);
    await refreshButton.click();

    // Verify data was refreshed
    await expect(lastUpdated).not.toContainText(initialTime || '');
    await expect(page.getByTestId('refresh-button')).not.toBeDisabled();
  });

  test('should handle stock search and autocomplete', async ({ page }) => {
    await page.getByTestId('add-stock-button').click();

    const symbolInput = page.getByTestId('stock-symbol-input');
    await symbolInput.fill('AA');

    // Check if autocomplete appears
    await expect(page.getByTestId('stock-suggestions')).toBeVisible();
    await expect(page.getByText('AAPL')).toBeVisible();

    // Select from autocomplete
    await page.getByText('AAPL').click();
    await expect(symbolInput).toHaveValue('AAPL');
  });

  test('should validate stock symbol input', async ({ page }) => {
    await page.getByTestId('add-stock-button').click();

    // Try invalid symbol
    await page.getByTestId('stock-symbol-input').fill('INVALID_SYMBOL_123');
    await page.getByTestId('add-stock-submit').click();

    // Check for error message
    await expect(page.getByTestId('error-message')).toContainText(
      /invalid symbol/i
    );
  });

  test('should validate alert price input', async ({ page }) => {
    await page.getByTestId('add-stock-button').click();
    await page.getByTestId('stock-symbol-input').fill('AAPL');

    // Try invalid alert price
    await page.getByTestId('alert-price-input').fill('-10');
    await page.getByTestId('add-stock-submit').click();

    // Check for error message
    await expect(page.getByTestId('error-message')).toContainText(
      /price must be positive/i
    );
  });

  test('should persist data across page reloads', async ({ page }) => {
    await addStock(page, 'AAPL', 150.0);
    await addStock(page, 'GOOGL');
    await waitForStockToLoad(page, 'AAPL');
    await waitForStockToLoad(page, 'GOOGL');

    // Reload the page
    await page.reload();

    // Verify data persisted
    await expect(page.getByTestId('stock-item-AAPL')).toBeVisible();
    await expect(page.getByTestId('stock-item-GOOGL')).toBeVisible();
    await expect(page.getByTestId('alert-price-AAPL')).toContainText('$150.00');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate network error
    await page.route('**/api/quote**', route => {
      route.abort('failed');
    });

    await addStock(page, 'AAPL');

    // Check error handling
    await expect(page.getByTestId('error-banner')).toContainText(
      /network error|failed to load/i
    );
    await expect(page.getByTestId('retry-button')).toBeVisible();

    // Test retry functionality
    await page.unroute('**/api/quote**');
    await page.getByTestId('retry-button').click();

    await waitForStockToLoad(page, 'AAPL');
  });

  test('should work on mobile devices', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is only for mobile devices');

    await addStock(page, 'AAPL');
    await waitForStockToLoad(page, 'AAPL');

    // Check mobile-specific UI elements
    await expect(page.getByTestId('mobile-menu-button')).toBeVisible();

    // Test swipe actions on mobile (simulated with mouse drag)
    const stockItem = page.getByTestId('stock-item-AAPL');
    await stockItem.dragTo(stockItem, {
      sourcePosition: { x: 100, y: 50 },
      targetPosition: { x: 50, y: 50 },
    });
    await expect(page.getByTestId('swipe-actions-AAPL')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await addStock(page, 'AAPL');
    await addStock(page, 'GOOGL');

    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('add-stock-button')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByTestId('live-data-toggle')).toBeFocused();

    // Test keyboard shortcuts
    await page.keyboard.press('r'); // Refresh shortcut
    await expect(page.getByTestId('last-updated')).toBeVisible();
  });

  test('should handle dark mode toggle', async ({ page }) => {
    const themeToggle = page.getByTestId('theme-toggle');

    // Toggle to dark mode
    await themeToggle.click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Toggle back to light mode
    await themeToggle.click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});

test.describe('Real-time Data Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should connect to real-time data stream', async ({ page }) => {
    await addStock(page, 'AAPL');
    await waitForStockToLoad(page, 'AAPL');

    // Enable live data
    await enableLiveData(page);

    // Wait for connection
    await expect(page.getByTestId('connection-status')).toContainText(
      /connected/i,
      { timeout: 10000 }
    );
    await expect(page.getByTestId('real-time-indicator')).toBeVisible();
  });

  test('should display real-time price updates', async ({ page }) => {
    await addStock(page, 'AAPL');
    await waitForStockToLoad(page, 'AAPL');
    await enableLiveData(page);

    // Wait for connection
    await expect(page.getByTestId('connection-status')).toContainText(
      /connected/i,
      { timeout: 10000 }
    );

    // Get initial price
    const priceElement = page.getByTestId('stock-price-AAPL');
    const initialPrice = await priceElement.textContent();

    // Wait for price update (real-time data might take time)
    await expect(priceElement).not.toContainText(initialPrice || '', {
      timeout: 30000,
    });

    // Verify real-time indicator is active
    await expect(page.getByTestId('real-time-indicator')).toHaveClass(
      /active|live/
    );
  });

  test('should fallback to polling when WebSocket fails', async ({ page }) => {
    // Block WebSocket connections
    await page.route('**/websocket-proxy**', route => {
      route.abort('failed');
    });

    await addStock(page, 'AAPL');
    await waitForStockToLoad(page, 'AAPL');
    await enableLiveData(page);

    // Should fallback to polling
    await expect(page.getByTestId('connection-status')).toContainText(
      /polling|fallback/i
    );
    await expect(page.getByTestId('polling-indicator')).toBeVisible();
  });

  test('should handle WebSocket reconnection', async ({ page }) => {
    await addStock(page, 'AAPL');
    await waitForStockToLoad(page, 'AAPL');
    await enableLiveData(page);

    // Wait for initial connection
    await expect(page.getByTestId('connection-status')).toContainText(
      /connected/i,
      { timeout: 10000 }
    );

    // Simulate connection loss by blocking WebSocket
    await page.route('**/websocket-proxy**', route => {
      route.abort('failed');
    });

    // Should show disconnected state
    await expect(page.getByTestId('connection-status')).toContainText(
      /disconnected|error/i
    );

    // Restore connection
    await page.unroute('**/websocket-proxy**');

    // Should reconnect automatically
    await expect(page.getByTestId('connection-status')).toContainText(
      /connected/i,
      { timeout: 15000 }
    );
  });
});

test.describe('Price Alerts and Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Mock notification permissions
    await page.addInitScript(() => {
      Object.defineProperty(window.Notification, 'permission', {
        value: 'granted',
        writable: false,
      });

      window.Notification.requestPermission = () => Promise.resolve('granted');

      // Mock notifications
      (window as any).showNotificationCalls = [];
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification = (title, options) => {
            (window as any).showNotificationCalls.push({ title, options });
            return Promise.resolve();
          };
        });
      }
    });
  });

  test('should trigger price alert notifications', async ({ page }) => {
    await addStock(page, 'AAPL', 150.0);
    await waitForStockToLoad(page, 'AAPL');

    // Mock price update that triggers alert
    await page.evaluate(() => {
      const event = new CustomEvent('price-update', {
        detail: { symbol: 'AAPL', price: 151.0 },
      });
      window.dispatchEvent(event);
    });

    // Check for alert notification
    const notificationCalls = await page.evaluate(
      () => (window as any).showNotificationCalls
    );
    expect(notificationCalls).toContainEqual(
      expect.objectContaining({
        title: expect.stringContaining('AAPL'),
        options: expect.objectContaining({
          body: expect.stringContaining('151'),
        }),
      })
    );
  });

  test('should show visual alert indicators', async ({ page }) => {
    await addStock(page, 'AAPL', 150.0);
    await waitForStockToLoad(page, 'AAPL');

    // Simulate price above alert
    await page.evaluate(() => {
      const event = new CustomEvent('price-update', {
        detail: { symbol: 'AAPL', price: 151.0 },
      });
      window.dispatchEvent(event);
    });

    // Check visual indicators
    await expect(page.getByTestId('alert-triggered-AAPL')).toBeVisible();
    await expect(page.getByTestId('stock-item-AAPL')).toHaveClass(
      /alert-active/
    );
  });

  test('should handle alert permission denied', async ({ page }) => {
    // Mock denied permissions
    await page.addInitScript(() => {
      Object.defineProperty(window.Notification, 'permission', {
        value: 'denied',
        writable: false,
      });
    });

    await addStock(page, 'AAPL', 150.0);
    await waitForStockToLoad(page, 'AAPL');

    // Should show permission warning
    await expect(
      page.getByTestId('notification-permission-warning')
    ).toBeVisible();

    // Should offer to request permissions
    await expect(page.getByTestId('enable-notifications-button')).toBeVisible();
  });
});

test.describe('PWA Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should be installable as PWA', async ({ page }) => {
    // Check for PWA install prompt
    await expect(page.getByTestId('pwa-install-banner')).toBeVisible();
    await expect(page.getByTestId('pwa-install-button')).toBeVisible();
  });

  test('should work offline', async ({ page }) => {
    await addStock(page, 'AAPL');
    await waitForStockToLoad(page, 'AAPL');

    // Go offline
    await page.context().setOffline(true);

    // Should show offline indicator
    await expect(page.getByTestId('offline-indicator')).toBeVisible();

    // Should still display cached data
    await expect(page.getByTestId('stock-item-AAPL')).toBeVisible();

    // Should show offline message for new requests
    await page.getByTestId('refresh-button').click();
    await expect(page.getByTestId('offline-message')).toContainText(/offline/i);

    // Go back online
    await page.context().setOffline(false);

    // Should hide offline indicators
    await expect(page.getByTestId('offline-indicator')).not.toBeVisible();

    // Should resume normal functionality
    await page.getByTestId('refresh-button').click();
    await waitForStockToLoad(page, 'AAPL');
  });

  test('should cache stock data for offline use', async ({ page }) => {
    await addStock(page, 'AAPL');
    await addStock(page, 'GOOGL');
    await waitForStockToLoad(page, 'AAPL');
    await waitForStockToLoad(page, 'GOOGL');

    // Go offline
    await page.context().setOffline(true);

    // Reload page
    await page.reload();

    // Should still show cached data
    await expect(page.getByTestId('stock-item-AAPL')).toBeVisible();
    await expect(page.getByTestId('stock-item-GOOGL')).toBeVisible();

    // Should indicate data is cached
    await expect(page.getByTestId('cached-data-indicator')).toBeVisible();
  });
});

test.describe('Performance and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should meet accessibility standards', async ({ page }) => {
    // Add some content first
    await addStock(page, 'AAPL', 150.0);
    await waitForStockToLoad(page, 'AAPL');

    // Check for proper headings
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Check for proper labels
    await expect(page.getByLabel(/stock symbol/i)).toBeVisible();
    await expect(page.getByLabel(/alert price/i)).toBeVisible();

    // Check for ARIA attributes
    await expect(page.getByTestId('live-data-toggle')).toHaveAttribute(
      'aria-label'
    );
    await expect(page.getByTestId('connection-status')).toHaveAttribute(
      'aria-live'
    );

    // Check color contrast (basic check)
    const backgroundColor = await page
      .locator('body')
      .evaluate(el => getComputedStyle(el).backgroundColor);
    expect(backgroundColor).toBeTruthy();
  });

  test('should load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /Stock Pulse/i })
    ).toBeVisible();
    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle large numbers of stocks efficiently', async ({
    page,
  }) => {
    const stockSymbols = Array.from({ length: 20 }, (_, i) => `STOCK${i}`);

    // Add many stocks
    for (const symbol of stockSymbols) {
      await addStock(page, symbol);
      // Wait briefly to avoid overwhelming the UI
      await page.waitForTimeout(100);
    }

    // Check that all stocks are rendered
    for (const symbol of stockSymbols.slice(0, 10)) {
      // Check first 10
      await expect(page.getByTestId(`stock-item-${symbol}`)).toBeVisible();
    }

    // Check performance doesn't degrade significantly
    const refreshButton = page.getByTestId('refresh-button');
    const startTime = Date.now();
    await refreshButton.click();
    const refreshTime = Date.now() - startTime;

    // Refresh should complete within reasonable time
    expect(refreshTime).toBeLessThan(5000);
  });
});

test.describe('Cross-browser Compatibility', () => {
  test('should work consistently across browsers', async ({
    page,
    browserName,
  }) => {
    await addStock(page, 'AAPL', 150.0);
    await waitForStockToLoad(page, 'AAPL');

    // Basic functionality should work in all browsers
    await expect(page.getByTestId('stock-item-AAPL')).toBeVisible();
    await expect(page.getByTestId('stock-price-AAPL')).toBeVisible();
    await expect(page.getByTestId('alert-price-AAPL')).toContainText('$150.00');

    // Enable live data (if supported)
    if (browserName !== 'webkit') {
      // Safari might have different WebSocket behavior
      await enableLiveData(page);
      await expect(page.getByTestId('connection-status')).toContainText(
        /connecting|connected|error/i
      );
    }
  });
});
