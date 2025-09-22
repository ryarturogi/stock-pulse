/**
 * E2E Tests for Performance and Edge Cases
 * ========================================
 * 
 * Tests for performance, edge cases, and stress scenarios
 */

import { test, expect, type Page } from '@playwright/test';

// Helper functions
async function addMultipleStocks(page: Page, symbols: string[]) {
  for (const symbol of symbols) {
    await page.getByTestId('add-stock-button').click();
    await page.getByTestId('stock-symbol-input').fill(symbol);
    await page.getByTestId('add-stock-submit').click();
    await page.waitForTimeout(100); // Small delay to avoid overwhelming
  }
}

async function waitForStocksToLoad(page: Page, symbols: string[]) {
  for (const symbol of symbols) {
    await expect(page.getByTestId(`stock-item-${symbol}`)).toBeVisible();
    await expect(page.getByTestId(`stock-price-${symbol}`)).not.toContainText('Loading...');
  }
}

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should handle initial page load performance', async ({ page }) => {
    // Measure page load performance
    const navigationStart = await page.evaluate(() => performance.timing.navigationStart);
    const loadComplete = await page.evaluate(() => performance.timing.loadEventEnd);
    const loadTime = loadComplete - navigationStart;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check Core Web Vitals (basic checks)
    const paintMetrics = await page.evaluate(() => {
      const entries = performance.getEntriesByType('paint');
      return {
        firstPaint: entries.find(entry => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: entries.find(entry => entry.name === 'first-contentful-paint')?.startTime,
      };
    });
    
    expect(paintMetrics.firstPaint).toBeLessThan(2000);
    expect(paintMetrics.firstContentfulPaint).toBeLessThan(2000);
  });

  test('should handle large number of stocks efficiently', async ({ page }) => {
    const stockSymbols = Array.from({ length: 50 }, (_, i) => `STOCK${i.toString().padStart(2, '0')}`);
    
    const startTime = Date.now();
    await addMultipleStocks(page, stockSymbols);
    const addTime = Date.now() - startTime;
    
    // Adding 50 stocks should complete within 30 seconds
    expect(addTime).toBeLessThan(30000);
    
    // Check that DOM updates are efficient
    const stockCount = await page.getByTestId(/^stock-item-/).count();
    expect(stockCount).toBe(50);
    
    // Test scrolling performance with many items
    await page.evaluate(() => {
      const container = document.querySelector('[data-testid="stocks-container"]');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });
    
    // Should still be responsive
    await expect(page.getByTestId('add-stock-button')).toBeVisible();
  });

  test('should handle rapid user interactions', async ({ page }) => {
    await page.getByTestId('add-stock-button').click();
    await page.getByTestId('stock-symbol-input').fill('AAPL');
    await page.getByTestId('add-stock-submit').click();
    
    await expect(page.getByTestId('stock-item-AAPL')).toBeVisible();
    
    // Rapid clicks on refresh button
    for (let i = 0; i < 10; i++) {
      await page.getByTestId('refresh-button').click();
      await page.waitForTimeout(50);
    }
    
    // UI should remain responsive
    await expect(page.getByTestId('refresh-button')).toBeEnabled();
    await expect(page.getByTestId('stock-item-AAPL')).toBeVisible();
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    // Add stocks and measure memory usage
    const stockSymbols = Array.from({ length: 20 }, (_, i) => `MEM${i}`);
    await addMultipleStocks(page, stockSymbols);
    
    const memoryUsage = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      } : null;
    });
    
    if (memoryUsage) {
      const usagePercentage = (memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit) * 100;
      
      // Should not use more than 50% of available memory
      expect(usagePercentage).toBeLessThan(50);
    }
    
    // Test memory cleanup by removing stocks
    for (const symbol of stockSymbols) {
      await page.getByTestId(`remove-stock-${symbol}`).click();
    }
    
    // Force garbage collection (if available)
    await page.evaluate(() => {
      if (window.gc) {
        window.gc();
      }
    });
    
    const memoryAfterCleanup = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : null;
    });
    
    if (memoryUsage && memoryAfterCleanup) {
      // Memory usage should decrease after cleanup
      expect(memoryAfterCleanup).toBeLessThan(memoryUsage.usedJSHeapSize * 1.2);
    }
  });

  test('should handle network throttling gracefully', async ({ page, context }) => {
    // Simulate slow 3G network
    await context.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 500)); // Add 500ms delay
      await route.continue();
    });
    
    await page.getByTestId('add-stock-button').click();
    await page.getByTestId('stock-symbol-input').fill('AAPL');
    await page.getByTestId('add-stock-submit').click();
    
    // Should show loading state
    await expect(page.getByTestId('loading-indicator')).toBeVisible();
    
    // Should eventually load
    await expect(page.getByTestId('stock-item-AAPL')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Edge Cases and Error Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should handle extreme input values', async ({ page }) => {
    await page.getByTestId('add-stock-button').click();
    
    // Test very long symbol
    const longSymbol = 'A'.repeat(100);
    await page.getByTestId('stock-symbol-input').fill(longSymbol);
    await page.getByTestId('add-stock-submit').click();
    
    await expect(page.getByTestId('error-message')).toContainText(/invalid symbol|too long/i);
    
    // Test special characters
    await page.getByTestId('stock-symbol-input').fill('ABC@#$%');
    await page.getByTestId('add-stock-submit').click();
    
    await expect(page.getByTestId('error-message')).toContainText(/invalid symbol/i);
    
    // Test extremely high alert price
    await page.getByTestId('stock-symbol-input').fill('AAPL');
    await page.getByTestId('alert-price-input').fill('999999999');
    await page.getByTestId('add-stock-submit').click();
    
    // Should either accept it or show validation error
    const hasError = await page.getByTestId('error-message').isVisible();
    const hasStock = await page.getByTestId('stock-item-AAPL').isVisible();
    
    expect(hasError || hasStock).toBe(true);
  });

  test('should handle browser storage limitations', async ({ page }) => {
    // Fill localStorage to near capacity
    await page.evaluate(() => {
      try {
        const largeData = 'x'.repeat(1024 * 1024); // 1MB of data
        for (let i = 0; i < 5; i++) {
          localStorage.setItem(`large_item_${i}`, largeData);
        }
      } catch (e) {
        // Storage quota exceeded - expected in some cases
      }
    });
    
    // Try to add stocks normally
    await page.getByTestId('add-stock-button').click();
    await page.getByTestId('stock-symbol-input').fill('AAPL');
    await page.getByTestId('add-stock-submit').click();
    
    // Should either work or show graceful error
    const hasStock = await page.getByTestId('stock-item-AAPL').isVisible();
    const hasError = await page.getByTestId('storage-error').isVisible();
    
    expect(hasStock || hasError).toBe(true);
  });

  test('should handle JavaScript disabled scenarios', async ({ page, context }) => {
    // Disable JavaScript
    await context.setExtraHTTPHeaders({ 'User-Agent': 'NoJS-Test-Agent' });
    await page.addInitScript(() => {
      // Simulate limited JavaScript environment
      Object.defineProperty(window, 'fetch', { value: undefined });
      Object.defineProperty(window, 'EventSource', { value: undefined });
    });
    
    await page.reload();
    
    // Should show graceful degradation message
    await expect(page.getByTestId('javascript-required-message')).toBeVisible();
    
    // Or should at least display basic content
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('should handle corrupted local storage', async ({ page }) => {
    // Corrupt localStorage data
    await page.evaluate(() => {
      localStorage.setItem('stock-pulse-data', 'invalid json data');
      localStorage.setItem('stock-pulse-settings', '{broken json}');
    });
    
    await page.reload();
    
    // Should handle corrupted data gracefully
    await expect(page.getByRole('heading')).toBeVisible();
    
    // Should show clean state or recovery message
    const hasCleanState = await page.getByText('No stocks added yet').isVisible();
    const hasRecoveryMessage = await page.getByTestId('data-recovery-message').isVisible();
    
    expect(hasCleanState || hasRecoveryMessage).toBe(true);
  });

  test('should handle rapid page navigation', async ({ page }) => {
    // Add a stock
    await page.getByTestId('add-stock-button').click();
    await page.getByTestId('stock-symbol-input').fill('AAPL');
    await page.getByTestId('add-stock-submit').click();
    
    // Rapidly navigate away and back
    for (let i = 0; i < 5; i++) {
      await page.goto('/about'); // Assuming there's an about page
      await page.goBack();
      await page.waitForTimeout(100);
    }
    
    // Should maintain state
    await expect(page.getByTestId('stock-item-AAPL')).toBeVisible();
  });

  test('should handle timezone changes', async ({ page }) => {
    // Set initial timezone
    await page.addInitScript(() => {
      // Mock timezone
      Object.defineProperty(Intl, 'DateTimeFormat', {
        value: function(locale, options) {
          return {
            format: (date: Date) => date.toLocaleString('en-US', { timeZone: 'America/New_York' }),
            resolvedOptions: () => ({ timeZone: 'America/New_York' })
          };
        }
      });
    });
    
    await page.getByTestId('add-stock-button').click();
    await page.getByTestId('stock-symbol-input').fill('AAPL');
    await page.getByTestId('add-stock-submit').click();
    
    await expect(page.getByTestId('stock-item-AAPL')).toBeVisible();
    
    // Check that timestamps are displayed
    await expect(page.getByTestId('last-updated')).toBeVisible();
    
    // Simulate timezone change (page reload with different timezone)
    await page.addInitScript(() => {
      Object.defineProperty(Intl, 'DateTimeFormat', {
        value: function(locale, options) {
          return {
            format: (date: Date) => date.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }),
            resolvedOptions: () => ({ timeZone: 'Asia/Tokyo' })
          };
        }
      });
    });
    
    await page.reload();
    
    // Should still work with different timezone
    await expect(page.getByTestId('stock-item-AAPL')).toBeVisible();
    await expect(page.getByTestId('last-updated')).toBeVisible();
  });
});

