/**
 * Unit Tests for useTheme Hook
 * ============================
 * 
 * Tests for the theme management custom hook
 */

import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock matchMedia
const mockMatchMedia = jest.fn();
Object.defineProperty(window, 'matchMedia', {
  value: mockMatchMedia,
  writable: true,
});

// Mock document.documentElement
const mockDocumentElement = {
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
  },
};

Object.defineProperty(document, 'documentElement', {
  value: mockDocumentElement,
  writable: true,
});

describe('useTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMatchMedia.mockReturnValue({ matches: false });
  });

  describe('Initial State', () => {
    it('should use default initial state when no parameter provided', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.isDarkMode).toBe(false);
      expect(typeof result.current.toggle).toBe('function');
      expect(typeof result.current.setDarkMode).toBe('function');
    });

    it('should use provided initial state when no localStorage or system preference', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockMatchMedia.mockReturnValue({ matches: false });

      const { result } = renderHook(() => useTheme(true));

      expect(result.current.isDarkMode).toBe(true);
    });

    it('should load theme from localStorage if available', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');

      const { result } = renderHook(() => useTheme());

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('stockpulse_theme');
      expect(result.current.isDarkMode).toBe(true);
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
    });

    it('should load light theme from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('light');

      const { result } = renderHook(() => useTheme());

      expect(result.current.isDarkMode).toBe(false);
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('dark');
    });

    it('should use system preference when no localStorage value', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockMatchMedia.mockReturnValue({ matches: true });

      const { result } = renderHook(() => useTheme());

      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(result.current.isDarkMode).toBe(true);
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
    });

    it('should default to light mode when no localStorage and system prefers light', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockMatchMedia.mockReturnValue({ matches: false });

      const { result } = renderHook(() => useTheme());

      expect(result.current.isDarkMode).toBe(false);
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('dark');
    });
  });

  describe('Server-Side Rendering', () => {
    it('should handle SSR when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const { result } = renderHook(() => useTheme());

      expect(result.current.isDarkMode).toBe(false);
      expect(mockLocalStorage.getItem).not.toHaveBeenCalled();

      global.window = originalWindow;
    });

    it('should handle SSR when document is undefined', () => {
      const originalDocument = global.document;
      // @ts-ignore
      delete global.document;

      const { result } = renderHook(() => useTheme());

      // Should not throw errors
      act(() => {
        result.current.toggle();
      });

      global.document = originalDocument;
    });
  });

  describe('Theme Toggle', () => {
    it('should toggle from light to dark', () => {
      const { result } = renderHook(() => useTheme(false));

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isDarkMode).toBe(true);
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('stockpulse_theme', 'dark');
    });

    it('should toggle from dark to light', () => {
      const { result } = renderHook(() => useTheme(true));

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isDarkMode).toBe(false);
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('dark');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('stockpulse_theme', 'light');
    });

    it('should handle multiple toggles', () => {
      const { result } = renderHook(() => useTheme(false));

      // Toggle to dark
      act(() => {
        result.current.toggle();
      });
      expect(result.current.isDarkMode).toBe(true);

      // Toggle back to light
      act(() => {
        result.current.toggle();
      });
      expect(result.current.isDarkMode).toBe(false);

      // Toggle to dark again
      act(() => {
        result.current.toggle();
      });
      expect(result.current.isDarkMode).toBe(true);

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(3);
    });
  });

  describe('SetDarkMode Function', () => {
    it('should set dark mode to true', () => {
      const { result } = renderHook(() => useTheme(false));

      act(() => {
        result.current.setDarkMode(true);
      });

      expect(result.current.isDarkMode).toBe(true);
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('stockpulse_theme', 'dark');
    });

    it('should set dark mode to false', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');

      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setDarkMode(false);
      });

      expect(result.current.isDarkMode).toBe(false);
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('dark');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('stockpulse_theme', 'light');
    });
  });

  describe('DOM Theme Updates', () => {
    it('should add dark class to document element for dark mode', () => {
      const { result } = renderHook(() => useTheme(false));

      act(() => {
        result.current.toggle();
      });

      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
      expect(mockDocumentElement.classList.remove).not.toHaveBeenCalled();
    });

    it('should remove dark class from document element for light mode', () => {
      const { result } = renderHook(() => useTheme(true));

      act(() => {
        result.current.toggle();
      });

      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('dark');
    });

    it('should handle DOM updates when document is undefined', () => {
      const originalDocument = global.document;
      // @ts-ignore
      delete global.document;

      const { result } = renderHook(() => useTheme());

      // Should not throw errors
      act(() => {
        result.current.toggle();
      });

      expect(result.current.isDarkMode).toBe(true);

      global.document = originalDocument;
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should save dark theme to localStorage', () => {
      const { result } = renderHook(() => useTheme(false));

      act(() => {
        result.current.toggle();
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('stockpulse_theme', 'dark');
    });

    it('should save light theme to localStorage', () => {
      const { result } = renderHook(() => useTheme(true));

      act(() => {
        result.current.toggle();
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('stockpulse_theme', 'light');
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const { result } = renderHook(() => useTheme(false));

      // Should not throw
      act(() => {
        result.current.toggle();
      });

      expect(result.current.isDarkMode).toBe(true);
    });
  });

  describe('Function Memoization', () => {
    it('should memoize toggle function', () => {
      const { result, rerender } = renderHook(() => useTheme());

      const originalToggle = result.current.toggle;

      // Force re-render
      rerender();

      expect(result.current.toggle).toBe(originalToggle);
    });

    it('should memoize setDarkMode function', () => {
      const { result, rerender } = renderHook(() => useTheme());

      const originalSetDarkMode = result.current.setDarkMode;

      // Force re-render
      rerender();

      expect(result.current.setDarkMode).toBe(originalSetDarkMode);
    });

    it('should update memoized functions when dependencies change', () => {
      const { result } = renderHook(() => useTheme(false));

      const originalToggle = result.current.toggle;

      // Change state
      act(() => {
        result.current.toggle();
      });

      // Function should still be the same reference due to useCallback
      expect(result.current.toggle).toBe(originalToggle);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid localStorage values', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid_theme');
      mockMatchMedia.mockReturnValue({ matches: false });

      const { result } = renderHook(() => useTheme());

      // Should fall back to system preference
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(result.current.isDarkMode).toBe(false);
    });

    it('should handle rapid theme changes', () => {
      const { result } = renderHook(() => useTheme(false));

      // Rapidly toggle theme
      act(() => {
        result.current.toggle();
        result.current.toggle();
        result.current.toggle();
        result.current.toggle();
      });

      expect(result.current.isDarkMode).toBe(false);
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(4);
    });

    it('should handle concurrent state updates', () => {
      const { result } = renderHook(() => useTheme(false));

      // Simulate concurrent updates
      act(() => {
        result.current.toggle();
        result.current.setDarkMode(true);
      });

      expect(result.current.isDarkMode).toBe(true);
    });
  });

  describe('System Preference Detection', () => {
    it('should detect dark system preference', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockMatchMedia.mockReturnValue({ matches: true });

      const { result } = renderHook(() => useTheme());

      expect(result.current.isDarkMode).toBe(true);
    });

    it('should detect light system preference', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockMatchMedia.mockReturnValue({ matches: false });

      const { result } = renderHook(() => useTheme());

      expect(result.current.isDarkMode).toBe(false);
    });

    it('should handle matchMedia errors', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockMatchMedia.mockImplementation(() => {
        throw new Error('matchMedia error');
      });

      const { result } = renderHook(() => useTheme());

      // Should default to false when matchMedia fails
      expect(result.current.isDarkMode).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const { result, rerender } = renderHook(() => useTheme());

      const initialFunctions = {
        toggle: result.current.toggle,
        setDarkMode: result.current.setDarkMode,
      };

      // Multiple re-renders should not change function references
      rerender();
      rerender();
      rerender();

      expect(result.current.toggle).toBe(initialFunctions.toggle);
      expect(result.current.setDarkMode).toBe(initialFunctions.setDarkMode);
    });
  });

  describe('Integration', () => {
    it('should work with initial state and localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');

      const { result } = renderHook(() => useTheme(false));

      // localStorage should override initial state
      expect(result.current.isDarkMode).toBe(true);
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
    });

    it('should maintain state across hook re-initializations', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');

      const { result: result1 } = renderHook(() => useTheme());
      expect(result1.current.isDarkMode).toBe(true);

      const { result: result2 } = renderHook(() => useTheme());
      expect(result2.current.isDarkMode).toBe(true);
    });
  });
});