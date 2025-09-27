/**
 * API Middleware for Common Functionality
 * ======================================
 *
 * Shared middleware functions for Next.js API routes providing:
 * - Request/response logging
 * - Error handling
 * - CORS configuration
 * - Rate limiting
 * - Request validation
 * - Response formatting
 */

import { NextRequest, NextResponse } from 'next/server';

import { createErrorResponse } from '@/core/utils/apiResponse';
import { validateApiRequest } from '@/core/utils/validation';

export type ApiHandler = (req: NextRequest) => Promise<NextResponse>;

export interface MiddlewareConfig {
  enableLogging?: boolean;
  enableCors?: boolean;
  enableRateLimit?: boolean;
  rateLimitRequests?: number;
  rateLimitWindow?: number; // in milliseconds
  allowedMethods?: string[];
  requiredFields?: string[];
}

const DEFAULT_CONFIG: MiddlewareConfig = {
  enableLogging: true,
  enableCors: true,
  enableRateLimit: false,
  rateLimitRequests: 100,
  rateLimitWindow: 60 * 1000, // 1 minute
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  requiredFields: [],
};

/**
 * Rate limiting store (in-memory, would use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Clean up expired rate limit entries
 */
function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check rate limit for a given identifier
 */
function checkRateLimit(identifier: string, config: MiddlewareConfig): boolean {
  cleanupRateLimit();

  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.rateLimitWindow!,
    });
    return true;
  }

  if (now > entry.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.rateLimitWindow!,
    });
    return true;
  }

  if (entry.count >= config.rateLimitRequests!) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(req: NextRequest): string {
  // In production, you might want to use a more sophisticated approach
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded
    ? forwarded.split(',')[0]
    : req.headers.get('x-real-ip') || 'unknown';
  return ip;
}

/**
 * CORS middleware
 */
