/**
 * Push Notification Service with VAPID
 * ====================================
 * 
 * Handles web push notifications using VAPID keys for secure
 * server-to-client communication.
 */

'use client';

// import { WatchedStock, PriceAlertNotification } from '@/core/types';

/**
 * Push notification service for VAPID-based notifications
 */
export class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private vapidPublicKey: string | null = null;

  private constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Check if push notifications are supported
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 
           'serviceWorker' in navigator && 
           'PushManager' in window &&
           'Notification' in window;
  }

  /**
   * Check if VAPID is configured
   */
  public isVapidConfigured(): boolean {
    return this.vapidPublicKey !== null && this.vapidPublicKey.length > 0;
  }

  /**
   * Register service worker for push notifications
   */
  public async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered for push notifications:', this.registration);
      return this.registration;
    } catch (error) {
      console.error('Failed to register service worker:', error);
      return null;
    }
  }

  /**
   * Request notification permission
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
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
   * Subscribe to push notifications with VAPID
   */
  public async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.isSupported() || !this.isVapidConfigured()) {
      console.warn('Push notifications not supported or VAPID not configured');
      return null;
    }

    try {
      // Register service worker if not already registered
      if (!this.registration) {
        this.registration = await this.registerServiceWorker();
        if (!this.registration) {
          throw new Error('Failed to register service worker');
        }
      }

      // Check if already subscribed
      this.subscription = await this.registration.pushManager.getSubscription();
      if (this.subscription) {
        console.log('Already subscribed to push notifications');
        return this.subscription;
      }

      // Create new subscription with VAPID
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey!) as unknown as ArrayBuffer
      });

      console.log('Subscribed to push notifications:', this.subscription);

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  public async unsubscribeFromPush(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      const result = await this.subscription.unsubscribe();
      if (result) {
        this.subscription = null;
        console.log('Unsubscribed from push notifications');
        
        // Notify server about unsubscription
        await this.removeSubscriptionFromServer();
      }
      return result;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send subscription to server: ${response.statusText}`);
      }

      console.log('Subscription sent to server successfully');
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  /**
   * Remove subscription from server
   */
  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to remove subscription from server: ${response.statusText}`);
      }

      console.log('Subscription removed from server successfully');
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Get current subscription status
   */
  public async getSubscriptionStatus(): Promise<{
    isSupported: boolean;
    isVapidConfigured: boolean;
    hasPermission: NotificationPermission;
    isSubscribed: boolean;
    subscription: PushSubscription | null;
  }> {
    const isSupported = this.isSupported();
    const isVapidConfigured = this.isVapidConfigured();
    const hasPermission = isSupported ? Notification.permission : 'denied';
    
    let isSubscribed = false;
    let subscription: PushSubscription | null = null;

    if (isSupported && this.registration) {
      subscription = await this.registration.pushManager.getSubscription();
      isSubscribed = subscription !== null;
    }

    return {
      isSupported,
      isVapidConfigured,
      hasPermission,
      isSubscribed,
      subscription,
    };
  }

  /**
   * Show a test notification
   */
  public async showTestNotification(): Promise<void> {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      console.warn('Cannot show notification: not supported or permission denied');
      return;
    }

    try {
      const notification = new Notification('StockPulse Test', {
        body: 'Push notifications are working! 🎉',
        icon: '/icons/icon-192x192.svg',
        badge: '/icons/icon-72x72.svg',
        tag: 'test-notification',
        requireInteraction: false,
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    } catch (error) {
      console.error('Failed to show test notification:', error);
    }
  }
}

// Lazy-loaded service to prevent SSR issues
export const getPushNotificationService = () => PushNotificationService.getInstance();
