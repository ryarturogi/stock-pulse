/**
 * Unit Tests for Push Subscription API Route
 * ==========================================
 * 
 * Tests for the push subscription endpoint (no VAPID required)
 */

import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock subscription data
const mockSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
  keys: {
    p256dh: 'test-p256dh-key',
    auth: 'test-auth-key'
  }
};

describe('/api/push/subscribe', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment
    process.env = {
      ...originalEnv,
      // No VAPID configuration needed
    };

    // Clear in-memory subscriptions
    const route = require('./route');
    route.subscriptions?.clear?.();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('POST /api/push/subscribe', () => {
    it('should successfully store a push subscription', async () => {
      const requestBody = {
        subscription: mockSubscription,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        deviceType: 'desktop',
        browserType: 'desktop-chrome',
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'Subscription stored successfully',
      });
    });

    it('should handle mobile device subscriptions', async () => {
      const requestBody = {
        subscription: mockSubscription,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X)',
        deviceType: 'mobile',
        browserType: 'ios-safari',
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle Android device subscriptions', async () => {
      const requestBody = {
        subscription: mockSubscription,
        userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36',
        deviceType: 'mobile',
        browserType: 'android-chrome',
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 for invalid subscription data', async () => {
      const requestBody = {
        subscription: null,
        userAgent: 'Chrome/100.0',
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        code: 'INVALID_SUBSCRIPTION',
        message: 'Invalid subscription data',
        details: { timestamp: expect.any(String) },
      });
    });

    it('should return 400 for missing subscription endpoint', async () => {
      const requestBody = {
        subscription: {
          keys: {
            p256dh: 'test-p256dh-key',
            auth: 'test-auth-key'
          }
        },
        userAgent: 'Chrome/100.0',
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_SUBSCRIPTION');
    });

    it('should handle missing device information gracefully', async () => {
      const requestBody = {
        subscription: mockSubscription,
        userAgent: 'Chrome/100.0',
        timestamp: Date.now(),
        // Missing deviceType and browserType
      };

      const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('SUBSCRIPTION_ERROR');
    });

    it('should handle missing request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('SUBSCRIPTION_ERROR');
    });

    it('should store subscription with device metadata', async () => {
      const requestBody = {
        subscription: mockSubscription,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        deviceType: 'desktop',
        browserType: 'desktop-chrome',
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify subscription was stored with device info
      const route = require('./route');
      const storedSubscriptions = Array.from(route.subscriptions.values());
      expect(storedSubscriptions).toHaveLength(1);
      
      const storedSubscription = storedSubscriptions[0];
      expect(storedSubscription.deviceType).toBe('desktop');
      expect(storedSubscription.browserType).toBe('desktop-chrome');
      expect(storedSubscription.userAgent).toBe(requestBody.userAgent);
    });

    it('should handle multiple subscriptions', async () => {
      const subscription1 = {
        ...mockSubscription,
        endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint1'
      };
      
      const subscription2 = {
        ...mockSubscription,
        endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint2'
      };

      // First subscription
      const request1 = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          subscription: subscription1,
          userAgent: 'Chrome/100.0',
          deviceType: 'desktop',
          browserType: 'desktop-chrome',
          timestamp: Date.now(),
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response1 = await POST(request1);
      expect(response1.status).toBe(200);

      // Second subscription
      const request2 = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          subscription: subscription2,
          userAgent: 'Safari/100.0',
          deviceType: 'mobile',
          browserType: 'ios-safari',
          timestamp: Date.now(),
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response2 = await POST(request2);
      expect(response2.status).toBe(200);

      // Verify both subscriptions were stored
      const route = require('./route');
      expect(route.subscriptions.size).toBe(2);
    });
  });
});