/**
 * Unit Tests for RefreshIntervalSelector Component
 * ================================================
 * 
 * Tests for the refresh interval selection component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RefreshIntervalSelector } from './RefreshIntervalSelector';
import type { RefreshInterval } from '@/core/types';

// Mock console.log to avoid noise in tests
const originalLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalLog;
});

describe('RefreshIntervalSelector', () => {
  const mockOnIntervalChange = jest.fn();

  beforeEach(() => {
    mockOnIntervalChange.mockClear();
  });

  describe('Rendering', () => {
    it('should render with correct elements', () => {
      render(
        <RefreshIntervalSelector
          currentInterval="2m"
          onIntervalChange={mockOnIntervalChange}
        />
      );

      expect(screen.getByLabelText(/Refresh/)).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2 minutes')).toBeInTheDocument();
    });

    it('should show clock icon', () => {
      render(
        <RefreshIntervalSelector
          currentInterval="2m"
          onIntervalChange={mockOnIntervalChange}
        />
      );

      // Clock icon should be present (from lucide-react)
      const clockIcon = document.querySelector('svg');
      expect(clockIcon).toBeInTheDocument();
    });

    it('should show responsive labels', () => {
      render(
        <RefreshIntervalSelector
          currentInterval="2m"
          onIntervalChange={mockOnIntervalChange}
        />
      );

      const label = screen.getByLabelText(/Refresh/);
      expect(label).toBeInTheDocument();
      
      // Check for responsive text classes
      const refreshText = screen.getByText('Refresh:');
      const shortText = screen.getByText('R:');
      
      expect(refreshText).toHaveClass('hidden', 'sm:inline');
      expect(shortText).toHaveClass('sm:hidden');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <RefreshIntervalSelector
          currentInterval="2m"
          onIntervalChange={mockOnIntervalChange}
          className="custom-selector"
        />
      );

      expect(container.firstChild).toHaveClass('custom-selector');
    });
  });

  describe('Interval Options', () => {
    it('should display all available interval options', () => {
      render(
        <RefreshIntervalSelector
          currentInterval="2m"
          onIntervalChange={mockOnIntervalChange}
        />
      );

      // Check that all default intervals are present
      expect(screen.getByText('30 seconds')).toBeInTheDocument();
      expect(screen.getByText('1 minute')).toBeInTheDocument();
      expect(screen.getByText('2 minutes')).toBeInTheDocument();
      expect(screen.getByText('5 minutes')).toBeInTheDocument();
      expect(screen.getByText('10 minutes')).toBeInTheDocument();
    });

    it('should show current interval as selected', () => {
      render(
        <RefreshIntervalSelector
          currentInterval="5m"
          onIntervalChange={mockOnIntervalChange}
        />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('5m');
      expect(screen.getByDisplayValue('5 minutes')).toBeInTheDocument();
    });

    it('should handle different current intervals', () => {
      const intervals: RefreshInterval[] = ['30s', '1m', '2m', '5m', '10m'];
      
      intervals.forEach(interval => {
        const { unmount } = render(
          <RefreshIntervalSelector
            currentInterval={interval}
            onIntervalChange={mockOnIntervalChange}
          />
        );

        const select = screen.getByRole('combobox') as HTMLSelectElement;
        expect(select.value).toBe(interval);

        unmount();
      });
    });
  });

  describe('Interval Selection', () => {
    it('should call onIntervalChange when interval is changed', async () => {
      const user = userEvent.setup();
      render(
        <RefreshIntervalSelector
          currentInterval="2m"
          onIntervalChange={mockOnIntervalChange}
        />
      );

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '5m');

      expect(mockOnIntervalChange).toHaveBeenCalledWith('5m');
    });

    it('should handle multiple interval changes', async () => {
      const user = userEvent.setup();
      render(
        <RefreshIntervalSelector
          currentInterval="2m"
          onIntervalChange={mockOnIntervalChange}
        />
      );

      const select = screen.getByRole('combobox');

      await user.selectOptions(select, '30s');
      expect(mockOnIntervalChange).toHaveBeenCalledWith('30s');

      await user.selectOptions(select, '10m');
      expect(mockOnIntervalChange).toHaveBeenCalledWith('10m');

      expect(mockOnIntervalChange).toHaveBeenCalledTimes(2);
    });

    it('should log interval changes', async () => {
      const user = userEvent.setup();
      render(
        <RefreshIntervalSelector
          currentInterval="2m"
          onIntervalChange={mockOnIntervalChange}
        />
      );

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '5m');

      expect(console.log).toHaveBeenCalledWith(
        '🔄 RefreshIntervalSelector: Changing interval to 5m'
      );
    });
  });

  describe('Styling and Layout', () => {
    it('should have proper responsive classes', () => {
      const { container } = render(
        <RefreshIntervalSelector
          currentInterval="2m"
          onIntervalChange={mockOnIntervalChange}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'items-center', 'space-x-1', 'lg:space-x-2');
    });

    it('should have responsive clock icon sizing', () => {
      render(
        <RefreshIntervalSelector
          currentInterval="2m"
          onIntervalChange={mockOnIntervalChange}
        />
      );

      const clockIcon = document.querySelector('svg');
      expect(clockIcon).toHaveClass('w-3', 'h-3', 'lg:w-4', 'lg:h-4');
    });

    it('should have responsive select styling', () => {
      render(
        <RefreshIntervalSelector
          currentInterval="2m"
          onIntervalChange={mockOnIntervalChange}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveClass(
        'min-w-28', 'lg:min-w-32',
        'pl-1', 'lg:pl-2',
        'pr-6', 'lg:pr-8',
        'text-xs', 'lg:text-sm'
      );
    });

    it('should have dark mode support', () => {
      render(
        <RefreshIntervalSelector
          currentInterval="2m"
          onIntervalChange={mockOnIntervalChange}
        />
      );

      const clockIcon = document.querySelector('svg');
      const label = document.querySelector('label[for="refresh-interval"]');
      const select = screen.getByRole('combobox');

      expect(clockIcon).toHaveClass('dark:text-gray-400');
      expect(label).toHaveClass('dark:text-gray-300');
      expect(select).toHaveClass('dark:bg-gray-700', 'dark:border-gray-600', 'dark:text-white');
    });
  });

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      render(
        <RefreshIntervalSelector
          currentInterval="2m"
          onIntervalChange={mockOnIntervalChange}
        />
      );

      const select = screen.getByRole('combobox');
      const label = document.querySelector('label[for="refresh-interval"]');

      expect(select).toHaveAttribute('id', 'refresh-interval');
      expect(label).toHaveAttribute('for', 'refresh-interval');
    });

    it('should be keyboard navigable', () => {
      render(
        <RefreshIntervalSelector
          currentInterval="2m"
          onIntervalChange={mockOnIntervalChange}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).not.toHaveAttribute('tabindex', '-1');
    });

    it('should have focus styles', () => {
      render(
        <RefreshIntervalSelector
          currentInterval="2m"
          onIntervalChange={mockOnIntervalChange}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty className gracefully', () => {
      const { container } = render(
        <RefreshIntervalSelector
          currentInterval="2m"
          onIntervalChange={mockOnIntervalChange}
          className=""
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle rapid interval changes', async () => {
      const user = userEvent.setup();
      render(
        <RefreshIntervalSelector
          currentInterval="2m"
          onIntervalChange={mockOnIntervalChange}
        />
      );

      const select = screen.getByRole('combobox');

      // Rapidly change intervals
      await user.selectOptions(select, '30s');
      await user.selectOptions(select, '1m');
      await user.selectOptions(select, '5m');
      await user.selectOptions(select, '10m');

      expect(mockOnIntervalChange).toHaveBeenCalledTimes(4);
      expect(mockOnIntervalChange).toHaveBeenLastCalledWith('10m');
    });
  });

  describe('Props Validation', () => {
    it('should work with all valid interval values', () => {
      const validIntervals: RefreshInterval[] = ['30s', '1m', '2m', '5m', '10m'];

      validIntervals.forEach(interval => {
        const { unmount } = render(
          <RefreshIntervalSelector
            currentInterval={interval}
            onIntervalChange={mockOnIntervalChange}
          />
        );

        const select = screen.getByRole('combobox') as HTMLSelectElement;
        expect(select.value).toBe(interval);

        unmount();
      });
    });
  });

  describe('Component Behavior', () => {
    it('should not call onIntervalChange on initial render', () => {
      render(
        <RefreshIntervalSelector
          currentInterval="2m"
          onIntervalChange={mockOnIntervalChange}
        />
      );

      expect(mockOnIntervalChange).not.toHaveBeenCalled();
    });

    it('should update when currentInterval prop changes', () => {
      const { rerender } = render(
        <RefreshIntervalSelector
          currentInterval="2m"
          onIntervalChange={mockOnIntervalChange}
        />
      );

      expect(screen.getByDisplayValue('2 minutes')).toBeInTheDocument();

      rerender(
        <RefreshIntervalSelector
          currentInterval="5m"
          onIntervalChange={mockOnIntervalChange}
        />
      );

      expect(screen.getByDisplayValue('5 minutes')).toBeInTheDocument();
    });
  });
});