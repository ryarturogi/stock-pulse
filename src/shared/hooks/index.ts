/**
 * Shared Hooks Index
 * ==================
 *
 * Central export point for all shared custom hooks.
 */

export { useResponsive } from './useResponsive';
export { useSidebar } from './useSidebar';
export { useTheme } from './useTheme';
export { useNotifications } from './useNotifications';
export { useSearch } from './useSearch';

// Re-export types
export type { ResponsiveState } from './useResponsive';
export type { SidebarState } from './useSidebar';
export type { ThemeState } from './useTheme';
export type { NotificationState } from './useNotifications';
export type { SearchState } from './useSearch';
