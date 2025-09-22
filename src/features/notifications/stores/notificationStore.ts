/**
 * Notification Store with Zustand
 * ==============================
 * 
 * Centralized state management for notification functionality
 * with persistence following the React Developer test requirements.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { STORAGE_KEYS } from '@/core/constants/constants';
import {
  NotificationStoreState,
  NotificationPermissionType,
  Notification,
  PushSubscriptionData,
} from '@/core/types';
import { getNotificationService } from '@/features/notifications';

/**
 * Generate unique ID for notifications
 */
const generateNotificationId = (): string => {
  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Notification store implementation
 */
export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      permission: 'default',
      isEnabled: true,
      pushSubscription: null,
      notifications: [],
      unreadCount: 0,
      showDesktopNotifications: true,
      showPushNotifications: true,
      soundEnabled: true,

      // Permission management
      setPermission: (permission: NotificationPermissionType) => {
        set({ permission });
      },

      setEnabled: (enabled: boolean) => {
        set({ isEnabled: enabled });
      },

      // Toggle notifications on/off
      toggleNotifications: async () => {
        try {
          const state = get();
          const notificationService = getNotificationService();

          if (state.isEnabled) {
            // Disable notifications
            set({ isEnabled: false });
          } else {
            // Enable notifications (request permission if needed)
            if (state.permission !== 'granted') {
              const newPermission = await notificationService.requestPermission();
              set({ permission: newPermission });

              if (newPermission === 'granted') {
                set({ isEnabled: true });
              }
            } else {
              set({ isEnabled: true });
            }
          }
        } catch (error) {
          console.error('Failed to toggle notifications:', error);
        }
      },

      // Request notification permission
      requestPermission: async (): Promise<NotificationPermissionType> => {
        try {
          const notificationService = getNotificationService();
          const newPermission = await notificationService.requestPermission();
          
          set({ permission: newPermission });

          if (newPermission === 'granted') {
            set({ isEnabled: true });
          } else if (newPermission === 'denied') {
            set({ isEnabled: false });
          }

          return newPermission;
        } catch (error) {
          console.error('Failed to request notification permission:', error);
          return 'denied';
        }
      },

      // Push subscription management
      setPushSubscription: (subscription: PushSubscriptionData | null) => {
        set({ pushSubscription: subscription });
      },

      clearPushSubscription: () => {
        set({ pushSubscription: null });
      },

      // Notification history management
      addNotification: (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const state = get();
        const newNotification: Notification = {
          ...notificationData,
          id: generateNotificationId(),
          timestamp: new Date().toISOString(),
          read: false,
        };

        const updatedNotifications = [newNotification, ...state.notifications];
        const updatedUnreadCount = state.unreadCount + 1;

        set({
          notifications: updatedNotifications,
          unreadCount: updatedUnreadCount,
        });
      },

      markAsRead: (notificationId: string) => {
        const state = get();
        const notification = state.notifications.find(n => n.id === notificationId);
        
        if (notification && !notification.read) {
          const updatedNotifications = state.notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          );
          const updatedUnreadCount = Math.max(0, state.unreadCount - 1);

          set({
            notifications: updatedNotifications,
            unreadCount: updatedUnreadCount,
          });
        }
      },

      markAllAsRead: () => {
        const state = get();
        const updatedNotifications = state.notifications.map(n => ({ ...n, read: true }));

        set({
          notifications: updatedNotifications,
          unreadCount: 0,
        });
      },

      removeNotification: (notificationId: string) => {
        const state = get();
        const notification = state.notifications.find(n => n.id === notificationId);
        
        if (notification) {
          const updatedNotifications = state.notifications.filter(n => n.id !== notificationId);
          const updatedUnreadCount = notification.read ? state.unreadCount : Math.max(0, state.unreadCount - 1);

          set({
            notifications: updatedNotifications,
            unreadCount: updatedUnreadCount,
          });
        }
      },

      clearNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0,
        });
      },

      // Settings management
      setShowDesktopNotifications: (enabled: boolean) => {
        set({ showDesktopNotifications: enabled });
      },

      setShowPushNotifications: (enabled: boolean) => {
        set({ showPushNotifications: enabled });
      },

      setSoundEnabled: (enabled: boolean) => {
        set({ soundEnabled: enabled });
      },

      // Utility actions
      clearError: () => {
        // This can be extended if we add error state to the store
        console.log('Error cleared from notification store');
      },
    }),
    {
      name: STORAGE_KEYS.NOTIFICATIONS,
      storage: createJSONStorage(() => {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          // Server-side rendering - use in-memory storage
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        
        // Browser environment - use localStorage
        try {
          return localStorage;
        } catch (error) {
          // Fallback to in-memory storage if localStorage is not available
          console.warn('localStorage not available, using in-memory storage:', error);
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
      }),
      version: 1, // Current version of the persisted state
      migrate: (persistedState: unknown, version: number) => {
        try {
          // Handle migration from older versions
          if (version === 0) {
            // If no version exists, this is a fresh install or old format
            // Try to migrate from old localStorage format
            
            // Check for old notification preference
            let isEnabled = true;
            if (typeof window !== 'undefined') {
              const oldNotificationPref = localStorage.getItem('stockpulse_notifications_enabled');
              if (oldNotificationPref !== null) {
                isEnabled = JSON.parse(oldNotificationPref);
                // Clean up old storage key
                localStorage.removeItem('stockpulse_notifications_enabled');
              }
            }

            return {
              permission: 'default',
              isEnabled,
              pushSubscription: null,
              notifications: [],
              unreadCount: 0,
              showDesktopNotifications: true,
              showPushNotifications: true,
              soundEnabled: true,
            };
          }
          
          // For current version, return as-is
          return persistedState;
        } catch (error) {
          console.warn('Failed to migrate persisted state, using defaults:', error);
          // Return safe defaults if migration fails
          return {
            permission: 'default',
            isEnabled: true,
            pushSubscription: null,
            notifications: [],
            unreadCount: 0,
            showDesktopNotifications: true,
            showPushNotifications: true,
            soundEnabled: true,
          };
        }
      },
      partialize: (state) => ({
        permission: state.permission,
        isEnabled: state.isEnabled,
        pushSubscription: state.pushSubscription,
        notifications: state.notifications.slice(0, 50), // Keep only last 50 notifications
        unreadCount: state.unreadCount,
        showDesktopNotifications: state.showDesktopNotifications,
        showPushNotifications: state.showPushNotifications,
        soundEnabled: state.soundEnabled,
      }),
      onRehydrateStorage: () => {
        return (_state, error) => {
          if (error) {
            console.warn('Failed to rehydrate notification store state:', error);
          } else {
            console.log('Notification store state rehydrated successfully');
          }
        };
      },
    }
  )
);

