/**
 * Unit Tests for PushNotificationService
 * ======================================
 * 
 * Tests for the push notification service (no VAPID required)
 */

import { PushNotificationService, getPushNotificationService } from './pushNotificationService';

// Mock global APIs
const mockSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
  keys: {
    p256dh: 'test-p256dh-key',
    auth: 'test-auth-key'
  },
  toJSON: jest.fn(),
  unsubscribe: jest.fn()
};

const mockServiceWorkerRegistration = {
  active: { state: 'activated' },
  installing: null,
  waiting: null,
  pushManager: {
    getSubscription: jest.fn(),
    subscribe: jest.fn()
  },
  showNotification: jest.fn()
};

const mockServiceWorker = {
  register: jest.fn(),
  ready: Promise.resolve(mockServiceWorkerRegistration)
};

// Mock global objects
Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: mockServiceWorker,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  writable: true
});

Object.defineProperty(global, 'window', {
  value: {
    atob: jest.fn(),
    matchMedia: jest.fn(() => ({ matches: false })),
    navigator: { standalone: false }
  },
  writable: true
});

Object.defineProperty(global, 'Notification', {
  value: {
    permission: 'granted',
    requestPermission: jest.fn().mockResolvedValue('granted')
  },
  writable: true
});

Object.defineProperty(global, 'PushManager', {
  value: {},
  writable: true
});

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

Object.defineProperty(global, 'console', {
  value: mockConsole,
  writable: true
});

