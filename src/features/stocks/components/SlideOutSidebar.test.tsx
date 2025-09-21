/**
 * Unit Tests for SlideOutSidebar Component
 * =========================================
 * 
 * Tests for the responsive slide-out sidebar component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SlideOutSidebar } from './SlideOutSidebar';

// Mock the document.body style property
const mockBodyStyle = {
  overflow: 'unset',
};

Object.defineProperty(document, 'body', {
  value: {
    style: mockBodyStyle,
  },
  writable: true,
});

describe('SlideOutSidebar', () => {
  const mockOnClose = jest.fn();
  const mockChildren = <div data-testid="sidebar-content">Test Content</div>;

  beforeEach(() => {
    mockOnClose.mockClear();
    mockBodyStyle.overflow = 'unset';
  });

  afterEach(() => {
    // Cleanup event listeners
    document.removeEventListener('keydown', jest.fn());
    mockBodyStyle.overflow = 'unset';
  });

  describe('Rendering', () => {
    it('should render sidebar with children', () => {
      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const closeButton = screen.getByLabelText('Close sidebar');
      expect(closeButton).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose} className="custom-sidebar">
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

      const overlay = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
      expect(overlay).toBeInTheDocument();
    });

    it('should not show overlay when closed', () => {
      render(
        <SlideOutSidebar isOpen={false} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const overlay = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
      expect(overlay).not.toBeInTheDocument();
    });

    it('should apply correct transform classes when open', () => {
      const { container } = render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const sidebar = container.querySelector('.fixed.lg\\:relative');
      expect(sidebar).toHaveClass('translate-x-0');
      expect(sidebar).not.toHaveClass('-translate-x-full');
    });

    it('should apply correct transform classes when closed', () => {
      const { container } = render(
        <SlideOutSidebar isOpen={false} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const sidebar = container.querySelector('.fixed.lg\\:relative');
      expect(sidebar).toHaveClass('-translate-x-full');
      expect(sidebar).not.toHaveClass('translate-x-0');
    });
  });

  describe('Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const closeButton = screen.getByLabelText('Close sidebar');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked', async () => {
      const user = userEvent.setup();
      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const overlay = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50') as HTMLElement;
      await user.click(overlay);

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

    it('should handle state changes from closed to open', () => {
      const { rerender } = render(
        <SlideOutSidebar isOpen={false} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      expect(document.body.style.overflow).toBe('unset');

      rerender(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive classes for sidebar position', () => {
      const { container } = render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const sidebar = container.querySelector('.fixed.lg\\:relative');
      expect(sidebar).toHaveClass('fixed', 'lg:relative', 'lg:translate-x-0');
    });

    it('should have responsive classes for overlay', () => {
      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const overlay = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
      expect(overlay).toHaveClass('lg:hidden');
    });

    it('should have responsive classes for close button', () => {
      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const closeButtonContainer = screen.getByLabelText('Close sidebar').closest('div');
      expect(closeButtonContainer).toHaveClass('lg:hidden');
    });

    it('should have responsive shadow classes', () => {
      const { container } = render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const sidebar = container.querySelector('.fixed.lg\\:relative');
      expect(sidebar).toHaveClass('shadow-xl', 'lg:shadow-sm');
    });
  });

  describe('Sizing and Layout', () => {
    it('should have correct width and max-width', () => {
      const { container } = render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const sidebar = container.querySelector('.fixed.lg\\:relative');
      expect(sidebar).toHaveClass('w-80', 'max-w-[85vw]');
    });

    it('should have full height', () => {
      const { container } = render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const sidebar = container.querySelector('.fixed.lg\\:relative');
      expect(sidebar).toHaveClass('h-full');
    });

    it('should have scrollable content area', () => {
      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const contentArea = screen.getByTestId('sidebar-content').parentElement;
      expect(contentArea).toHaveClass('h-full', 'overflow-y-auto');
    });
  });

  describe('Animations and Transitions', () => {
    it('should have transition classes', () => {
      const { container } = render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const sidebar = container.querySelector('.fixed.lg\\:relative');
      expect(sidebar).toHaveClass('transform', 'transition-transform', 'duration-300', 'ease-in-out');
    });

    it('should have z-index for proper layering', () => {
      const { container } = render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const sidebar = container.querySelector('.fixed.lg\\:relative');
      const overlay = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');

      expect(sidebar).toHaveClass('z-50');
      expect(overlay).toHaveClass('z-40');
    });
  });

  describe('Dark Mode Support', () => {
    it('should have dark mode classes for sidebar', () => {
      const { container } = render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const sidebar = container.querySelector('.fixed.lg\\:relative');
      expect(sidebar).toHaveClass('bg-white', 'dark:bg-gray-800');
    });

    it('should have dark mode classes for close button', () => {
      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const closeButton = screen.getByLabelText('Close sidebar');
      expect(closeButton).toHaveClass('hover:bg-gray-100', 'dark:hover:bg-gray-700');

      const closeIcon = closeButton.querySelector('svg');
      expect(closeIcon).toHaveClass('text-gray-500', 'dark:text-gray-400');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for close button', () => {
      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const closeButton = screen.getByLabelText('Close sidebar');
      expect(closeButton).toHaveAttribute('aria-label', 'Close sidebar');
    });

    it('should be focusable when open', () => {
      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      const closeButton = screen.getByLabelText('Close sidebar');
      expect(closeButton).not.toHaveAttribute('tabindex', '-1');
    });

    it('should handle focus management properly', () => {
      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          <input data-testid="sidebar-input" placeholder="Test input" />
        </SlideOutSidebar>
      );

      const input = screen.getByTestId('sidebar-input');
      expect(input).toBeInTheDocument();
      expect(input).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Event Listener Management', () => {
    it('should add event listener when sidebar opens', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

      render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      const { unmount } = render(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('should handle rapid open/close state changes', () => {
      const { rerender } = render(
        <SlideOutSidebar isOpen={false} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      // Rapidly change states
      rerender(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      rerender(
        <SlideOutSidebar isOpen={false} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      rerender(
        <SlideOutSidebar isOpen={true} onClose={mockOnClose}>
          {mockChildren}
        </SlideOutSidebar>
      );

      // Should not throw errors and body overflow should be handled correctly
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('Complex Children', () => {
    it('should render complex children with interactive elements', async () => {
      const user = userEvent.setup();
      const mockButtonClick = jest.fn();

      render(
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

      expect(screen.getByText('Sidebar Title')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();

      const button = screen.getByTestId('sidebar-button');
      await user.click(button);

      expect(mockButtonClick).toHaveBeenCalled();
    });
  });
});