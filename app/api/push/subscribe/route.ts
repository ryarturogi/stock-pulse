/**
 * Push Subscription API Route
 * ===========================
 * 
 * Handles push notification subscriptions with VAPID validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '@/core/types';

// In-memory storage for subscriptions (in production, use a database)
const subscriptions: Map<string, any> = new Map();

/**
 * POST /api/push/subscribe
 * 
 * Subscribe a client to push notifications
 */
export async function POST(request: NextRequest): Promise<NextResponse<{ success: boolean; message: string } | ApiError>> {
  try {
    const body = await request.json();
    const { subscription, userAgent, timestamp } = body;

    // Validate required fields
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json<ApiError>({
        code: 'INVALID_SUBSCRIPTION',
        message: 'Invalid subscription data',
        details: { timestamp: new Date().toISOString() },
      }, { status: 400 });
    }

    // Validate VAPID keys are configured
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    if (!vapidPrivateKey) {
      return NextResponse.json<ApiError>({
        code: 'VAPID_NOT_CONFIGURED',
        message: 'VAPID private key not configured',
        details: { timestamp: new Date().toISOString() },
      }, { status: 500 });
    }

    // Create subscription ID (use endpoint as unique identifier)
    const subscriptionId = subscription.endpoint;
    
    // Store subscription
    subscriptions.set(subscriptionId, {
      subscription,
      userAgent,
      timestamp,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    });

    console.log(`✅ Push subscription stored: ${subscriptionId}`);
    console.log(`📊 Total subscriptions: ${subscriptions.size}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription stored successfully',
    });

  } catch (error) {
    console.error('Push subscription error:', error);
    
    return NextResponse.json<ApiError>({
      code: 'SUBSCRIPTION_ERROR',
      message: 'Failed to process subscription',
      details: { 
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }, { status: 500 });
  }
}

/**
 * GET /api/push/subscribe
 * 
 * Get subscription statistics (for debugging)
 */
export async function GET(): Promise<NextResponse<{ 
  success: boolean; 
  subscriptions: number; 
  details: any[] 
} | ApiError>> {
  try {
    const subscriptionDetails = Array.from(subscriptions.entries()).map(([id, data]) => ({
      id,
      endpoint: data.subscription.endpoint,
      createdAt: data.createdAt,
      lastUsed: data.lastUsed,
    }));

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions.size,
      details: subscriptionDetails,
    });

  } catch (error) {
    console.error('Get subscriptions error:', error);
    
    return NextResponse.json<ApiError>({
      code: 'GET_SUBSCRIPTIONS_ERROR',
      message: 'Failed to get subscriptions',
      details: { 
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }, { status: 500 });
  }
}
