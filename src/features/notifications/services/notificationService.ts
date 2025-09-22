/**
 * Notification Service for Price Alerts
 * =====================================
 * 
 * Enhanced notification service for managing push notifications
 * and price alerts following the React Developer test requirements.
 */

import { 
  type PriceAlertNotification,
  type WatchedStock,
  isWatchedStock
} from '@/core/types';

/**
 * Notification service class for managing price alerts
 */
export class NotificationService {
  private static instance: NotificationService;
  private isSupported: boolean = false;
  private permission: NotificationPermission = 'default';
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private alertHistory: Map<string, number> = new Map(); // Track last alert time per stock

  private constructor() {
    this.checkSupport();
    this.requestPermission();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Check if notifications are supported
   */
  private checkSupport(): void {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    console.log('Notification support:', this.isSupported);
  }

  /**
   * Request notification permission
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    try {
      this.permission = await Notification.requestPermission();
      console.log('Notification permission:', this.permission);
      
      if (this.permission === 'granted') {
        await this.registerServiceWorker();
      }
      
      return this.permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      this.permission = 'denied';
      return 'denied';
    }
  }

  /**
   * Register service worker for push notifications
   */
  private async registerServiceWorker(): Promise<void> {
    try {
      // Check if service worker is available (might be disabled in development)
      if (!('serviceWorker' in navigator)) {
        console.log('Service worker not supported, using fallback notifications');
        return;
      }

      // Skip service worker registration in development to avoid precache errors
      if (process.env.NODE_ENV === 'development') {
        console.log('Service worker registration skipped in development mode');
        return;
      }

      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered for notifications');
      
      // Wait for service worker to become active
      if (this.serviceWorkerRegistration.installing) {
        console.log('Service worker installing...');
      }
      
      if (this.serviceWorkerRegistration.waiting) {
        console.log('Service worker waiting...');
      }
      
      if (this.serviceWorkerRegistration.active) {
        console.log('Service worker active and ready');
      }
    } catch (error) {
      console.error('Failed to register service worker (falling back to regular notifications):', error);
      this.serviceWorkerRegistration = null;
    }
  }

  /**
   * Wait for service worker to be ready
   */
  private async waitForServiceWorker(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false;
    }

    // If already active, return immediately
    if (this.serviceWorkerRegistration.active) {
      return true;
    }

    // Wait for service worker to activate
    return new Promise((resolve) => {
      const checkActive = () => {
        if (this.serviceWorkerRegistration?.active) {
          resolve(true);
        } else {
          setTimeout(checkActive, 100);
        }
      };
      
      // Start checking with a timeout
      setTimeout(() => resolve(false), 5000); // 5 second timeout
      checkActive();
    });
  }

  /**
   * Check if notifications are enabled
   */
  public isEnabled(): boolean {
    return this.isSupported && this.permission === 'granted';
  }

  /**
   * Show price alert notification
   */
  public showPriceAlert(stock: WatchedStock, currentPrice: number): void {
    if (!this.isEnabled() || !isWatchedStock(stock)) {
      return;
    }

    // Prevent spam notifications (max 1 per minute per stock)
    const now = Date.now();
    const lastAlert = this.alertHistory.get(stock.symbol);
    if (lastAlert && now - lastAlert < 60000) {
      return;
    }

    const isAboveAlert = currentPrice >= stock.alertPrice;
    const alertType = isAboveAlert ? 'above' : 'below';
    
    const notification: PriceAlertNotification = {
      title: `Price Alert: ${stock.symbol}`,
      body: `${stock.symbol} is now $${currentPrice.toFixed(2)} (${alertType} your alert of $${stock.alertPrice.toFixed(2)})`,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-72x72.svg',
      data: {
        symbol: stock.symbol,
        currentPrice,
        alertPrice: stock.alertPrice,
        type: alertType,
      },
    };

    this.showNotification(notification).catch(error => {
      console.error('Failed to show price alert notification:', error);
    });
    this.alertHistory.set(stock.symbol, now);
  }

  /**
   * Show generic notification
   */
  public async showNotification(notification: PriceAlertNotification): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      let notificationShown = false;

