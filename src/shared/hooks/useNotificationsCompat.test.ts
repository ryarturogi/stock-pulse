/**
 * Backward Compatibility Hook Tests
 * ================================
 * 
 * Tests for the useNotifications compatibility layer.
 */

import { renderHook } from '@testing-library/react';
import { useNotifications } from './useNotificationsCompat';

// Mock the notification store
const mockNotificationStore = {
  permission: 'default',
  isEnabled: true,
  setPermission: jest.fn(),
  setEnabled: jest.fn(),
  toggleNotifications: jest.fn(),
  requestPermission: jest.fn(),
};

jest.mock('@/features/notifications', () => ({
  useNotificationPermission: () => mockNotificationStore,
}));

// Mock console.warn to test deprecation warning
const originalConsoleWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
});

describe('useNotificationsCompat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show deprecation warning', () => {
    renderHook(() => useNotifications());
    
    expect(console.warn).toHaveBeenCalledWith(
      'useNotifications is deprecated. Use useNotificationPermission from @/features/notifications instead.'
    );
  });

  it('should return the same interface as useNotificationPermission', () => {
    const { result } = renderHook(() => useNotifications());
    
    expect(result.current).toEqual(mockNotificationStore);
    expect(result.current.permission).toBe('default');
    expect(result.current.isEnabled).toBe(true);
    expect(typeof result.current.setPermission).toBe('function');
    expect(typeof result.current.setEnabled).toBe('function');
    expect(typeof result.current.toggleNotifications).toBe('function');
    expect(typeof result.current.requestPermission).toBe('function');
  });

  it('should pass through all methods correctly', () => {
    const { result } = renderHook(() => useNotifications());
    
    // Test that methods are callable
    act(() => {
      result.current.setPermission('granted');
      result.current.setEnabled(false);
    });
    
    expect(mockNotificationStore.setPermission).toHaveBeenCalledWith('granted');
    expect(mockNotificationStore.setEnabled).toHaveBeenCalledWith(false);
  });
});
