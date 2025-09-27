/**
 * Unit Tests for Shared Components Index
 * ======================================
 *
 * Tests for shared components export file
 */

import * as ComponentsIndex from './index';
import { ErrorBoundary, ErrorBoundaryWrapper, Button } from './index';

describe('Shared Components Index', () => {
  describe('Component Exports', () => {
    it('should export ErrorBoundary component', () => {
      expect(typeof ErrorBoundary).toBe('function');
      expect(ErrorBoundary.name).toBe('ErrorBoundary');
    });

    it('should export ErrorBoundaryWrapper component', () => {
      expect(typeof ErrorBoundaryWrapper).toBe('function');
      expect(ErrorBoundaryWrapper.name).toBe('ErrorBoundaryWrapper');
    });

    it('should export Button component from ui', () => {
      expect(typeof Button).toBe('function');
      expect(Button.name).toBe('Button');
    });

    it('should export components via namespace import', () => {
      expect(ComponentsIndex.ErrorBoundary).toBe(ErrorBoundary);
      expect(ComponentsIndex.ErrorBoundaryWrapper).toBe(ErrorBoundaryWrapper);
      expect(ComponentsIndex.Button).toBe(Button);
    });
  });

  describe('Re-export from UI', () => {
    it('should re-export all UI components', () => {
      // Button should be available through the re-export
      expect(ComponentsIndex.Button).toBeDefined();
      expect(typeof ComponentsIndex.Button).toBe('function');
    });

    it('should maintain reference equality for UI re-exports', async () => {
      const { Button: directButton } = await import('./ui/Button');
      expect(ComponentsIndex.Button).toBe(directButton);
    });
  });

  describe('Direct Component Exports', () => {
    it('should maintain reference equality for direct exports', async () => {
      const { ErrorBoundary: directErrorBoundary } = await import(
        './ErrorBoundary'
      );
      const { ErrorBoundaryWrapper: directWrapper } = await import(
        './ErrorBoundaryWrapper'
      );

      expect(ComponentsIndex.ErrorBoundary).toBe(directErrorBoundary);
      expect(ComponentsIndex.ErrorBoundaryWrapper).toBe(directWrapper);
    });
  });

  describe('Export Structure', () => {
    it('should have expected component exports', () => {
      const expectedComponents = [
        'ErrorBoundary',
        'ErrorBoundaryWrapper',
        'Button',
      ];

      expectedComponents.forEach(componentName => {
        expect(ComponentsIndex).toHaveProperty(componentName);
        expect(typeof (ComponentsIndex as any)[componentName]).toBe('function');
      });
    });

    it('should have at least the minimum expected exports', () => {
      const exportKeys = Object.keys(ComponentsIndex);
      expect(exportKeys.length).toBeGreaterThanOrEqual(3);
      expect(exportKeys).toContain('ErrorBoundary');
      expect(exportKeys).toContain('ErrorBoundaryWrapper');
      expect(exportKeys).toContain('Button');
    });
  });

  describe('Module Structure', () => {
    it('should be a valid ES module with exports', () => {
      expect(typeof ComponentsIndex).toBe('object');
      expect(ComponentsIndex).not.toBeNull();
      expect(Object.keys(ComponentsIndex).length).toBeGreaterThan(0);
    });

    it('should not have default export', () => {
      expect((ComponentsIndex as any).default).toBeUndefined();
    });
  });

  describe('Component Types', () => {
    it('should export React components', () => {
      const components = [ErrorBoundary, ErrorBoundaryWrapper, Button];

      components.forEach(Component => {
        expect(typeof Component).toBe('function');
        // React components should be callable functions
        expect(Component.length).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
