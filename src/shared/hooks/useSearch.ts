/**
 * useSearch Hook
 * ==============
 *
 * Custom hook for managing search state and filtering.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';

export interface SearchState<T> {
  query: string;
  setQuery: (_query: string) => void;
  clearQuery: () => void;
  filteredItems: T[];
  isSearching: boolean;
}

/**
 * useSearch Hook
 *
 * Provides search functionality with:
 * - Search query state
 * - Filtered results
 * - Search status
 * - Custom filter function support
 *
 * @param items - Array of items to search through
 * @param filterFn - Function to filter items based on query
 * @param initialQuery - Initial search query (default: '')
 * @returns SearchState object with search state and actions
 */
export const useSearch = <T>(
  items: T[],
  filterFn: (_item: T, _query: string) => boolean,
  initialQuery: string = ''
): SearchState<T> => {
  const [query, setQuery] = useState(initialQuery);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!items || !Array.isArray(items)) return [];
    if (!query.trim()) return items;
    try {
      return items.filter(item => filterFn(item, query.toLowerCase()));
    } catch (error) {
      console.error('Error filtering items:', error);
      return [];
    }
  }, [items, query, filterFn]);

  // Clear search query
  const clearQuery = useCallback(() => {
    setQuery('');
  }, []);

  // Check if currently searching
  const isSearching = query.trim().length > 0;

  return {
    query,
    setQuery,
    clearQuery,
    filteredItems,
    isSearching,
  };
};

export default useSearch;