function handleCors(
  req: NextRequest,
  config: MiddlewareConfig
): NextResponse | null {
  if (!config.enableCors) return null;

  const origin = req.headers.get('origin');
  const method = req.method;

  // Handle preflight requests
  if (method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': config.allowedMethods!.join(', '),
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  return null;
}

/**
 * Method validation middleware
 */
function validateMethod(
  req: NextRequest,
  config: MiddlewareConfig
): NextResponse | null {
  if (!config.allowedMethods!.includes(req.method)) {
    console.error(`❌ [API] Method ${req.method} not allowed`, {
      method: req.method,
      url: req.url,
      allowed: config.allowedMethods,
    });

    return createErrorResponse('Method not allowed', 405);
  }

  return null;
}

/**
 * Rate limiting middleware
 */
function handleRateLimit(
  req: NextRequest,
  config: MiddlewareConfig
): NextResponse | null {
  if (!config.enableRateLimit) return null;

  const identifier = getClientIdentifier(req);

  if (!checkRateLimit(identifier, config)) {
    console.warn('⚠️ [API] Rate limit exceeded', {
      identifier,
      limit: config.rateLimitRequests,
      window: config.rateLimitWindow,
    });

    const response = createErrorResponse(
      'Rate limit exceeded',
      429,
      'Too many requests'
    );
    response.headers.set(
      'Retry-After',
      Math.ceil(config.rateLimitWindow! / 1000).toString()
    );
    return response;
  }

  return null;
}

/**
 * Request validation middleware
 */
async function validateRequest(
  req: NextRequest,
  config: MiddlewareConfig
): Promise<NextResponse | null> {
  if (!config.requiredFields || config.requiredFields.length === 0) {
    return null;
  }

  if (req.method === 'GET') {
    return null; // Skip validation for GET requests
  }

  try {
    const body = await req.json();
    const validation = validateApiRequest(body, config.requiredFields);

    if (!validation.isValid) {
      console.warn('Request validation failed', {
        error: validation.error,
        requiredFields: config.requiredFields,
        url: req.url,
      });

      return createErrorResponse(validation.error || 'Invalid request', 400);
    }
  } catch (error) {
    console.error('Failed to parse request body', { error, url: req.url });
    return createErrorResponse('Invalid JSON in request body', 400);
  }

  return null;
}

/**
 * Request logging middleware
 */
function logRequest(req: NextRequest, config: MiddlewareConfig): void {
  if (!config.enableLogging) return;

  const startTime = Date.now();
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const referer = req.headers.get('referer');

  console.log(`${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    userAgent,
    referer,
    timestamp: startTime,
  });
}

/**
 * Response logging middleware
 */
function logResponse(
  req: NextRequest,
  response: NextResponse,
  startTime: number,
  config: MiddlewareConfig
): void {
  if (!config.enableLogging) return;

  const duration = Date.now() - startTime;
  const status = response.status;

  const logData = {
    method: req.method,
    url: req.url,
    status,
    duration,
  };

  if (status >= 500) {
    console.error(`${req.method} ${req.url} - ${status}`, logData);
  } else if (status >= 400) {
    console.warn(`${req.method} ${req.url} - ${status}`, logData);
  } else {
    console.log(`${req.method} ${req.url} - ${status}`, logData);
  }

  // Log slow requests
  if (duration > 1000) {
    console.warn(`API request`, duration, 1000, logData);
  }
}

/**
 * Add CORS headers to response
 */
function addCorsHeaders(
  response: NextResponse,
  req: NextRequest,
  config: MiddlewareConfig
): NextResponse {
  if (!config.enableCors) return response;

  const origin = req.headers.get('origin');

  response.headers.set('Access-Control-Allow-Origin', origin || '*');
  response.headers.set(
    'Access-Control-Allow-Methods',
    config.allowedMethods!.join(', ')
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );

  return response;
}

/**
 * Main middleware function that wraps API handlers
 */
export function withApiMiddleware(
  handler: ApiHandler,
  config: Partial<MiddlewareConfig> = {}
): ApiHandler {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();

    try {
      // Log incoming request
      logRequest(req, mergedConfig);

      // Handle CORS preflight
      const corsResponse = handleCors(req, mergedConfig);
      if (corsResponse) {
        logResponse(req, corsResponse, startTime, mergedConfig);
        return corsResponse;
      }

      // Validate HTTP method
      const methodError = validateMethod(req, mergedConfig);
      if (methodError) {
        logResponse(req, methodError, startTime, mergedConfig);
        return addCorsHeaders(methodError, req, mergedConfig);
      }

      // Check rate limit
      const rateLimitError = handleRateLimit(req, mergedConfig);
      if (rateLimitError) {
        logResponse(req, rateLimitError, startTime, mergedConfig);
        return addCorsHeaders(rateLimitError, req, mergedConfig);
      }

      // Validate request
      const validationError = await validateRequest(req, mergedConfig);
      if (validationError) {
        logResponse(req, validationError, startTime, mergedConfig);
        return addCorsHeaders(validationError, req, mergedConfig);
      }

      // Execute the actual handler
      const response = await handler(req);

      // Add CORS headers to response
      const finalResponse = addCorsHeaders(response, req, mergedConfig);

      // Log response
      logResponse(req, finalResponse, startTime, mergedConfig);

      return finalResponse;
    } catch (error) {
      // Handle unexpected errors
      console.error('Unhandled API error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        method: req.method,
        url: req.url,
      });

      const errorResponse = createErrorResponse('Internal server error', 500);
      logResponse(req, errorResponse, startTime, mergedConfig);
      return addCorsHeaders(errorResponse, req, mergedConfig);
    }
  };
}

/**
 * Convenience functions for common middleware configurations
 */

/**
 * Basic middleware with logging and CORS
 */
export function withBasicMiddleware(handler: ApiHandler): ApiHandler {
  return withApiMiddleware(handler, {
    enableLogging: true,
    enableCors: true,
    enableRateLimit: false,
  });
}

/**
 * Middleware with rate limiting (good for public APIs)
 */
export function withRateLimitedMiddleware(
  handler: ApiHandler,
  requests: number = 100,
  windowMs: number = 60000
): ApiHandler {
  return withApiMiddleware(handler, {
    enableLogging: true,
    enableCors: true,
    enableRateLimit: true,
    rateLimitRequests: requests,
    rateLimitWindow: windowMs,
  });
}

/**
 * Middleware for POST/PUT endpoints with validation
 */
export function withValidatedMiddleware(
  handler: ApiHandler,
  requiredFields: string[]
): ApiHandler {
  return withApiMiddleware(handler, {
    enableLogging: true,
    enableCors: true,
    allowedMethods: ['POST', 'PUT', 'OPTIONS'],
    requiredFields,
  });
}

/**
 * Middleware for read-only endpoints (GET only)
 */
export function withReadOnlyMiddleware(handler: ApiHandler): ApiHandler {
  return withApiMiddleware(handler, {
    enableLogging: true,
    enableCors: true,
    allowedMethods: ['GET', 'OPTIONS'],
  });
}

/**
 * Development middleware with relaxed settings
 */
export function withDevMiddleware(handler: ApiHandler): ApiHandler {
  return withApiMiddleware(handler, {
    enableLogging: true,
    enableCors: true,
    enableRateLimit: false,
  });
}

/**
 * Production middleware with all protections
 */
export function withProductionMiddleware(handler: ApiHandler): ApiHandler {
  return withApiMiddleware(handler, {
    enableLogging: true,
    enableCors: true,
    enableRateLimit: true,
    rateLimitRequests: 60, // Conservative for production
    rateLimitWindow: 60000, // 1 minute
  });
}

/**
 * Utility to measure API performance
 */
export function measureApiPerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  return fn().finally(() => {
    const duration = Math.round(performance.now() - start);
    if (duration > 1000) {
      console.warn(`⚡ [Performance] ${operation} was slow: ${duration}ms`);
    }
  });
}
