/**
 * useResponsive Hook
 * =================
 *
 * Custom hook for responsive design that provides screen size information
 * and breakpoint detection.
 */

'use client';

import { useState, useEffect } from 'react';

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

/**
 * useResponsive Hook
 *
 * Provides responsive state information including:
 * - Screen size detection (mobile, tablet, desktop)
 * - Current window dimensions
 * - Breakpoint-based boolean flags
 *
 * @returns ResponsiveState object with screen information
 */
export const useResponsive = (): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateResponsive = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setState({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        width,
        height,
      });
    };

    // Initial update
    updateResponsive();

    // Add event listener
    window.addEventListener('resize', updateResponsive);

    // Cleanup
    return () => window.removeEventListener('resize', updateResponsive);
  }, []);

  return state;
};

export default useResponsive;
