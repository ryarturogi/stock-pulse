/**
 * Send Push Notification API Route
 * ================================
 * 
 * Sends push notifications to subscribed clients using VAPID.
 */

import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { ApiError, PriceAlertNotification } from '@/core/types';

// In-memory storage for subscriptions (in production, use a database)
const subscriptions: Map<string, any> = new Map();

/**
 * Configure web-push with VAPID keys
 */
function configureWebPush() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@stockpulse.app';

  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error('VAPID keys not configured');
  }

  webpush.setVapidDetails(
    vapidEmail,
    vapidPublicKey,
    vapidPrivateKey
  );
}

/**
 * POST /api/push/send
 * 
 * Send push notification to all subscribed clients
 */
export async function POST(request: NextRequest): Promise<NextResponse<{ 
  success: boolean; 
  sent: number; 
  failed: number; 
  message: string 
} | ApiError>> {
  try {
    const body = await request.json();
    const { notification, targetSubscriptionId } = body;

    // Validate notification data
    if (!notification || !notification.title || !notification.body) {
      return NextResponse.json<ApiError>({
        code: 'INVALID_NOTIFICATION_DATA',
        message: 'Invalid notification data',
        details: { timestamp: new Date().toISOString() },
      }, { status: 400 });
    }

    // Configure web-push
    configureWebPush();

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Prepare notification payload
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icons/icon-192x192.svg',
      badge: notification.badge || '/icons/icon-72x72.svg',
      data: notification.data || {},
      tag: notification.tag || 'stock-alert',
      requireInteraction: notification.requireInteraction || false,
      actions: notification.actions || [
        {
          action: 'view',
          title: 'View Details',
          icon: '/icons/action-view.svg'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icons/action-close.svg'
        }
      ],
    });

    // Send to specific subscription or all subscriptions
    const subscriptionsToNotify = targetSubscriptionId 
      ? [subscriptions.get(targetSubscriptionId)].filter(Boolean)
      : Array.from(subscriptions.values());

    for (const subscriptionData of subscriptionsToNotify) {
      try {
        await webpush.sendNotification(subscriptionData.subscription, payload);
        sent++;
        
        // Update last used timestamp
        subscriptionData.lastUsed = Date.now();
        
        console.log(`✅ Push notification sent to: ${subscriptionData.subscription.endpoint}`);
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(errorMessage);
        
        console.error(`❌ Failed to send push notification:`, error);
        
        // Remove invalid subscriptions
        if (errorMessage.includes('410') || errorMessage.includes('Gone')) {
          const subscriptionId = Array.from(subscriptions.entries())
            .find(([_, data]) => data.subscription.endpoint === subscriptionData.subscription.endpoint)?.[0];
          
          if (subscriptionId) {
            subscriptions.delete(subscriptionId);
            console.log(`🗑️ Removed invalid subscription: ${subscriptionId}`);
          }
        }
      }
    }

    console.log(`📊 Push notification results: ${sent} sent, ${failed} failed`);

    return NextResponse.json({
      success: true,
      sent,
      failed,
      message: `Push notifications sent: ${sent} successful, ${failed} failed`,
      ...(errors.length > 0 && { errors }),
    });

  } catch (error) {
    console.error('Send push notification error:', error);
    
    return NextResponse.json<ApiError>({
      code: 'PUSH_SEND_ERROR',
      message: 'Failed to send push notifications',
      details: { 
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }, { status: 500 });
  }
}

/**
 * GET /api/push/send
 * 
 * Send a test push notification
 */
export async function GET(): Promise<NextResponse<{ 
  success: boolean; 
  sent: number; 
  failed: number; 
  message: string 
} | ApiError>> {
  try {
    const testNotification: PriceAlertNotification = {
      title: 'StockPulse Test',
      body: 'Push notifications are working! 🎉',
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-72x72.svg',
      data: {
        symbol: 'TEST',
        currentPrice: 100.00,
        alertPrice: 95.00,
        type: 'above',
      },
    };

    // Use the POST handler logic
    const request = new NextRequest('http://localhost:3000/api/push/send', {
      method: 'POST',
      body: JSON.stringify({ notification: testNotification }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return POST(request);

  } catch (error) {
    console.error('Test push notification error:', error);
    
    return NextResponse.json<ApiError>({
      code: 'TEST_PUSH_ERROR',
      message: 'Failed to send test push notification',
      details: { 
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }, { status: 500 });
  }
}
