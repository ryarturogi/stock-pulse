/**
 * Unit Tests for PushNotificationService
 * ======================================
 * 
 * Tests for the VAPID push notification service
 */

import { PushNotificationService, getPushNotificationService } from './pushNotificationService';

// Mock global APIs
const mockSubscription = {
  unsubscribe: jest.fn(),
  toJSON: jest.fn(),
};

const mockPushManager = {
  getSubscription: jest.fn(),
  subscribe: jest.fn(),
};

const mockServiceWorkerRegistration = {
  pushManager: mockPushManager,
};

const mockServiceWorker = {
  register: jest.fn(),
};

const mockNotification = {
  requestPermission: jest.fn(),
  permission: 'default',
  close: jest.fn(),
};

// Mock global objects
Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: mockServiceWorker,
    userAgent: 'Test User Agent',
  },
  writable: true,
});

Object.defineProperty(global, 'window', {
  value: {
    atob: jest.fn(),
    Notification: mockNotification,
    PushManager: {},
  },
  writable: true,
});

global.Notification = jest.fn().mockImplementation((title, options) => ({
  title,
  ...options,
  close: mockNotification.close,
})) as any;

Object.defineProperty(global.Notification, 'requestPermission', {
  value: mockNotification.requestPermission,
  writable: true,
});

Object.defineProperty(global.Notification, 'permission', {
  get: () => mockNotification.permission,
  set: (value) => { mockNotification.permission = value; },
});

// Mock fetch
global.fetch = jest.fn();

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