      // Try service worker notification first (if available and active)
      if (this.serviceWorkerRegistration) {
        try {
          const isReady = await this.waitForServiceWorker();
          
          if (isReady && this.serviceWorkerRegistration.active) {
            await this.serviceWorkerRegistration.showNotification(notification.title, {
              body: notification.body,
              icon: notification.icon || '/icons/icon-192x192.svg',
              badge: notification.badge || '/icons/icon-72x72.svg',
              data: notification.data,
              tag: `price-alert-${notification.data.symbol}`, // Prevent duplicate notifications
              requireInteraction: true, // Keep notification visible until user interacts
            });
            notificationShown = true;
            console.log('Service worker notification shown for', notification.data.symbol);
          }
        } catch (swError) {
          console.warn('Service worker notification failed, falling back to regular notification:', swError);
        }
      }

      // Fallback to regular notification if service worker failed or not available
      if (!notificationShown) {
        const notif = new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon || '/icons/icon-192x192.svg',
          badge: notification.badge || '/icons/icon-72x72.svg',
          data: notification.data,
          tag: `price-alert-${notification.data.symbol}`,
          requireInteraction: true,
        });

        // Handle notification click
        notif.onclick = () => {
          window.focus();
          notif.close();
        };

        console.log('Regular notification shown for', notification.data.symbol);
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  /**
   * Show connection status notification
   */
  public showConnectionStatus(isConnected: boolean): void {
    if (!this.isEnabled()) {
      return;
    }

    const notification: PriceAlertNotification = {
      title: 'Stock Tracker',
      body: isConnected ? 'Real-time connection restored' : 'Connection lost - using cached data',
      icon: '/icons/icon-192x192.png',
        data: {
          symbol: 'CONNECTION',
          currentPrice: 0,
          alertPrice: 0,
          type: 'above',
        },
    };

    this.showNotification(notification);
  }

  /**
   * Show error notification
   */
  public showError(message: string): void {
    if (!this.isEnabled()) {
      return;
    }

    const notification: PriceAlertNotification = {
      title: 'Stock Tracker Error',
      body: message,
      icon: '/icons/icon-192x192.png',
        data: {
          symbol: 'ERROR',
          currentPrice: 0,
          alertPrice: 0,
          type: 'above',
        },
    };

    this.showNotification(notification);
  }

  /**
   * Show success notification
   */
  public showSuccess(message: string): void {
    if (!this.isEnabled()) {
      return;
    }

    const notification: PriceAlertNotification = {
      title: 'Stock Tracker',
      body: message,
      icon: '/icons/icon-192x192.png',
        data: {
          symbol: 'SUCCESS',
          currentPrice: 0,
          alertPrice: 0,
          type: 'above',
        },
    };

    this.showNotification(notification);
  }

  /**
   * Clear all notifications
   */
  public clearAllNotifications(): void {
    if (this.serviceWorkerRegistration) {
      this.serviceWorkerRegistration.getNotifications().then(notifications => {
        notifications.forEach(notification => notification.close());
      });
    }
  }

  /**
   * Clear notifications for specific stock
   */
  public clearStockNotifications(symbol: string): void {
    if (this.serviceWorkerRegistration) {
      this.serviceWorkerRegistration.getNotifications().then(notifications => {
        notifications.forEach(notification => {
          if (notification.tag === `price-alert-${symbol}`) {
            notification.close();
          }
        });
      });
    }
  }

  /**
   * Get notification permission status
   */
  public getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  /**
   * Check if we can request permission
   */
  public canRequestPermission(): boolean {
    return this.isSupported && this.permission === 'default';
  }

  /**
   * Setup notification click handlers
   */
  public setupClickHandlers(): void {
    if (!this.serviceWorkerRegistration) {
      return;
    }

    // Handle notification clicks
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'NOTIFICATION_CLICK') {
        const { action, data } = event.data;
        
        switch (action) {
          case 'view':
            // Focus the app and navigate to the stock
            window.focus();
            if (data.symbol && data.symbol !== 'CONNECTION' && data.symbol !== 'ERROR' && data.symbol !== 'SUCCESS') {
              // Could navigate to specific stock view
              console.log('Navigate to stock:', data.symbol);
            }
            break;
          case 'dismiss':
            // Just close the notification
            break;
          default:
            // Default action - focus the app
            window.focus();
        }
      }
    });
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.clearAllNotifications();
    this.alertHistory.clear();
    this.serviceWorkerRegistration = null;
  }
}

/**
 * Export singleton instance
 */
// Lazy-loaded service to prevent SSR issues
export const getNotificationService = () => NotificationService.getInstance();
