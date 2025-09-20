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
  setDarkMode: (dark: boolean) => void;
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

  // Load theme from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedTheme = localStorage.getItem('stockpulse_theme');
    if (savedTheme) {
      const isDark = savedTheme === 'dark';
      setIsDarkMode(isDark);
      updateDOMTheme(isDark);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      updateDOMTheme(prefersDark);
    }
  }, []);

  // Update DOM theme class
  const updateDOMTheme = useCallback((dark: boolean) => {
    if (typeof document === 'undefined') return;

    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Toggle theme
  const toggle = useCallback(() => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    updateDOMTheme(newTheme);
    localStorage.setItem('stockpulse_theme', newTheme ? 'dark' : 'light');
  }, [isDarkMode, updateDOMTheme]);

  // Set specific theme
  const setDarkMode = useCallback((dark: boolean) => {
    setIsDarkMode(dark);
    updateDOMTheme(dark);
    localStorage.setItem('stockpulse_theme', dark ? 'dark' : 'light');
  }, [updateDOMTheme]);

  return {
    isDarkMode,
    toggle,
    setDarkMode,
  };
};

export default useTheme;
