/**
 * Unit Tests for useResponsive Hook
 * =================================
 *
 * Tests for the responsive design custom hook
 */

import { renderHook, act } from '@testing-library/react';
import { useResponsive } from './useResponsive';

// Mock window.innerWidth and window.innerHeight
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
});

// Helper function to trigger window resize
const resizeWindow = (width: number, height: number) => {
  window.innerWidth = width;
  window.innerHeight = height;
  window.dispatchEvent(new Event('resize'));
};

describe('useResponsive', () => {
  beforeEach(() => {
    // Reset to desktop size
    window.innerWidth = 1024;
    window.innerHeight = 768;
  });

  describe('Initial State', () => {
    it('should have correct initial state on desktop', () => {
      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.width).toBe(1024);
      expect(result.current.height).toBe(768);
    });

    it('should detect mobile on initial render', () => {
      window.innerWidth = 320;
      window.innerHeight = 568;

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.width).toBe(320);
      expect(result.current.height).toBe(568);
    });

    it('should detect tablet on initial render', () => {
      window.innerWidth = 800;
      window.innerHeight = 600;

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.width).toBe(800);
      expect(result.current.height).toBe(600);
    });
  });

  describe('Server-Side Rendering', () => {
    it('should handle SSR when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Intentionally deleting global.window for SSR testing
      delete global.window;

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.width).toBe(0);
      expect(result.current.height).toBe(0);

      global.window = originalWindow;
    });
  });

  describe('Breakpoint Detection', () => {
    it('should detect mobile breakpoint (< 768px)', () => {
      const { result } = renderHook(() => useResponsive());

      act(() => {
        resizeWindow(767, 500);
      });

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
    });

    it('should detect tablet breakpoint (768px - 1023px)', () => {
      const { result } = renderHook(() => useResponsive());

      act(() => {
        resizeWindow(768, 600);
      });

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);

      act(() => {
        resizeWindow(1023, 800);
      });

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });

    it('should detect desktop breakpoint (>= 1024px)', () => {
      const { result } = renderHook(() => useResponsive());

      act(() => {
        resizeWindow(1024, 768);
      });

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);

      act(() => {
        resizeWindow(1920, 1080);
      });

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
    });
  });

  describe('Dimension Tracking', () => {
    it('should track width and height changes', () => {
      const { result } = renderHook(() => useResponsive());

      act(() => {
        resizeWindow(1200, 900);
      });

      expect(result.current.width).toBe(1200);
      expect(result.current.height).toBe(900);

      act(() => {
        resizeWindow(800, 600);
      });

      expect(result.current.width).toBe(800);
      expect(result.current.height).toBe(600);
    });

    it('should handle extreme dimensions', () => {
      const { result } = renderHook(() => useResponsive());

      act(() => {
        resizeWindow(1, 1);
      });

      expect(result.current.width).toBe(1);
      expect(result.current.height).toBe(1);
      expect(result.current.isMobile).toBe(true);

      act(() => {
        resizeWindow(5000, 3000);
      });

      expect(result.current.width).toBe(5000);
      expect(result.current.height).toBe(3000);
      expect(result.current.isDesktop).toBe(true);
    });
  });

  describe('Resize Event Handling', () => {
    it('should respond to window resize events', () => {
      const { result } = renderHook(() => useResponsive());

      // Start at desktop
      expect(result.current.isDesktop).toBe(true);

      // Resize to mobile
      act(() => {
        resizeWindow(320, 568);
      });

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isDesktop).toBe(false);

      // Resize to tablet
      act(() => {
        resizeWindow(768, 1024);
      });

      expect(result.current.isTablet).toBe(true);
      expect(result.current.isMobile).toBe(false);

      // Resize back to desktop
      act(() => {
        resizeWindow(1440, 900);
      });

      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isTablet).toBe(false);
    });

    it('should handle rapid resize events', () => {
      const { result } = renderHook(() => useResponsive());

      // Rapid size changes
      act(() => {
        resizeWindow(320, 568);
        resizeWindow(768, 1024);
        resizeWindow(1024, 768);
        resizeWindow(1920, 1080);
      });

      expect(result.current.width).toBe(1920);
      expect(result.current.height).toBe(1080);
      expect(result.current.isDesktop).toBe(true);
    });

    it('should maintain consistent state during resize', () => {
      const { result } = renderHook(() => useResponsive());

      act(() => {
        resizeWindow(800, 600);
      });

      const state = result.current;
      expect(state.isTablet).toBe(true);
      expect(state.width).toBe(800);
      expect(state.height).toBe(600);

      // Verify only one breakpoint is true
      const breakpointCount =
        Number(state.isMobile) +
        Number(state.isTablet) +
        Number(state.isDesktop);
      expect(breakpointCount).toBe(1);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle exact breakpoint boundaries', () => {
      const { result } = renderHook(() => useResponsive());

      // Exactly at mobile/tablet boundary (768px)
      act(() => {
        resizeWindow(768, 600);
      });

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);

      // One pixel below
      act(() => {
        resizeWindow(767, 600);
      });

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);

      // Exactly at tablet/desktop boundary (1024px)
      act(() => {
        resizeWindow(1024, 600);
      });

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);

      // One pixel below
      act(() => {
        resizeWindow(1023, 600);
      });

      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });

    it('should handle zero dimensions', () => {
      const { result } = renderHook(() => useResponsive());

      act(() => {
        resizeWindow(0, 0);
      });

      expect(result.current.width).toBe(0);
      expect(result.current.height).toBe(0);
      expect(result.current.isMobile).toBe(true);
    });

    it('should handle negative dimensions (if browser allows)', () => {
      const { result } = renderHook(() => useResponsive());

      act(() => {
        resizeWindow(-100, -100);
      });

      expect(result.current.width).toBe(-100);
      expect(result.current.height).toBe(-100);
      expect(result.current.isMobile).toBe(true);
    });
  });

  describe('Event Listener Management', () => {
    it('should add event listener on mount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      renderHook(() => useResponsive());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
    });

    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useResponsive());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });

    it('should not add event listeners when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Intentionally deleting global.window for testing
      delete global.window;

      const addEventListenerSpy = jest
        .spyOn(global, 'addEventListener')
        .mockImplementation();

      renderHook(() => useResponsive());

      expect(addEventListenerSpy).not.toHaveBeenCalled();

      addEventListenerSpy.mockRestore();
      global.window = originalWindow;
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const { result, rerender } = renderHook(() => useResponsive());

      const initialState = result.current;

      // Re-render without resizing
      rerender();

      // State object should be different but values should be the same
      expect(result.current.width).toBe(initialState.width);
      expect(result.current.height).toBe(initialState.height);
      expect(result.current.isDesktop).toBe(initialState.isDesktop);
    });

    it('should batch state updates during resize', () => {
      const { result } = renderHook(() => useResponsive());

      const initialState = result.current;

      act(() => {
        resizeWindow(800, 600);
      });

      // Should update responsively
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.isTablet).toBe(true);

      // Verify state actually changed from initial state
      expect(result.current.isDesktop).not.toBe(initialState.isDesktop);

      // Should have updated state
      expect(result.current.width).toBe(800);
      expect(result.current.height).toBe(600);
      expect(result.current.isTablet).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    it('should work correctly with different screen orientations', () => {
      const { result } = renderHook(() => useResponsive());

      // Portrait tablet
      act(() => {
        resizeWindow(768, 1024);
      });

      expect(result.current.isTablet).toBe(true);
      expect(result.current.width).toBe(768);
      expect(result.current.height).toBe(1024);

      // Landscape tablet
      act(() => {
        resizeWindow(1024, 768);
      });

      expect(result.current.isDesktop).toBe(true);
      expect(result.current.width).toBe(1024);
      expect(result.current.height).toBe(768);
    });

    it('should handle common device dimensions', () => {
      const { result } = renderHook(() => useResponsive());

      // iPhone SE
      act(() => {
        resizeWindow(375, 667);
      });
      expect(result.current.isMobile).toBe(true);

      // iPad
      act(() => {
        resizeWindow(768, 1024);
      });
      expect(result.current.isTablet).toBe(true);

      // MacBook Pro
      act(() => {
        resizeWindow(1440, 900);
      });
      expect(result.current.isDesktop).toBe(true);

      // 4K Monitor
      act(() => {
        resizeWindow(3840, 2160);
      });
      expect(result.current.isDesktop).toBe(true);
    });
  });

  describe('State Consistency', () => {
    it('should ensure only one breakpoint is active at a time', () => {
      const { result } = renderHook(() => useResponsive());

      const testSizes = [
        [320, 568], // Mobile
        [375, 812], // Mobile
        [768, 1024], // Tablet
        [900, 600], // Tablet
        [1024, 768], // Desktop
        [1920, 1080], // Desktop
      ];

      testSizes.forEach(([width, height]) => {
        act(() => {
          resizeWindow(width, height);
        });

        const state = result.current;
        const activeBreakpoints = [
          state.isMobile,
          state.isTablet,
          state.isDesktop,
        ].filter(Boolean);
        expect(activeBreakpoints).toHaveLength(1);
      });
    });

    it('should maintain dimension accuracy', () => {
      const { result } = renderHook(() => useResponsive());

      const testDimensions = [
        [100, 200],
        [500, 300],
        [1000, 800],
        [1500, 1200],
        [2000, 1500],
      ];

      testDimensions.forEach(([width, height]) => {
        act(() => {
          resizeWindow(width, height);
        });

        expect(result.current.width).toBe(width);
        expect(result.current.height).toBe(height);
      });
    });
  });
});
