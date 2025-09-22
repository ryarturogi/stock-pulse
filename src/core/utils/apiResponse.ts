/**
 * Shared API Response Utilities
 * ============================
 * 
 * Standardized response formatting and error handling for all API routes
 */

import { NextResponse } from 'next/server';

import type { ApiResponse } from '@/core/types/utils';

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
  console.error(`API Error${context ? ` in ${context}` : ''}:`, error);
  
  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return createErrorResponse(
        'Request timeout - please try again',
        408,
        'The request took too long to complete'
      );
    }
    
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return createErrorResponse(
        'Rate limit exceeded - please try again later',
        429,
        'Too many requests'
      );
    }
    
    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return createErrorResponse(
        'Unauthorized access',
        401,
        'Invalid or missing authentication'
      );
    }
    
    if (error.message.includes('not found') || error.message.includes('404')) {
      return createErrorResponse(
        'Resource not found',
        404,
        'The requested resource could not be found'
      );
    }
    
    // Generic error with error message
    return createErrorResponse(
      error.message,
      500,
      'An error occurred while processing your request'
    );
  }
  
  // Unknown error type
  return createErrorResponse(
    'An unexpected error occurred',
    500,
    'Unknown error type'
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