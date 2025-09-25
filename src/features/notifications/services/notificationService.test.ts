/**
 * Tests for NotificationService
 * =============================
 * 
 * Tests for the stock price alert notification service.
 */

import { NotificationService, getNotificationService } from './notificationService';
import type { WatchedStock } from '@/core/types';
import { jest } from '@jest/globals';

// Mock types for tests
interface MockNotification extends Notification {
  onclick: ((this: Notification, ev: Event) => any) | null;
  onclose: ((this: Notification, ev: Event) => any) | null;
  onerror: ((this: Notification, ev: Event) => any) | null;
}

interface MockServiceWorkerRegistration extends ServiceWorkerRegistration {
  installing: ServiceWorker | null;
  waiting: ServiceWorker | null;
  active: ServiceWorker | null;
  showNotification: jest.MockedFunction<any>;
  getNotifications: jest.MockedFunction<any>;
}

// Global test setup
describe('NotificationService', () => {
  let service: NotificationService;
  let mockNotification: jest.MockedFunction<any>;
  let mockServiceWorkerRegistration: MockServiceWorkerRegistration;
  let mockRequestPermission: jest.MockedFunction<any>;
  let originalWindow: any;
  let originalNavigator: any;

  // Test data
  const mockStock: WatchedStock = {
    id: 'test-stock-1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    alertPrice: 150.00,
    currentPrice: 155.50,
    change: 5.50,
    changePercent: 3.67,
    volume: 1000000,
    lastUpdated: Date.now(),
    color: '#007bff'
  };

  beforeEach(() => {
    // Reset singleton instance
    NotificationService.resetInstance();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Save original globals
    originalWindow = global.window;
    originalNavigator = global.navigator;

    // Setup notification mock
    mockRequestPermission = jest.fn();
    mockNotification = jest.fn().mockImplementation((title: string, options?: NotificationOptions) => {
      const notification: Partial<MockNotification> = {
        title,
        body: options?.body,
        icon: options?.icon,
        close: jest.fn(),
        onclick: null,
        onclose: null,
        onerror: null,
      };
      return notification as MockNotification;
    });
    
    // Setup service worker mock
    mockServiceWorkerRegistration = {
      installing: null,
      waiting: null,
      active: {
        state: 'activated',
        postMessage: jest.fn(),
        addEventListener: jest.fn(),
      } as any,
      showNotification: jest.fn(),
      getNotifications: jest.fn().mockResolvedValue([]),
    } as MockServiceWorkerRegistration;

    // Setup global mocks
    global.Notification = mockNotification as any;
    (global.Notification as any).requestPermission = mockRequestPermission;
    (global.Notification as any).permission = 'default';

    // Setup window and navigator
    Object.defineProperty(global, 'window', {
      value: {
        Notification: mockNotification,
        navigator: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          serviceWorker: {
            register: jest.fn().mockResolvedValue(mockServiceWorkerRegistration),
            addEventListener: jest.fn(),
          },
        },
        matchMedia: jest.fn().mockReturnValue({ matches: false }),
        focus: jest.fn(),
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        serviceWorker: {
          register: jest.fn().mockResolvedValue(mockServiceWorkerRegistration),
          addEventListener: jest.fn(),
        },
      },
      writable: true,
      configurable: true,
    });

    // Create fresh service instance
    service = NotificationService.getInstance();
  });

  afterEach(() => {
    // Clean up service
    if (service) {
      service.destroy();
    }
    
    // Reset singleton
    NotificationService.resetInstance();
    
    // Restore globals
    global.window = originalWindow;
    global.navigator = originalNavigator;
  });

  describe('Basic Functionality', () => {
    test('should create singleton instance', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(NotificationService);
    });

    test('should return same instance', () => {
      const instance1 = NotificationService.getInstance();
      const instance2 = NotificationService.getInstance();
      const instance3 = getNotificationService();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(instance3);
    });

    test('should not be enabled by default', () => {
      expect(service.isEnabled()).toBe(false);
    });

    test('should be able to request permission by default', () => {
      expect(service.canRequestPermission()).toBe(true);
    });

    test('should get default permission status', () => {
      const permission = service.getPermissionStatus();
      expect(['default', 'denied', 'granted']).toContain(permission);
    });
  });

  describe('Permission Management', () => {
    test('should request permission successfully', async () => {
      mockRequestPermission.mockResolvedValue('granted');
      
      const result = await service.requestPermission();
      
      expect(result).toBe('granted');
      expect(mockRequestPermission).toHaveBeenCalled();
    });

    test('should handle permission denied', async () => {
      mockRequestPermission.mockResolvedValue('denied');
      
      const result = await service.requestPermission();
      
      expect(result).toBe('denied');
    });

    test('should handle permission request errors', async () => {
      mockRequestPermission.mockRejectedValue(new Error('Permission request failed'));
      
      const result = await service.requestPermission();
      
      expect(result).toBe('denied');
    });
  });

  describe('Service Worker Management', () => {
    test('should register service worker successfully', async () => {
      mockRequestPermission.mockResolvedValue('granted');
      
      await service.requestPermission();
      
      expect(global.navigator.serviceWorker.register).toHaveBeenCalledWith('/sw-custom.js');
    });

    test('should handle service worker registration failure gracefully', async () => {
      const mockError = new Error('Service worker registration failed');
      (global.navigator.serviceWorker.register as jest.Mock).mockRejectedValue(mockError);
      mockRequestPermission.mockResolvedValue('granted');
      
      const result = await service.requestPermission();
      
      expect(result).toBe('granted');
      // Should not fail even if service worker fails
    });
  });

  describe('Price Alert Notifications', () => {
    beforeEach(async () => {
      mockRequestPermission.mockResolvedValue('granted');
      (global.Notification as any).permission = 'granted';
      await service.requestPermission();
    });

    test('should send price alert notification successfully', async () => {
      service.showPriceAlert(mockStock, 155.50);
      
      // Wait a bit for async operations
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should be called (either service worker or regular notification)
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalled();
    });

    test('should enforce rate limiting', () => {
      // First notification should succeed
      service.showPriceAlert(mockStock, 155.50);
      
      // Immediate second notification should be rate limited (no additional calls)
      const initialCallCount = mockServiceWorkerRegistration.showNotification.mock.calls.length;
      service.showPriceAlert(mockStock, 156.00);
      const finalCallCount = mockServiceWorkerRegistration.showNotification.mock.calls.length;
      
      expect(finalCallCount).toBe(initialCallCount);
    });

    test('should handle invalid stock data', () => {
      const invalidStock = { ...mockStock, symbol: '' };
      
      // Should not throw error
      expect(() => {
        service.showPriceAlert(invalidStock as WatchedStock, 155.50);
      }).not.toThrow();
    });
  });

  describe('Notification Management', () => {
    beforeEach(async () => {
      mockRequestPermission.mockResolvedValue('granted');
      (global.Notification as any).permission = 'granted';
      await service.requestPermission();
    });

    test('should show connection status notification', async () => {
      await service.showConnectionStatus(true);
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalled();
    });

    test('should show error notification', async () => {
      await service.showError('Test error message');
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalled();
    });

    test('should show success notification', async () => {
      await service.showSuccess('Test success message');
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalled();
    });

    test('should clear all notifications', () => {
      service.clearAllNotifications();
      
      // Should call getNotifications to get list for clearing
      expect(mockServiceWorkerRegistration.getNotifications).toHaveBeenCalled();
    });

    test('should clear stock notifications', () => {
      service.clearStockNotifications('AAPL');
      
      // Should call getNotifications to get list for clearing
      expect(mockServiceWorkerRegistration.getNotifications).toHaveBeenCalled();
    });
  });

  describe('Cleanup and Resource Management', () => {
    test('should clear all notifications on destroy', async () => {
      mockServiceWorkerRegistration.getNotifications.mockResolvedValue([
        { close: jest.fn() },
        { close: jest.fn() },
      ]);
      
      // First enable the service so it has a service worker registration
      mockRequestPermission.mockResolvedValue('granted');
      (global.Notification as any).permission = 'granted';
      await service.requestPermission();
      
      service.destroy();
      
      // Wait a bit for async operations
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify cleanup was attempted
      expect(mockServiceWorkerRegistration.getNotifications).toHaveBeenCalled();
    });

    test('should handle cleanup gracefully when service worker unavailable', () => {
      service.destroy();
      
      // Should not throw
      expect(() => service.destroy()).not.toThrow();
    });
  });

  describe('Click Handlers', () => {
    test('should setup click handlers', async () => {
      // First enable the service so it has a service worker registration
      mockRequestPermission.mockResolvedValue('granted');
      (global.Notification as any).permission = 'granted';
      await service.requestPermission();
      
      service.setupClickHandlers();
      
      // Should add event listener for service worker messages
      expect(global.navigator.serviceWorker.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });
  });

  describe('Unsupported Environment', () => {
    test('should handle unsupported environment gracefully', () => {
      // Reset to unsupported environment
      NotificationService.resetInstance();
      
      Object.defineProperty(global, 'window', {
        value: {
          navigator: global.navigator,
        },
        writable: true,
        configurable: true,
      });
      
      const unsupportedService = NotificationService.getInstance();
      
      expect(unsupportedService.isEnabled()).toBe(false);
      expect(unsupportedService.canRequestPermission()).toBe(false);
      
      unsupportedService.destroy();
    });
  });
});