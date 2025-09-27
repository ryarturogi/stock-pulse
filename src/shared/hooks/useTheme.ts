/**
 * useTheme Hook
 * =============
 *
 * Custom hook for managing theme state and persistence.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ThemeState {
  isDarkMode: boolean;
  toggle: () => void;
  setDarkMode: (isDark: boolean) => void;
}

/**
 * useTheme Hook
 *
 * Provides theme management with:
 * - Dark/light mode state
 * - Toggle functionality
 * - Local storage persistence
 * - DOM class management
 *
 * @param initialDark - Initial dark mode state (default: false)
 * @returns ThemeState object with theme state and actions
 */
export const useTheme = (initialDark: boolean = false): ThemeState => {
  const [isDarkMode, setIsDarkMode] = useState(initialDark);

  // Update DOM theme class - defined as regular function to avoid hoisting issues
  const updateDOMTheme = (dark: boolean) => {
    if (typeof document === 'undefined') return;

    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Load theme from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedTheme = localStorage.getItem('stockpulse_theme');
      if (savedTheme) {
        const isDark = savedTheme === 'dark';
        setIsDarkMode(isDark);
        updateDOMTheme(isDark);
      } else {
        // Check system preference if available
        try {
          const prefersDark =
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches;
          const themeValue = prefersDark || initialDark;
          setIsDarkMode(themeValue);
          updateDOMTheme(themeValue);
        } catch {
          // Fallback to initial value if matchMedia fails
          setIsDarkMode(initialDark);
          updateDOMTheme(initialDark);
        }
      }
    } catch {
      // Fallback if localStorage is not available
      setIsDarkMode(initialDark);
      updateDOMTheme(initialDark);
    }
  }, [initialDark]);

  // Toggle theme
  const toggle = useCallback(() => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    updateDOMTheme(newTheme);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('stockpulse_theme', newTheme ? 'dark' : 'light');
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [isDarkMode]);

  // Set specific theme
  const setDarkMode = useCallback((isDark: boolean) => {
    setIsDarkMode(isDark);
    updateDOMTheme(isDark);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('stockpulse_theme', isDark ? 'dark' : 'light');
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  return {
    isDarkMode,
    toggle,
    setDarkMode,
  };
};

export default useTheme;