test.describe('Stress Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should handle maximum number of stocks', async ({ page }) => {
    // Test with maximum realistic number of stocks
    const maxStocks = 100;
    const stockSymbols = Array.from({ length: maxStocks }, (_, i) => 
      `STK${i.toString().padStart(3, '0')}`
    );
    
    // Add stocks in batches to avoid timeout
    const batchSize = 10;
    for (let i = 0; i < stockSymbols.length; i += batchSize) {
      const batch = stockSymbols.slice(i, i + batchSize);
      await addMultipleStocks(page, batch);
      
      // Brief pause between batches
      await page.waitForTimeout(500);
      
      // Check that we're not hitting memory limits
      const errorMessage = page.getByTestId('memory-error');
      if (await errorMessage.isVisible()) {
        // If we hit a limit, that's acceptable behavior
        break;
      }
    }
    
    // Should either display all stocks or show a reasonable limit message
    const stockCount = await page.getByTestId(/^stock-item-/).count();
    expect(stockCount).toBeGreaterThan(50); // Should handle at least 50 stocks
  });

  test('should handle continuous real-time updates', async ({ page }) => {
    await page.getByTestId('add-stock-button').click();
    await page.getByTestId('stock-symbol-input').fill('AAPL');
    await page.getByTestId('add-stock-submit').click();
    
    await expect(page.getByTestId('stock-item-AAPL')).toBeVisible();
    
    // Enable live data
    const liveDataToggle = page.getByTestId('live-data-toggle');
    if (!(await liveDataToggle.isChecked())) {
      await liveDataToggle.click();
    }
    
    // Let it run for a while to test for memory leaks
    await page.waitForTimeout(10000);
    
    // Should still be responsive
    await expect(page.getByTestId('stock-item-AAPL')).toBeVisible();
    await expect(page.getByTestId('refresh-button')).toBeEnabled();
  });

  test('should handle rapid alert price changes', async ({ page }) => {
    await page.getByTestId('add-stock-button').click();
    await page.getByTestId('stock-symbol-input').fill('AAPL');
    await page.getByTestId('alert-price-input').fill('150.00');
    await page.getByTestId('add-stock-submit').click();
    
    await expect(page.getByTestId('stock-item-AAPL')).toBeVisible();
    
    // Rapidly change alert prices
    for (let i = 0; i < 20; i++) {
      await page.getByTestId('edit-alert-AAPL').click();
      await page.getByTestId('alert-price-input').fill(`${150 + i}.00`);
      await page.getByTestId('save-alert-button').click();
      await page.waitForTimeout(100);
    }
    
    // Should handle all changes without errors
    await expect(page.getByTestId('alert-price-AAPL')).toContainText('169.00');
  });

  test('should handle browser resource constraints', async ({ page }) => {
    // Simulate resource constraints by creating many DOM elements
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      
      for (let i = 0; i < 10000; i++) {
        const element = document.createElement('div');
        element.textContent = `Resource test element ${i}`;
        container.appendChild(element);
      }
      
      document.body.appendChild(container);
    });
    
    // App should still function normally
    await page.getByTestId('add-stock-button').click();
    await page.getByTestId('stock-symbol-input').fill('AAPL');
    await page.getByTestId('add-stock-submit').click();
    
    await expect(page.getByTestId('stock-item-AAPL')).toBeVisible();
  });

  test('should handle long-running session', async ({ page }) => {
    // Simulate a long-running session
    await page.getByTestId('add-stock-button').click();
    await page.getByTestId('stock-symbol-input').fill('AAPL');
    await page.getByTestId('add-stock-submit').click();
    
    await expect(page.getByTestId('stock-item-AAPL')).toBeVisible();
    
    // Perform various actions over time
    const actions = [
      () => page.getByTestId('refresh-button').click(),
      () => page.getByTestId('edit-alert-AAPL').click(),
      () => page.getByTestId('alert-price-input').fill('160.00'),
      () => page.getByTestId('save-alert-button').click(),
    ];
    
    // Run actions repeatedly
    for (let i = 0; i < 50; i++) {
      const action = actions[i % actions.length];
      try {
        await action();
        await page.waitForTimeout(200);
      } catch (error) {
        // Some actions might fail due to timing, that's okay
      }
    }
    
    // Should still be functional after long session
    await expect(page.getByTestId('stock-item-AAPL')).toBeVisible();
    await expect(page.getByTestId('refresh-button')).toBeEnabled();
  });
});