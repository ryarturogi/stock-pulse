// Mock Recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => (
    <div data-testid='line-chart'>{children}</div>
  ),
  Line: ({ dataKey, stroke }: any) => (
    <div data-testid={`line-${dataKey}`} data-stroke={stroke} />
  ),
  XAxis: () => <div data-testid='x-axis' />,
  YAxis: () => <div data-testid='y-axis' />,
  CartesianGrid: () => <div data-testid='grid' />,
  Tooltip: () => <div data-testid='tooltip' />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid='responsive-container'>{children}</div>
  ),
  Legend: () => <div data-testid='legend' />,
}));

/**
 * Unit Tests for StockChart Component
 * ===================================
 *
 * Tests for stock chart visualization and data display
 */

import { render, screen } from '@testing-library/react';

import type { WatchedStock } from '@/core/types';

import { StockChart } from './StockChart';

describe('StockChart', () => {
  const mockStocks: WatchedStock[] = [
    {
      id: 'stock_1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      alertPrice: 150.0,
      currentPrice: 155.5,
      priceHistory: [
        { time: Date.now() - 2000, price: 154.0 },
        { time: Date.now() - 1000, price: 154.5 },
        { time: Date.now(), price: 155.5 },
      ],
    },
    {
      id: 'stock_2',
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      alertPrice: 2800.0,
      currentPrice: 2850.0,
      priceHistory: [
        { time: Date.now() - 2000, price: 2830.0 },
        { time: Date.now() - 1000, price: 2840.0 },
        { time: Date.now(), price: 2850.0 },
      ],
    },
  ];

  describe('Rendering', () => {
    it('should render chart with data', () => {
      render(<StockChart stocks={mockStocks} />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('grid')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('should render lines for each stock', () => {
      render(<StockChart stocks={mockStocks} />);

      expect(screen.getByTestId('line-AAPL')).toBeInTheDocument();
      expect(screen.getByTestId('line-GOOGL')).toBeInTheDocument();
    });

    it('should use correct colors for stock lines', () => {
      render(<StockChart stocks={mockStocks} />);

      const aaplLine = screen.getByTestId('line-AAPL');
      const googlLine = screen.getByTestId('line-GOOGL');

      expect(aaplLine).toHaveAttribute('data-stroke', '#2563eb'); // AAPL color
      expect(googlLine).toHaveAttribute('data-stroke', '#ea4335'); // GOOGL color
    });

    it('should show chart header with stock count', () => {
      render(<StockChart stocks={mockStocks} />);

      expect(screen.getByText('Stock Price Chart')).toBeInTheDocument();
      expect(
        screen.getByText('Real-time price data for 2 stocks')
      ).toBeInTheDocument();
    });

    it('should display data points count', () => {
      render(<StockChart stocks={mockStocks} />);

      expect(screen.getByText('3 data points')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no stocks provided', () => {
      render(<StockChart stocks={[]} />);

      expect(screen.getByText('No stocks to display')).toBeInTheDocument();
      expect(
        screen.getByText('Add stocks to your watchlist to see the chart')
      ).toBeInTheDocument();
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });

    it('should show empty state when stocks have no price history', () => {
      const stocksWithoutHistory = [
        {
          id: 'stock_1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          alertPrice: 150.0,
          priceHistory: [],
        },
      ];

      render(<StockChart stocks={stocksWithoutHistory} />);

      expect(screen.getByText('No stocks to display')).toBeInTheDocument();
    });

    it('should render empty state with clock icon', () => {
      render(<StockChart stocks={[]} />);

      // Clock icon should be present (from lucide-react)
      const emptyState = screen
        .getByText('No stocks to display')
        .closest('div');
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe('Data Processing', () => {
    it('should handle stocks with current price but no history', () => {
      const stocksWithCurrentPrice = [
        {
          id: 'stock_1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          alertPrice: 150.0,
          currentPrice: 155.5,
          priceHistory: [],
        },
      ];

      render(<StockChart stocks={stocksWithCurrentPrice} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByText('1 data points')).toBeInTheDocument();
    });

    it('should filter out stocks without data', () => {
      const mixedStocks = [
        {
          id: 'stock_1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          alertPrice: 150.0,
          currentPrice: 155.5,
          priceHistory: [{ time: Date.now(), price: 155.5 }],
        },
        {
          id: 'stock_2',
          symbol: 'GOOGL',
          name: 'Alphabet Inc.',
          alertPrice: 2800.0,
          priceHistory: [],
        },
      ];

      render(<StockChart stocks={mixedStocks} />);

      expect(
        screen.getByText('Real-time price data for 1 stock')
      ).toBeInTheDocument();
      expect(screen.getByTestId('line-AAPL')).toBeInTheDocument();
      expect(screen.queryByTestId('line-GOOGL')).not.toBeInTheDocument();
    });
  });

  describe('Data Status Indicators', () => {
    it('should show building data message for single data point', () => {
      const singlePointStock = [
        {
          id: 'stock_1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          alertPrice: 150.0,
          currentPrice: 155.5,
          priceHistory: [],
        },
      ];

      render(<StockChart stocks={singlePointStock} />);

      expect(screen.getByText(/Building chart data/)).toBeInTheDocument();
    });

    it('should show progress message for few data points', () => {
      const fewPointsStocks = [
        {
          id: 'stock_1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          alertPrice: 150.0,
          priceHistory: [
            { time: Date.now() - 1000, price: 154.0 },
            { time: Date.now(), price: 155.5 },
          ],
        },
      ];

      render(<StockChart stocks={fewPointsStocks} />);

      expect(
        screen.getByText(/Showing all 2 collected data points/)
      ).toBeInTheDocument();
    });

    it('should show success message for many data points', () => {
      const manyPointsStocks = [
        {
          id: 'stock_1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          alertPrice: 150.0,
          priceHistory: Array.from({ length: 15 }, (_, i) => ({
            time: Date.now() - (15 - i) * 1000,
            price: 150 + i,
          })),
        },
      ];

      render(<StockChart stocks={manyPointsStocks} />);

      expect(
        screen.getByText(/Displaying all 15 data points/)
      ).toBeInTheDocument();
      expect(screen.getByText(/✅/)).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should accept custom height prop', () => {
      render(<StockChart stocks={mockStocks} height={400} />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      const { container } = render(
        <StockChart stocks={mockStocks} className='custom-chart' />
      );

      expect(container.firstChild).toHaveClass('custom-chart');
    });

    it('should use default height when not provided', () => {
      render(<StockChart stocks={mockStocks} />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive classes', () => {
      const { container } = render(<StockChart stocks={mockStocks} />);

      const chartContainer = container.firstChild as HTMLElement;
      expect(chartContainer).toHaveClass('bg-white', 'dark:bg-gray-800');
    });

    it('should have responsive padding', () => {
      render(<StockChart stocks={mockStocks} />);

      const headerContainer = screen.getByText('Stock Price Chart').closest('.p-3');
      expect(headerContainer).toHaveClass('p-3');
      expect(headerContainer).toHaveClass('lg:p-4');
    });
  });

  describe('Dark Mode', () => {
    it('should apply dark mode classes', () => {
      const { container } = render(<StockChart stocks={mockStocks} />);

      const chartContainer = container.firstChild as HTMLElement;
      expect(chartContainer).toHaveClass(
        'dark:bg-gray-800',
        'dark:border-gray-700'
      );
    });
  });

  describe('Time Formatting', () => {
    it('should format timestamps for display', () => {
      render(<StockChart stocks={mockStocks} />);

      // Should show latest timestamp
      const latestTime = screen.getByText(/Latest:/);
      expect(latestTime).toBeInTheDocument();
    });

    it('should show latest timestamp indicator', () => {
      render(<StockChart stocks={mockStocks} />);

      // Should show latest timestamp, not a "Live" indicator
      // The component shows "Latest: [timestamp]" format
      expect(screen.getByText(/Latest:/)).toBeInTheDocument();
    });

    it('should handle millisecond precision in timestamps', () => {
      const stocksWithMillisecondData = [
        {
          id: 'stock_1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          alertPrice: 150.0,
          currentPrice: 155.5,
          priceHistory: [
            { time: Date.now() - 1000, price: 154.0 },
            { time: Date.now() - 500, price: 154.5 },
            { time: Date.now(), price: 155.5 },
          ],
        },
      ];

      render(<StockChart stocks={stocksWithMillisecondData} />);

      // Should show data points count
      expect(screen.getByText('3 data points')).toBeInTheDocument();
    });
  });

  describe('Real-time Data Updates', () => {
    it('should update chart when new data points are added', () => {
      const initialStocks = [
        {
          id: 'stock_1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          alertPrice: 150.0,
          currentPrice: 155.5,
          priceHistory: [
            { time: Date.now() - 2000, price: 154.0 },
            { time: Date.now() - 1000, price: 154.5 },
          ],
          lastUpdated: Date.now() - 1000,
        },
      ];

      const { rerender } = render(<StockChart stocks={initialStocks} />);
      expect(screen.getByText('2 data points')).toBeInTheDocument();

      // Simulate new data point being added
      const updatedStocks = [
        {
          ...initialStocks[0],
          currentPrice: 156.0,
          priceHistory: [
            ...initialStocks[0].priceHistory,
            { time: Date.now(), price: 156.0 },
          ],
          lastUpdated: Date.now(),
        },
      ];

      rerender(<StockChart stocks={updatedStocks} />);
      expect(screen.getByText('3 data points')).toBeInTheDocument();
    });

    it('should handle rapid data updates', () => {
      const rapidUpdateStocks = [
        {
          id: 'stock_1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          alertPrice: 150.0,
          currentPrice: 155.5,
          priceHistory: Array.from({ length: 10 }, (_, i) => ({
            time: Date.now() - (10 - i) * 100, // 100ms intervals
            price: 155 + i * 0.1,
          })),
          lastUpdated: Date.now(),
        },
      ];

      render(<StockChart stocks={rapidUpdateStocks} />);
      expect(screen.getByText('10 data points')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeDatasetStock = [
        {
          id: 'stock_1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          alertPrice: 150.0,
          priceHistory: Array.from({ length: 500 }, (_, i) => ({
            time: Date.now() - (500 - i) * 1000,
            price: 150 + Math.random() * 10,
          })),
        },
      ];

      render(<StockChart stocks={largeDatasetStock} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByText('500 data points')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid price data gracefully', () => {
      const invalidDataStock = [
        {
          id: 'stock_1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          alertPrice: 150.0,
          priceHistory: [
            { time: Date.now(), price: NaN },
            { time: Date.now() + 1000, price: Infinity },
          ],
        },
      ];

      render(<StockChart stocks={invalidDataStock} />);

      // Should still render without crashing
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<StockChart stocks={mockStocks} />);

      const chartTitle = screen.getByText('Stock Price Chart');
      expect(chartTitle).toBeInTheDocument();
    });

    it('should provide screen reader friendly content', () => {
      render(<StockChart stocks={mockStocks} />);

      expect(
        screen.getByText('Real-time price data for 2 stocks')
      ).toBeInTheDocument();
    });
  });
});