describe('PushNotificationService', () => {
  let service: PushNotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton instance
    (PushNotificationService as any).instance = null;
    
    // Set default mocks
    mockServiceWorker.register.mockResolvedValue(mockServiceWorkerRegistration);
    mockNotification.requestPermission.mockResolvedValue('granted');
    mockNotification.permission = 'default';
    mockPushManager.getSubscription.mockResolvedValue(null);
    mockPushManager.subscribe.mockResolvedValue(mockSubscription);
    mockSubscription.unsubscribe.mockResolvedValue(true);
    mockSubscription.toJSON.mockReturnValue({ endpoint: 'test-endpoint' });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    
    // Mock VAPID public key
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-vapid-key';
    
    service = PushNotificationService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PushNotificationService.getInstance();
      const instance2 = PushNotificationService.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should work with getPushNotificationService helper', () => {
      const instance1 = getPushNotificationService();
      const instance2 = PushNotificationService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Support Detection', () => {
    it('should detect push notification support', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('should detect no support when serviceWorker is missing', () => {
      const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
      
      // Actually delete the property
      if (originalServiceWorker) {
        delete (navigator as any).serviceWorker;
      }
      
      expect(service.isSupported()).toBe(false);
      
      // Restore the property
      if (originalServiceWorker) {
        Object.defineProperty(navigator, 'serviceWorker', originalServiceWorker);
      }
    });

    it('should detect no support when PushManager is missing', () => {
      const originalPushManager = (global.window as any).PushManager;
      // @ts-ignore
      delete (global.window as any).PushManager;
      
      expect(service.isSupported()).toBe(false);
      
      (global.window as any).PushManager = originalPushManager;
    });

    it('should detect no support when Notification is missing', () => {
      const originalNotification = (global.window as any).Notification;
      // @ts-ignore
      delete (global.window as any).Notification;
      
      expect(service.isSupported()).toBe(false);
      
      (global.window as any).Notification = originalNotification;
    });

    it('should detect no support in server environment', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      (PushNotificationService as any).instance = null;
      const serverService = PushNotificationService.getInstance();
      
      expect(serverService.isSupported()).toBe(false);
      
      global.window = originalWindow;
    });
  });

  describe('VAPID Configuration', () => {
    it('should detect VAPID configuration', () => {
      expect(service.isVapidConfigured()).toBe(true);
    });

    it('should detect missing VAPID configuration', () => {
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = '';
      (PushNotificationService as any).instance = null;
      const noVapidService = PushNotificationService.getInstance();
      
      expect(noVapidService.isVapidConfigured()).toBe(false);
    });

    it('should handle undefined VAPID key', () => {
      delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      (PushNotificationService as any).instance = null;
      const noVapidService = PushNotificationService.getInstance();
      
      expect(noVapidService.isVapidConfigured()).toBe(false);
    });

    it('should handle server-side VAPID initialization', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      (PushNotificationService as any).instance = null;
      const serverService = PushNotificationService.getInstance();
      
      expect(serverService.isVapidConfigured()).toBe(false);
      
      global.window = originalWindow;
    });
  });

  describe('Service Worker Registration', () => {
    it('should register service worker successfully', async () => {
      const registration = await service.registerServiceWorker();
      
      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js');
      expect(registration).toBe(mockServiceWorkerRegistration);
      expect(console.log).toHaveBeenCalledWith('Service worker registered for push notifications:', mockServiceWorkerRegistration);
    });

    it('should handle service worker registration failure', async () => {
      const error = new Error('Registration failed');
      mockServiceWorker.register.mockRejectedValue(error);
      
      const registration = await service.registerServiceWorker();
      
      expect(registration).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Failed to register service worker:', error);
    });

    it('should return null when push notifications not supported', async () => {
      const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
      
      if (originalServiceWorker) {
        delete (navigator as any).serviceWorker;
      }
      
      const registration = await service.registerServiceWorker();
      
      expect(registration).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('Push notifications not supported');
      
      if (originalServiceWorker) {
        Object.defineProperty(navigator, 'serviceWorker', originalServiceWorker);
      }
    });
  });

  describe('Permission Management', () => {
    it('should request notification permission successfully', async () => {
      const permission = await service.requestPermission();
      
      expect(mockNotification.requestPermission).toHaveBeenCalled();
      expect(permission).toBe('granted');
      expect(console.log).toHaveBeenCalledWith('Notification permission:', 'granted');
    });

    it('should handle permission request failure', async () => {
      const error = new Error('Permission request failed');
      mockNotification.requestPermission.mockRejectedValue(error);
      
      const permission = await service.requestPermission();
      
      expect(permission).toBe('denied');
      expect(console.error).toHaveBeenCalledWith('Failed to request notification permission:', error);
    });

    it('should return denied when push notifications not supported', async () => {
      const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
      
      if (originalServiceWorker) {
        delete (navigator as any).serviceWorker;
      }
      
      const permission = await service.requestPermission();
      
      expect(permission).toBe('denied');
      
      if (originalServiceWorker) {
        Object.defineProperty(navigator, 'serviceWorker', originalServiceWorker);
      }
    });
  });

  describe('Push Subscription', () => {
    beforeEach(() => {
      // Mock atob for VAPID key conversion
      (global.window.atob as jest.Mock).mockReturnValue('test-raw-data');
    });

    it('should subscribe to push notifications successfully', async () => {
      const subscription = await service.subscribeToPush();
      
      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js');
      expect(mockPushManager.getSubscription).toHaveBeenCalled();
      expect(mockPushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: expect.any(Uint8Array),
      });
      expect(subscription).toBe(mockSubscription);
      expect(global.fetch).toHaveBeenCalledWith('/api/push/subscribe', expect.any(Object));
    });

    it('should return existing subscription if already subscribed', async () => {
      mockPushManager.getSubscription.mockResolvedValue(mockSubscription);
      
      const subscription = await service.subscribeToPush();
      
      expect(mockPushManager.subscribe).not.toHaveBeenCalled();
      expect(subscription).toBe(mockSubscription);
      expect(console.log).toHaveBeenCalledWith('Already subscribed to push notifications');
    });

    it('should handle subscription failure', async () => {
      const error = new Error('Subscription failed');
      mockPushManager.subscribe.mockRejectedValue(error);
      
      const subscription = await service.subscribeToPush();
      
      expect(subscription).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Failed to subscribe to push notifications:', error);
    });

    it('should handle service worker registration failure during subscription', async () => {
      mockServiceWorker.register.mockResolvedValue(null);
      
      const subscription = await service.subscribeToPush();
      
      expect(subscription).toBeNull();
    });

    it('should not subscribe when push notifications not supported', async () => {
      const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
      
      if (originalServiceWorker) {
        delete (navigator as any).serviceWorker;
      }
      
      const subscription = await service.subscribeToPush();
      
      expect(subscription).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('Push notifications not supported or VAPID not configured');
      
      if (originalServiceWorker) {
        Object.defineProperty(navigator, 'serviceWorker', originalServiceWorker);
      }
    });

    it('should not subscribe when VAPID not configured', async () => {
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = '';
      (PushNotificationService as any).instance = null;
      const noVapidService = PushNotificationService.getInstance();
      
      const subscription = await noVapidService.subscribeToPush();
      
      expect(subscription).toBeNull();
    });

    it('should handle server subscription API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, statusText: 'Server Error' });
      
      const subscription = await service.subscribeToPush();
      
      expect(subscription).toBe(mockSubscription);
      expect(console.error).toHaveBeenCalledWith('Failed to send subscription to server:', expect.any(Error));
    });

    it('should handle server subscription API network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const subscription = await service.subscribeToPush();
      
      expect(subscription).toBe(mockSubscription);
      expect(console.error).toHaveBeenCalledWith('Failed to send subscription to server:', expect.any(Error));
    });
  });

  describe('Push Unsubscription', () => {
    it('should unsubscribe from push notifications successfully', async () => {
      (service as any).subscription = mockSubscription;
      
      const result = await service.unsubscribeFromPush();
      
      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
      expect(result).toBe(true);
      expect((service as any).subscription).toBeNull();
      expect(console.log).toHaveBeenCalledWith('Unsubscribed from push notifications');
      expect(global.fetch).toHaveBeenCalledWith('/api/push/unsubscribe', expect.any(Object));
    });

    it('should handle unsubscription failure', async () => {
      const error = new Error('Unsubscription failed');
      mockSubscription.unsubscribe.mockRejectedValue(error);
      (service as any).subscription = mockSubscription;
      
      const result = await service.unsubscribeFromPush();
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Failed to unsubscribe from push notifications:', error);
    });

    it('should return true when no subscription exists', async () => {
      (service as any).subscription = null;
      
      const result = await service.unsubscribeFromPush();
      
      expect(result).toBe(true);
      expect(mockSubscription.unsubscribe).not.toHaveBeenCalled();
    });

    it('should handle server unsubscription API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, statusText: 'Server Error' });
      (service as any).subscription = mockSubscription;
      
      const result = await service.unsubscribeFromPush();
      
      expect(result).toBe(true);
      expect(console.error).toHaveBeenCalledWith('Failed to remove subscription from server:', expect.any(Error));
    });

    it('should handle server unsubscription API network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      (service as any).subscription = mockSubscription;
      
      const result = await service.unsubscribeFromPush();
      
      expect(result).toBe(true);
      expect(console.error).toHaveBeenCalledWith('Failed to remove subscription from server:', expect.any(Error));
    });
  });

  describe('VAPID Key Conversion', () => {
    it('should convert VAPID key from base64 to Uint8Array', () => {
      (global.window.atob as jest.Mock).mockReturnValue('test-raw-data');
      
      const result = (service as any).urlBase64ToUint8Array('dGVzdC1rZXk');
      
      expect(result).toBeInstanceOf(Uint8Array);
      expect(global.window.atob).toHaveBeenCalled();
    });

    it('should handle base64 strings that need padding', () => {
      (global.window.atob as jest.Mock).mockReturnValue('test');
      
      const result = (service as any).urlBase64ToUint8Array('dGVzdA'); // Missing padding
      
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(4);
    });

    it('should replace URL-safe characters', () => {
      (global.window.atob as jest.Mock).mockReturnValue('test');
      
      (service as any).urlBase64ToUint8Array('dGVzd-_test');
      
      // Verify that atob is called with standard base64 characters
      const calledWith = (global.window.atob as jest.Mock).mock.calls[0][0];
      expect(calledWith).not.toContain('-');
      expect(calledWith).not.toContain('_');
      expect(calledWith).toContain('+');
      expect(calledWith).toContain('/');
    });
  });

  describe('Subscription Status', () => {
    it('should return complete subscription status', async () => {
      mockNotification.permission = 'granted';
      (service as any).registration = mockServiceWorkerRegistration;
      mockPushManager.getSubscription.mockResolvedValue(mockSubscription);
      
      const status = await service.getSubscriptionStatus();
      
      expect(status).toEqual({
        isSupported: true,
        isVapidConfigured: true,
        hasPermission: 'granted',
        isSubscribed: true,
        subscription: mockSubscription,
      });
    });

    it('should return status when not subscribed', async () => {
      mockNotification.permission = 'denied';
      (service as any).registration = mockServiceWorkerRegistration;
      mockPushManager.getSubscription.mockResolvedValue(null);
      
      const status = await service.getSubscriptionStatus();
      
      expect(status).toEqual({
        isSupported: true,
        isVapidConfigured: true,
        hasPermission: 'denied',
        isSubscribed: false,
        subscription: null,
      });
    });

    it('should return status when not supported', async () => {
      const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
      
      if (originalServiceWorker) {
        delete (navigator as any).serviceWorker;
      }
      
      const status = await service.getSubscriptionStatus();
      
      expect(status).toEqual({
        isSupported: false,
        isVapidConfigured: true,
        hasPermission: 'denied',
        isSubscribed: false,
        subscription: null,
      });
      
      if (originalServiceWorker) {
        Object.defineProperty(navigator, 'serviceWorker', originalServiceWorker);
      }
    });

    it('should return status without registration', async () => {
      (service as any).registration = null;
      
      const status = await service.getSubscriptionStatus();
      
      expect(status.isSubscribed).toBe(false);
      expect(status.subscription).toBeNull();
    });
  });

  describe('Test Notification', () => {
    it('should show test notification when supported and permitted', async () => {
      mockNotification.permission = 'granted';
      
      await service.showTestNotification();
      
      expect(global.Notification).toHaveBeenCalledWith('StockPulse Test', {
        body: 'Push notifications are working! 🎉',
        icon: '/icons/icon-192x192.svg',
        badge: '/icons/icon-72x72.svg',
        tag: 'test-notification',
        requireInteraction: false,
      });
    });

    it('should not show test notification when permission denied', async () => {
      mockNotification.permission = 'denied';
      
      await service.showTestNotification();
      
      expect(global.Notification).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith('Cannot show notification: not supported or permission denied');
    });

    it('should not show test notification when not supported', async () => {
      const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
      
      if (originalServiceWorker) {
        delete (navigator as any).serviceWorker;
      }
      
      await service.showTestNotification();
      
      expect(global.Notification).not.toHaveBeenCalled();
      
      if (originalServiceWorker) {
        Object.defineProperty(navigator, 'serviceWorker', originalServiceWorker);
      }
    });

    it('should handle test notification creation errors', async () => {
      mockNotification.permission = 'granted';
      (global.Notification as any).mockImplementation(() => {
        throw new Error('Notification creation failed');
      });
      
      await service.showTestNotification();
      
      expect(console.error).toHaveBeenCalledWith('Failed to show test notification:', expect.any(Error));
    });

    it('should auto-close test notification after timeout', async () => {
      mockNotification.permission = 'granted';
      jest.useFakeTimers();
      
      // Create a mock notification instance with close method
      const mockNotificationInstance = {
        title: 'StockPulse Test',
        body: 'Push notifications are working! 🎉',
        close: jest.fn(),
      };
      
      (global.Notification as any).mockImplementation(() => mockNotificationInstance);
      
      await service.showTestNotification();
      
      // Fast-forward time
      jest.advanceTimersByTime(5000);
      
      expect(mockNotificationInstance.close).toHaveBeenCalled();
      
      jest.useRealTimers();
    });
  });

  describe('Server API Integration', () => {
    describe('Subscription API', () => {
      it('should send correct subscription data to server', async () => {
        mockSubscription.toJSON.mockReturnValue({
          endpoint: 'test-endpoint',
          keys: { p256dh: 'test-key', auth: 'test-auth' },
        });
        
        // Ensure service has registration set up
        (service as any).registration = mockServiceWorkerRegistration;
        
        await service.subscribeToPush();
        
        expect(global.fetch).toHaveBeenCalledWith('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('subscription'),
        });
        
        // Check the actual body content
        const calls = (global.fetch as jest.Mock).mock.calls;
        const lastCall = calls[calls.length - 1];
        const body = JSON.parse(lastCall[1].body);
        
        expect(body.subscription).toEqual({
          endpoint: 'test-endpoint',
          keys: { p256dh: 'test-key', auth: 'test-auth' },
        });
        expect(body.userAgent).toBe('Test User Agent');
        expect(typeof body.timestamp).toBe('number');
      });
    });

    describe('Unsubscription API', () => {
      it('should send correct unsubscription data to server', async () => {
        (service as any).subscription = mockSubscription;
        
        await service.unsubscribeFromPush();
        
        expect(global.fetch).toHaveBeenCalledWith('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('timestamp'),
        });
        
        // Check the actual body content
        const calls = (global.fetch as jest.Mock).mock.calls;
        const lastCall = calls[calls.length - 1];
        const body = JSON.parse(lastCall[1].body);
        
        expect(typeof body.timestamp).toBe('number');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle multiple consecutive errors gracefully', async () => {
      mockServiceWorker.register.mockRejectedValue(new Error('SW error'));
      mockNotification.requestPermission.mockRejectedValue(new Error('Permission error'));
      mockPushManager.subscribe.mockRejectedValue(new Error('Subscribe error'));
      
      const registration = await service.registerServiceWorker();
      const permission = await service.requestPermission();
      const subscription = await service.subscribeToPush();
      
      expect(registration).toBeNull();
      expect(permission).toBe('denied');
      expect(subscription).toBeNull();
      
      // Should not throw
    });

    it('should handle undefined/null values gracefully', async () => {
      mockPushManager.getSubscription.mockResolvedValue(null);
      mockPushManager.subscribe.mockResolvedValue(null);
      
      const subscription = await service.subscribeToPush();
      
      expect(subscription).toBeNull();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete subscription flow', async () => {
      // Request permission
      const permission = await service.requestPermission();
      expect(permission).toBe('granted');
      
      // Subscribe to push
      const subscription = await service.subscribeToPush();
      expect(subscription).toBe(mockSubscription);
      
      // Check status
      mockNotification.permission = 'granted';
      (service as any).registration = mockServiceWorkerRegistration;
      mockPushManager.getSubscription.mockResolvedValue(mockSubscription);
      
      const status = await service.getSubscriptionStatus();
      expect(status.isSubscribed).toBe(true);
      
      // Unsubscribe
      const unsubscribed = await service.unsubscribeFromPush();
      expect(unsubscribed).toBe(true);
    });

    it('should handle failed permission then retry', async () => {
      // First attempt fails
      mockNotification.requestPermission.mockResolvedValueOnce('denied');
      let permission = await service.requestPermission();
      expect(permission).toBe('denied');
      
      // Second attempt succeeds
      mockNotification.requestPermission.mockResolvedValueOnce('granted');
      permission = await service.requestPermission();
      expect(permission).toBe('granted');
    });
  });
});