/**
 * Unit Tests for NotificationService
 * ==================================
 * 
 * Tests for the price alert notification service
 */

import { NotificationService, getNotificationService } from './notificationService';
import type { WatchedStock } from '@/core/types';

// Mock the global Notification API
const mockNotification = {
  requestPermission: jest.fn(),
  close: jest.fn(),
  onclick: null,
};

global.Notification = jest.fn().mockImplementation((title, options) => ({
  title,
  ...options,
  close: mockNotification.close,
  onclick: null,
})) as any;

// Add static properties to Notification
(global.Notification as any).requestPermission = mockNotification.requestPermission;

// Mock ServiceWorker API
const mockServiceWorkerRegistration = {
  installing: null,
  waiting: null,
  active: { state: 'activated' },
  showNotification: jest.fn(),
  getNotifications: jest.fn().mockResolvedValue([]),
};

const mockServiceWorker = {
  register: jest.fn().mockResolvedValue(mockServiceWorkerRegistration),
  addEventListener: jest.fn(),
};

Object.defineProperty(global.navigator, 'serviceWorker', {
  value: mockServiceWorker,
  writable: true,
});

// Mock window object
Object.defineProperty(global, 'window', {
  value: {
    focus: jest.fn(),
  },
  writable: true,
});

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

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the singleton instance
    (NotificationService as any).instance = null;
    
    // Mock successful permission by default
    mockNotification.requestPermission.mockResolvedValue('granted');
    
    // Mock environment as production
    process.env.NODE_ENV = 'production';
    
    service = NotificationService.getInstance();
  });

  afterEach(() => {
    service.destroy();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = NotificationService.getInstance();
      const instance2 = NotificationService.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should work with getNotificationService helper', () => {
      const instance1 = getNotificationService();
      const instance2 = NotificationService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Support Detection', () => {
    it('should detect notification support', () => {
      // Notification and serviceWorker are mocked and available
      expect(service.canRequestPermission()).toBe(false); // Not default permission
      
      // Test with default permission
      (service as any).permission = 'default';
      expect(service.canRequestPermission()).toBe(true);
    });

    it('should handle missing Notification API', () => {
      const originalNotification = global.Notification;
      // @ts-ignore
      delete global.Notification;
      
      // Create new instance without Notification API
      (NotificationService as any).instance = null;
      const serviceWithoutNotification = NotificationService.getInstance();
      
      expect(serviceWithoutNotification.isEnabled()).toBe(false);
      
      global.Notification = originalNotification;
    });

    it('should handle missing ServiceWorker API', () => {
      const originalServiceWorker = navigator.serviceWorker;
      // @ts-ignore
      delete navigator.serviceWorker;
      
      (NotificationService as any).instance = null;
      const serviceWithoutSW = NotificationService.getInstance();
      
      expect(serviceWithoutSW.isEnabled()).toBe(false);
      
      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalServiceWorker,
        writable: true,
      });
    });
  });

  describe('Permission Management', () => {
    it('should request notification permission', async () => {
      mockNotification.requestPermission.mockResolvedValue('granted');
      
      const permission = await service.requestPermission();
      
      expect(mockNotification.requestPermission).toHaveBeenCalled();
      expect(permission).toBe('granted');
      expect(service.getPermissionStatus()).toBe('granted');
    });

    it('should handle denied permission', async () => {
      mockNotification.requestPermission.mockResolvedValue('denied');
      
      const permission = await service.requestPermission();
      
      expect(permission).toBe('denied');
      expect(service.isEnabled()).toBe(false);
    });

    it('should handle permission request errors', async () => {
      const error = new Error('Permission request failed');
      mockNotification.requestPermission.mockRejectedValue(error);
      
      const permission = await service.requestPermission();
      
      expect(permission).toBe('denied');
      expect(console.error).toHaveBeenCalledWith('Failed to request notification permission:', error);
    });

    it('should handle unsupported notifications', async () => {
      (service as any).isSupported = false;
      
      const permission = await service.requestPermission();
      
      expect(permission).toBe('denied');
      expect(console.warn).toHaveBeenCalledWith('Notifications not supported');
    });
  });

  describe('Service Worker Registration', () => {
    it('should register service worker in production', async () => {
      process.env.NODE_ENV = 'production';
      mockNotification.requestPermission.mockResolvedValue('granted');
      
      await service.requestPermission();
      
      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js');
    });

    it('should skip service worker registration in development', async () => {
      process.env.NODE_ENV = 'development';
      (NotificationService as any).instance = null;
      
      const devService = NotificationService.getInstance();
      await devService.requestPermission();
      
      expect(console.log).toHaveBeenCalledWith('Service worker registration skipped in development mode');
    });

    it('should handle service worker registration errors', async () => {
      const error = new Error('SW registration failed');
      mockServiceWorker.register.mockRejectedValue(error);
      mockNotification.requestPermission.mockResolvedValue('granted');
      
      await service.requestPermission();
      
      expect(console.error).toHaveBeenCalledWith(
        'Failed to register service worker (falling back to regular notifications):',
        error
      );
    });

    it('should handle missing service worker support', async () => {
      const originalServiceWorker = navigator.serviceWorker;
      // @ts-ignore
      delete navigator.serviceWorker;
      
      (NotificationService as any).instance = null;
      const serviceWithoutSW = NotificationService.getInstance();
      mockNotification.requestPermission.mockResolvedValue('granted');
      
      await serviceWithoutSW.requestPermission();
      
      expect(console.log).toHaveBeenCalledWith('Service worker not supported, using fallback notifications');
      
      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalServiceWorker,
        writable: true,
      });
    });
  });

  describe('Service Worker State Handling', () => {
    it('should handle installing service worker', async () => {
      mockServiceWorkerRegistration.installing = { state: 'installing' };
      mockServiceWorkerRegistration.active = null;
      mockNotification.requestPermission.mockResolvedValue('granted');
      
      await service.requestPermission();
      
      expect(console.log).toHaveBeenCalledWith('Service worker installing...');
    });

    it('should handle waiting service worker', async () => {
      mockServiceWorkerRegistration.waiting = { state: 'waiting' };
      mockServiceWorkerRegistration.active = null;
      mockNotification.requestPermission.mockResolvedValue('granted');
      
      await service.requestPermission();
      
      expect(console.log).toHaveBeenCalledWith('Service worker waiting...');
    });

    it('should handle active service worker', async () => {
      mockServiceWorkerRegistration.active = { state: 'activated' };
      mockNotification.requestPermission.mockResolvedValue('granted');
      
      await service.requestPermission();
      
      expect(console.log).toHaveBeenCalledWith('Service worker active and ready');
    });
  });

  describe('Price Alert Notifications', () => {
    const mockStock: WatchedStock = {
      id: 'stock_1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      alertPrice: 150.0,
      currentPrice: 155.0,
      priceHistory: [],
    };

    beforeEach(() => {
      (service as any).permission = 'granted';
      (service as any).isSupported = true;
    });

    it('should show price alert notification for stock above alert price', () => {
      const showNotificationSpy = jest.spyOn(service, 'showNotification').mockResolvedValue();
      
      service.showPriceAlert(mockStock, 160.0);
      
      expect(showNotificationSpy).toHaveBeenCalledWith({
        title: 'Price Alert: AAPL',
        body: 'AAPL is now $160.00 (above your alert of $150.00)',
        icon: '/icons/icon-192x192.svg',
        badge: '/icons/icon-72x72.svg',
        data: {
          symbol: 'AAPL',
          currentPrice: 160.0,
          alertPrice: 150.0,
          type: 'above',
        },
      });
    });

    it('should show price alert notification for stock below alert price', () => {
      const showNotificationSpy = jest.spyOn(service, 'showNotification').mockResolvedValue();
      
      service.showPriceAlert(mockStock, 140.0);
      
      expect(showNotificationSpy).toHaveBeenCalledWith({
        title: 'Price Alert: AAPL',
        body: 'AAPL is now $140.00 (below your alert of $150.00)',
        icon: '/icons/icon-192x192.svg',
        badge: '/icons/icon-72x72.svg',
        data: {
          symbol: 'AAPL',
          currentPrice: 140.0,
          alertPrice: 150.0,
          type: 'below',
        },
      });
    });

    it('should not show notification when service is disabled', () => {
      (service as any).permission = 'denied';
      const showNotificationSpy = jest.spyOn(service, 'showNotification');
      
      service.showPriceAlert(mockStock, 160.0);
      
      expect(showNotificationSpy).not.toHaveBeenCalled();
    });

    it('should not show notification for invalid stock', () => {
      const showNotificationSpy = jest.spyOn(service, 'showNotification');
      
      service.showPriceAlert({} as WatchedStock, 160.0);
      
      expect(showNotificationSpy).not.toHaveBeenCalled();
    });

    it('should prevent spam notifications (throttling)', () => {
      const showNotificationSpy = jest.spyOn(service, 'showNotification').mockResolvedValue();
      
      // First notification should go through
      service.showPriceAlert(mockStock, 160.0);
      expect(showNotificationSpy).toHaveBeenCalledTimes(1);
      
      // Second notification within 60 seconds should be blocked
      service.showPriceAlert(mockStock, 165.0);
      expect(showNotificationSpy).toHaveBeenCalledTimes(1);
      
      // Mock time passing (61 seconds)
      const originalNow = Date.now;
      Date.now = jest.fn().mockReturnValue(originalNow() + 61000);
      
      // Third notification after 60 seconds should go through
      service.showPriceAlert(mockStock, 170.0);
      expect(showNotificationSpy).toHaveBeenCalledTimes(2);
      
      Date.now = originalNow;
    });
  });

  describe('Generic Notifications', () => {
    beforeEach(() => {
      (service as any).permission = 'granted';
      (service as any).isSupported = true;
    });

    it('should show service worker notification when available', async () => {
      (service as any).serviceWorkerRegistration = mockServiceWorkerRegistration;
      mockServiceWorkerRegistration.showNotification.mockResolvedValue();
      
      const notification = {
        title: 'Test Title',
        body: 'Test Body',
        icon: '/test-icon.png',
        data: { symbol: 'TEST', currentPrice: 100, alertPrice: 90, type: 'above' as const },
      };
      
      await service.showNotification(notification);
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
        icon: '/test-icon.png',
        badge: '/icons/icon-72x72.svg',
        data: notification.data,
        tag: 'price-alert-TEST',
        requireInteraction: true,
      });
    });

    it('should fallback to regular notification when service worker fails', async () => {
      (service as any).serviceWorkerRegistration = mockServiceWorkerRegistration;
      mockServiceWorkerRegistration.showNotification.mockRejectedValue(new Error('SW error'));
      
      const notification = {
        title: 'Test Title',
        body: 'Test Body',
        data: { symbol: 'TEST', currentPrice: 100, alertPrice: 90, type: 'above' as const },
      };
      
      await service.showNotification(notification);
      
      expect(global.Notification).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
        icon: '/icons/icon-192x192.svg',
        badge: '/icons/icon-72x72.svg',
        data: notification.data,
        tag: 'price-alert-TEST',
        requireInteraction: true,
      });
    });

    it('should use regular notification when service worker not available', async () => {
      (service as any).serviceWorkerRegistration = null;
      
      const notification = {
        title: 'Test Title',
        body: 'Test Body',
        data: { symbol: 'TEST', currentPrice: 100, alertPrice: 90, type: 'above' as const },
      };
      
      await service.showNotification(notification);
      
      expect(global.Notification).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
        icon: '/icons/icon-192x192.svg',
        badge: '/icons/icon-72x72.svg',
        data: notification.data,
        tag: 'price-alert-TEST',
        requireInteraction: true,
      });
    });

    it('should handle notification creation errors', async () => {
      (global.Notification as any).mockImplementation(() => {
        throw new Error('Notification creation failed');
      });
      
      const notification = {
        title: 'Test Title',
        body: 'Test Body',
        data: { symbol: 'TEST', currentPrice: 100, alertPrice: 90, type: 'above' as const },
      };
      
      await service.showNotification(notification);
      
      expect(console.error).toHaveBeenCalledWith('Failed to show notification:', expect.any(Error));
    });

    it('should not show notification when disabled', async () => {
      (service as any).permission = 'denied';
      
      const notification = {
        title: 'Test Title',
        body: 'Test Body',
        data: { symbol: 'TEST', currentPrice: 100, alertPrice: 90, type: 'above' as const },
      };
      
      await service.showNotification(notification);
      
      expect(mockServiceWorkerRegistration.showNotification).not.toHaveBeenCalled();
      expect(global.Notification).not.toHaveBeenCalled();
    });
  });

  describe('Status Notifications', () => {
    beforeEach(() => {
      (service as any).permission = 'granted';
      (service as any).isSupported = true;
    });

    it('should show connection status notification for connected state', () => {
      const showNotificationSpy = jest.spyOn(service, 'showNotification').mockResolvedValue();
      
      service.showConnectionStatus(true);
      
      expect(showNotificationSpy).toHaveBeenCalledWith({
        title: 'Stock Tracker',
        body: 'Real-time connection restored',
        icon: '/icons/icon-192x192.png',
        data: {
          symbol: 'CONNECTION',
          currentPrice: 0,
          alertPrice: 0,
          type: 'above',
        },
      });
    });

    it('should show connection status notification for disconnected state', () => {
      const showNotificationSpy = jest.spyOn(service, 'showNotification').mockResolvedValue();
      
      service.showConnectionStatus(false);
      
      expect(showNotificationSpy).toHaveBeenCalledWith({
        title: 'Stock Tracker',
        body: 'Connection lost - using cached data',
        icon: '/icons/icon-192x192.png',
        data: {
          symbol: 'CONNECTION',
          currentPrice: 0,
          alertPrice: 0,
          type: 'above',
        },
      });
    });

    it('should show error notification', () => {
      const showNotificationSpy = jest.spyOn(service, 'showNotification').mockResolvedValue();
      
      service.showError('Test error message');
      
      expect(showNotificationSpy).toHaveBeenCalledWith({
        title: 'Stock Tracker Error',
        body: 'Test error message',
        icon: '/icons/icon-192x192.png',
        data: {
          symbol: 'ERROR',
          currentPrice: 0,
          alertPrice: 0,
          type: 'above',
        },
      });
    });

    it('should show success notification', () => {
      const showNotificationSpy = jest.spyOn(service, 'showNotification').mockResolvedValue();
      
      service.showSuccess('Test success message');
      
      expect(showNotificationSpy).toHaveBeenCalledWith({
        title: 'Stock Tracker',
        body: 'Test success message',
        icon: '/icons/icon-192x192.png',
        data: {
          symbol: 'SUCCESS',
          currentPrice: 0,
          alertPrice: 0,
          type: 'above',
        },
      });
    });

    it('should not show status notifications when disabled', () => {
      (service as any).permission = 'denied';
      const showNotificationSpy = jest.spyOn(service, 'showNotification');
      
      service.showConnectionStatus(true);
      service.showError('error');
      service.showSuccess('success');
      
      expect(showNotificationSpy).not.toHaveBeenCalled();
    });
  });

  describe('Notification Management', () => {
    beforeEach(() => {
      (service as any).serviceWorkerRegistration = mockServiceWorkerRegistration;
    });

    it('should clear all notifications', () => {
      const mockNotifications = [
        { close: jest.fn() },
        { close: jest.fn() },
      ];
      mockServiceWorkerRegistration.getNotifications.mockResolvedValue(mockNotifications);
      
      service.clearAllNotifications();
      
      expect(mockServiceWorkerRegistration.getNotifications).toHaveBeenCalled();
    });

    it('should clear notifications for specific stock', () => {
      const mockNotifications = [
        { tag: 'price-alert-AAPL', close: jest.fn() },
        { tag: 'price-alert-GOOGL', close: jest.fn() },
        { tag: 'other-notification', close: jest.fn() },
      ];
      mockServiceWorkerRegistration.getNotifications.mockResolvedValue(mockNotifications);
      
      service.clearStockNotifications('AAPL');
      
      expect(mockServiceWorkerRegistration.getNotifications).toHaveBeenCalled();
    });

    it('should handle clearing notifications without service worker', () => {
      (service as any).serviceWorkerRegistration = null;
      
      // Should not throw
      service.clearAllNotifications();
      service.clearStockNotifications('AAPL');
    });
  });

  describe('Click Handlers', () => {
    beforeEach(() => {
      (service as any).serviceWorkerRegistration = mockServiceWorkerRegistration;
    });

    it('should setup notification click handlers', () => {
      service.setupClickHandlers();
      
      expect(mockServiceWorker.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should handle notification click messages', () => {
      const windowFocusSpy = jest.spyOn(window, 'focus');
      service.setupClickHandlers();
      
      // Get the event listener function
      const messageListener = mockServiceWorker.addEventListener.mock.calls[0][1];
      
      // Simulate notification click message
      messageListener({
        data: {
          type: 'NOTIFICATION_CLICK',
          action: 'view',
          data: { symbol: 'AAPL' },
        },
      });
      
      expect(windowFocusSpy).toHaveBeenCalled();
    });

    it('should handle dismiss action', () => {
      service.setupClickHandlers();
      const messageListener = mockServiceWorker.addEventListener.mock.calls[0][1];
      
      messageListener({
        data: {
          type: 'NOTIFICATION_CLICK',
          action: 'dismiss',
          data: { symbol: 'AAPL' },
        },
      });
      
      // Should not crash
    });

    it('should handle default action', () => {
      const windowFocusSpy = jest.spyOn(window, 'focus');
      service.setupClickHandlers();
      const messageListener = mockServiceWorker.addEventListener.mock.calls[0][1];
      
      messageListener({
        data: {
          type: 'NOTIFICATION_CLICK',
          action: 'unknown',
          data: { symbol: 'AAPL' },
        },
      });
      
      expect(windowFocusSpy).toHaveBeenCalled();
    });

    it('should not setup handlers without service worker', () => {
      (service as any).serviceWorkerRegistration = null;
      
      service.setupClickHandlers();
      
      expect(mockServiceWorker.addEventListener).not.toHaveBeenCalled();
    });
  });

  describe('Service Worker Wait Logic', () => {
    it('should return true for active service worker', async () => {
      (service as any).serviceWorkerRegistration = mockServiceWorkerRegistration;
      mockServiceWorkerRegistration.active = { state: 'activated' };
      
      const result = await (service as any).waitForServiceWorker();
      
      expect(result).toBe(true);
    });

    it('should return false for no service worker registration', async () => {
      (service as any).serviceWorkerRegistration = null;
      
      const result = await (service as any).waitForServiceWorker();
      
      expect(result).toBe(false);
    });

    it('should wait for service worker to become active', async () => {
      (service as any).serviceWorkerRegistration = mockServiceWorkerRegistration;
      mockServiceWorkerRegistration.active = null;
      
      // Mock the service worker becoming active after a delay
      setTimeout(() => {
        mockServiceWorkerRegistration.active = { state: 'activated' };
      }, 200);
      
      const result = await (service as any).waitForServiceWorker();
      
      expect(result).toBe(true);
    }, 6000);

    it('should timeout when service worker never becomes active', async () => {
      (service as any).serviceWorkerRegistration = mockServiceWorkerRegistration;
      mockServiceWorkerRegistration.active = null;
      
      const result = await (service as any).waitForServiceWorker();
      
      expect(result).toBe(false);
    }, 6000);
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      const clearAllNotificationsSpy = jest.spyOn(service, 'clearAllNotifications');
      
      service.destroy();
      
      expect(clearAllNotificationsSpy).toHaveBeenCalled();
      expect((service as any).alertHistory.size).toBe(0);
      expect((service as any).serviceWorkerRegistration).toBeNull();
    });
  });

  describe('Regular Notification Click Handling', () => {
    it('should setup click handler for regular notifications', async () => {
      (service as any).serviceWorkerRegistration = null;
      const windowFocusSpy = jest.spyOn(window, 'focus');
      
      const notification = {
        title: 'Test Title',
        body: 'Test Body',
        data: { symbol: 'TEST', currentPrice: 100, alertPrice: 90, type: 'above' as const },
      };
      
      await service.showNotification(notification);
      
      // Get the created notification and simulate click
      const createdNotification = (global.Notification as any).mock.results[0].value;
      if (createdNotification.onclick) {
        createdNotification.onclick();
      }
      
      expect(windowFocusSpy).toHaveBeenCalled();
      expect(mockNotification.close).toHaveBeenCalled();
    });
  });
});