// Export store actions for external use
export const {
  setPermission: setNotificationPermission,
  setEnabled: setNotificationEnabled,
  toggleNotifications: toggleNotificationState,
  requestPermission: requestNotificationPermission,
  setPushSubscription: setNotificationPushSubscription,
  clearPushSubscription: clearNotificationPushSubscription,
  addNotification: addNotificationToStore,
  markAsRead: markNotificationAsRead,
  markAllAsRead: markAllNotificationsAsRead,
  removeNotification: removeNotificationFromStore,
  clearNotifications: clearAllNotifications,
  setShowDesktopNotifications: setDesktopNotificationEnabled,
  setShowPushNotifications: setPushNotificationEnabled,
  setSoundEnabled: setNotificationSoundEnabled,
  clearError: clearNotificationError,
} = useNotificationStore.getState();

// Export convenience hooks for specific state slices
export const useNotificationPermission = () => useNotificationStore((state) => ({
  permission: state.permission,
  isEnabled: state.isEnabled,
  setPermission: state.setPermission,
  setEnabled: state.setEnabled,
  toggleNotifications: state.toggleNotifications,
  requestPermission: state.requestPermission,
}));

export const useNotificationHistory = () => useNotificationStore((state) => ({
  notifications: state.notifications,
  unreadCount: state.unreadCount,
  addNotification: state.addNotification,
  markAsRead: state.markAsRead,
  markAllAsRead: state.markAllAsRead,
  removeNotification: state.removeNotification,
  clearNotifications: state.clearNotifications,
}));

export const useNotificationSettings = () => useNotificationStore((state) => ({
  showDesktopNotifications: state.showDesktopNotifications,
  showPushNotifications: state.showPushNotifications,
  soundEnabled: state.soundEnabled,
  setShowDesktopNotifications: state.setShowDesktopNotifications,
  setShowPushNotifications: state.setShowPushNotifications,
  setSoundEnabled: state.setSoundEnabled,
}));

export const usePushSubscription = () => useNotificationStore((state) => ({
  pushSubscription: state.pushSubscription,
  setPushSubscription: state.setPushSubscription,
  clearPushSubscription: state.clearPushSubscription,
}));

export default useNotificationStore;
