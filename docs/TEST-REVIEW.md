# StockPulse Testing Guide

This document outlines the comprehensive testing strategy, guidelines, and review process for the
StockPulse application.

## 🎯 Testing Philosophy

Our testing approach is built on these core principles:

1. **User-Centric Testing** - Focus on user behavior and experiences
2. **Confidence Through Coverage** - Comprehensive test coverage for critical paths
3. **Fast Feedback Loops** - Quick test execution for rapid development
4. **Maintainable Tests** - Tests that evolve with the codebase
5. **Accessibility First** - Ensure all features are accessible

## 🏗️ Testing Architecture

### Testing Pyramid

```
    ┌─────────────────┐
    │   E2E Tests     │  ← Few, Slow, High Confidence
    │   (Playwright)  │
    ├─────────────────┤
    │ Integration     │  ← Some, Medium Speed
    │ Tests (Jest)    │
    ├─────────────────┤
    │   Unit Tests    │  ← Many, Fast, Low Level
    │   (Jest + RTL)  │
    └─────────────────┘
```

### Test Types and Tools

| Test Type     | Tool            | Purpose                    | Examples                            |
| ------------- | --------------- | -------------------------- | ----------------------------------- |
| Unit          | Jest + RTL      | Component logic, utilities | Button rendering, utility functions |
| Integration   | Jest + RTL      | Component interactions     | Form submission, API integration    |
| E2E           | Playwright      | User workflows             | Portfolio management, stock search  |
| Visual        | Playwright      | UI consistency             | Component screenshots               |
| Accessibility | Jest + jest-axe | A11y compliance            | Screen reader support               |
| Performance   | Lighthouse CI   | Core Web Vitals            | Page load times, metrics            |

## 🧪 Testing Standards

### Unit Testing Guidelines

#### Component Testing Structure

```typescript
describe('ComponentName', () => {
  // Test setup
  const defaultProps = {
    // Minimal props for rendering
  };

  const renderComponent = (props = {}) => {
    return render(<ComponentName {...defaultProps} {...props} />);
  };

  // Basic rendering tests
  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderComponent();
    });

    it('displays required content', () => {
      renderComponent();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  // Props and state tests
  describe('Props and State', () => {
    it('applies variant styles correctly', () => {
      renderComponent({ variant: 'secondary' });
      expect(screen.getByRole('button')).toHaveClass('bg-gray-600');
    });
  });

  // Interaction tests
  describe('Interactions', () => {
    it('handles click events', async () => {
      const handleClick = jest.fn();
      renderComponent({ onClick: handleClick });

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderComponent();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports keyboard navigation', async () => {
      renderComponent();
      const button = screen.getByRole('button');

      button.focus();
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      // Assert expected behavior
    });
  });

  // Error states
  describe('Error Handling', () => {
    it('displays error state correctly', () => {
      renderComponent({ error: 'Something went wrong' });
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });
});
```

#### Custom Hook Testing

```typescript
describe('useStock', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClient client={queryClient}>
      {children}
    </QueryClient>
  );

  it('fetches stock data successfully', async () => {
    mockApiResponse({ price: 150.50, symbol: 'AAPL' });

    const { result, waitForNextUpdate } = renderHook(
      () => useStock('AAPL'),
      { wrapper }
    );

    await waitForNextUpdate();

    expect(result.current.data).toEqual({
      price: 150.50,
      symbol: 'AAPL'
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('handles API errors gracefully', async () => {
    mockApiError('Network error');

    const { result, waitForNextUpdate } = renderHook(
      () => useStock('INVALID'),
      { wrapper }
    );

    await waitForNextUpdate();

    expect(result.current.error).toBe('Network error');
    expect(result.current.data).toBe(null);
  });
});
```

### Integration Testing

#### API Integration Tests

```typescript
describe('StockService Integration', () => {
  beforeEach(() => {
    // Setup mock server
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('fetches and transforms stock data correctly', async () => {
    // Mock API response
    server.use(
      rest.get('/api/quote/AAPL', (req, res, ctx) => {
        return res(
          ctx.json({
            c: 150.5,
            h: 155.0,
            l: 148.0,
            // ... other fields
          })
        );
      })
    );

    const stockService = StockService.getInstance();
    const quote = await stockService.getQuote('AAPL');

    expect(quote).toEqual({
      symbol: 'AAPL',
      price: 150.5,
      high: 155.0,
      low: 148.0,
      // ... transformed fields
    });
  });
});
```

#### Component Integration Tests

