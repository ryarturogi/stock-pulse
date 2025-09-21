/**
 * useSidebar Hook
 * ===============
 *
 * Custom hook for managing sidebar state and interactions.
 */

'use client';

import { useState, useCallback } from 'react';

export interface SidebarState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * useSidebar Hook
 *
 * Provides sidebar state management with:
 * - Open/close state
 * - Toggle functionality
 * - Callback functions for state changes
 *
 * @param initialOpen - Initial open state (default: false)
 * @returns SidebarState object with state and actions
 */
export const useSidebar = (initialOpen: boolean = false): SidebarState => {
  const [isOpen, setIsOpen] = useState(Boolean(initialOpen));

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
};

export default useSidebar;
