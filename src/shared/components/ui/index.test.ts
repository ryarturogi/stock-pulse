/**
 * Unit Tests for UI Components Index
 * ==================================
 *
 * Tests for UI components export file
 */

import * as UIIndex from './index';
import { Button } from './index';

describe('UI Components Index', () => {
  describe('Component Exports', () => {
    it('should export Button component', () => {
      expect(typeof Button).toBe('function');
      expect(Button.name).toBe('Button');
    });

    it('should export Button via namespace import', () => {
      expect(UIIndex.Button).toBe(Button);
      expect(typeof UIIndex.Button).toBe('function');
    });
  });

  describe('Export Structure', () => {
    it('should have exactly the expected exports', () => {
      const expectedExports = ['Button'];

      expectedExports.forEach(exportName => {
        expect(UIIndex).toHaveProperty(exportName);
        expect(typeof (UIIndex as any)[exportName]).toBe('function');
      });
    });

    it('should not have unexpected exports', () => {
      const exportKeys = Object.keys(UIIndex);
      expect(exportKeys).toEqual(['Button']);
    });
  });

  describe('Re-export Consistency', () => {
    it('should maintain reference equality for re-exported component', async () => {
      const { Button: directButton } = await import('./Button');
      expect(UIIndex.Button).toBe(directButton);
    });
  });

  describe('Module Structure', () => {
    it('should be a valid ES module with exports', () => {
      expect(typeof UIIndex).toBe('object');
      expect(UIIndex).not.toBeNull();
      expect(Object.keys(UIIndex).length).toBe(1);
    });

    it('should not have default export', () => {
      expect((UIIndex as any).default).toBeUndefined();
    });
  });
});