```typescript
describe('PortfolioPage Integration', () => {
  it('displays portfolio data and handles stock addition', async () => {
    // Setup initial portfolio state
    const mockPortfolio = {
      holdings: [
        { symbol: 'AAPL', shares: 10, averageCost: 140 }
      ]
    };

    render(<PortfolioPage />, {
      wrapper: ({ children }) => (
        <PortfolioProvider initialData={mockPortfolio}>
          {children}
        </PortfolioProvider>
      )
    });

    // Verify initial state
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('10 shares')).toBeInTheDocument();

    // Test adding new stock
    await user.click(screen.getByText('Add Stock'));

    const symbolInput = screen.getByLabelText('Stock Symbol');
    await user.type(symbolInput, 'MSFT');

    const sharesInput = screen.getByLabelText('Shares');
    await user.type(sharesInput, '5');

    await user.click(screen.getByText('Add to Portfolio'));

    // Verify new stock is added
    await waitFor(() => {
      expect(screen.getByText('MSFT')).toBeInTheDocument();
      expect(screen.getByText('5 shares')).toBeInTheDocument();
    });
  });
});
```

### End-to-End Testing

#### E2E Test Structure

```typescript
// tests/e2e/portfolio.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Portfolio Management', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test data and navigate to portfolio
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
  });

  test('user can add stock to portfolio', async ({ page }) => {
    // Click add stock button
    await page.click('[data-testid="add-stock-button"]');

    // Fill out the form
    await page.fill('[data-testid="symbol-input"]', 'AAPL');
    await page.fill('[data-testid="shares-input"]', '10');
    await page.fill('[data-testid="price-input"]', '150.00');

    // Submit the form
    await page.click('[data-testid="submit-button"]');

    // Verify the stock appears in portfolio
    await expect(page.locator('[data-testid="portfolio-holding"]')).toContainText('AAPL');
    await expect(page.locator('[data-testid="portfolio-holding"]')).toContainText('10 shares');

    // Verify portfolio value updated
    await expect(page.locator('[data-testid="total-value"]')).toContainText('$1,500.00');
  });

  test('user can remove stock from portfolio', async ({ page }) => {
    // Assuming stock exists, click remove button
    await page.click('[data-testid="remove-stock-AAPL"]');

    // Confirm removal in modal
    await page.click('[data-testid="confirm-remove"]');

    // Verify stock is removed
    await expect(page.locator('[data-testid="portfolio-holding"]')).not.toContainText('AAPL');
  });

  test('portfolio updates in real-time', async ({ page }) => {
    // Mock WebSocket connection for real-time updates
    await page.route('**/ws', route => {
      // Mock WebSocket data
    });

    // Verify price updates
    await expect(page.locator('[data-testid="stock-price-AAPL"]')).toContainText('$150.50');

    // Simulate price change
    // ... mock WebSocket message

    // Verify UI updates
    await expect(page.locator('[data-testid="stock-price-AAPL"]')).toContainText('$151.25');
  });
});
```

#### Visual Testing

```typescript
// Visual regression tests
test('portfolio page visual consistency', async ({ page }) => {
  await page.goto('/portfolio');
  await page.waitForLoadState('networkidle');

  // Take full page screenshot
  await expect(page).toHaveScreenshot('portfolio-page.png');

  // Test responsive design
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page).toHaveScreenshot('portfolio-page-tablet.png');

  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page).toHaveScreenshot('portfolio-page-mobile.png');
});
```

## 🔧 Testing Setup and Configuration

### Jest Configuration

```typescript
// jest.config.ts
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Module name mapping for path aliases
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Test match patterns
  testMatch: ['**/__tests__/**/*.(ts|tsx)', '**/*.(test|spec).(ts|tsx)'],
};
```

### Test Setup File

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';
import 'jest-axe/extend-expect';

// Mock APIs
beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});

afterAll(() => {
  server.close();
});

// Mock browser APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
```

### Mock Data and Services

```typescript
// tests/mocks/data.ts
export const mockStockQuote = {
  symbol: 'AAPL',
  name: 'Apple Inc.',
  price: 150.5,
  change: 2.25,
  changePercent: 1.52,
  volume: 50000000,
  timestamp: '2024-01-15T16:00:00Z',
};

export const mockPortfolio = {
  id: '1',
  name: 'My Portfolio',
  totalValue: 15050.0,
  totalGainLoss: 550.0,
  totalGainLossPercent: 3.79,
  holdings: [
    {
      id: '1',
      symbol: 'AAPL',
      shares: 100,
      averageCost: 145.0,
      currentPrice: 150.5,
      totalValue: 15050.0,
      totalGainLoss: 550.0,
      totalGainLossPercent: 3.79,
    },
  ],
};

