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
  useNotifications,
  useSearch,
} from './index';

describe('Shared Hooks Index', () => {
  describe('Hook Exports', () => {
    it('should export all hook functions', () => {
      expect(typeof useResponsive).toBe('function');
      expect(typeof useSidebar).toBe('function');
      expect(typeof useTheme).toBe('function');
      expect(typeof useNotifications).toBe('function');
      expect(typeof useSearch).toBe('function');
    });

    it('should export hooks via named exports', () => {
      expect(HooksIndex.useResponsive).toBe(useResponsive);
      expect(HooksIndex.useSidebar).toBe(useSidebar);
      expect(HooksIndex.useTheme).toBe(useTheme);
      expect(HooksIndex.useNotifications).toBe(useNotifications);
      expect(HooksIndex.useSearch).toBe(useSearch);
    });

    it('should export hooks through namespace import', () => {
      expect(typeof HooksIndex.useResponsive).toBe('function');
      expect(typeof HooksIndex.useSidebar).toBe('function');
      expect(typeof HooksIndex.useTheme).toBe('function');
      expect(typeof HooksIndex.useNotifications).toBe('function');
      expect(typeof HooksIndex.useSearch).toBe('function');
    });
  });

  describe('Export Structure', () => {
    it('should have exactly the expected number of hook exports', () => {
      const hookExports = [
        'useResponsive',
        'useSidebar', 
        'useTheme',
        'useNotifications',
        'useSearch'
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
        'useNotifications',
        'useSearch'
      ];

      expect(functionKeys.sort()).toEqual(expectedHooks.sort());
    });
  });

  describe('Hook Function Properties', () => {
    it('should export functions with proper names', () => {
      expect(useResponsive.name).toBe('useResponsive');
      expect(useSidebar.name).toBe('useSidebar');
      expect(useTheme.name).toBe('useTheme');
      expect(useNotifications.name).toBe('useNotifications');
      expect(useSearch.name).toBe('useSearch');
    });

    it('should export functions that are callable', () => {
      // Hook functions should be callable functions
      const hooks = [useResponsive, useSidebar, useTheme, useNotifications, useSearch];
      
      hooks.forEach(hook => {
        expect(typeof hook).toBe('function');
        expect(hook.length).toBeGreaterThanOrEqual(0); // Function arity (parameter count)
      });
    });
  });

  describe('Re-export Consistency', () => {
    it('should maintain reference equality for re-exported functions', async () => {
      // Import from the actual source files
      const { useSearch: directUseSearch } = await import('./useSearch');
      const { useSidebar: directUseSidebar } = await import('./useSidebar');
      
      // These should be the same function references
      expect(HooksIndex.useSearch).toBe(directUseSearch);
      expect(HooksIndex.useSidebar).toBe(directUseSidebar);
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