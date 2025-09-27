/**
 * Unit Tests for SlideOutSidebar Component
 * =========================================
 *
 * Tests for the responsive slide-out sidebar component using React Testing Library
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SlideOutSidebar } from './SlideOutSidebar';

// Mock document.body style for testing
const mockBodyStyle = {
  overflow: 'unset',
} as CSSStyleDeclaration;

Object.defineProperty(document.body, 'style', {
  get: () => mockBodyStyle,
  set: value => {
    Object.assign(mockBodyStyle, value);
  },
  configurable: true,
});

describe('SlideOutSidebar', () => {
  const mockOnClose = jest.fn();
  const mockChildren = <div data-testid='sidebar-content'>Test Content</div>;

  beforeEach(() => {
    mockOnClose.mockClear();
    mockBodyStyle.overflow = 'unset';
  });

  describe('Rendering', () => {
    it('should render sidebar with children when open', () => {
      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const sidebarContent = screen.getByTestId('sidebar-content');
      expect(sidebarContent).toBeInTheDocument();
      expect(sidebarContent).toHaveTextContent('Test Content');
    });

    it('should render close button when open', () => {
      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      // Get all elements with that label and select the button
      const closeElements = screen.getAllByLabelText('Close sidebar');
      const closeButton = closeElements.find(el => el.tagName === 'BUTTON');
      expect(closeButton).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      const { container } = render(
        <SlideOutSidebar
          isOpen={true}
          onClose={mockOnClose}
          className='custom-sidebar'
        >
          {mockChildren}
        </SlideOutSidebar>
      );

      const sidebar = container.querySelector('.custom-sidebar');
      expect(sidebar).toBeInTheDocument();
    });
  });

  describe('Open/Close States', () => {
    it('should show overlay when open', () => {
      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      // Check that overlay exists (has specific classes for overlay)
      const overlay = document.querySelector(
        '.fixed.inset-0.bg-black.bg-opacity-50'
      );
      expect(overlay).toBeInTheDocument();
    });

    it('should not show overlay when closed', () => {
      render(
        <SlideOutSidebar isOpen={false} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const overlay = document.querySelector(
        '.fixed.inset-0.bg-black.bg-opacity-50'
      );
      expect(overlay).not.toBeInTheDocument();
    });

    it('should apply correct transform classes when open', () => {
      const { container } = render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const sidebar = container.querySelector('[class*="translate-x-0"]');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveClass('translate-x-0');
    });

    it('should apply correct transform classes when closed', () => {
      const { container } = render(
        <SlideOutSidebar isOpen={false} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const sidebar = container.querySelector('[class*="-translate-x-full"]');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveClass('-translate-x-full');
    });
  });

  describe('Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const closeElements = screen.getAllByLabelText('Close sidebar');
      const closeButton = closeElements.find(el => el.tagName === 'BUTTON')!;
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked', () => {
      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const overlay = document.querySelector(
        '.fixed.inset-0.bg-black.bg-opacity-50'
      ) as HTMLElement;
      expect(overlay).toBeInTheDocument();
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key is pressed and sidebar is open', () => {
      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when Escape key is pressed and sidebar is closed', () => {
      render(
        <SlideOutSidebar isOpen={false} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should not call onClose for other keys', () => {
      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space', code: 'Space' });
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Body Scroll Management', () => {
    it('should prevent body scroll when sidebar is open', () => {
      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when sidebar is closed', () => {
      const { rerender } = render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <SlideOutSidebar isOpen={false} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      expect(document.body.style.overflow).toBe('unset');
    });

    it('should restore body scroll on unmount', () => {
      const { unmount } = render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      expect(document.body.style.overflow).toBe('hidden');
      unmount();
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Accessibility and Styling', () => {
    it('should have proper aria-label for close button', () => {
      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const closeElements = screen.getAllByLabelText('Close sidebar');
      const closeButton = closeElements.find(el => el.tagName === 'BUTTON')!;
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label', 'Close sidebar');
    });

    it('should have proper CSS classes for responsive behavior', () => {
      const { container } = render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      // Select the actual sidebar div (has w-80 class), not the overlay
      const sidebar = container.querySelector('[class*="w-80"]');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveClass('fixed');
      expect(sidebar).toHaveClass('lg:relative');
      expect(sidebar).toHaveClass('lg:translate-x-0');

      // Check overlay classes
      const overlay = document.querySelector('.fixed.inset-0');
      expect(overlay).toHaveClass('lg:hidden');
    });

    it('should have proper styling classes', () => {
      const { container } = render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      // Select the actual sidebar div (has w-80 class), not the overlay
      const sidebar = container.querySelector('[class*="w-80"]');
      expect(sidebar).toBeInTheDocument();

      const classesToCheck = [
        'w-80',
        'max-w-[85vw]',
        'h-full',
        'bg-white',
        'dark:bg-gray-800',
        'shadow-xl',
        'lg:shadow-sm',
        'transform',
        'transition-transform',
        'duration-300',
        'ease-in-out',
        'z-50',
      ];

      classesToCheck.forEach(className => {
        expect(sidebar).toHaveClass(className);
      });
    });
  });

  describe('Complex Children Rendering', () => {
    it('should render complex children with interactive elements', () => {
      const mockButtonClick = jest.fn();

      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          <div>
            <h2>Sidebar Title</h2>
            <button onClick={mockButtonClick} data-testid='sidebar-button'>
              Click me
            </button>
            <form>
              <input type='text' placeholder='Search' />
              <select>
                <option>Option 1</option>
                <option>Option 2</option>
              </select>
            </form>
          </div>
        </SlideOutSidebar>
      );

      const title = screen.getByText('Sidebar Title');
      expect(title).toBeInTheDocument();

      const input = screen.getByPlaceholderText('Search');
      expect(input).toBeInTheDocument();

      const button = screen.getByTestId('sidebar-button');
      expect(button).toBeInTheDocument();

      fireEvent.click(button);
      expect(mockButtonClick).toHaveBeenCalled();
    });
  });
});
