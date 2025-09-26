/**
 * Unit Tests for StockCards Component
 * ===================================
 * 
 * Tests for the container component that displays multiple stock cards
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StockCards } from './StockCards';
import type { WatchedStock } from '@/core/types';

// Mock the StockCard component
jest.mock('./StockCard', () => ({
  StockCard: ({ stock, onRemove }: { stock: any; onRemove: any }) => (
    <div data-testid={`stock-card-${stock.symbol}`}>
      <span>{stock.symbol}</span>
      <span>${stock.currentPrice || '---'}</span>
      {onRemove && (
        <button onClick={() => onRemove(stock.symbol)}>
          Remove {stock.symbol}
        </button>
      )}
    </div>
  ),
}));

describe('StockCards', () => {
  const mockStocks: WatchedStock[] = [
    {
      id: 'stock_1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      alertPrice: 150.0,
      currentPrice: 155.50,
      change: 5.50,
      percentChange: 3.67,
      high: 157.0,
      low: 153.0,
      open: 154.0,
      previousClose: 150.0,
      isLoading: false,
      lastUpdated: Date.now(),
      priceHistory: [],
    },
    {
      id: 'stock_2',
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      alertPrice: 2800.0,
      currentPrice: 2850.0,
      change: 50.0,
      percentChange: 1.79,
      high: 2860.0,
      low: 2820.0,
      open: 2830.0,
      previousClose: 2800.0,
      isLoading: false,
      lastUpdated: Date.now(),
      priceHistory: [],
    },
  ];

  const mockOnRemoveStock = jest.fn();

  beforeEach(() => {
    mockOnRemoveStock.mockClear();
  });

  describe('Empty State', () => {
    it('should render empty state when no stocks provided', () => {
      render(<StockCards stocks={[]} onRemoveStock={mockOnRemoveStock} />);

      expect(screen.getByText('No stocks being watched')).toBeInTheDocument();
      expect(screen.getByText('Add a stock from the sidebar to get started with real-time tracking')).toBeInTheDocument();
    });

    it('should show TrendingUp icon in empty state', () => {
      render(<StockCards stocks={[]} onRemoveStock={mockOnRemoveStock} />);

      // Icon should be present (from lucide-react)
      const emptyState = screen.getByText('No stocks being watched').closest('div');
      expect(emptyState).toBeInTheDocument();
    });

    it('should apply custom className to empty state', () => {
      const { container } = render(
        <StockCards stocks={[]} onRemoveStock={mockOnRemoveStock} className="custom-empty" />
      );

      expect(container.firstChild).toHaveClass('custom-empty');
    });

    it('should have proper styling for empty state', () => {
      const { container } = render(
        <StockCards stocks={[]} onRemoveStock={mockOnRemoveStock} />
      );

      const emptyState = container.firstChild as HTMLElement;
      expect(emptyState).toHaveClass('p-8', 'text-center', 'bg-white', 'rounded-lg', 'shadow-sm', 'dark:bg-gray-800');
    });
  });

  describe('Stock Cards Grid', () => {
    it('should render all provided stocks', () => {
      render(<StockCards stocks={mockStocks} onRemoveStock={mockOnRemoveStock} />);

      expect(screen.getByTestId('stock-card-AAPL')).toBeInTheDocument();
      expect(screen.getByTestId('stock-card-GOOGL')).toBeInTheDocument();
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('GOOGL')).toBeInTheDocument();
    });

    it('should apply grid layout classes', () => {
      const { container } = render(
        <StockCards stocks={mockStocks} onRemoveStock={mockOnRemoveStock} />
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('grid', 'grid-cols-1', 'gap-6', 'md:grid-cols-2', 'xl:grid-cols-4');
    });

    it('should apply custom className to grid', () => {
      const { container } = render(
        <StockCards stocks={mockStocks} onRemoveStock={mockOnRemoveStock} className="custom-grid" />
      );

      expect(container.firstChild).toHaveClass('custom-grid');
    });

    it('should pass correct props to StockCard components', () => {
      render(<StockCards stocks={mockStocks} onRemoveStock={mockOnRemoveStock} />);

      // Check that StockCard receives the stock data
      expect(screen.getByText('$155.5')).toBeInTheDocument(); // AAPL price
      expect(screen.getByText('$2850')).toBeInTheDocument(); // GOOGL price
    });

    it('should pass onRemove callback to StockCard components', () => {
      render(<StockCards stocks={mockStocks} onRemoveStock={mockOnRemoveStock} />);

      expect(screen.getByText('Remove AAPL')).toBeInTheDocument();
      expect(screen.getByText('Remove GOOGL')).toBeInTheDocument();
    });
  });

  describe('Component Interactions', () => {
    it('should handle stock removal', async () => {
      const user = userEvent.setup();
      render(<StockCards stocks={mockStocks} onRemoveStock={mockOnRemoveStock} />);

      const removeButton = screen.getByText('Remove AAPL');
      await user.click(removeButton);

      expect(mockOnRemoveStock).toHaveBeenCalledWith('AAPL');
    });

    it('should handle removal of different stocks', async () => {
      const user = userEvent.setup();
      render(<StockCards stocks={mockStocks} onRemoveStock={mockOnRemoveStock} />);

      const removeAaplButton = screen.getByText('Remove AAPL');
      const removeGooglButton = screen.getByText('Remove GOOGL');

      await user.click(removeAaplButton);
      expect(mockOnRemoveStock).toHaveBeenCalledWith('AAPL');

      await user.click(removeGooglButton);
      expect(mockOnRemoveStock).toHaveBeenCalledWith('GOOGL');

      expect(mockOnRemoveStock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Key Generation', () => {
    it('should use unique keys for stock cards', () => {
      const stocksWithTimestamps = mockStocks.map((stock, index) => ({
        ...stock,
        lastUpdated: Date.now() + index * 1000,
      }));

      render(<StockCards stocks={stocksWithTimestamps} onRemoveStock={mockOnRemoveStock} />);

      // Keys should include both id and lastUpdated
      expect(screen.getByTestId('stock-card-AAPL')).toBeInTheDocument();
      expect(screen.getByTestId('stock-card-GOOGL')).toBeInTheDocument();
    });

    it('should handle stocks without lastUpdated', () => {
      const stocksWithoutTimestamps: WatchedStock[] = mockStocks.map(stock => {
        const { lastUpdated, ...stockWithoutTimestamp } = stock;
        return stockWithoutTimestamp;
      });

      render(<StockCards stocks={stocksWithoutTimestamps} onRemoveStock={mockOnRemoveStock} />);

      // Should still render without errors
      expect(screen.getByTestId('stock-card-AAPL')).toBeInTheDocument();
      expect(screen.getByTestId('stock-card-GOOGL')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should work without onRemoveStock callback', () => {
      render(<StockCards stocks={mockStocks} />);

      expect(screen.getByTestId('stock-card-AAPL')).toBeInTheDocument();
      expect(screen.getByTestId('stock-card-GOOGL')).toBeInTheDocument();
      // Remove buttons should not be present
      expect(screen.queryByText('Remove AAPL')).not.toBeInTheDocument();
      expect(screen.queryByText('Remove GOOGL')).not.toBeInTheDocument();
    });

    it('should handle single stock', () => {
      render(<StockCards stocks={[mockStocks[0]]} onRemoveStock={mockOnRemoveStock} />);

      expect(screen.getByTestId('stock-card-AAPL')).toBeInTheDocument();
      expect(screen.queryByTestId('stock-card-GOOGL')).not.toBeInTheDocument();
    });

    it('should handle many stocks', () => {
      const manyStocks = Array.from({ length: 10 }, (_, i) => ({
        ...mockStocks[0],
        id: `stock_${i}`,
        symbol: `STOCK${i}`,
        name: `Stock ${i} Inc.`,
      }));

      render(<StockCards stocks={manyStocks} onRemoveStock={mockOnRemoveStock} />);

      // Should render all stocks
      manyStocks.forEach((_, i) => {
        expect(screen.getByTestId(`stock-card-STOCK${i}`)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid classes', () => {
      const { container } = render(
        <StockCards stocks={mockStocks} onRemoveStock={mockOnRemoveStock} />
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('grid-cols-1'); // Mobile
      expect(grid).toHaveClass('md:grid-cols-2'); // Tablet
      expect(grid).toHaveClass('xl:grid-cols-4'); // Desktop
    });
  });

  describe('Dark Mode Support', () => {
    it('should have dark mode classes in empty state', () => {
      const { container } = render(
        <StockCards stocks={[]} onRemoveStock={mockOnRemoveStock} />
      );

      const emptyState = container.firstChild as HTMLElement;
      expect(emptyState).toHaveClass('dark:bg-gray-800');
    });

    it('should have dark mode text classes in empty state', () => {
      render(<StockCards stocks={[]} onRemoveStock={mockOnRemoveStock} />);

      const heading = screen.getByText('No stocks being watched');
      const description = screen.getByText('Add a stock from the sidebar to get started with real-time tracking');

      expect(heading).toHaveClass('dark:text-white');
      expect(description).toHaveClass('dark:text-gray-300');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure in empty state', () => {
      render(<StockCards stocks={[]} onRemoveStock={mockOnRemoveStock} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('No stocks being watched');
    });

    it('should provide descriptive text for empty state', () => {
      render(<StockCards stocks={[]} onRemoveStock={mockOnRemoveStock} />);

      expect(screen.getByText(/Add a stock from the sidebar/)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle frequent re-renders efficiently', () => {
      const { rerender } = render(
        <StockCards stocks={mockStocks} onRemoveStock={mockOnRemoveStock} />
      );

      // Simulate price updates
      const updatedStocks = mockStocks.map(stock => ({
        ...stock,
        currentPrice: (stock.currentPrice || 0) + 1,
        lastUpdated: Date.now(),
      }));

      rerender(<StockCards stocks={updatedStocks} onRemoveStock={mockOnRemoveStock} />);

      // Should still render all stocks
      expect(screen.getByTestId('stock-card-AAPL')).toBeInTheDocument();
      expect(screen.getByTestId('stock-card-GOOGL')).toBeInTheDocument();
    });
  });
});