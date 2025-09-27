/**
 * Unit Tests for useSearch Hook
 * =============================
 *
 * Tests for the search functionality custom hook
 */

import { renderHook, act } from '@testing-library/react';
import { useSearch } from './useSearch';

interface TestItem {
  id: number;
  name: string;
  category: string;
}

describe('useSearch', () => {
  const mockItems: TestItem[] = [
    { id: 1, name: 'Apple iPhone', category: 'Electronics' },
    { id: 2, name: 'Apple MacBook', category: 'Electronics' },
    { id: 3, name: 'Samsung Galaxy', category: 'Electronics' },
    { id: 4, name: 'Nike Shoes', category: 'Clothing' },
    { id: 5, name: 'Adidas Sneakers', category: 'Clothing' },
  ];

  const mockFilterFn = (item: TestItem, query: string) =>
    item.name.toLowerCase().includes(query) ||
    item.category.toLowerCase().includes(query);

  describe('Initial State', () => {
    it('should have correct default initial state', () => {
      const { result } = renderHook(() => useSearch(mockItems, mockFilterFn));

      expect(result.current.query).toBe('');
      expect(result.current.filteredItems).toEqual(mockItems);
      expect(result.current.isSearching).toBe(false);
      expect(typeof result.current.setQuery).toBe('function');
      expect(typeof result.current.clearQuery).toBe('function');
    });

    it('should use provided initial query', () => {
      const { result } = renderHook(() =>
        useSearch(mockItems, mockFilterFn, 'apple')
      );

      expect(result.current.query).toBe('apple');
      expect(result.current.isSearching).toBe(true);
      expect(result.current.filteredItems).toHaveLength(2);
    });

    it('should handle empty items array', () => {
      const { result } = renderHook(() => useSearch([], mockFilterFn));

      expect(result.current.filteredItems).toEqual([]);
      expect(result.current.isSearching).toBe(false);
    });

    it('should handle null/undefined initial query', () => {
      const { result } = renderHook(() =>
        useSearch(mockItems, mockFilterFn, undefined as any)
      );

      expect(result.current.query).toBe('');
      expect(result.current.filteredItems).toEqual(mockItems);
    });
  });

  describe('Query Management', () => {
    it('should update query when setQuery is called', () => {
      const { result } = renderHook(() => useSearch(mockItems, mockFilterFn));

      act(() => {
        result.current.setQuery('apple');
      });

      expect(result.current.query).toBe('apple');
      expect(result.current.isSearching).toBe(true);
    });

    it('should clear query when clearQuery is called', () => {
      const { result } = renderHook(() =>
        useSearch(mockItems, mockFilterFn, 'apple')
      );

      expect(result.current.query).toBe('apple');

      act(() => {
        result.current.clearQuery();
      });

      expect(result.current.query).toBe('');
      expect(result.current.isSearching).toBe(false);
    });

    it('should handle empty string queries', () => {
      const { result } = renderHook(() => useSearch(mockItems, mockFilterFn));

      act(() => {
        result.current.setQuery('');
      });

      expect(result.current.query).toBe('');
      expect(result.current.isSearching).toBe(false);
      expect(result.current.filteredItems).toEqual(mockItems);
    });

    it('should handle whitespace-only queries', () => {
      const { result } = renderHook(() => useSearch(mockItems, mockFilterFn));

      act(() => {
        result.current.setQuery('   ');
      });

      expect(result.current.query).toBe('   ');
      expect(result.current.isSearching).toBe(false);
      expect(result.current.filteredItems).toEqual(mockItems);
    });
  });

  describe('Filtering', () => {
    it('should filter items based on search query', () => {
      const { result } = renderHook(() => useSearch(mockItems, mockFilterFn));

      act(() => {
        result.current.setQuery('apple');
      });

      expect(result.current.filteredItems).toHaveLength(2);
      expect(result.current.filteredItems[0].name).toBe('Apple iPhone');
      expect(result.current.filteredItems[1].name).toBe('Apple MacBook');
    });

    it('should be case insensitive', () => {
      const { result } = renderHook(() => useSearch(mockItems, mockFilterFn));

      act(() => {
        result.current.setQuery('APPLE');
      });

      expect(result.current.filteredItems).toHaveLength(2);
    });

    it('should filter by category', () => {
      const { result } = renderHook(() => useSearch(mockItems, mockFilterFn));

      act(() => {
        result.current.setQuery('clothing');
      });

      expect(result.current.filteredItems).toHaveLength(2);
      expect(result.current.filteredItems[0].category).toBe('Clothing');
      expect(result.current.filteredItems[1].category).toBe('Clothing');
    });

    it('should return empty array when no matches', () => {
      const { result } = renderHook(() => useSearch(mockItems, mockFilterFn));

      act(() => {
        result.current.setQuery('nonexistent');
      });

      expect(result.current.filteredItems).toEqual([]);
    });

    it('should handle partial matches', () => {
      const { result } = renderHook(() => useSearch(mockItems, mockFilterFn));

      act(() => {
        result.current.setQuery('app');
      });

      expect(result.current.filteredItems).toHaveLength(2);
    });

    it('should handle special characters in query', () => {
      const itemsWithSpecialChars = [
        { id: 1, name: 'Item-1', category: 'Test' },
        { id: 2, name: 'Item.2', category: 'Test' },
        { id: 3, name: 'Item@3', category: 'Test' },
      ];

      const { result } = renderHook(() =>
        useSearch(itemsWithSpecialChars, mockFilterFn)
      );

      act(() => {
        result.current.setQuery('-');
      });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].name).toBe('Item-1');
    });
  });

  describe('Custom Filter Function', () => {
    it('should use custom filter function', () => {
      const customFilterFn = (item: TestItem, query: string) =>
        item.id.toString() === query;

      const { result } = renderHook(() => useSearch(mockItems, customFilterFn));

      act(() => {
        result.current.setQuery('1');
      });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].id).toBe(1);
    });

    it('should handle filter function that always returns true', () => {
      const alwaysTrueFilter = () => true;

      const { result } = renderHook(() =>
        useSearch(mockItems, alwaysTrueFilter)
      );

      act(() => {
        result.current.setQuery('anything');
      });

      expect(result.current.filteredItems).toEqual(mockItems);
    });

    it('should handle filter function that always returns false', () => {
      const alwaysFalseFilter = () => false;

      const { result } = renderHook(() =>
        useSearch(mockItems, alwaysFalseFilter)
      );

      act(() => {
        result.current.setQuery('anything');
      });

      expect(result.current.filteredItems).toEqual([]);
    });

    it('should handle complex filter logic', () => {
      const complexFilter = (item: TestItem, query: string) => {
        const words = query.split(' ');
        return words.every(
          word =>
            item.name.toLowerCase().includes(word) ||
            item.category.toLowerCase().includes(word)
        );
      };

      const { result } = renderHook(() => useSearch(mockItems, complexFilter));

      act(() => {
        result.current.setQuery('apple electronics');
      });

      expect(result.current.filteredItems).toHaveLength(2);
    });
  });

  describe('isSearching State', () => {
    it('should return false when query is empty', () => {
      const { result } = renderHook(() => useSearch(mockItems, mockFilterFn));

      expect(result.current.isSearching).toBe(false);
    });

    it('should return true when query has content', () => {
      const { result } = renderHook(() => useSearch(mockItems, mockFilterFn));

      act(() => {
        result.current.setQuery('apple');
      });

      expect(result.current.isSearching).toBe(true);
    });

    it('should return false when query is only whitespace', () => {
      const { result } = renderHook(() => useSearch(mockItems, mockFilterFn));

      act(() => {
        result.current.setQuery('   ');
      });

      expect(result.current.isSearching).toBe(false);
    });

    it('should update correctly when query changes', () => {
      const { result } = renderHook(() => useSearch(mockItems, mockFilterFn));

      // Start not searching
      expect(result.current.isSearching).toBe(false);

      // Set query - should be searching
      act(() => {
        result.current.setQuery('apple');
      });
      expect(result.current.isSearching).toBe(true);

      // Clear query - should not be searching
      act(() => {
        result.current.clearQuery();
      });
      expect(result.current.isSearching).toBe(false);
    });
  });

  describe('Items Array Changes', () => {
    it('should update filtered results when items array changes', () => {
      const { result, rerender } = renderHook(
        ({ items }) => useSearch(items, mockFilterFn, 'apple'),
        { initialProps: { items: mockItems } }
      );

      expect(result.current.filteredItems).toHaveLength(2);

      // Update items array
      const newItems = [
        { id: 6, name: 'Apple Watch', category: 'Electronics' },
        { id: 7, name: 'Google Pixel', category: 'Electronics' },
      ];

      rerender({ items: newItems });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].name).toBe('Apple Watch');
    });

    it('should handle empty items array update', () => {
      const { result, rerender } = renderHook(
        ({ items }) => useSearch(items, mockFilterFn, 'apple'),
        { initialProps: { items: mockItems } }
      );

      expect(result.current.filteredItems).toHaveLength(2);

      rerender({ items: [] });

      expect(result.current.filteredItems).toEqual([]);
    });

    it('should maintain query state when items change', () => {
      const { result, rerender } = renderHook(
        ({ items }) => useSearch(items, mockFilterFn, 'apple'),
        { initialProps: { items: mockItems } }
      );

      expect(result.current.query).toBe('apple');

      rerender({ items: [] });

      expect(result.current.query).toBe('apple');
      expect(result.current.isSearching).toBe(true);
    });
  });

  describe('Filter Function Changes', () => {
    it('should update filtered results when filter function changes', () => {
      const filterFn1 = (item: TestItem, query: string) =>
        item.name.toLowerCase().includes(query);

      const filterFn2 = (item: TestItem, query: string) =>
        item.category.toLowerCase().includes(query);

      const { result, rerender } = renderHook(
        ({ filterFn }) => useSearch(mockItems, filterFn, 'electronics'),
        { initialProps: { filterFn: filterFn1 } }
      );

      // With filterFn1 (name only), should find no matches
      expect(result.current.filteredItems).toEqual([]);

      // With filterFn2 (category only), should find matches
      rerender({ filterFn: filterFn2 });
      expect(result.current.filteredItems).toHaveLength(3);
    });
  });

  describe('Performance and Memoization', () => {
    it('should memoize clearQuery function', () => {
      const { result, rerender } = renderHook(() =>
        useSearch(mockItems, mockFilterFn)
      );

      const originalClearQuery = result.current.clearQuery;

      rerender();

      expect(result.current.clearQuery).toBe(originalClearQuery);
    });

    it('should memoize filtered results', () => {
      const { result, rerender } = renderHook(() =>
        useSearch(mockItems, mockFilterFn, 'apple')
      );

      const originalFilteredItems = result.current.filteredItems;

      // Re-render without changing dependencies
      rerender();

      expect(result.current.filteredItems).toBe(originalFilteredItems);
    });

    it('should recalculate filtered results when dependencies change', () => {
      const { result } = renderHook(() => useSearch(mockItems, mockFilterFn));

      const originalFilteredItems = result.current.filteredItems;

      act(() => {
        result.current.setQuery('apple');
      });

      expect(result.current.filteredItems).not.toBe(originalFilteredItems);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null items', () => {
      const { result } = renderHook(() => useSearch(null as any, mockFilterFn));

      act(() => {
        result.current.setQuery('test');
      });

      // Should not crash
      expect(result.current.filteredItems).toEqual([]);
    });

    it('should handle undefined items', () => {
      const { result } = renderHook(() =>
        useSearch(undefined as any, mockFilterFn)
      );

      act(() => {
        result.current.setQuery('test');
      });

      // Should not crash
      expect(result.current.filteredItems).toEqual([]);
    });

    it('should handle filter function that throws error', () => {
      const errorFilter = () => {
        throw new Error('Filter error');
      };

      const { result } = renderHook(() => useSearch(mockItems, errorFilter));

      // Should handle the error gracefully
      act(() => {
        result.current.setQuery('test');
      });

      // The behavior depends on how React handles the error
      // In most cases, it would throw and be caught by error boundaries
    });

    it('should handle very long queries', () => {
      const longQuery = 'a'.repeat(1000);

      const { result } = renderHook(() => useSearch(mockItems, mockFilterFn));

      act(() => {
        result.current.setQuery(longQuery);
      });

      expect(result.current.query).toBe(longQuery);
      expect(result.current.isSearching).toBe(true);
    });

    it('should handle large items arrays', () => {
      const largeItems = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        category: i % 2 === 0 ? 'Even' : 'Odd',
      }));

      const { result } = renderHook(() => useSearch(largeItems, mockFilterFn));

      act(() => {
        result.current.setQuery('Even');
      });

      expect(result.current.filteredItems.length).toBe(5000);
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with different data types', () => {
      const numberItems = [1, 2, 3, 4, 5];
      const numberFilter = (item: number, query: string) =>
        item.toString().includes(query);

      const { result } = renderHook(() => useSearch(numberItems, numberFilter));

      act(() => {
        result.current.setQuery('1');
      });

      expect(result.current.filteredItems).toEqual([1]);
    });

    it('should work with complex object structures', () => {
      interface ComplexItem {
        id: number;
        data: {
          name: string;
          nested: {
            value: string;
          };
        };
      }

      const complexItems: ComplexItem[] = [
        { id: 1, data: { name: 'Test', nested: { value: 'deep' } } },
        { id: 2, data: { name: 'Another', nested: { value: 'shallow' } } },
      ];

      const complexFilter = (item: ComplexItem, query: string) =>
        item.data.name.toLowerCase().includes(query) ||
        item.data.nested.value.toLowerCase().includes(query);

      const { result } = renderHook(() =>
        useSearch(complexItems, complexFilter)
      );

      act(() => {
        result.current.setQuery('deep');
      });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].id).toBe(1);
    });
  });
});
