/**
 * useNotifications Hook
 * =====================
 *
 * Custom hook for managing notification permissions and state.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getNotificationService } from '@/features/notifications';

export interface NotificationState {
  permission: NotificationPermission;
  isEnabled: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  toggleNotifications: () => Promise<void>;
  setEnabled: (enabled: boolean) => void;
}

/**
 * useNotifications Hook
 *
 * Provides notification management with:
 * - Permission state tracking
 * - Enable/disable functionality
 * - Local storage persistence
 * - Permission request handling
 *
 * @returns NotificationState object with notification state and actions
 */
export const useNotifications = (): NotificationState => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  // Load notification state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const notificationService = getNotificationService();
    
    // Load notification preference from localStorage
    const savedNotificationPref = localStorage.getItem('stockpulse_notifications_enabled');
    if (savedNotificationPref !== null) {
      setIsEnabled(JSON.parse(savedNotificationPref));
    }
    
    // Check current notification permission status
    setPermission(notificationService.getPermissionStatus());
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      const notificationService = getNotificationService();
      const newPermission = await notificationService.requestPermission();
      setPermission(newPermission);
      
      if (newPermission === 'granted') {
        setIsEnabled(true);
        localStorage.setItem('stockpulse_notifications_enabled', 'true');
      } else if (newPermission === 'denied') {
        setIsEnabled(false);
        localStorage.setItem('stockpulse_notifications_enabled', 'false');
      }
      
      return newPermission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }, []);

  // Toggle notifications on/off
  const toggleNotifications = useCallback(async (): Promise<void> => {
    try {
      const notificationService = getNotificationService();
      
      if (isEnabled) {
        // Disable notifications
        setIsEnabled(false);
        localStorage.setItem('stockpulse_notifications_enabled', 'false');
      } else {
        // Enable notifications (request permission if needed)
        if (permission !== 'granted') {
          const newPermission = await notificationService.requestPermission();
          setPermission(newPermission);
          
          if (newPermission === 'granted') {
            setIsEnabled(true);
            localStorage.setItem('stockpulse_notifications_enabled', 'true');
          }
        } else {
          setIsEnabled(true);
          localStorage.setItem('stockpulse_notifications_enabled', 'true');
        }
      }
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
    }
  }, [isEnabled, permission]);

  // Set enabled state directly
  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    localStorage.setItem('stockpulse_notifications_enabled', enabled.toString());
  }, []);

  return {
    permission,
    isEnabled,
    requestPermission,
    toggleNotifications,
    setEnabled,
  };
};

export default useNotifications;
