import { NextResponse } from 'next/server';

import { Timestamp } from '@/core/types';

// Define types for health check response
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Timestamp;
  responseTime: string;
  checks?: {
    timestamp: Timestamp;
    uptime: number;
    memory: NodeJS.MemoryUsage;
    environment: string | undefined;
    version: string;
    vercel: {
      env: string | undefined;
      region: string | undefined;
      url: string | undefined;
    };
    externalApis: Record<string, ApiHealthCheck>;
  };
  error?: string;
}

interface ApiHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: string;
}

/**
 * Health check endpoint for monitoring and load balancer
 * 
 * @param request - The incoming request
 * @returns JSON response with health status
 */
export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const startTime = Date.now();
  
  try {
    // Basic health checks
    const checks = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      vercel: {
        env: process.env.VERCEL_ENV,
        region: process.env.VERCEL_REGION,
        url: process.env.VERCEL_URL,
      },
    };

    // Database connectivity check (if applicable)
    // const dbHealth = await checkDatabaseConnection();
    
    // External API health checks
    const externalApis = {
      finnhub: await checkApiHealth('https://finnhub.io/api/v1/'),
    };

    const responseTime = Date.now() - startTime;

    const healthResponse: HealthCheckResponse = {
      status: 'healthy',
      timestamp: checks.timestamp,
      responseTime: `${responseTime}ms`,
      checks: {
        ...checks,
        externalApis,
      },
    };

    return NextResponse.json<HealthCheckResponse>(healthResponse, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    
    return NextResponse.json<HealthCheckResponse>(errorResponse, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}

/**
 * Check external API health
 */
async function checkApiHealth(baseUrl: string): Promise<ApiHealthCheck> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(baseUrl, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    return {
      status: response.ok ? 'healthy' : 'degraded',
      responseTime: `${responseTime}ms`,
    };
  } catch {
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'unhealthy',
      responseTime: `${responseTime}ms`,
    };
  }
}