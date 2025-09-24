/**
 * Shared API Response Utilities
 * ============================
 * 
 * Standardized response formatting and error handling for all API routes
 */

import { NextResponse } from 'next/server';

import type { ApiResponse } from '@/core/types/utils';
import { ErrorHandler } from './errorHandler';

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(
  data: T, 
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
  
  if (message) {
    response.message = message;
  }
  
  return NextResponse.json(response, { status });
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  message?: string
): NextResponse<ApiResponse<never>> {
  const response: ApiResponse<never> = {
    success: false,
    error,
    timestamp: new Date().toISOString()
  };
  
  if (message) {
    response.message = message;
  }
  
  return NextResponse.json(response, { status });
}

/**
 * Handle common API errors with standardized messages
 */
export function handleApiError(error: unknown, context?: string): NextResponse<ApiResponse<never>> {
  const appError = ErrorHandler.handleError(error, context);
  
  return NextResponse.json(
    ErrorHandler.getErrorResponse(appError),
    { status: appError.statusCode }
  );
}

/**
 * Validate required environment variables
 */
export function validateApiKey(apiKey: string | undefined, keyName: string): NextResponse<ApiResponse<never>> | null {
  if (!apiKey) {
    return createErrorResponse(
      `${keyName} API key not configured`,
      500,
      'Server configuration error'
    );
  }
  return null;
}

/**
 * Validate request parameters
 */
export function validateRequiredParam(
  value: string | null, 
  paramName: string
): NextResponse<ApiResponse<never>> | null {
  if (!value || value.trim() === '') {
    return createErrorResponse(
      `Missing required parameter: ${paramName}`,
      400,
      'Invalid request parameters'
    );
  }
  return null;
}

/**
 * Create a paginated response with metadata
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  },
  message?: string
): NextResponse<ApiResponse<{
  items: T[];
  pagination: typeof pagination;
}>> {
  return createSuccessResponse({
    items: data,
    pagination
  }, message);
}