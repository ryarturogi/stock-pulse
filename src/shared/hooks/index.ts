/**
 * Shared Hooks Index
 * ==================
 *
 * Central export point for all shared custom hooks.
 */

export { useResponsive } from './useResponsive';
export { useSidebar } from './useSidebar';
export { useTheme } from './useTheme';
export { useSearch } from './useSearch';
export { useTour } from './useTour';
export { getDesktopTourSteps, getMobileTourSteps, getTourSteps, shouldShowTour, markTourAsCompleted, resetTour } from './useTourConfig';

// Re-export types
export type { ResponsiveState } from './useResponsive';
export type { SidebarState } from './useSidebar';
export type { ThemeState } from './useTheme';
export type { SearchState } from './useSearch';
export type { TourStep } from './useTour';

