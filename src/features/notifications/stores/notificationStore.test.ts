/**
 * Notification Store Tests
 * =======================
 *
 * Comprehensive tests for the notification store with Zustand persistence.
 */

import { act, renderHook } from '@testing-library/react';
import { useNotificationStore } from './notificationStore';
import { STORAGE_KEYS } from '@/core/constants/constants';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock notification service
jest.mock('../services/notificationService', () => ({
  getNotificationService: () => ({
    requestPermission: jest.fn().mockResolvedValue('granted'),
  }),
}));

describe('NotificationStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();

    // Reset store state
    act(() => {
      useNotificationStore.setState({
        permission: 'default',
        isEnabled: true,
        pushSubscription: null,
        notifications: [],
        unreadCount: 0,
        showDesktopNotifications: true,
        showPushNotifications: true,
        soundEnabled: true,
      });
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useNotificationStore());

      expect(result.current.permission).toBe('default');
      expect(result.current.isEnabled).toBe(true);
      expect(result.current.pushSubscription).toBeNull();
      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.showDesktopNotifications).toBe(true);
      expect(result.current.showPushNotifications).toBe(true);
      expect(result.current.soundEnabled).toBe(true);
    });
  });

  describe('Permission Management', () => {
    it('should set permission correctly', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.setPermission('granted');
      });

      expect(result.current.permission).toBe('granted');
    });

    it('should set enabled state correctly', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.setEnabled(false);
      });

      expect(result.current.isEnabled).toBe(false);
    });

    it('should toggle notifications correctly', async () => {
      const { result } = renderHook(() => useNotificationStore());

      // Initially enabled
      expect(result.current.isEnabled).toBe(true);

      // Toggle off
      await act(async () => {
        await result.current.toggleNotifications();
      });

      expect(result.current.isEnabled).toBe(false);

      // Toggle back on
      await act(async () => {
        await result.current.toggleNotifications();
      });

      expect(result.current.isEnabled).toBe(true);
      expect(result.current.permission).toBe('granted');
    });

    it('should request permission correctly', async () => {
      const { result } = renderHook(() => useNotificationStore());

      await act(async () => {
        const permission = await result.current.requestPermission();
        expect(permission).toBe('granted');
      });

      expect(result.current.permission).toBe('granted');
      expect(result.current.isEnabled).toBe(true);
    });
  });

  describe('Push Subscription Management', () => {
    it('should set push subscription correctly', () => {
      const { result } = renderHook(() => useNotificationStore());

      const mockSubscription: any = {
        subscription: { endpoint: 'test-endpoint' },
        createdAt: Date.now(),
        lastUsed: Date.now(),
      };

      act(() => {
        result.current.setPushSubscription(mockSubscription);
      });

      expect(result.current.pushSubscription).toEqual(mockSubscription);
    });

    it('should clear push subscription correctly', () => {
      const { result } = renderHook(() => useNotificationStore());

      const mockSubscription: any = {
        subscription: { endpoint: 'test-endpoint' },
        createdAt: Date.now(),
        lastUsed: Date.now(),
      };

      // Set subscription first
      act(() => {
        result.current.setPushSubscription(mockSubscription);
      });

      expect(result.current.pushSubscription).toEqual(mockSubscription);

      // Clear subscription
      act(() => {
        result.current.clearPushSubscription();
      });

      expect(result.current.pushSubscription).toBeNull();
    });
  });

  describe('Notification History Management', () => {
    it('should add notification correctly', () => {
      const { result } = renderHook(() => useNotificationStore());

      const notificationData = {
        type: 'info' as const,
        title: 'Test Notification',
        message: 'This is a test notification',
      };

      act(() => {
        result.current.addNotification(notificationData);
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0]).toMatchObject({
        ...notificationData,
        read: false,
      });
      expect(result.current.notifications[0].id).toBeDefined();
      expect(result.current.notifications[0].timestamp).toBeDefined();
      expect(result.current.unreadCount).toBe(1);
    });

    it('should mark notification as read correctly', () => {
      const { result } = renderHook(() => useNotificationStore());

      const notificationData = {
        type: 'info' as const,
        title: 'Test Notification',
        message: 'This is a test notification',
      };

      // Add notification
      act(() => {
        result.current.addNotification(notificationData);
      });

      const notificationId = result.current.notifications[0].id;
      expect(result.current.unreadCount).toBe(1);

      // Mark as read
      act(() => {
        result.current.markAsRead(notificationId);
      });

      expect(result.current.notifications[0].read).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });

    it('should mark all notifications as read correctly', () => {
      const { result } = renderHook(() => useNotificationStore());

      // Add multiple notifications
      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Notification 1',
          message: 'Message 1',
        });
        result.current.addNotification({
          type: 'success',
          title: 'Notification 2',
          message: 'Message 2',
        });
      });

      expect(result.current.unreadCount).toBe(2);

      // Mark all as read
      act(() => {
        result.current.markAllAsRead();
      });

      expect(result.current.notifications.every(n => n.read)).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });

    it('should remove notification correctly', () => {
      const { result } = renderHook(() => useNotificationStore());

      // Add notification
      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Test Notification',
          message: 'This is a test notification',
        });
      });

      const notificationId = result.current.notifications[0].id;
      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.unreadCount).toBe(1);

      // Remove notification
      act(() => {
        result.current.removeNotification(notificationId);
      });

      expect(result.current.notifications).toHaveLength(0);
      expect(result.current.unreadCount).toBe(0);
    });

    it('should clear all notifications correctly', () => {
      const { result } = renderHook(() => useNotificationStore());

      // Add multiple notifications
      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Notification 1',
          message: 'Message 1',
        });
        result.current.addNotification({
          type: 'success',
          title: 'Notification 2',
          message: 'Message 2',
        });
      });

      expect(result.current.notifications).toHaveLength(2);
      expect(result.current.unreadCount).toBe(2);

      // Clear all notifications
      act(() => {
        result.current.clearNotifications();
      });

      expect(result.current.notifications).toHaveLength(0);
      expect(result.current.unreadCount).toBe(0);
    });
  });

  describe('Settings Management', () => {
    it('should set desktop notifications setting correctly', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.setShowDesktopNotifications(false);
      });

      expect(result.current.showDesktopNotifications).toBe(false);
    });

    it('should set push notifications setting correctly', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.setShowPushNotifications(false);
      });

      expect(result.current.showPushNotifications).toBe(false);
    });

    it('should set sound enabled setting correctly', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.setSoundEnabled(false);
      });

      expect(result.current.soundEnabled).toBe(false);
    });
  });

  describe('Persistence', () => {
    it('should persist state to localStorage', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.setPermission('granted');
        result.current.setEnabled(false);
        result.current.addNotification({
          type: 'info',
          title: 'Test',
          message: 'Test message',
        });
      });

      // Check if data is stored in localStorage
      const storedData = localStorageMock.getItem(STORAGE_KEYS.NOTIFICATIONS);
      expect(storedData).toBeTruthy();

      const parsedData = JSON.parse(storedData!);
      expect(parsedData.state.permission).toBe('granted');
      expect(parsedData.state.isEnabled).toBe(false);
      expect(parsedData.state.notifications).toHaveLength(1);
    });

    it('should migrate from old localStorage format', () => {
      // Set up old format data
      localStorageMock.setItem('stockpulse_notifications_enabled', 'false');

      // Create a new store instance (simulating app restart)
      renderHook(() => useNotificationStore());

      // The migration should have run and cleaned up old data
      expect(
        localStorageMock.getItem('stockpulse_notifications_enabled')
      ).toBeNull();
    });
  });

  describe('Convenience Hooks', () => {
    it('should provide useNotificationPermission hook', () => {
      const { result } = renderHook(() =>
        useNotificationStore(state => ({
          permission: state.permission,
          isEnabled: state.isEnabled,
          setPermission: state.setPermission,
          setEnabled: state.setEnabled,
          toggleNotifications: state.toggleNotifications,
          requestPermission: state.requestPermission,
        }))
      );

      expect(result.current.permission).toBe('default');
      expect(result.current.isEnabled).toBe(true);
      expect(typeof result.current.setPermission).toBe('function');
      expect(typeof result.current.setEnabled).toBe('function');
      expect(typeof result.current.toggleNotifications).toBe('function');
      expect(typeof result.current.requestPermission).toBe('function');
    });
  });
});
