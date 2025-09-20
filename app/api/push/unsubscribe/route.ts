/**
 * Push Unsubscription API Route
 * =============================
 * 
 * Handles push notification unsubscriptions.
 */

import { NextRequest, NextResponse } from 'next/server';

import { ApiError } from '@/core/types';

// In-memory storage for subscriptions (in production, use a database)
const subscriptions: Map<string, any> = new Map();

/**
 * POST /api/push/unsubscribe
 * 
 * Unsubscribe a client from push notifications
 */
export async function POST(request: NextRequest): Promise<NextResponse<{ success: boolean; message: string } | ApiError>> {
  try {
    const body = await request.json();
    const { subscriptionId } = body;

    // If subscriptionId is provided, remove specific subscription
    if (subscriptionId) {
      const removed = subscriptions.delete(subscriptionId);
      
      if (removed) {
        console.log(`✅ Push subscription removed: ${subscriptionId}`);
        return NextResponse.json({
          success: true,
          message: 'Subscription removed successfully',
        });
      } else {
        return NextResponse.json<ApiError>({
          code: 'SUBSCRIPTION_NOT_FOUND',
          message: 'Subscription not found',
          details: { timestamp: new Date().toISOString() },
        }, { status: 404 });
      }
    }

    // If no specific subscriptionId, remove all subscriptions
    // (This is a simple approach - in production you'd want to identify the specific client)
    const initialCount = subscriptions.size;
    subscriptions.clear();

    console.log(`✅ All push subscriptions removed: ${initialCount} subscriptions cleared`);

    return NextResponse.json({
      success: true,
      message: `${initialCount} subscriptions removed successfully`,
    });

  } catch (error) {
    console.error('Push unsubscription error:', error);
    
    return NextResponse.json<ApiError>({
      code: 'UNSUBSCRIPTION_ERROR',
      message: 'Failed to process unsubscription',
      details: { 
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }, { status: 500 });
  }
}
