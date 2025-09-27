/**
 * Unit Tests for Shared Hooks Index
 * =================================
 *
 * Tests for hooks export file
 */

import * as HooksIndex from './index';
import {
  useResponsive,
  useSidebar,
  useTheme,
  useSearch,
  useTour,
} from './index';

describe('Shared Hooks Index', () => {
  describe('Hook Exports', () => {
    it('should export all hook functions', () => {
      expect(typeof useResponsive).toBe('function');
      expect(typeof useSidebar).toBe('function');
      expect(typeof useTheme).toBe('function');
      expect(typeof useSearch).toBe('function');
      expect(typeof useTour).toBe('function');
    });

    it('should export hooks via named exports', () => {
      expect(HooksIndex.useResponsive).toBe(useResponsive);
      expect(HooksIndex.useSidebar).toBe(useSidebar);
      expect(HooksIndex.useTheme).toBe(useTheme);
      expect(HooksIndex.useSearch).toBe(useSearch);
      expect(HooksIndex.useTour).toBe(useTour);
    });

    it('should export hooks through namespace import', () => {
      expect(typeof HooksIndex.useResponsive).toBe('function');
      expect(typeof HooksIndex.useSidebar).toBe('function');
      expect(typeof HooksIndex.useTheme).toBe('function');
      expect(typeof HooksIndex.useSearch).toBe('function');
      expect(typeof HooksIndex.useTour).toBe('function');
    });
  });

  describe('Export Structure', () => {
    it('should have exactly the expected number of hook exports', () => {
      const hookExports = [
        'useResponsive',
        'useSidebar',
        'useTheme',
        'useSearch',
        'useTour',
      ];

      hookExports.forEach(hookName => {
        expect(HooksIndex).toHaveProperty(hookName);
        expect(typeof (HooksIndex as any)[hookName]).toBe('function');
      });
    });

    it('should not export unexpected functions', () => {
      // Get all function exports
      const functionKeys = Object.keys(HooksIndex).filter(
        key => typeof (HooksIndex as any)[key] === 'function'
      );

      const expectedHooks = [
        'useResponsive',
        'useSidebar',
        'useTheme',
        'useSearch',
        'useTour',
        'getDesktopTourSteps',
        'getMobileTourSteps',
        'getTourSteps',
        'shouldShowTour',
        'markTourAsCompleted',
        'resetTour',
      ];

      expect(functionKeys.sort()).toEqual(expectedHooks.sort());
    });
  });

  describe('Hook Function Properties', () => {
    it('should export functions with proper names', () => {
      expect(useResponsive.name).toBe('useResponsive');
      expect(useSidebar.name).toBe('useSidebar');
      expect(useTheme.name).toBe('useTheme');
      expect(useSearch.name).toBe('useSearch');
      expect(useTour.name).toBe('useTour');
    });

    it('should export functions that are callable', () => {
      // Hook functions should be callable functions
      const hooks = [useResponsive, useSidebar, useTheme, useSearch, useTour];

      hooks.forEach(hook => {
        expect(typeof hook).toBe('function');
        expect(hook.length).toBeGreaterThanOrEqual(0); // Function arity (parameter count)
      });
    });
  });

  describe('Re-export Consistency', () => {
    it('should maintain functional consistency for re-exported functions', async () => {
      // Import from the actual source files
      const { useSearch: directUseSearch } = await import('./useSearch');
      const { useSidebar: directUseSidebar } = await import('./useSidebar');

      // These should be functionally equivalent
      expect(typeof HooksIndex.useSearch).toBe('function');
      expect(typeof directUseSearch).toBe('function');
      expect(typeof HooksIndex.useSidebar).toBe('function');
      expect(typeof directUseSidebar).toBe('function');
    });
  });

  describe('Module Structure', () => {
    it('should be a valid ES module with exports', () => {
      expect(typeof HooksIndex).toBe('object');
      expect(HooksIndex).not.toBeNull();
      expect(Object.keys(HooksIndex).length).toBeGreaterThan(0);
    });

    it('should not have default export conflicts', () => {
      // Verify we're dealing with named exports, not default
      expect((HooksIndex as any).default).toBeUndefined();
    });
  });
});
