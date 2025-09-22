/**
 * Shared Pagination Utilities
 * ===========================
 * 
 * Common pagination logic to eliminate duplication across API routes
 */

export interface PaginationOptions {
  page: number;
  limit: number;
  total?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  startIndex: number;
  endIndex: number;
}

/**
 * Calculate pagination metadata and indices
 */
export function calculatePagination(options: PaginationOptions): PaginationResult {
  const { page, limit, total = 0 } = options;
  
  // Ensure valid values
  const normalizedPage = Math.max(1, page);
  const normalizedLimit = Math.max(1, Math.min(limit, 1000)); // Cap at 1000 for safety
  
  const startIndex = (normalizedPage - 1) * normalizedLimit;
  const endIndex = startIndex + normalizedLimit;
  const totalPages = Math.ceil(total / normalizedLimit);
  const hasMore = endIndex < total;
  
  return {
    page: normalizedPage,
    limit: normalizedLimit,
    total,
    totalPages: Math.max(1, totalPages),
    hasMore,
    startIndex,
    endIndex
  };
}

/**
 * Apply pagination to an array of items
 */
export function paginateArray<T>(items: T[], page: number, limit: number): {
  paginatedItems: T[];
  pagination: PaginationResult;
} {
  const pagination = calculatePagination({ page, limit, total: items.length });
  const paginatedItems = items.slice(pagination.startIndex, pagination.endIndex);
  
  return {
    paginatedItems,
    pagination
  };
}

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(
    parseInt(searchParams.get('limit') || '50', 10), 
    1000 // Maximum limit
  ));
  
  return { page, limit };
}

/**
 * Create pagination response metadata
 */
export function createPaginationResponse(
  pagination: PaginationResult,
  search?: string
): {
  pagination: PaginationResult;
  search?: string;
} {
  const response: { pagination: PaginationResult; search?: string } = {
    pagination
  };
  
  if (search && search.trim()) {
    response.search = search.trim();
  }
  
  return response;
}