// tests/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/quote/:symbol', (req, res, ctx) => {
    const { symbol } = req.params;
    return res(
      ctx.json({
        ...mockStockQuote,
        symbol: symbol.toString().toUpperCase(),
      })
    );
  }),

  rest.get('/api/portfolio', (req, res, ctx) => {
    return res(ctx.json(mockPortfolio));
  }),

  rest.post('/api/portfolio/holdings', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ success: true }));
  }),
];
```

## 📊 Testing Metrics and Coverage

### Coverage Requirements

| Component Type | Line Coverage | Branch Coverage | Function Coverage |
| -------------- | ------------- | --------------- | ----------------- |
| UI Components  | 90%+          | 85%+            | 95%+              |
| Hooks          | 95%+          | 90%+            | 100%              |
| Services       | 90%+          | 85%+            | 95%+              |
| Utilities      | 95%+          | 90%+ 100%       |

### Quality Gates

Before code can be merged, it must pass:

1. **All Tests Pass** - Unit, integration, and E2E tests
2. **Coverage Thresholds** - Meet minimum coverage requirements
3. **No Accessibility Violations** - All components pass a11y tests
4. **Performance Budgets** - Meet Core Web Vitals thresholds
5. **Visual Regression** - No unintended UI changes

### Performance Testing

```typescript
// Performance benchmarks
describe('Performance Tests', () => {
  it('renders large portfolio within performance budget', async () => {
    const largePortfolio = generateMockPortfolio(1000); // 1000 holdings

    const startTime = performance.now();
    render(<PortfolioPage portfolio={largePortfolio} />);
    const renderTime = performance.now() - startTime;

    // Should render within 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('handles rapid price updates efficiently', async () => {
    const { rerender } = render(<StockCard {...mockProps} />);

    const updates = Array.from({ length: 100 }, (_, i) => ({
      ...mockProps,
      price: 150 + i * 0.1,
    }));

    const startTime = performance.now();
    updates.forEach(props => rerender(<StockCard {...props} />));
    const updateTime = performance.now() - startTime;

    // Should handle 100 updates within 50ms
    expect(updateTime).toBeLessThan(50);
  });
});
```

## 🚀 CI/CD Testing Pipeline

### GitHub Actions Workflow

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run type checking
        run: pnpm run type-check

      - name: Run linting
        run: pnpm run lint

      - name: Run unit tests
        run: pnpm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

      - name: Build application
        run: pnpm run build

      - name: Run E2E tests
        run: pnpm run test:e2e

      - name: Run accessibility tests
        run: pnpm run test:a11y

      - name: Performance audit
        run: pnpm run lighthouse:ci
```

## 📝 Code Review Testing Checklist

### For Reviewers

When reviewing code changes, ensure:

#### Test Coverage

- [ ] New features have comprehensive test coverage
- [ ] Edge cases and error conditions are tested
- [ ] Tests are readable and maintainable
- [ ] Mock data is realistic and comprehensive

#### Test Quality

- [ ] Tests focus on behavior, not implementation
- [ ] Assertions are specific and meaningful
- [ ] Test names clearly describe what is being tested
- [ ] Tests are isolated and don't depend on external state

#### Accessibility

- [ ] Components are tested with screen readers
- [ ] Keyboard navigation is verified
- [ ] Color contrast and visual indicators are tested
- [ ] ARIA attributes are properly implemented

#### Performance

- [ ] Large datasets are tested
- [ ] Memory leaks are prevented
- [ ] Render performance is verified
- [ ] API call efficiency is tested

#### E2E Coverage

- [ ] Critical user paths are covered
- [ ] Cross-browser compatibility is verified
- [ ] Mobile responsiveness is tested
- [ ] Error scenarios are included

## 🔧 Testing Tools and Utilities

### Custom Testing Utilities

```typescript
// tests/utils/render.tsx
export const renderWithProviders = (
  ui: React.ReactElement,
  options: RenderOptions = {}
) => {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <PortfolioProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </PortfolioProvider>
      </QueryClientProvider>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
};

// tests/utils/user.ts
export const user = userEvent.setup();

// tests/utils/mock-api.ts
export const mockApiSuccess = (data: any) => {
  server.use(
    rest.get('*', (req, res, ctx) => {
      return res(ctx.json(data));
    })
  );
};

export const mockApiError = (message: string, status = 500) => {
  server.use(
    rest.get('*', (req, res, ctx) => {
      return res(ctx.status(status), ctx.json({ error: message }));
    })
  );
};
```

### Test Data Factories

```typescript
// tests/factories/stock.ts
export const createMockStock = (overrides: Partial<StockQuote> = {}): StockQuote => ({
  symbol: 'AAPL',
  name: 'Apple Inc.',
  price: 150.5,
  change: 2.25,
  changePercent: 1.52,
  volume: 50000000,
  timestamp: new Date().toISOString(),
  ...overrides,
});

export const createMockPortfolio = (overrides: Partial<Portfolio> = {}): Portfolio => ({
  id: '1',
  name: 'Test Portfolio',
  totalValue: 15050.0,
  totalGainLoss: 550.0,
  totalGainLossPercent: 3.79,
  holdings: [createMockHolding()],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});
```

## 📈 Continuous Improvement

### Testing Metrics Dashboard

Track and monitor:

- Test execution time trends
- Coverage percentage over time
- Flaky test identification
- E2E test success rates
- Performance regression detection

### Regular Testing Reviews

Monthly reviews should cover:

- Test suite performance optimization
- Coverage gaps identification
- Flaky test investigation
- Tool and framework updates
- Testing strategy refinements

This comprehensive testing strategy ensures high-quality, reliable, and maintainable code while
providing confidence in the application's functionality and user experience.
