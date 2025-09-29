/**
 * Unit Tests for StockForm Component
 * ==================================
 *
 * Tests for the stock selection and alert form component
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StockForm } from './StockForm';
import type { StockOption, WatchedStock } from '@/core/types';

// Mock the useStockForm hook
const mockSetSelectedStock = jest.fn();
const mockSetAlertPrice = jest.fn();
const mockValidateForm = jest.fn();
const mockResetForm = jest.fn();
const mockFetchCurrentPrice = jest.fn();

jest.mock('@/features/stocks/hooks', () => ({
  useStockForm: () => ({
    selectedStock: 'AAPL',
    alertPrice: '150.00',
    currentPrice: 155.5,
    isLoadingPrice: false,
    errors: {},
    setSelectedStock: mockSetSelectedStock,
    setAlertPrice: mockSetAlertPrice,
    validateForm: mockValidateForm,
    resetForm: mockResetForm,
    fetchCurrentPrice: mockFetchCurrentPrice,
  }),
}));

// Mock the Button component
jest.mock('@/shared/components/ui/Button', () => ({
  Button: ({
    children,
    disabled,
    loading,
    onClick,
    type,
    leftIcon,
    className,
  }: any) => (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={className}
      data-testid='submit-button'
      data-loading={loading}
    >
      {leftIcon}
      {loading ? 'Loading...' : children}
    </button>
  ),
}));

// Mock InfiniteStockSelector component
jest.mock('./InfiniteStockSelector', () => ({
  InfiniteStockSelector: ({ onChange, value, watchedStocks = [] }: any) => {
    // Mock stocks that would be available
    const mockStocks = [
      { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', exchange: 'NASDAQ' },
      { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ' },
    ];

    // Filter out watched stocks
    const filteredStocks = mockStocks.filter(
      stock =>
        !watchedStocks?.some((watched: any) => watched.symbol === stock.symbol)
    );

    return (
      <div data-testid='infinite-stock-selector'>
        <label htmlFor='stock-select'>Select Stock</label>
        <select
          id='stock-select'
          value={value || ''}
          onChange={e => onChange && onChange(e.target.value)}
        >
          <option value=''>Select a stock...</option>
          {filteredStocks.map(stock => (
            <option key={stock.symbol} value={stock.symbol}>
              {stock.symbol} - {stock.name}
            </option>
          ))}
        </select>
      </div>
    );
  },
}));

// Mock StockSearch component
jest.mock('./StockSearch', () => ({
  StockSearch: ({ onStockSelect }: any) => (
    <div data-testid='stock-search'>
      <input
        type='text'
        placeholder='Search stocks...'
        onChange={e => {
          if (e.target.value === 'AAPL') {
            onStockSelect &&
              onStockSelect({ symbol: 'AAPL', name: 'Apple Inc.' });
          }
        }}
      />
    </div>
  ),
}));

// Mock the stock service
jest.mock('@/features/stocks/services', () => ({
  stockService: {
    getAvailableStocksLegacy: jest.fn(),
  },
}));

// Get mock reference after mocking
const { stockService } = require('@/features/stocks/services');
const mockGetAvailableStocksLegacy =
  stockService.getAvailableStocksLegacy as jest.Mock;

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock timers disabled to prevent timeout issues in tests
// jest.useFakeTimers();

describe('StockForm', () => {
  const mockAvailableStocks: StockOption[] = [
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', exchange: 'NASDAQ' },
  ];

  const mockWatchedStocks: WatchedStock[] = [
    {
      id: 'stock_1',
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      alertPrice: 800.0,
      currentPrice: 850.0,
      priceHistory: [],
    },
  ];

  const mockOnAddStock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateForm.mockReturnValue(true);

    // Setup default mock for stock service
    mockGetAvailableStocksLegacy.mockResolvedValue(mockAvailableStocks);

    // Mock successful API responses for all possible endpoints
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      // Handle stock symbols API requests
      if (url.includes('/stock-symbols') || url.includes('stock-symbols')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              items: mockAvailableStocks,
              pagination: {
                page: 1,
                limit: mockAvailableStocks.length,
                total: mockAvailableStocks.length,
                totalPages: 1,
                hasMore: false,
              },
            },
          }),
        });
      }

      // Default mock response for any other requests
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: mockAvailableStocks,
        }),
      });
    });
  });

  afterEach(() => {
    // Clear any pending timers (disabled for now)
    // jest.runOnlyPendingTimers();
    // jest.clearAllTimers();
  });

  afterAll(() => {
    // jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render form elements correctly', async () => {
      await act(async () => {
        render(
          <StockForm
            availableStocks={mockAvailableStocks}
            onAddStock={mockOnAddStock}
            watchedStocks={mockWatchedStocks}
          />
        );
      });

      expect(screen.getByText('Add Stock to Watch')).toBeInTheDocument();
      expect(screen.getByLabelText('Select Stock')).toBeInTheDocument();
      expect(screen.getByLabelText('Price Alert ($)')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    it('should show StockPulse header on desktop', async () => {
      await act(async () => {
        render(
          <StockForm
            availableStocks={mockAvailableStocks}
            onAddStock={mockOnAddStock}
          />
        );
      });

      expect(screen.getByText('StockPulse')).toBeInTheDocument();
    });

    it('should show help text on desktop', async () => {
      await act(async () => {
        render(
          <StockForm
            availableStocks={mockAvailableStocks}
            onAddStock={mockOnAddStock}
          />
        );
      });

      expect(screen.getByText('How it works:')).toBeInTheDocument();
      expect(
        screen.getByText(/Select a stock from the dropdown/)
      ).toBeInTheDocument();
    });

    it('should apply custom className', async () => {
      let container: any;
      await act(async () => {
        const result = render(
          <StockForm
            availableStocks={mockAvailableStocks}
            onAddStock={mockOnAddStock}
            className='custom-form'
          />
        );
        container = result.container;
      });

      expect(container.firstChild).toHaveClass('custom-form');
    });
  });

  describe('Stock Selection', () => {
    it('should render available stocks in dropdown', async () => {
      await waitFor(() => {
        render(
          <StockForm
            availableStocks={mockAvailableStocks}
            onAddStock={mockOnAddStock}
            watchedStocks={mockWatchedStocks}
          />
        );
      });

      // Wait for async stock loading to complete
      await waitFor(() => {
        expect(
          screen.getByTestId('infinite-stock-selector')
        ).toBeInTheDocument();
      });

      // TSLA should be filtered out since it's already watched
      expect(screen.getByText('AAPL - Apple Inc.')).toBeInTheDocument();
      expect(screen.getByText('GOOGL - Alphabet Inc.')).toBeInTheDocument();
      expect(screen.getByText('MSFT - Microsoft Corp.')).toBeInTheDocument();
      expect(screen.queryByText('TSLA')).not.toBeInTheDocument();
    });

    it('should show "all stocks watched" message when no stocks available', async () => {
      const allWatchedStocks = mockAvailableStocks.map(stock => ({
        id: `stock_${stock.symbol}`,
        symbol: stock.symbol,
        name: stock.name,
        alertPrice: 100,
        priceHistory: [],
      }));

      await act(async () => {
        render(
          <StockForm
            availableStocks={mockAvailableStocks}
            onAddStock={mockOnAddStock}
            watchedStocks={allWatchedStocks}
          />
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText(/All default stocks are being watched/)
        ).toBeInTheDocument();
      });
    });

    it('should call setSelectedStock when stock is selected', async () => {
      const user = userEvent.setup();
      render(
        <StockForm
          availableStocks={mockAvailableStocks}
          onAddStock={mockOnAddStock}
        />
      );

      await waitFor(() => {
        const select = screen.getByLabelText('Select Stock');
        return user.selectOptions(select, 'GOOGL');
      });

      await waitFor(() => {
        expect(mockSetSelectedStock).toHaveBeenCalledWith('GOOGL');
      });
    });
  });

  describe('Price Alert Input', () => {
    it('should show current price when available', async () => {
      await act(async () => {
        render(
          <StockForm
            availableStocks={mockAvailableStocks}
            onAddStock={mockOnAddStock}
          />
        );
      });

      expect(screen.getByText('💰 Current price: $155.50')).toBeInTheDocument();
    });

    it('should show "Use Current" button when current price exists and no alert price', () => {
      // Re-mock the hook with empty alert price
      const mockHookWithEmptyPrice = {
        selectedStock: 'AAPL',
        alertPrice: '',
        currentPrice: 155.5,
        isLoadingPrice: false,
        errors: {},
        setSelectedStock: mockSetSelectedStock,
        setAlertPrice: mockSetAlertPrice,
        validateForm: mockValidateForm,
        resetForm: mockResetForm,
        fetchCurrentPrice: mockFetchCurrentPrice,
      };

      jest.doMock('@/features/stocks/hooks', () => ({
        useStockForm: () => mockHookWithEmptyPrice,
      }));

      const { StockForm } = require('./StockForm');
      render(
        <StockForm
          availableStocks={mockAvailableStocks}
          onAddStock={mockOnAddStock}
        />
      );

      expect(screen.getByText('Use Current')).toBeInTheDocument();
    });

    it('should call setAlertPrice when Use Current button is clicked', async () => {
      const user = userEvent.setup();

      // Mock hook to return empty alert price
      jest.doMock('@/features/stocks/hooks', () => ({
        useStockForm: () => ({
          selectedStock: 'AAPL',
          alertPrice: '',
          currentPrice: 155.5,
          isLoadingPrice: false,
          errors: {},
          setSelectedStock: mockSetSelectedStock,
          setAlertPrice: mockSetAlertPrice,
          validateForm: mockValidateForm,
          resetForm: mockResetForm,
          fetchCurrentPrice: mockFetchCurrentPrice,
        }),
      }));

      render(
        <StockForm
          availableStocks={mockAvailableStocks}
          onAddStock={mockOnAddStock}
        />
      );

      const useCurrentButton = screen.getByText('Use Current');
      await user.click(useCurrentButton);

      expect(mockSetAlertPrice).toHaveBeenCalledWith('155.50');
    });

    it('should handle price input changes', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <StockForm
          availableStocks={mockAvailableStocks}
          onAddStock={mockOnAddStock}
        />
      );

      const priceInput = screen.getByLabelText('Price Alert ($)');
      await user.clear(priceInput);
      await user.type(priceInput, '160');

      await waitFor(() => {
        expect(mockSetAlertPrice).toHaveBeenCalledWith('160');
      });
    });

    it('should only allow numeric input with decimal', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <StockForm
          availableStocks={mockAvailableStocks}
          onAddStock={mockOnAddStock}
        />
      );

      const priceInput = screen.getByLabelText('Price Alert ($)');

      // Clear any initial value
      await user.clear(priceInput);
      
      // Valid inputs should call setAlertPrice
      await user.type(priceInput, '123.45');
      await waitFor(() => {
        expect(mockSetAlertPrice).toHaveBeenCalledWith('123.45');
      });

      // Test that the input only accepts valid numeric format
      await user.clear(priceInput);
      await user.type(priceInput, 'abc');
      
      // Since the component validates input, invalid chars shouldn't be in the input
      expect(priceInput).toHaveValue('');
    });

    it('should show loading state for price', () => {
      // Mock loading state
      jest.doMock('@/features/stocks/hooks', () => ({
        useStockForm: () => ({
          selectedStock: 'AAPL',
          alertPrice: '150.00',
          currentPrice: 155.5,
          isLoadingPrice: true,
          errors: {},
          setSelectedStock: mockSetSelectedStock,
          setAlertPrice: mockSetAlertPrice,
          validateForm: mockValidateForm,
          resetForm: mockResetForm,
          fetchCurrentPrice: mockFetchCurrentPrice,
        }),
      }));

      render(
        <StockForm
          availableStocks={mockAvailableStocks}
          onAddStock={mockOnAddStock}
        />
      );

      expect(screen.getByText(/\(loading\.\.\.\)/)).toBeInTheDocument();
    });
  });

  describe('Form Validation and Errors', () => {
    it('should display stock selection error', () => {
      // Mock error state
      jest.doMock('@/features/stocks/hooks', () => ({
        useStockForm: () => ({
          selectedStock: '',
          alertPrice: '',
          currentPrice: null,
          isLoadingPrice: false,
          errors: { stock: 'Please select a stock' },
          setSelectedStock: mockSetSelectedStock,
          setAlertPrice: mockSetAlertPrice,
          validateForm: mockValidateForm,
          resetForm: mockResetForm,
          fetchCurrentPrice: mockFetchCurrentPrice,
        }),
      }));

      render(
        <StockForm
          availableStocks={mockAvailableStocks}
          onAddStock={mockOnAddStock}
        />
      );

      expect(screen.getByText('Please select a stock')).toBeInTheDocument();
    });

    it('should display price error', () => {
      // Mock error state
      jest.doMock('@/features/stocks/hooks', () => ({
        useStockForm: () => ({
          selectedStock: 'AAPL',
          alertPrice: '',
          currentPrice: 155.5,
          isLoadingPrice: false,
          errors: { price: 'Price must be greater than 0' },
          setSelectedStock: mockSetSelectedStock,
          setAlertPrice: mockSetAlertPrice,
          validateForm: mockValidateForm,
          resetForm: mockResetForm,
          fetchCurrentPrice: mockFetchCurrentPrice,
        }),
      }));

      render(
        <StockForm
          availableStocks={mockAvailableStocks}
          onAddStock={mockOnAddStock}
        />
      );

      expect(
        screen.getByText('Price must be greater than 0')
      ).toBeInTheDocument();
    });

    it('should apply error styles to inputs', () => {
      // Mock error state
      jest.doMock('@/features/stocks/hooks', () => ({
        useStockForm: () => ({
          selectedStock: '',
          alertPrice: '',
          currentPrice: null,
          isLoadingPrice: false,
          errors: { stock: 'Error', price: 'Error' },
          setSelectedStock: mockSetSelectedStock,
          setAlertPrice: mockSetAlertPrice,
          validateForm: mockValidateForm,
          resetForm: mockResetForm,
          fetchCurrentPrice: mockFetchCurrentPrice,
        }),
      }));

      render(
        <StockForm
          availableStocks={mockAvailableStocks}
          onAddStock={mockOnAddStock}
        />
      );

      const stockSelect = screen.getByLabelText('Select Stock');
      const priceInput = screen.getByLabelText('Price Alert ($)');

      expect(stockSelect).toHaveClass('border-red-300');
      expect(priceInput).toHaveClass('border-red-300');
    });
  });

  describe('Form Submission', () => {
    it('should call onAddStock when form is submitted successfully', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <StockForm
          availableStocks={mockAvailableStocks}
          onAddStock={mockOnAddStock}
        />
      );

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockValidateForm).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(mockOnAddStock).toHaveBeenCalledWith('AAPL', 150.0, undefined);
      });
      await waitFor(() => {
        expect(mockResetForm).toHaveBeenCalled();
      });
    });

    it('should not submit when validation fails', async () => {
      const user = userEvent.setup({ delay: null });
      mockValidateForm.mockReturnValue(false);

      render(
        <StockForm
          availableStocks={mockAvailableStocks}
          onAddStock={mockOnAddStock}
        />
      );

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockValidateForm).toHaveBeenCalled();
      });
      expect(mockOnAddStock).not.toHaveBeenCalled();
      expect(mockResetForm).not.toHaveBeenCalled();
    });

    it('should prevent submission when required fields are empty', () => {
      // Mock empty state
      jest.doMock('@/features/stocks/hooks', () => ({
        useStockForm: () => ({
          selectedStock: '',
          alertPrice: '',
          currentPrice: null,
          isLoadingPrice: false,
          errors: {},
          setSelectedStock: mockSetSelectedStock,
          setAlertPrice: mockSetAlertPrice,
          validateForm: mockValidateForm,
          resetForm: mockResetForm,
          fetchCurrentPrice: mockFetchCurrentPrice,
        }),
      }));

      render(
        <StockForm
          availableStocks={mockAvailableStocks}
          onAddStock={mockOnAddStock}
        />
      );

      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeDisabled();
    });

    it('should show loading state when isLoading is true', () => {
      render(
        <StockForm
          availableStocks={mockAvailableStocks}
          onAddStock={mockOnAddStock}
          isLoading={true}
        />
      );

      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('useEffect Behavior', () => {
    it('should fetch current price when stock is selected', () => {
      render(
        <StockForm
          availableStocks={mockAvailableStocks}
          onAddStock={mockOnAddStock}
        />
      );

      expect(mockFetchCurrentPrice).toHaveBeenCalledWith('AAPL');
    });

    it('should clear alert price when no stock is selected', () => {
      // Mock no selected stock
      jest.doMock('@/features/stocks/hooks', () => ({
        useStockForm: () => ({
          selectedStock: '',
          alertPrice: '150.00',
          currentPrice: null,
          isLoadingPrice: false,
          errors: {},
          setSelectedStock: mockSetSelectedStock,
          setAlertPrice: mockSetAlertPrice,
          validateForm: mockValidateForm,
          resetForm: mockResetForm,
          fetchCurrentPrice: mockFetchCurrentPrice,
        }),
      }));

      render(
        <StockForm
          availableStocks={mockAvailableStocks}
          onAddStock={mockOnAddStock}
        />
      );

      expect(mockSetAlertPrice).toHaveBeenCalledWith('');
    });
  });

  describe('Default Props', () => {
    it('should use default props when not provided', () => {
      render(<StockForm availableStocks={[]} onAddStock={mockOnAddStock} />);

      // Should show the placeholder for stock selection
      expect(screen.getByText('Add Stock to Watch')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(
        <StockForm
          availableStocks={mockAvailableStocks}
          onAddStock={mockOnAddStock}
        />
      );

      expect(screen.getByLabelText('Select Stock')).toBeInTheDocument();
      expect(screen.getByLabelText('Price Alert ($)')).toBeInTheDocument();
    });

    it('should associate errors with form fields', () => {
      // Mock error state
      const mockHookWithError = {
        selectedStock: '',
        alertPrice: '',
        currentPrice: null,
        isLoadingPrice: false,
        errors: { stock: 'Please select a stock' },
        setSelectedStock: mockSetSelectedStock,
        setAlertPrice: mockSetAlertPrice,
        validateForm: mockValidateForm,
        resetForm: mockResetForm,
        fetchCurrentPrice: mockFetchCurrentPrice,
      };

      jest.doMock('@/features/stocks/hooks', () => ({
        useStockForm: () => mockHookWithError,
      }));

      const { StockForm } = require('./StockForm');
      render(
        <StockForm
          availableStocks={mockAvailableStocks}
          onAddStock={mockOnAddStock}
        />
      );

      // Check that error message is displayed
      expect(screen.getByText('Please select a stock')).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('should have dark mode classes', () => {
      const { container } = render(
        <StockForm
          availableStocks={mockAvailableStocks}
          onAddStock={mockOnAddStock}
        />
      );

      const form = container.firstChild as HTMLElement;
      expect(form).toHaveClass('dark:bg-gray-800');
    });
  });
});
