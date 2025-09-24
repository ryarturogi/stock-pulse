/**
 * Unit Tests for SlideOutSidebar Component
 * =========================================
 * 
 * Tests for the responsive slide-out sidebar component using a React 19 compatible approach
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { fireEvent, act } from '@testing-library/react';
import { SlideOutSidebar } from './SlideOutSidebar';

// Mock the document.body style property for testing
const mockBodyStyle = {
  overflow: 'unset',
} as CSSStyleDeclaration;

Object.defineProperty(document.body, 'style', {
  get: () => mockBodyStyle,
  set: (value) => {
    Object.assign(mockBodyStyle, value);
  },
  configurable: true,
});

describe('SlideOutSidebar', () => {
  let container: HTMLDivElement;
  let root: any;
  const mockOnClose = jest.fn();
  const mockChildren = <div data-testid="sidebar-content">Test Content</div>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    mockOnClose.mockClear();
    mockBodyStyle.overflow = 'unset';
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root.unmount();
      });
    }
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
    mockBodyStyle.overflow = 'unset';
  });

  describe('Rendering', () => {
    it('should render sidebar with children when open', async () => {
      await new Promise<void>((resolve) => {
        root.render(
          <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
            {mockChildren}
          </SlideOutSidebar>
        );
        setTimeout(() => {
          const sidebarContent = container.querySelector('[data-testid="sidebar-content"]');
          expect(sidebarContent).toBeTruthy();
          expect(sidebarContent?.textContent).toBe('Test Content');
          resolve();
        }, 0);
      });
    });

    it('should render close button when open', async () => {
      await new Promise<void>((resolve) => {
        root.render(
          <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
            {mockChildren}
          </SlideOutSidebar>
        );
        setTimeout(() => {
          const closeButton = container.querySelector('[aria-label="Close sidebar"]');
          expect(closeButton).toBeTruthy();
          resolve();
        }, 0);
      });
    });

    it('should apply custom className when provided', async () => {
      await new Promise<void>((resolve) => {
        root.render(
          <SlideOutSidebar isOpen={true} onClose={mockOnClose} className="custom-sidebar">
            {mockChildren}
          </SlideOutSidebar>
        );
        setTimeout(() => {
          const sidebar = container.querySelector('.custom-sidebar');
          expect(sidebar).toBeTruthy();
          resolve();
        }, 0);
      });
    });
  });

  describe('Open/Close States', () => {
    it('should show overlay when open', async () => {
      await new Promise<void>((resolve) => {
        root.render(
          <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
            {mockChildren}
          </SlideOutSidebar>
        );
        setTimeout(() => {
          // Check that overlay exists in the document (it's rendered outside container)
          const overlay = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
          expect(overlay).toBeTruthy();
          resolve();
        }, 0);
      });
    });

    it('should not show overlay when closed', async () => {
      await new Promise<void>((resolve) => {
        root.render(
          <SlideOutSidebar isOpen={false} onClose={mockOnClose}>
            {mockChildren}
          </SlideOutSidebar>
        );
        setTimeout(() => {
          const overlay = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
          expect(overlay).toBeFalsy();
          resolve();
        }, 0);
      });
    });

    it('should apply correct transform classes when open', async () => {
      await new Promise<void>((resolve) => {
        root.render(
          <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
            {mockChildren}
          </SlideOutSidebar>
        );
        setTimeout(() => {
          const sidebar = container.querySelector('[class*="translate-x-0"]');
          expect(sidebar).toBeTruthy();
          expect(sidebar?.classList.contains('translate-x-0')).toBe(true);
          resolve();
        }, 0);
      });
    });

    it('should apply correct transform classes when closed', async () => {
      await new Promise<void>((resolve) => {
        root.render(
          <SlideOutSidebar isOpen={false} onClose={mockOnClose}>
            {mockChildren}
          </SlideOutSidebar>
        );
        setTimeout(() => {
          const sidebar = container.querySelector('[class*="-translate-x-full"]');
          expect(sidebar).toBeTruthy();
          expect(sidebar?.classList.contains('-translate-x-full')).toBe(true);
          resolve();
        }, 0);
      });
    });
  });

  describe('Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      await new Promise<void>((resolve) => {
        root.render(
          <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
            {mockChildren}
          </SlideOutSidebar>
        );
        setTimeout(() => {
          const closeButton = container.querySelector('[aria-label="Close sidebar"]') as HTMLElement;
          expect(closeButton).toBeTruthy();
          fireEvent.click(closeButton);
          expect(mockOnClose).toHaveBeenCalledTimes(1);
          resolve();
        }, 0);
      });
    });

    it('should call onClose when overlay is clicked', async () => {
      await new Promise<void>((resolve) => {
        root.render(
          <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
            {mockChildren}
          </SlideOutSidebar>
        );
        setTimeout(() => {
          const overlay = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50') as HTMLElement;
          expect(overlay).toBeTruthy();
          fireEvent.click(overlay);
          expect(mockOnClose).toHaveBeenCalledTimes(1);
          resolve();
        }, 0);
      });
    });

    it('should call onClose when Escape key is pressed and sidebar is open', async () => {
      await new Promise<void>((resolve) => {
        root.render(
          <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
            {mockChildren}
          </SlideOutSidebar>
        );
        setTimeout(() => {
          fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
          expect(mockOnClose).toHaveBeenCalledTimes(1);
          resolve();
        }, 0);
      });
    });

    it('should not call onClose when Escape key is pressed and sidebar is closed', async () => {
      await new Promise<void>((resolve) => {
        root.render(
          <SlideOutSidebar isOpen={false} onClose={mockOnClose}>
            {mockChildren}
          </SlideOutSidebar>
        );
        setTimeout(() => {
          fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
          expect(mockOnClose).not.toHaveBeenCalled();
          resolve();
        }, 0);
      });
    });

    it('should not call onClose for other keys', async () => {
      await new Promise<void>((resolve) => {
        root.render(
          <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
            {mockChildren}
          </SlideOutSidebar>
        );
        setTimeout(() => {
          fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' });
          fireEvent.keyDown(document, { key: 'Space', code: 'Space' });
          expect(mockOnClose).not.toHaveBeenCalled();
          resolve();
        }, 0);
      });
    });
  });

  describe('Body Scroll Management', () => {
    it('should prevent body scroll when sidebar is open', async () => {
      await new Promise<void>((resolve) => {
        root.render(
          <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
            {mockChildren}
          </SlideOutSidebar>
        );
        setTimeout(() => {
          expect(document.body.style.overflow).toBe('hidden');
          resolve();
        }, 0);
      });
    });

    it('should restore body scroll when sidebar is closed', async () => {
      await new Promise<void>((resolve) => {
        // First render open
        root.render(
          <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
            {mockChildren}
          </SlideOutSidebar>
        );
        
        setTimeout(() => {
          expect(document.body.style.overflow).toBe('hidden');
          
          // Then render closed
          root.render(
            <SlideOutSidebar isOpen={false} onClose={mockOnClose}>
              {mockChildren}
            </SlideOutSidebar>
          );
          
          setTimeout(() => {
            expect(document.body.style.overflow).toBe('unset');
            resolve();
          }, 0);
        }, 0);
      });
    });

    it('should restore body scroll on unmount', async () => {
      await new Promise<void>((resolve) => {
        root.render(
          <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
            {mockChildren}
          </SlideOutSidebar>
        );
        
        setTimeout(() => {
          expect(document.body.style.overflow).toBe('hidden');
          root.unmount();
          expect(document.body.style.overflow).toBe('unset');
          resolve();
        }, 0);
      });
    });
  });

  describe('Accessibility and Styling', () => {
    it('should have proper aria-label for close button', async () => {
      await new Promise<void>((resolve) => {
        root.render(
          <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
            {mockChildren}
          </SlideOutSidebar>
        );
        setTimeout(() => {
          const closeButton = container.querySelector('[aria-label="Close sidebar"]');
          expect(closeButton).toBeTruthy();
          expect(closeButton?.getAttribute('aria-label')).toBe('Close sidebar');
          resolve();
        }, 0);
      });
    });

    it('should have proper CSS classes for responsive behavior', async () => {
      await new Promise<void>((resolve) => {
        root.render(
          <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
            {mockChildren}
          </SlideOutSidebar>
        );
        setTimeout(() => {
          const sidebar = container.querySelector('[class*="fixed"]');
          expect(sidebar).toBeTruthy();
          expect(sidebar?.classList.contains('fixed')).toBe(true);
          expect(sidebar?.classList.contains('lg:relative')).toBe(true);
          expect(sidebar?.classList.contains('lg:translate-x-0')).toBe(true);
          
          // Check overlay classes
          const overlay = document.querySelector('.fixed.inset-0');
          expect(overlay?.classList.contains('lg:hidden')).toBe(true);
          resolve();
        }, 0);
      });
    });

    it('should have proper styling classes', async () => {
      await new Promise<void>((resolve) => {
        root.render(
          <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
            {mockChildren}
          </SlideOutSidebar>
        );
        setTimeout(() => {
          const sidebar = container.querySelector('[class*="fixed"]');
          expect(sidebar).toBeTruthy();
          
          const classesToCheck = [
            'w-80', 'max-w-[85vw]', 'h-full', 'bg-white', 'dark:bg-gray-800',
            'shadow-xl', 'lg:shadow-sm', 'transform', 'transition-transform',
            'duration-300', 'ease-in-out', 'z-50'
          ];
          
          classesToCheck.forEach(className => {
            expect(sidebar?.classList.contains(className)).toBe(true);
          });
          resolve();
        }, 0);
      });
    });
  });

  describe('Complex Children Rendering', () => {
    it('should render complex children with interactive elements', async () => {
      const mockButtonClick = jest.fn();
      
      await new Promise<void>((resolve) => {
        root.render(
          <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
            <div>
              <h2>Sidebar Title</h2>
              <button onClick={mockButtonClick} data-testid="sidebar-button">
                Click me
              </button>
              <form>
                <input type="text" placeholder="Search" />
                <select>
                  <option>Option 1</option>
                  <option>Option 2</option>
                </select>
              </form>
            </div>
          </SlideOutSidebar>
        );
        
        setTimeout(() => {
          const title = container.querySelector('h2');
          expect(title?.textContent).toBe('Sidebar Title');
          
          const input = container.querySelector('input[placeholder="Search"]');
          expect(input).toBeTruthy();
          
          const button = container.querySelector('[data-testid="sidebar-button"]') as HTMLElement;
          expect(button).toBeTruthy();
          
          fireEvent.click(button);
          expect(mockButtonClick).toHaveBeenCalled();
          resolve();
        }, 0);
      });
    });
  });
});