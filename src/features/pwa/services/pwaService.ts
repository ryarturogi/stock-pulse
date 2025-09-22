/**
 * PWA Service for Background Management and Local Storage
 * ======================================================
 * 
 * Enhanced PWA service for managing background WebSocket connections,
 * local storage, and offline functionality following the React Developer test requirements.
 */

import { STORAGE_KEYS } from '@/core/constants/constants';
import {
  type LocalStorageData,
  type BackgroundSyncData,
  type WatchedStock,
  isWatchedStock,
  PWA_CONFIG
} from '@/core/types';

/**
 * PWA service class for managing background functionality
 */
export class PWAService {
  private static instance: PWAService;
  private isOnline: boolean = typeof window !== 'undefined' ? navigator.onLine : true;
  private backgroundSyncInterval: NodeJS.Timeout | null = null;
  private storageListeners: Map<string, (data: unknown) => void> = new Map();

  private constructor() {
    // Only setup on client side
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
      this.startBackgroundSync();
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService();
    }
    return PWAService.instance;
  }

  /**
   * Setup event listeners for PWA functionality
   */
  private setupEventListeners(): void {
    // Don't setup event listeners on server side
    if (typeof window === 'undefined') {
      return;
    }

    // Online/offline status
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Visibility change (background/foreground)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Before unload (save data)
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));

    // Storage events (for cross-tab communication)
    window.addEventListener('storage', this.handleStorageEvent.bind(this));
  }

  /**
   * Start background sync interval
   */
  private startBackgroundSync(): void {
    if (this.backgroundSyncInterval) {
      clearInterval(this.backgroundSyncInterval);
    }

    this.backgroundSyncInterval = setInterval(() => {
      this.performBackgroundSync();
    }, PWA_CONFIG.SYNC_INTERVAL);
  }

  /**
   * Stop background sync
   */
  private stopBackgroundSync(): void {
    if (this.backgroundSyncInterval) {
      clearInterval(this.backgroundSyncInterval);
      this.backgroundSyncInterval = null;
    }
  }

  /**
   * Save watched stocks to local storage
   */
  public saveWatchedStocks(stocks: WatchedStock[]): void {
    try {
      const data: LocalStorageData = {
        watchedStocks: stocks.map(stock => ({
          ...stock,
          // Don't save WebSocket connection or temporary state
          webSocketConnection: null,
          isLoading: false,
        })),
        lastSync: Date.now(),
        version: PWA_CONFIG.VERSION,
      };

      localStorage.setItem(STORAGE_KEYS.WATCHED_STOCKS, JSON.stringify(data));
      
      // Notify listeners
      this.notifyStorageListeners('watchedStocks', data);
      
      console.log('Saved watched stocks to local storage');
    } catch (error) {
      console.error('Failed to save watched stocks:', error);
    }
  }

  /**
   * Load watched stocks from local storage
   */
  public loadWatchedStocks(): WatchedStock[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WATCHED_STOCKS);
      if (!data) return [];

      const parsed: LocalStorageData = JSON.parse(data);
      
      // Ensure watchedStocks exists and is an array
      if (!parsed.watchedStocks || !Array.isArray(parsed.watchedStocks)) {
        return [];
      }
      
      // Validate and filter valid stocks
      const validStocks = parsed.watchedStocks.filter(stock => 
        isWatchedStock(stock)
      );

      console.log('Loaded watched stocks from local storage:', validStocks.length);
      return validStocks;
    } catch (error) {
      console.error('Failed to load watched stocks:', error);
      return [];
    }
  }

  /**
   * Save background sync data
   */
  public saveBackgroundSyncData(data: BackgroundSyncData): void {
    try {
      const syncData = {
        ...data,
        timestamp: Date.now(),
      };

      localStorage.setItem('stockpulse_background_sync', JSON.stringify(syncData));
      console.log('Saved background sync data');
    } catch (error) {
      console.error('Failed to save background sync data:', error);
    }
  }

  /**
   * Load background sync data
   */
  public loadBackgroundSyncData(): BackgroundSyncData | null {
    try {
      const data = localStorage.getItem('stockpulse_background_sync');
      if (!data) return null;

      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load background sync data:', error);
      return null;
    }
  }

  /**
   * Clear all local storage data
   */
  public clearStorage(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.WATCHED_STOCKS);
      localStorage.removeItem('stockpulse_background_sync');
      localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
      
      console.log('Cleared all local storage data');
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  /**
   * Get storage usage information
   */
  public getStorageInfo(): {
    used: number;
    available: number;
    percentage: number;
  } {
    try {
      let used = 0;
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          used += localStorage[key].length;
        }
      }

      // Estimate available space (most browsers have ~5-10MB limit)
      const available = 5 * 1024 * 1024; // 5MB
      const percentage = (used / available) * 100;

      return { used, available, percentage };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * Check if PWA is installed
   */
  public isPWAInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as { standalone?: boolean }).standalone === true;
  }

  /**
   * Request PWA installation
   */
  public async requestInstallation(): Promise<boolean> {
    try {
      // Check if the browser supports PWA installation
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        // Register service worker if not already registered
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker registered:', registration);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to request PWA installation:', error);
      return false;
    }
  }

  /**
   * Check if push notifications are supported
   */
  public isPushNotificationSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Request push notification permission
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!this.isPushNotificationSupported()) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Show local notification
   */
  public showNotification(title: string, options?: NotificationOptions): void {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options,
      });
    }
  }

  /**
   * Perform background sync
   */
  private async performBackgroundSync(): Promise<void> {
    try {
      // Only sync if we're online and have data
      if (!this.isOnline) return;

      const stocks = this.loadWatchedStocks();
      if (stocks.length === 0) return;

      // Save sync data
      const syncData: BackgroundSyncData = {
        stocks,
        lastUpdate: Date.now(),
        connectionStatus: 'connected',
      };

      this.saveBackgroundSyncData(syncData);
      
      console.log('Background sync completed');
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    console.log('App is online');
    this.isOnline = true;
    
    // Trigger sync when coming back online
    this.performBackgroundSync();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log('App is offline');
    this.isOnline = false;
  }

  /**
   * Handle visibility change (background/foreground)
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      console.log('App moved to background');
      // Save current state
      this.performBackgroundSync();
    } else {
      console.log('App moved to foreground');
      // Restore state if needed
      this.performBackgroundSync();
    }
  }

  /**
   * Handle before unload (save data)
   */
  private handleBeforeUnload(): void {
    // Save current state before app closes
    this.performBackgroundSync();
  }

  /**
   * Handle storage events (cross-tab communication)
   */
  private handleStorageEvent(event: StorageEvent): void {
    if (event.key === STORAGE_KEYS.WATCHED_STOCKS && event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        this.notifyStorageListeners('watchedStocks', data);
      } catch (error) {
        console.error('Failed to parse storage event data:', error);
      }
    }
  }

  /**
   * Add storage listener
   */
  public addStorageListener(key: string, listener: (_data: unknown) => void): void {
    this.storageListeners.set(key, listener);
  }

  /**
   * Remove storage listener
   */
  public removeStorageListener(key: string): void {
    this.storageListeners.delete(key);
  }

  /**
   * Notify storage listeners
   */
  private notifyStorageListeners(event: string, _data: unknown): void {
    this.storageListeners.forEach((listener, key) => {
      if (key === event) {
        try {
          listener(_data);
        } catch (error) {
          console.error('Error in storage listener:', error);
        }
      }
    });
  }

  /**
   * Get online status
   */
  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stopBackgroundSync();
    this.storageListeners.clear();
    
    // Remove event listeners
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    window.removeEventListener('storage', this.handleStorageEvent);
  }
}

/**
 * Export singleton instance
 */
// Lazy-loaded service to prevent SSR issues
export const getPWAService = () => PWAService.getInstance();