describe('PushNotificationService', () => {
  let service: PushNotificationService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockServiceWorker.register.mockResolvedValue(mockServiceWorkerRegistration);
    mockServiceWorkerRegistration.pushManager.getSubscription.mockResolvedValue(null);
    mockServiceWorkerRegistration.pushManager.subscribe.mockResolvedValue(mockSubscription);
    mockSubscription.unsubscribe.mockResolvedValue(true);
    mockSubscription.toJSON.mockReturnValue({ endpoint: 'test-endpoint' });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    
    // No VAPID configuration needed
    
    service = PushNotificationService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PushNotificationService.getInstance();
      const instance2 = PushNotificationService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should work with lazy loading', () => {
      const lazyService = getPushNotificationService();
      expect(lazyService).toBeInstanceOf(PushNotificationService);
    });
  });

  describe('Device Detection', () => {
    it('should detect mobile devices', () => {
      const deviceInfo = service.getDeviceInfo();
      expect(deviceInfo).toHaveProperty('deviceType');
      expect(deviceInfo).toHaveProperty('browserType');
      expect(deviceInfo).toHaveProperty('isMobile');
      expect(deviceInfo).toHaveProperty('isIOS');
      expect(deviceInfo).toHaveProperty('isAndroid');
      expect(deviceInfo).toHaveProperty('isStandalone');
    });

    it('should detect iOS devices', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: mockServiceWorker,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X)'
        },
        writable: true
      });
      
      (PushNotificationService as any).instance = null;
      const iosService = PushNotificationService.getInstance();
      const deviceInfo = iosService.getDeviceInfo();
      
      expect(deviceInfo.isMobile).toBe(true);
      expect(deviceInfo.isIOS).toBe(true);
    });

    it('should detect Android devices', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: mockServiceWorker,
          userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36'
        },
        writable: true
      });
      
      (PushNotificationService as any).instance = null;
      const androidService = PushNotificationService.getInstance();
      const deviceInfo = androidService.getDeviceInfo();
      
      expect(deviceInfo.isMobile).toBe(true);
      expect(deviceInfo.isAndroid).toBe(true);
    });
  });

  describe('Service Readiness', () => {
    it('should detect service readiness', () => {
      expect(service.isReady()).toBe(true);
    });

    it('should handle server-side initialization', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Intentionally deleting global.window for server-side testing
      delete global.window;
      
      (PushNotificationService as any).instance = null;
      const serverService = PushNotificationService.getInstance();
      
      expect(serverService.isReady()).toBe(false);
      
      global.window = originalWindow;
    });
  });

  describe('Service Worker Registration', () => {
    it('should register service worker successfully', async () => {
      const registration = await service.registerServiceWorker();
      
      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw-custom.js');
      expect(registration).toBe(mockServiceWorkerRegistration);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Service worker registered for push notifications')
      );
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
    it('should request notification permission', async () => {
      const permission = await service.requestPermission();
      
      expect(global.Notification.requestPermission).toHaveBeenCalled();
      expect(permission).toBe('granted');
    });

    it('should handle permission request failure', async () => {
      const error = new Error('Permission denied');
      (global.Notification.requestPermission as jest.Mock).mockRejectedValue(error);
      
      const permission = await service.requestPermission();
      
      expect(permission).toBe('denied');
      expect(console.error).toHaveBeenCalledWith('Failed to request notification permission:', error);
    });

    it('should return denied when not supported', async () => {
      const originalNotification = global.Notification;
      // @ts-expect-error - Intentionally deleting global.Notification for testing
      delete global.Notification;
      
      const permission = await service.requestPermission();
      
      expect(permission).toBe('denied');
      
      global.Notification = originalNotification;
    });
  });

  describe('Push Subscription', () => {
    it('should subscribe to push notifications successfully', async () => {
      const subscription = await service.subscribeToPush();
      
      expect(subscription).toBe(mockSubscription);
      expect(mockServiceWorkerRegistration.pushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true
      });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Subscribed to push notifications')
      );
    });

    it('should return existing subscription if already subscribed', async () => {
      mockServiceWorkerRegistration.pushManager.getSubscription.mockResolvedValue(mockSubscription);
      
      const subscription = await service.subscribeToPush();
      
      expect(subscription).toBe(mockSubscription);
      expect(mockServiceWorkerRegistration.pushManager.subscribe).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Already subscribed to push notifications');
    });

    it('should handle subscription failure', async () => {
      const error = new Error('Subscription failed');
      mockServiceWorkerRegistration.pushManager.subscribe.mockRejectedValue(error);
      
      const subscription = await service.subscribeToPush();
      
      expect(subscription).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Failed to subscribe to push notifications:', error);
    });

    it('should not subscribe when not supported', async () => {
      const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
      
      if (originalServiceWorker) {
        delete (navigator as any).serviceWorker;
      }
      
      const subscription = await service.subscribeToPush();
      
      expect(subscription).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('Push notifications not supported');
      
      if (originalServiceWorker) {
        Object.defineProperty(navigator, 'serviceWorker', originalServiceWorker);
      }
    });
  });

  describe('Unsubscribe', () => {
    it('should unsubscribe successfully', async () => {
      mockServiceWorkerRegistration.pushManager.getSubscription.mockResolvedValue(mockSubscription);
      
      const result = await service.unsubscribeFromPush();
      
      expect(result).toBe(true);
      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Unsubscribed from push notifications');
    });

    it('should return true when no subscription exists', async () => {
      mockServiceWorkerRegistration.pushManager.getSubscription.mockResolvedValue(null);
      
      const result = await service.unsubscribeFromPush();
      
      expect(result).toBe(true);
      expect(mockSubscription.unsubscribe).not.toHaveBeenCalled();
    });

    it('should handle unsubscribe failure', async () => {
      const error = new Error('Unsubscribe failed');
      mockSubscription.unsubscribe.mockRejectedValue(error);
      mockServiceWorkerRegistration.pushManager.getSubscription.mockResolvedValue(mockSubscription);
      
      const result = await service.unsubscribeFromPush();
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Failed to unsubscribe from push notifications:', error);
    });
  });

  describe('Subscription Status', () => {
    it('should return correct subscription status', async () => {
      mockServiceWorkerRegistration.pushManager.getSubscription.mockResolvedValue(mockSubscription);
      
      const status = await service.getSubscriptionStatus();
      
      expect(status).toHaveProperty('isSupported', true);
      expect(status).toHaveProperty('isReady', true);
      expect(status).toHaveProperty('hasPermission', 'granted');
      expect(status).toHaveProperty('isSubscribed', true);
      expect(status).toHaveProperty('subscription', mockSubscription);
      expect(status).toHaveProperty('deviceInfo');
    });

    it('should return correct status when not subscribed', async () => {
      mockServiceWorkerRegistration.pushManager.getSubscription.mockResolvedValue(null);
      
      const status = await service.getSubscriptionStatus();
      
      expect(status.isSubscribed).toBe(false);
      expect(status.subscription).toBeNull();
    });
  });

  describe('Test Notification', () => {
    it('should show test notification successfully', async () => {
      const mockNotification = {
        close: jest.fn()
      };
      
      // Mock Notification constructor
      const NotificationConstructor = jest.fn(() => mockNotification);
      Object.defineProperty(global, 'Notification', {
        value: NotificationConstructor,
        writable: true
      });
      
      await service.showTestNotification();
      
      expect(NotificationConstructor).toHaveBeenCalledWith(
        expect.stringContaining('StockPulse Test'),
        expect.objectContaining({
          body: expect.stringContaining('Push notifications are working'),
          icon: '/icons/icon-192x192.svg',
          badge: '/icons/icon-72x72.svg',
          tag: 'test-notification',
          requireInteraction: true
        })
      );
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Test notification shown')
      );
    });

    it('should not show notification when permission denied', async () => {
      Object.defineProperty(global, 'Notification', {
        value: {
          permission: 'denied',
          requestPermission: jest.fn().mockResolvedValue('denied')
        },
        writable: true
      });
      
      await service.showTestNotification();
      
      expect(console.warn).toHaveBeenCalledWith(
        'Cannot show notification: not supported or permission denied'
      );
    });
  });
});