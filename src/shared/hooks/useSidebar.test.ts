/**
 * Unit Tests for useSidebar Hook
 * ==============================
 *
 * Tests for the sidebar state management custom hook
 */

import { renderHook, act } from '@testing-library/react';
import { useSidebar } from './useSidebar';

describe('useSidebar', () => {
  describe('Initial State', () => {
    it('should have correct default initial state', () => {
      const { result } = renderHook(() => useSidebar());

      expect(result.current.isOpen).toBe(false);
      expect(typeof result.current.open).toBe('function');
      expect(typeof result.current.close).toBe('function');
      expect(typeof result.current.toggle).toBe('function');
    });

    it('should use provided initial state', () => {
      const { result } = renderHook(() => useSidebar(true));

      expect(result.current.isOpen).toBe(true);
    });

    it('should handle false initial state explicitly', () => {
      const { result } = renderHook(() => useSidebar(false));

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('Open Functionality', () => {
    it('should open sidebar when close', () => {
      const { result } = renderHook(() => useSidebar(false));

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should keep sidebar open when already open', () => {
      const { result } = renderHook(() => useSidebar(true));

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should handle multiple consecutive open calls', () => {
      const { result } = renderHook(() => useSidebar(false));

      act(() => {
        result.current.open();
        result.current.open();
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('Close Functionality', () => {
    it('should close sidebar when open', () => {
      const { result } = renderHook(() => useSidebar(true));

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should keep sidebar closed when already closed', () => {
      const { result } = renderHook(() => useSidebar(false));

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should handle multiple consecutive close calls', () => {
      const { result } = renderHook(() => useSidebar(true));

      act(() => {
        result.current.close();
        result.current.close();
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('Toggle Functionality', () => {
    it('should toggle from closed to open', () => {
      const { result } = renderHook(() => useSidebar(false));

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should toggle from open to closed', () => {
      const { result } = renderHook(() => useSidebar(true));

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should handle multiple toggles', () => {
      const { result } = renderHook(() => useSidebar(false));

      // Start closed
      expect(result.current.isOpen).toBe(false);

      // Toggle to open
      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(true);

      // Toggle to closed
      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(false);

      // Toggle to open again
      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(true);
    });

    it('should handle rapid toggle calls', () => {
      const { result } = renderHook(() => useSidebar(false));

      act(() => {
        result.current.toggle();
        result.current.toggle();
        result.current.toggle();
        result.current.toggle();
      });

      // Should end up closed (even number of toggles)
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('Function Memoization', () => {
    it('should memoize functions with useCallback', () => {
      const { result, rerender } = renderHook(() => useSidebar());

      const originalFunctions = {
        open: result.current.open,
        close: result.current.close,
        toggle: result.current.toggle,
      };

      // Force re-render
      rerender();

      expect(result.current.open).toBe(originalFunctions.open);
      expect(result.current.close).toBe(originalFunctions.close);
      expect(result.current.toggle).toBe(originalFunctions.toggle);
    });

    it('should maintain function references after state changes', () => {
      const { result } = renderHook(() => useSidebar());

      const originalFunctions = {
        open: result.current.open,
        close: result.current.close,
        toggle: result.current.toggle,
      };

      // Change state
      act(() => {
        result.current.toggle();
      });

      // Functions should be the same references
      expect(result.current.open).toBe(originalFunctions.open);
      expect(result.current.close).toBe(originalFunctions.close);
      expect(result.current.toggle).toBe(originalFunctions.toggle);
    });
  });

  describe('Mixed Operations', () => {
    it('should handle mixed open, close, and toggle operations', () => {
      const { result } = renderHook(() => useSidebar(false));

      // Start closed
      expect(result.current.isOpen).toBe(false);

      // Open
      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);

      // Toggle (should close)
      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(false);

      // Close (already closed, should stay closed)
      act(() => {
        result.current.close();
      });
      expect(result.current.isOpen).toBe(false);

      // Toggle (should open)
      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(true);

      // Close
      act(() => {
        result.current.close();
      });
      expect(result.current.isOpen).toBe(false);
    });

    it('should handle rapid mixed operations', () => {
      const { result } = renderHook(() => useSidebar());

      act(() => {
        result.current.open();
        result.current.close();
        result.current.toggle();
        result.current.open();
        result.current.toggle();
      });

      // Final state should be closed
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistent state across re-renders', () => {
      const { result, rerender } = renderHook(() => useSidebar(true));

      expect(result.current.isOpen).toBe(true);

      // Re-render shouldn't affect state
      rerender();
      expect(result.current.isOpen).toBe(true);

      // Change state
      act(() => {
        result.current.close();
      });
      expect(result.current.isOpen).toBe(false);

      // Re-render with new state
      rerender();
      expect(result.current.isOpen).toBe(false);
    });

    it('should handle initial state changes', () => {
      const { result, rerender } = renderHook(
        ({ initialOpen }) => useSidebar(initialOpen),
        { initialProps: { initialOpen: false } }
      );

      expect(result.current.isOpen).toBe(false);

      // Rerender with different initial state (should not affect current state)
      rerender({ initialOpen: true });
      expect(result.current.isOpen).toBe(false);

      // State changes should still work normally
      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined initial state', () => {
      const { result } = renderHook(() => useSidebar(undefined as any));

      // Should default to false
      expect(result.current.isOpen).toBe(false);
    });

    it('should handle null initial state', () => {
      const { result } = renderHook(() => useSidebar(null as any));

      // Should default to false
      expect(result.current.isOpen).toBe(false);
    });

    it('should handle truthy/falsy initial values', () => {
      // Test with truthy value
      const { result: result1 } = renderHook(() => useSidebar(1 as any));
      expect(result1.current.isOpen).toBe(true);

      // Test with falsy value
      const { result: result2 } = renderHook(() => useSidebar(0 as any));
      expect(result2.current.isOpen).toBe(false);

      // Test with string
      const { result: result3 } = renderHook(() => useSidebar('true' as any));
      expect(result3.current.isOpen).toBe(true);

      // Test with empty string
      const { result: result4 } = renderHook(() => useSidebar('' as any));
      expect(result4.current.isOpen).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const { result, rerender } = renderHook(() => useSidebar());

      const initialFunctions = {
        open: result.current.open,
        close: result.current.close,
        toggle: result.current.toggle,
      };

      // Multiple re-renders should not change function references
      rerender();
      rerender();
      rerender();

      expect(result.current.open).toBe(initialFunctions.open);
      expect(result.current.close).toBe(initialFunctions.close);
      expect(result.current.toggle).toBe(initialFunctions.toggle);
    });

    it('should handle rapid state changes efficiently', () => {
      const { result } = renderHook(() => useSidebar());

      // Rapid state changes should work without issues
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.toggle();
        }
      });

      // Should end up closed (even number of toggles)
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('Complex Scenarios', () => {
    it('should work correctly in complex component hierarchies', () => {
      // Simulate multiple components using the same hook
      const { result: result1 } = renderHook(() => useSidebar(false));
      const { result: result2 } = renderHook(() => useSidebar(true));

      // Each instance should be independent
      expect(result1.current.isOpen).toBe(false);
      expect(result2.current.isOpen).toBe(true);

      // Changes to one should not affect the other
      act(() => {
        result1.current.open();
      });

      expect(result1.current.isOpen).toBe(true);
      expect(result2.current.isOpen).toBe(true);

      act(() => {
        result2.current.close();
      });

      expect(result1.current.isOpen).toBe(true);
      expect(result2.current.isOpen).toBe(false);
    });

    it('should handle concurrent state updates', () => {
      const { result } = renderHook(() => useSidebar());

      // Simulate concurrent updates
      act(() => {
        result.current.open();
        result.current.toggle();
      });

      // Final state should be closed (open then toggle)
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('Integration', () => {
    it('should integrate well with component lifecycle', () => {
      const { result, unmount } = renderHook(() => useSidebar(true));

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);

      // Unmounting should not cause any issues
      unmount();
    });

    it('should work with component unmount and remount scenarios', () => {
      // First render
      const { result: result1, unmount: unmount1 } = renderHook(() =>
        useSidebar(true)
      );

      expect(result1.current.isOpen).toBe(true);

      act(() => {
        result1.current.toggle();
      });

      expect(result1.current.isOpen).toBe(false);

      // Unmount the first instance
      unmount1();

      // Create a new instance (simulating component remount)
      const { result: result2 } = renderHook(() => useSidebar(true));

      // Should start fresh with initial state
      expect(result2.current.isOpen).toBe(true);
    });
  });
});
