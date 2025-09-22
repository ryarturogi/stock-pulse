/**
 * Notifications Feature Stores
 * ===========================
 * 
 * Central export point for all notification-related state management.
 */

export { 
  useNotificationStore,
  useNotificationPermission,
  useNotificationHistory,
  useNotificationSettings,
  usePushSubscription,
  setNotificationPermission,
  setNotificationEnabled,
  toggleNotificationState,
  requestNotificationPermission,
  setNotificationPushSubscription,
  clearNotificationPushSubscription,
  addNotificationToStore,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotificationFromStore,
  clearAllNotifications,
  setDesktopNotificationEnabled,
  setPushNotificationEnabled,
  setNotificationSoundEnabled,
  clearNotificationError,
} from './notificationStore';
