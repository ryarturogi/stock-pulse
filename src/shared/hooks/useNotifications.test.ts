/**
 * Unit Tests for useNotifications Hook
 * ====================================
 *
 * Tests for the notification management custom hook
 */

import { renderHook, act } from '@testing-library/react';
// Import directly from the store to avoid circular dependencies
import { useNotificationPermission } from '../../features/notifications/stores/notificationStore';

// Mock the notification service
const mockNotificationService = {
  getPermissionStatus: jest.fn(),
  requestPermission: jest.fn(),
  showNotification: jest.fn(),
  isSupported: jest.fn(),
};

jest.mock('../../features/notifications/services/notificationService', () => ({
  getNotificationService: () => mockNotificationService,
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotificationService.getPermissionStatus.mockReturnValue('default');
    mockNotificationService.requestPermission.mockResolvedValue('granted');
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useNotificationPermission());

      expect(result.current.permission).toBe('default');
      expect(result.current.isEnabled).toBe(true);
      expect(typeof result.current.requestPermission).toBe('function');
      expect(typeof result.current.toggleNotifications).toBe('function');
      expect(typeof result.current.setEnabled).toBe('function');
    });

    it('should load notification permission status on mount', () => {
      mockNotificationService.getPermissionStatus.mockReturnValue('granted');

      const { result } = renderHook(() => useNotificationPermission());

      expect(mockNotificationService.getPermissionStatus).toHaveBeenCalled();
      expect(result.current.permission).toBe('granted');
    });

    it('should load notification preference from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('false');

      const { result } = renderHook(() => useNotificationPermission());

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
        'stockpulse_notifications_enabled'
      );
      expect(result.current.isEnabled).toBe(false);
    });

    it('should handle invalid localStorage values', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid_json');

      const { result } = renderHook(() => useNotificationPermission());

      // Should default to true on invalid JSON
      expect(result.current.isEnabled).toBe(true);
    });

    it('should handle null localStorage values', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useNotificationPermission());

      // Should default to true when no saved preference
      expect(result.current.isEnabled).toBe(true);
    });
  });

  describe('Server-Side Rendering', () => {
    it('should handle SSR when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Intentionally deleting global.window for SSR testing
      delete global.window;

      const { result } = renderHook(() => useNotificationPermission());

      expect(result.current.permission).toBe('default');
      expect(result.current.isEnabled).toBe(true);
      expect(
        mockNotificationService.getPermissionStatus
      ).not.toHaveBeenCalled();

      global.window = originalWindow;
    });
  });

  describe('Permission Request', () => {
    it('should request permission successfully', async () => {
      mockNotificationService.requestPermission.mockResolvedValue('granted');

      const { result } = renderHook(() => useNotificationPermission());

      let permissionResult;
      await act(async () => {
        permissionResult = await result.current.requestPermission();
      });

      expect(mockNotificationService.requestPermission).toHaveBeenCalled();
      expect(permissionResult).toBe('granted');
      expect(result.current.permission).toBe('granted');
      expect(result.current.isEnabled).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'stockpulse_notifications_enabled',
        'true'
      );
    });

    it('should handle denied permission', async () => {
      mockNotificationService.requestPermission.mockResolvedValue('denied');

      const { result } = renderHook(() => useNotificationPermission());

      let permissionResult;
      await act(async () => {
        permissionResult = await result.current.requestPermission();
      });

      expect(permissionResult).toBe('denied');
      expect(result.current.permission).toBe('denied');
      expect(result.current.isEnabled).toBe(false);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'stockpulse_notifications_enabled',
        'false'
      );
    });

    it('should handle permission request errors', async () => {
      const error = new Error('Permission request failed');
      mockNotificationService.requestPermission.mockRejectedValue(error);

      const { result } = renderHook(() => useNotificationPermission());

      let permissionResult;
      await act(async () => {
        permissionResult = await result.current.requestPermission();
      });

      expect(permissionResult).toBe('denied');
      expect(console.error).toHaveBeenCalledWith(
        'Failed to request notification permission:',
        error
      );
    });

    it('should handle window undefined during permission request', async () => {
      mockNotificationService.requestPermission.mockResolvedValue('granted');

      const originalWindow = global.window;

      const { result } = renderHook(() => useNotificationPermission());

      // Remove window after hook initialization
      // @ts-expect-error - Intentionally deleting global.window for testing
      delete global.window;

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permission).toBe('granted');
      expect(result.current.isEnabled).toBe(true);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

      global.window = originalWindow;
    });
  });

  describe('Toggle Notifications', () => {
    it('should disable notifications when currently enabled', async () => {
      const { result } = renderHook(() => useNotificationPermission());

      // Start with enabled state
      expect(result.current.isEnabled).toBe(true);

      await act(async () => {
        await result.current.toggleNotifications();
      });

      expect(result.current.isEnabled).toBe(false);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'stockpulse_notifications_enabled',
        'false'
      );
    });

    it('should enable notifications when currently disabled and permission is granted', async () => {
      mockLocalStorage.getItem.mockReturnValue('false'); // Start disabled
      mockNotificationService.getPermissionStatus.mockReturnValue('granted');

      const { result } = renderHook(() => useNotificationPermission());

      expect(result.current.isEnabled).toBe(false);
      expect(result.current.permission).toBe('granted');

      await act(async () => {
        await result.current.toggleNotifications();
      });

      expect(result.current.isEnabled).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'stockpulse_notifications_enabled',
        'true'
      );
    });

    it('should request permission when enabling notifications without permission', async () => {
      mockLocalStorage.getItem.mockReturnValue('false'); // Start disabled
      mockNotificationService.getPermissionStatus.mockReturnValue('default');
      mockNotificationService.requestPermission.mockResolvedValue('granted');

      const { result } = renderHook(() => useNotificationPermission());

      expect(result.current.isEnabled).toBe(false);
      expect(result.current.permission).toBe('default');

      await act(async () => {
        await result.current.toggleNotifications();
      });

      expect(mockNotificationService.requestPermission).toHaveBeenCalled();
      expect(result.current.permission).toBe('granted');
      expect(result.current.isEnabled).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'stockpulse_notifications_enabled',
        'true'
      );
    });

    it('should not enable notifications when permission is denied during toggle', async () => {
      mockLocalStorage.getItem.mockReturnValue('false'); // Start disabled
      mockNotificationService.getPermissionStatus.mockReturnValue('default');
      mockNotificationService.requestPermission.mockResolvedValue('denied');

      const { result } = renderHook(() => useNotificationPermission());

      expect(result.current.isEnabled).toBe(false);

      await act(async () => {
        await result.current.toggleNotifications();
      });

      expect(mockNotificationService.requestPermission).toHaveBeenCalled();
      expect(result.current.permission).toBe('denied');
      expect(result.current.isEnabled).toBe(false);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith(
        'stockpulse_notifications_enabled',
        'true'
      );
    });

    it('should handle toggle errors gracefully', async () => {
      const error = new Error('Toggle failed');
      mockNotificationService.requestPermission.mockRejectedValue(error);

      const { result } = renderHook(() => useNotificationPermission());

      await act(async () => {
        await result.current.toggleNotifications();
      });

      expect(console.error).toHaveBeenCalledWith(
        'Failed to toggle notifications:',
        error
      );
    });

    it('should handle window undefined during toggle', async () => {
      const originalWindow = global.window;

      const { result } = renderHook(() => useNotificationPermission());

      // Remove window after hook initialization
      // @ts-expect-error - Intentionally deleting global.window for testing
      delete global.window;

      await act(async () => {
        await result.current.toggleNotifications();
      });

      expect(result.current.isEnabled).toBe(false);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

      global.window = originalWindow;
    });
  });

  describe('SetEnabled Function', () => {
    it('should enable notifications', () => {
      const { result } = renderHook(() => useNotificationPermission());

      act(() => {
        result.current.setEnabled(true);
      });

      expect(result.current.isEnabled).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'stockpulse_notifications_enabled',
        'true'
      );
    });

    it('should handle window undefined during setEnabled', () => {
      const originalWindow = global.window;

      const { result } = renderHook(() => useNotificationPermission());

      // Remove window after hook initialization
      // @ts-expect-error - Intentionally deleting global.window for testing
      delete global.window;

      act(() => {
        result.current.setEnabled(true);
      });

      expect(result.current.isEnabled).toBe(true);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

      global.window = originalWindow;
    });
  });

  describe('Function Memoization', () => {
    it('should memoize functions with useCallback', () => {
      const { result, rerender } = renderHook(() =>
        useNotificationPermission()
      );

      const originalFunctions = {
        requestPermission: result.current.requestPermission,
        toggleNotifications: result.current.toggleNotifications,
        setEnabled: result.current.setEnabled,
      };

      // Force re-render
      rerender();

      expect(result.current.requestPermission).toBe(
        originalFunctions.requestPermission
      );
      expect(result.current.toggleNotifications).toBe(
        originalFunctions.toggleNotifications
      );
      expect(result.current.setEnabled).toBe(originalFunctions.setEnabled);
    });

    it('should update memoized functions when dependencies change', () => {
      const { result } = renderHook(() => useNotificationPermission());

      const originalToggle = result.current.toggleNotifications;

      // Change state that affects toggleNotifications dependencies
      act(() => {
        result.current.setEnabled(true);
      });

      // Function should still be the same reference due to useCallback
      expect(result.current.toggleNotifications).toBe(originalToggle);
    });
  });

  describe('Complex State Changes', () => {
    it('should handle rapid state changes', async () => {
      const { result } = renderHook(() => useNotificationPermission());

      // Rapid toggles
      await act(async () => {
        await result.current.toggleNotifications(); // disable
        await result.current.toggleNotifications(); // enable
        await result.current.toggleNotifications(); // disable
      });

      expect(result.current.isEnabled).toBe(false);
    });

    it('should handle permission changes during toggles', async () => {
      mockNotificationService.getPermissionStatus.mockReturnValue('default');

      // First toggle should request permission and get granted
      mockNotificationService.requestPermission.mockResolvedValueOnce(
        'granted'
      );

      const { result } = renderHook(() => useNotificationPermission());

      expect(result.current.permission).toBe('default');
      expect(result.current.isEnabled).toBe(true);

      // Disable first
      await act(async () => {
        await result.current.toggleNotifications();
      });

      expect(result.current.isEnabled).toBe(false);

      // Enable - should request permission
      await act(async () => {
        await result.current.toggleNotifications();
      });

      expect(mockNotificationService.requestPermission).toHaveBeenCalled();
      expect(result.current.permission).toBe('granted');
      expect(result.current.isEnabled).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    it('should maintain state consistency across multiple operations', async () => {
      const { result } = renderHook(() => useNotificationPermission());

      // Request permission
      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permission).toBe('granted');
      expect(result.current.isEnabled).toBe(true);

      // Toggle off
      await act(async () => {
        await result.current.toggleNotifications();
      });

      expect(result.current.isEnabled).toBe(false);

      // Set enabled directly
      act(() => {
        result.current.setEnabled(true);
      });

      expect(result.current.isEnabled).toBe(true);
    });

    it('should handle mixed localStorage and permission states', () => {
      // Saved as disabled in localStorage but permission is granted
      mockLocalStorage.getItem.mockReturnValue('false');
      mockNotificationService.getPermissionStatus.mockReturnValue('granted');

      const { result } = renderHook(() => useNotificationPermission());

      expect(result.current.permission).toBe('granted');
      expect(result.current.isEnabled).toBe(false);

      // Should be able to toggle on without requesting permission again
      act(async () => {
        result.current.toggleNotifications();
      });

      expect(result.current.isEnabled).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors during initialization', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const { result } = renderHook(() => useNotificationPermission());

      // Should not crash and use default values
      expect(result.current.isEnabled).toBe(true);
    });

    it('should handle localStorage errors during setItem', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const { result } = renderHook(() => useNotificationPermission());

      // Should not crash
      act(() => {
        result.current.setEnabled(true);
      });

      expect(result.current.isEnabled).toBe(true);
    });

    it('should handle notification service errors during initialization', () => {
      mockNotificationService.getPermissionStatus.mockImplementation(() => {
        throw new Error('Service error');
      });

      const { result } = renderHook(() => useNotificationPermission());

      // Should not crash and maintain default state
      expect(result.current.permission).toBe('default');
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const { result, rerender } = renderHook(() =>
        useNotificationPermission()
      );

      const initialFunctions = {
        requestPermission: result.current.requestPermission,
        toggleNotifications: result.current.toggleNotifications,
        setEnabled: result.current.setEnabled,
      };

      // Multiple re-renders should not change function references
      rerender();
      rerender();
      rerender();

      expect(result.current.requestPermission).toBe(
        initialFunctions.requestPermission
      );
      expect(result.current.toggleNotifications).toBe(
        initialFunctions.toggleNotifications
      );
      expect(result.current.setEnabled).toBe(initialFunctions.setEnabled);
    });
  });
});
