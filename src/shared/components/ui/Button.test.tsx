// import React from 'react'; // React 19 with new JSX transform
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Button } from './Button';

describe('Button Component', () => {
  const renderComponent = (props = {}) => {
    const defaultProps = {};
    return render(<Button {...defaultProps} {...props} />);
  };

  // Basic rendering tests
  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderComponent({ children: 'Test Button' });
    });

    it('displays required content', () => {
      renderComponent({ children: 'Click me' });
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });
  });

  // Props and state tests
  describe('Props and State', () => {
    it('applies primary variant by default', () => {
      renderComponent({ children: 'Primary Button' });
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-600');
    });

    it('applies secondary variant when specified', () => {
      renderComponent({ variant: 'secondary', children: 'Secondary Button' });
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-600');
    });

    it('applies medium size by default', () => {
      renderComponent({ children: 'Medium Button' });
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2');
    });

    it('applies large size when specified', () => {
      renderComponent({ size: 'lg', children: 'Large Button' });
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-3');
    });
  });

  // Interaction tests
  describe('Interactions', () => {
    it('handles click events', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      renderComponent({ onClick: handleClick, children: 'Clickable Button' });

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  // Loading state tests
  describe('Loading State', () => {
    it('shows loading spinner when loading prop is true', () => {
      renderComponent({ loading: true, children: 'Loading Button' });
      const spinner = screen.getByRole('button').querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('disables button when loading', () => {
      renderComponent({ loading: true, children: 'Loading Button' });
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('does not render icons when loading', () => {
      const leftIcon = <span data-testid='left-icon'>←</span>;
      const rightIcon = <span data-testid='right-icon'>→</span>;

      renderComponent({
        loading: true,
        leftIcon,
        rightIcon,
        children: 'Loading Button',
      });

      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
    });
  });

  // Disabled state tests
  describe('Disabled State', () => {
    it('disables button when disabled prop is true', () => {
      renderComponent({ disabled: true, children: 'Disabled Button' });
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  // Icon tests
  describe('Icons', () => {
    it('renders left icon when provided', () => {
      const leftIcon = <span data-testid='left-icon'>←</span>;
      renderComponent({ leftIcon, children: 'Button with Left Icon' });

      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders right icon when provided', () => {
      const rightIcon = <span data-testid='right-icon'>→</span>;
      renderComponent({ rightIcon, children: 'Button with Right Icon' });

      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  // Customization tests
  describe('Customization', () => {
    it('applies additional className', () => {
      renderComponent({ className: 'custom-class', children: 'Custom Button' });
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('forwards other props to button element', () => {
      renderComponent({
        'data-testid': 'custom-button',
        type: 'submit',
        children: 'Submit Button',
      });
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });
});
