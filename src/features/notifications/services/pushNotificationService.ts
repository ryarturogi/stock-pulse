/**
 * Push Notification Service - Mobile Optimized (No VAPID)
 * ======================================================
 * 
 * Handles web push notifications without VAPID keys for simplified
 * server-to-client communication with mobile-specific optimizations.
 */

'use client';

/**
 * Device type detection for mobile-specific handling
 */
type DeviceType = 'mobile' | 'desktop' | 'unknown';
type BrowserType = 'ios-safari' | 'android-chrome' | 'desktop-chrome' | 'desktop-firefox' | 'unknown';

/**
 * Push notification service for notifications with mobile support (no VAPID)
 */
export class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private deviceType: DeviceType = 'unknown';
  private browserType: BrowserType = 'unknown';

  private constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.detectDeviceAndBrowser();
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
   * Detect device type and browser for mobile-specific handling
   */
  private detectDeviceAndBrowser(): void {
    if (typeof window === 'undefined') return;

    const userAgent = navigator.userAgent.toLowerCase();
    
    // Detect device type
    if (/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      this.deviceType = 'mobile';
    } else if (/windows|macintosh|linux/i.test(userAgent)) {
      this.deviceType = 'desktop';
    } else {
      this.deviceType = 'unknown';
    }

    // Detect browser type
    if (/iphone|ipad|ipod/i.test(userAgent) && /safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
      this.browserType = 'ios-safari';
    } else if (/android/i.test(userAgent) && /chrome/i.test(userAgent)) {
      this.browserType = 'android-chrome';
    } else if (/chrome/i.test(userAgent) && this.deviceType === 'desktop') {
      this.browserType = 'desktop-chrome';
    } else if (/firefox/i.test(userAgent) && this.deviceType === 'desktop') {
      this.browserType = 'desktop-firefox';
    } else {
      this.browserType = 'unknown';
    }

    console.log('Device detection:', { deviceType: this.deviceType, browserType: this.browserType });
  }

  /**
   * Check if push notifications are supported (with mobile-specific checks)
   */
  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;

    // Basic support check
    const basicSupport = 'serviceWorker' in navigator && 
                        'PushManager' in window &&
                        'Notification' in window;

    if (!basicSupport) return false;

    // iOS Safari has limited push notification support
    if (this.browserType === 'ios-safari') {
      // iOS 16.4+ supports push notifications in PWA mode
      const iosVersion = this.getIOSVersion();
      if (iosVersion && iosVersion < 16.4) {
        console.warn('iOS version too old for push notifications:', iosVersion);
        return false;
      }
      
      // Check if running as PWA (standalone mode)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true;
      
      if (!isStandalone) {
        console.warn('iOS Safari requires PWA mode for push notifications');
        return false;
      }
    }

    return true;
  }

  /**
   * Get iOS version from user agent
   */
  private getIOSVersion(): number | null {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
    if (match) {
      return parseFloat(`${match[1]}.${match[2]}`);
    }
    return null;
  }

  /**
   * Check if push notifications are ready (no VAPID required)
   */
  public isReady(): boolean {
    return this.isSupported();
  }

  /**
   * Register service worker for push notifications (mobile-optimized)
   */
  public async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported');
      return null;
    }

    try {
      // Use custom service worker for better mobile support
      const swPath = this.deviceType === 'mobile' ? '/sw-custom.js' : '/sw.js';
      this.registration = await navigator.serviceWorker.register(swPath);
      
      console.log(`Service worker registered for push notifications (${this.deviceType}):`, this.registration);
      
      // Wait for service worker to be ready
      if (this.registration.installing) {
        await new Promise<void>((resolve) => {
          const installingWorker = this.registration!.installing!;
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              resolve();
            }
          });
        });
      }
      
      // Ensure service worker is active
      if (this.registration.waiting) {
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        await new Promise<void>((resolve) => {
          const waitingWorker = this.registration!.waiting!;
          waitingWorker.addEventListener('statechange', () => {
            if (waitingWorker.state === 'activated') {
              resolve();
            }
          });
        });
      }
      
      return this.registration;
    } catch (error) {
      console.error('Failed to register service worker:', error);
      return null;
    }
  }

  /**
   * Request notification permission (mobile-optimized)
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return 'denied';
    }

    try {
      // For iOS Safari, ensure we're in PWA mode
      if (this.browserType === 'ios-safari') {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                            (window.navigator as any).standalone === true;
        
        if (!isStandalone) {
          console.warn('iOS Safari requires PWA mode for push notifications');
          return 'denied';
        }
      }

      const permission = await Notification.requestPermission();
      console.log(`Notification permission (${this.browserType}):`, permission);
      
      // For mobile devices, provide additional guidance
      if (this.deviceType === 'mobile' && permission === 'denied') {
        console.warn('Push notifications denied on mobile device. User may need to enable in browser settings.');
      }
      
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Subscribe to push notifications (mobile-optimized, no VAPID)
   */
  public async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported');
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

      // Create new subscription without VAPID (simplified)
      const subscriptionOptions: PushSubscriptionOptionsInit = {
        userVisibleOnly: true
      };

      this.subscription = await this.registration.pushManager.subscribe(subscriptionOptions);

      console.log(`Subscribed to push notifications (${this.deviceType}):`, this.subscription);

      // Send subscription to server with device info
      await this.sendSubscriptionToServer(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      
      // Provide specific error guidance for mobile devices
      if (this.deviceType === 'mobile') {
        if (error instanceof Error && error.message.includes('permission')) {
          console.error('Permission denied on mobile device. User may need to enable notifications in browser settings.');
        }
      }
      
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
   * Send subscription to server with device information
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
          deviceType: this.deviceType,
          browserType: this.browserType,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send subscription to server: ${response.statusText}`);
      }

      console.log(`Subscription sent to server successfully (${this.deviceType})`);
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
   * Get device and browser information
   */
  public getDeviceInfo(): {
    deviceType: DeviceType;
    browserType: BrowserType;
    isMobile: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    isStandalone: boolean;
  } {
    const isStandalone = typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );

    return {
      deviceType: this.deviceType,
      browserType: this.browserType,
      isMobile: this.deviceType === 'mobile',
      isIOS: this.browserType === 'ios-safari',
      isAndroid: this.browserType === 'android-chrome',
      isStandalone,
    };
  }

  /**
   * Get current subscription status (mobile-enhanced, no VAPID)
   */
  public async getSubscriptionStatus(): Promise<{
    isSupported: boolean;
    isReady: boolean;
    hasPermission: NotificationPermission;
    isSubscribed: boolean;
    subscription: PushSubscription | null;
    deviceInfo: {
      deviceType: DeviceType;
      browserType: BrowserType;
      isMobile: boolean;
      isIOS: boolean;
      isAndroid: boolean;
      isStandalone: boolean;
    };
  }> {
    const isSupported = this.isSupported();
    const isReady = this.isReady();
    const hasPermission = isSupported ? Notification.permission : 'denied';
    
    let isSubscribed = false;
    let subscription: PushSubscription | null = null;

    if (isSupported && this.registration) {
      subscription = await this.registration.pushManager.getSubscription();
      isSubscribed = subscription !== null;
    }

    return {
      isSupported,
      isReady,
      hasPermission,
      isSubscribed,
      subscription,
      deviceInfo: this.getDeviceInfo(),
    };
  }

  /**
   * Show a test notification (mobile-optimized)
   */
  public async showTestNotification(): Promise<void> {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      console.warn('Cannot show notification: not supported or permission denied');
      return;
    }

    try {
      const deviceInfo = this.getDeviceInfo();
      const notificationTitle = `StockPulse Test (${deviceInfo.deviceType})`;
      const notificationBody = deviceInfo.isMobile 
        ? 'Mobile push notifications are working! 📱🎉'
        : 'Push notifications are working! 🎉';

      const notification = new Notification(notificationTitle, {
        body: notificationBody,
        icon: '/icons/icon-192x192.svg',
        badge: '/icons/icon-72x72.svg',
        tag: 'test-notification',
        requireInteraction: deviceInfo.isMobile, // Keep mobile notifications visible longer
        data: {
          deviceType: deviceInfo.deviceType,
          browserType: deviceInfo.browserType,
          timestamp: Date.now(),
        },
      });

      // Auto-close after different durations based on device type
      const autoCloseDelay = deviceInfo.isMobile ? 8000 : 5000;
      setTimeout(() => {
        notification.close();
      }, autoCloseDelay);

      console.log(`Test notification shown for ${deviceInfo.deviceType} device`);
    } catch (error) {
      console.error('Failed to show test notification:', error);
    }
  }
}

// Lazy-loaded service to prevent SSR issues
export const getPushNotificationService = () => PushNotificationService.getInstance();
