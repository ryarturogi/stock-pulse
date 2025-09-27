/**
 * Push Subscription API Route
 * ===========================
 *
 * Handles push notification subscriptions (no VAPID required).
 */

import { NextRequest, NextResponse } from 'next/server';

import { ApiError, PushSubscriptionData } from '@/core/types';
import { getSubscriptionStorage } from '@/core/services/subscriptionStorage';

/**
 * POST /api/push/subscribe
 *
 * Subscribe a client to push notifications
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<{ success: boolean; message: string } | ApiError>> {
  try {
    const body = await request.json();
    const { subscription, userAgent, deviceType, browserType, timestamp } =
      body;

    // Validate required fields
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json<ApiError>(
        {
          code: 'INVALID_SUBSCRIPTION',
          message: 'Invalid subscription data',
          details: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    // No VAPID validation required - simplified implementation

    // Create subscription ID (use endpoint as unique identifier)
    const subscriptionId = subscription.endpoint;

    // Get storage service and store subscription
    const storage = getSubscriptionStorage();
    await storage.initialize();

    const subscriptionData: PushSubscriptionData = {
      subscription,
      userAgent,
      deviceType: deviceType || 'unknown',
      browserType: browserType || 'unknown',
      timestamp,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    };

    await storage.storeSubscription(subscriptionId, subscriptionData);

    const totalCount = await storage.getSubscriptionCount();
    console.log(
      `✅ Push subscription stored: ${subscriptionId} (${deviceType || 'unknown'})`
    );
    console.log(`📊 Total subscriptions: ${totalCount}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription stored successfully',
    });
  } catch (error) {
    console.error('Push subscription error:', error);

    return NextResponse.json<ApiError>(
      {
        code: 'SUBSCRIPTION_ERROR',
        message: 'Failed to process subscription',
        details: {
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/push/subscribe
 *
 * Get subscription statistics (for debugging)
 */
export async function GET(): Promise<
  NextResponse<
    | {
        success: boolean;
        subscriptions: number;
        details: Array<{
          id: string;
          endpoint: string;
          createdAt: number;
          lastUsed: number;
          deviceType: string;
          browserType: string;
        }>;
        stats: {
          total: number;
          byDeviceType: Record<string, number>;
          byBrowserType: Record<string, number>;
          oldestSubscription?: number;
          newestSubscription?: number;
        };
      }
    | ApiError
  >
> {
  try {
    const storage = getSubscriptionStorage();
    await storage.initialize();

    const subscriptions = await storage.getAllSubscriptions();
    const stats = await storage.getSubscriptionStats();

    const subscriptionDetails = Array.from(subscriptions.entries()).map(
      ([id, data]) => ({
        id,
        endpoint: data.subscription.endpoint,
        createdAt: data.createdAt,
        lastUsed: data.lastUsed,
        deviceType: data.deviceType || 'unknown',
        browserType: data.browserType || 'unknown',
      })
    );

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions.size,
      details: subscriptionDetails,
      stats,
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);

    return NextResponse.json<ApiError>(
      {
        code: 'GET_SUBSCRIPTIONS_ERROR',
        message: 'Failed to get subscriptions',
        details: {
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
