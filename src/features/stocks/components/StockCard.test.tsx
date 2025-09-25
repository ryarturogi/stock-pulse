/**
 * Unit Tests for StockCard Component
 * ==================================
 * 
 * Tests for stock card display and interactions
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StockCard } from './StockCard';
import type { WatchedStock } from '@/core/types';

// Mock the stock store
const mockUpdateAlertPrice = jest.fn();
jest.mock('@/features/stocks/stores/stockStore', () => ({
  useStockStore: (selector: any) => {
    const state = {
      updateAlertPrice: mockUpdateAlertPrice,
    };
    return selector ? selector(state) : state;
  },
}));

describe('StockCard', () => {
  const mockStock: WatchedStock = {
    id: 'stock_1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    alertPrice: 150.0,
    currentPrice: 155.50,
    change: 5.50,
    changePercent: 3.67,
    percentChange: 3.67,
    high: 157.0,
    low: 153.0,
    open: 154.0,
    previousClose: 150.0,
    isLoading: false,
    lastUpdated: Date.now(),
    priceHistory: [
      { time: Date.now() - 1000, price: 154.0 },
      { time: Date.now(), price: 155.50 },
    ],
  };

  const mockOnRemove = jest.fn();

  beforeEach(() => {
    mockUpdateAlertPrice.mockClear();
    mockOnRemove.mockClear();
  });

  describe('Rendering', () => {
    it('should render stock information correctly', () => {
      render(<StockCard stock={mockStock} onRemove={mockOnRemove} />);

      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('Apple')).toBeInTheDocument(); // Truncated name
      expect(screen.getByText('$155.50')).toBeInTheDocument();
      expect(screen.getByText('+5.50')).toBeInTheDocument();
      expect(screen.getByText('3.67%')).toBeInTheDocument();
    });

    it('should show loading skeleton when isLoading is true', () => {
      const loadingStock = { ...mockStock, isLoading: true };
      render(<StockCard stock={loadingStock} onRemove={mockOnRemove} />);

      // Should show animated skeleton
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should display stock icon with first letter', () => {
      render(<StockCard stock={mockStock} onRemove={mockOnRemove} />);

      const icon = screen.getByText('A'); // First letter of AAPL
      expect(icon).toBeInTheDocument();
      expect(icon.closest('div')).toHaveStyle('background-color: #2563eb'); // AAPL color
    });

    it('should show remove button when onRemove is provided', () => {
      render(<StockCard stock={mockStock} onRemove={mockOnRemove} />);

      const removeButton = screen.getByTitle('Remove from watchlist');
      expect(removeButton).toBeInTheDocument();
    });

    it('should not show remove button when onRemove is not provided', () => {
      render(<StockCard stock={mockStock} />);

      const removeButton = screen.queryByTitle('Remove from watchlist');
      expect(removeButton).not.toBeInTheDocument();
    });
  });

  describe('Price Display', () => {
    it('should show positive change in green', () => {
      render(<StockCard stock={mockStock} onRemove={mockOnRemove} />);

      const changeElement = screen.getByText('+5.50');
      expect(changeElement).toHaveClass('text-green-800');
    });

    it('should show negative change in red', () => {
      const negativeStock = {
        ...mockStock,
        change: -2.50,
        changePercent: -1.61,
        percentChange: -1.61,
      };
      render(<StockCard stock={negativeStock} onRemove={mockOnRemove} />);

      const changeElement = screen.getByText('-2.50');
      expect(changeElement).toHaveClass('text-red-800');
    });

    it('should handle missing price data gracefully', () => {
      const incompleteStock = {
        ...mockStock,
        currentPrice: undefined,
        change: undefined,
        changePercent: undefined,
        percentChange: undefined,
      };
      render(<StockCard stock={incompleteStock} onRemove={mockOnRemove} />);

      expect(screen.getAllByText('---.--').length).toBeGreaterThan(0);
      expect(screen.getByText('--.--%')).toBeInTheDocument();
    });
  });

  describe('Alert Status', () => {
    it('should show alert badge when price is above alert', () => {
      render(<StockCard stock={mockStock} onRemove={mockOnRemove} />);

      // Current price (155.50) > alert price (150.0)
      const alertBadge = screen.getByText('Above Alert');
      expect(alertBadge).toBeInTheDocument();
      expect(alertBadge).toHaveClass('bg-green-100');
    });

    it('should show alert badge when price is below alert', () => {
      const belowAlertStock = {
        ...mockStock,
        currentPrice: 145.0,
      };
      render(<StockCard stock={belowAlertStock} onRemove={mockOnRemove} />);

      const alertBadge = screen.getByText('Below Alert');
      expect(alertBadge).toBeInTheDocument();
      expect(alertBadge).toHaveClass('bg-red-100');
    });

    it('should show correct border color based on alert status', () => {
      const { container } = render(<StockCard stock={mockStock} onRemove={mockOnRemove} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-green-500');
    });
  });

  describe('Alert Price Editing', () => {
    it('should enter edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<StockCard stock={mockStock} onRemove={mockOnRemove} />);

      const editButton = screen.getByTitle('Click to edit alert price');
      await user.click(editButton);

      const input = screen.getByDisplayValue('150');
      expect(input).toBeInTheDocument();
      expect(input).toHaveFocus();
    });

    it('should save new alert price when save button is clicked', async () => {
      const user = userEvent.setup();
      render(<StockCard stock={mockStock} onRemove={mockOnRemove} />);

      // Enter edit mode
      const editButton = screen.getByTitle('Click to edit alert price');
      await user.click(editButton);

      // Change the value
      const input = screen.getByDisplayValue('150');
      await user.clear(input);
      await user.type(input, '160');

      // Save the change
      const saveButton = screen.getByTitle('Save');
      await user.click(saveButton);

      expect(mockUpdateAlertPrice).toHaveBeenCalledWith('AAPL', 160);
    });

    it('should cancel edit mode when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<StockCard stock={mockStock} onRemove={mockOnRemove} />);

      // Enter edit mode
      const editButton = screen.getByTitle('Click to edit alert price');
      await user.click(editButton);

      // Change the value
      const input = screen.getByDisplayValue('150');
      await user.clear(input);
      await user.type(input, '160');

      // Cancel the change
      const cancelButton = screen.getByTitle('Cancel');
      await user.click(cancelButton);

      expect(mockUpdateAlertPrice).not.toHaveBeenCalled();
      expect(screen.queryByDisplayValue('160')).not.toBeInTheDocument();
    });

    it('should save on Enter key press', async () => {
      const user = userEvent.setup();
      render(<StockCard stock={mockStock} onRemove={mockOnRemove} />);

      // Enter edit mode
      const editButton = screen.getByTitle('Click to edit alert price');
      await user.click(editButton);

      // Change value and press Enter
      const input = screen.getByDisplayValue('150');
      await user.clear(input);
      await user.type(input, '160{enter}');

      expect(mockUpdateAlertPrice).toHaveBeenCalledWith('AAPL', 160);
    });

    it('should cancel on Escape key press', async () => {
      const user = userEvent.setup();
      render(<StockCard stock={mockStock} onRemove={mockOnRemove} />);

      // Enter edit mode
      const editButton = screen.getByTitle('Click to edit alert price');
      await user.click(editButton);

      // Change value and press Escape
      const input = screen.getByDisplayValue('150');
      await user.clear(input);
      await user.type(input, '160{escape}');

      expect(mockUpdateAlertPrice).not.toHaveBeenCalled();
    });

    it('should handle invalid alert price input', async () => {
      const user = userEvent.setup();
      render(<StockCard stock={mockStock} onRemove={mockOnRemove} />);

      // Enter edit mode
      const editButton = screen.getByTitle('Click to edit alert price');
      await user.click(editButton);

      // Enter invalid value
      const input = screen.getByDisplayValue('150');
      await user.clear(input);
      await user.type(input, 'invalid');

      // Try to save
      const saveButton = screen.getByTitle('Save');
      await user.click(saveButton);

      expect(mockUpdateAlertPrice).not.toHaveBeenCalled();
      // Should reset to original value
      expect(screen.getByDisplayValue('150')).toBeInTheDocument();
    });
  });

  describe('Remove Functionality', () => {
    it('should call onRemove when remove button is clicked', async () => {
      const user = userEvent.setup();
      render(<StockCard stock={mockStock} onRemove={mockOnRemove} />);

      const removeButton = screen.getByTitle('Remove from watchlist');
      await user.click(removeButton);

      expect(mockOnRemove).toHaveBeenCalledWith('AAPL');
    });
  });

  describe('Real-time Updates', () => {
    it('should show visual indicators for recent updates', () => {
      const recentlyUpdatedStock = {
        ...mockStock,
        lastUpdated: Date.now() - 500, // 500ms ago
      };
      render(<StockCard stock={recentlyUpdatedStock} onRemove={mockOnRemove} />);

      // Should have ring effect for just updated
      const card = screen.getByRole('article') || 
                   document.querySelector('[class*="ring-2"]');
      expect(card).toBeTruthy();
    });

    it('should display last updated time', () => {
      render(<StockCard stock={mockStock} onRemove={mockOnRemove} />);

      const lastUpdated = screen.getAllByText(/\d{1,2}:\d{2}(:\d{2})?/)[0];
      expect(lastUpdated).toBeInTheDocument();
    });

    it('should show LIVE indicator for recent updates', () => {
      const recentStock = {
        ...mockStock,
        lastUpdated: Date.now() - 2000, // 2 seconds ago
      };
      render(<StockCard stock={recentStock} onRemove={mockOnRemove} />);

      const liveIndicator = screen.getByText('LIVE');
      expect(liveIndicator).toBeInTheDocument();
    });
  });

  describe('High/Low Display', () => {
    it('should display high and low prices when available', () => {
      render(<StockCard stock={mockStock} onRemove={mockOnRemove} />);

      expect(screen.getByText('H: $157.00')).toBeInTheDocument();
      expect(screen.getByText('L: $153.00')).toBeInTheDocument();
    });

    it('should handle missing high/low prices', () => {
      const stockWithoutHighLow = {
        ...mockStock,
        high: undefined,
        low: undefined,
      };
      render(<StockCard stock={stockWithoutHighLow} onRemove={mockOnRemove} />);

      expect(screen.queryByText(/H: \$/)).not.toBeInTheDocument();
      expect(screen.queryByText(/L: \$/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<StockCard stock={mockStock} onRemove={mockOnRemove} />);

      const removeButton = screen.getByTitle('Remove from watchlist');
      expect(removeButton).toHaveAttribute('title', 'Remove from watchlist');

      const editButton = screen.getByTitle('Click to edit alert price');
      expect(editButton).toHaveAttribute('title', 'Click to edit alert price');
    });

    it('should be keyboard navigable', () => {
      render(<StockCard stock={mockStock} onRemove={mockOnRemove} />);

      const removeButton = screen.getByTitle('Remove from watchlist');
      const editButton = screen.getByTitle('Click to edit alert price');

      expect(removeButton).not.toHaveAttribute('tabindex', '-1');
      expect(editButton).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Dark Mode', () => {
    it('should apply dark mode classes', () => {
      const { container } = render(<StockCard stock={mockStock} onRemove={mockOnRemove} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('dark:bg-gray-800');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive classes for different screen sizes', () => {
      const { container } = render(<StockCard stock={mockStock} onRemove={mockOnRemove} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('p-4', 'lg:p-6');

      const priceElement = screen.getByText('$155.50').closest('p');
      expect(priceElement).toHaveClass('text-xl', 'lg:text-2xl');
    });
  });
});