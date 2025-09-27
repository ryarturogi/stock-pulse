/**
 * Centralized Error Handling Utility
 * ===================================
 *
 * Provides standardized error handling across the application.
 */

import { logger } from './logger';
import type { ApiResponse } from '@/core/types/utils';

export interface AppError extends Error {
  code: string;
  statusCode: number;
  isOperational: boolean;
  context?: Record<string, unknown>;
}

export class ErrorHandler {
  /**
   * Create a standardized application error
   */
  static createError(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ): AppError {
    const error = new Error(message) as AppError;
    error.code = code;
    error.statusCode = statusCode;
    error.isOperational = isOperational;
    if (context) {
      error.context = context;
    }
    return error;
  }

  /**
   * Handle and log errors consistently
   */
  static handleError(error: unknown, context?: string): AppError {
    // If it's already an AppError, return it
    if (this.isAppError(error)) {
      const logData: Record<string, unknown> = {
        code: error.code,
        statusCode: error.statusCode,
      };

      if (error.context) {
        logData.context = error.context;
      }

      logger.error(`[${context || 'Unknown'}] ${error.message}`, logData);
      return error;
    }

    // Convert unknown errors to AppError
    const appError = this.createError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      'UNKNOWN_ERROR',
      500,
      false,
      { originalError: error, context }
    );

    logger.error(`[${context || 'Unknown'}] ${appError.message}`, {
      code: appError.code,
      statusCode: appError.statusCode,
      context: appError.context,
    });

    return appError;
  }

  /**
   * Check if error is an AppError
   */
  static isAppError(error: unknown): error is AppError {
    return (
      error instanceof Error &&
      'code' in error &&
      'statusCode' in error &&
      'isOperational' in error
    );
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: AppError): string {
    const userMessages: Record<string, string> = {
      NETWORK_ERROR:
        'Network connection failed. Please check your internet connection.',
      API_ERROR:
        'External service is temporarily unavailable. Please try again later.',
      VALIDATION_ERROR:
        'Invalid input provided. Please check your data and try again.',
      RATE_LIMIT_ERROR:
        'Too many requests. Please wait a moment before trying again.',
      AUTHENTICATION_ERROR:
        'Authentication failed. Please check your credentials.',
      PERMISSION_ERROR: 'You do not have permission to perform this action.',
      NOT_FOUND_ERROR: 'The requested resource was not found.',
      UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
    };

    return userMessages[error.code] || userMessages['UNKNOWN_ERROR'];
  }

  /**
   * Get error response for API routes
   */
  static getErrorResponse(error: AppError): ApiResponse<never> {
    return {
      success: false,
      error: this.getUserMessage(error),
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
        stack: error.stack,
        context: error.context,
        code: error.code,
      }),
    };
  }
}

// Predefined error types for common scenarios
export const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Helper functions for common error scenarios
export const createNetworkError = (
  message: string,
  context?: Record<string, unknown>
) =>
  ErrorHandler.createError(
    message,
    ErrorTypes.NETWORK_ERROR,
    503,
    true,
    context
  );

export const createApiError = (
  message: string,
  context?: Record<string, unknown>
) =>
  ErrorHandler.createError(message, ErrorTypes.API_ERROR, 502, true, context);

export const createValidationError = (
  message: string,
  context?: Record<string, unknown>
) =>
  ErrorHandler.createError(
    message,
    ErrorTypes.VALIDATION_ERROR,
    400,
    true,
    context
  );

export const createRateLimitError = (
  message: string,
  context?: Record<string, unknown>
) =>
  ErrorHandler.createError(
    message,
    ErrorTypes.RATE_LIMIT_ERROR,
    429,
    true,
    context
  );

export const createNotFoundError = (
  message: string,
  context?: Record<string, unknown>
) =>
  ErrorHandler.createError(
    message,
    ErrorTypes.NOT_FOUND_ERROR,
    404,
    true,
    context
  );
