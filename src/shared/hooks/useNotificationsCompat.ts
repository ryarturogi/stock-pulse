/**
 * Backward Compatibility Hook for useNotifications
 * ===============================================
 * 
 * This hook provides backward compatibility for components that were using
 * the old useNotifications hook. It wraps the new Zustand notification store
 * to maintain the same API.
 * 
 * @deprecated Use useNotificationPermission from @/features/notifications instead
 */

import { useNotificationPermission } from '@/features/notifications';

/**
 * Backward compatible notification hook
 * 
 * @deprecated Use useNotificationPermission from @/features/notifications instead
 * @returns NotificationState object with notification state and actions
 */
export const useNotifications = (): ReturnType<typeof useNotificationPermission> => {
  console.warn(
    'useNotifications is deprecated. Use useNotificationPermission from @/features/notifications instead.'
  );
  
  return useNotificationPermission();
};

export default useNotifications;
