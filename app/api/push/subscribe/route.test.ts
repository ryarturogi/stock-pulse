/**
 * Integration Tests for Push Subscribe API Route
 * =============================================
 * 
 * Tests for the push notification subscription endpoint
 */

import { NextRequest } from 'next/server';
import { GET, POST } from './route';

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
});

describe('/api/push/subscribe', () => {
  const originalEnv = process.env;
  const mockSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
    keys: {
      p256dh: 'test-p256dh-key',
      auth: 'test-auth-key',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment
    process.env = {
      ...originalEnv,
      VAPID_PRIVATE_KEY: 'test-vapid-private-key',
    };

    // Clear in-memory subscriptions
    const route = require('./route');
    route.subscriptions?.clear?.();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('POST /api/push/subscribe', () => {
    describe('Successful Subscriptions', () => {
      it('should store valid subscription successfully', async () => {
        const requestBody = {
          subscription: mockSubscription,
          userAgent: 'Mozilla/5.0 (Test Browser)',
          timestamp: Date.now(),
        };

        const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          success: true,
          message: 'Subscription stored successfully',
        });

        expect(console.log).toHaveBeenCalledWith(
          `✅ Push subscription stored: ${mockSubscription.endpoint}`
        );
        expect(console.log).toHaveBeenCalledWith('📊 Total subscriptions: 1');
      });

      it('should handle subscription with minimal required data', async () => {
        const minimalSubscription = {
          endpoint: 'https://push.service.mozilla.org/wpush/test',
        };

        const requestBody = {
          subscription: minimalSubscription,
          userAgent: 'Firefox/100.0',
          timestamp: Date.now(),
        };

        const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should update existing subscription with same endpoint', async () => {
        const requestBody = {
          subscription: mockSubscription,
          userAgent: 'Chrome/100.0',
          timestamp: Date.now(),
        };

        const request1 = new NextRequest('http://localhost:3000/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        });

        const request2 = new NextRequest('http://localhost:3000/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify({
            ...requestBody,
            userAgent: 'Chrome/101.0', // Updated user agent
            timestamp: Date.now() + 1000,
          }),
          headers: { 'Content-Type': 'application/json' },
        });

        await POST(request1);
        const response2 = await POST(request2);
        const data2 = await response2.json();

        expect(response2.status).toBe(200);
        expect(data2.success).toBe(true);
        expect(console.log).toHaveBeenCalledWith('📊 Total subscriptions: 1'); // Still 1 (updated, not added)
      });

      it('should handle multiple different subscriptions', async () => {
        const subscription1 = {
          subscription: mockSubscription,
          userAgent: 'Chrome/100.0',
          timestamp: Date.now(),
        };

        const subscription2 = {
          subscription: {
            endpoint: 'https://android.googleapis.com/gcm/send/different-endpoint',
            keys: {
              p256dh: 'different-p256dh-key',
              auth: 'different-auth-key',
            },
          },
          userAgent: 'Firefox/100.0',
          timestamp: Date.now(),
        };

        const request1 = new NextRequest('http://localhost:3000/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify(subscription1),
          headers: { 'Content-Type': 'application/json' },
        });

        const request2 = new NextRequest('http://localhost:3000/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify(subscription2),
          headers: { 'Content-Type': 'application/json' },
        });

        await POST(request1);
        const response2 = await POST(request2);

        expect(response2.status).toBe(200);
        expect(console.log).toHaveBeenCalledWith('📊 Total subscriptions: 2');
      });
    });

    describe('Request Validation', () => {
      it('should return 400 for missing subscription data', async () => {
        const requestBody = {
          userAgent: 'Chrome/100.0',
          timestamp: Date.now(),
        };

        const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
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

      it('should return 400 for subscription without endpoint', async () => {
        const requestBody = {
          subscription: {
            keys: {
              p256dh: 'test-key',
              auth: 'test-auth',
            },
          },
          userAgent: 'Chrome/100.0',
          timestamp: Date.now(),
        };

        const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('INVALID_SUBSCRIPTION');
        expect(data.message).toBe('Invalid subscription data');
      });

      it('should return 400 for empty subscription object', async () => {
        const requestBody = {
          subscription: {},
          userAgent: 'Chrome/100.0',
          timestamp: Date.now(),
        };

        const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('INVALID_SUBSCRIPTION');
      });

      it('should return 400 for null subscription', async () => {
        const requestBody = {
          subscription: null,
          userAgent: 'Chrome/100.0',
          timestamp: Date.now(),
        };

        const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('INVALID_SUBSCRIPTION');
      });
    });

    describe('Configuration Errors', () => {
      it('should return 500 when VAPID private key is not configured', async () => {
        delete process.env.VAPID_PRIVATE_KEY;

        const requestBody = {
          subscription: mockSubscription,
          userAgent: 'Chrome/100.0',
          timestamp: Date.now(),
        };

        const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
          code: 'VAPID_NOT_CONFIGURED',
          message: 'VAPID private key not configured',
          details: { timestamp: expect.any(String) },
        });
      });

      it('should return 500 when VAPID private key is empty', async () => {
        process.env.VAPID_PRIVATE_KEY = '';

        const requestBody = {
          subscription: mockSubscription,
          userAgent: 'Chrome/100.0',
          timestamp: Date.now(),
        };

        const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.code).toBe('VAPID_NOT_CONFIGURED');
      });
    });

    describe('Error Handling', () => {
      it('should handle malformed JSON in request body', async () => {
        const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
          method: 'POST',
          body: 'invalid json',
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.code).toBe('SUBSCRIPTION_ERROR');
        expect(data.message).toBe('Failed to process subscription');
        expect(data.details.error).toContain('JSON');
      });

      it('should handle empty request body', async () => {
        const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
          method: 'POST',
          body: '',
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.code).toBe('SUBSCRIPTION_ERROR');
      });

      it('should log subscription processing errors', async () => {
        const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
          method: 'POST',
          body: 'invalid json',
          headers: { 'Content-Type': 'application/json' },
        });

        await POST(request);

        expect(console.error).toHaveBeenCalledWith('Push subscription error:', expect.any(Error));
      });
    });

    describe('Data Storage', () => {
      it('should include metadata with stored subscription', async () => {
        const requestBody = {
          subscription: mockSubscription,
          userAgent: 'Chrome/100.0',
          timestamp: 1640995200000,
        };

        const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        });

        const beforeTime = Date.now();
        await POST(request);
        const afterTime = Date.now();

        // Get stored subscription via GET endpoint
        const getResponse = await GET();
        const getData = await getResponse.json();

        expect(getData.subscriptions).toBe(1);
        expect(getData.details[0]).toMatchObject({
          id: mockSubscription.endpoint,
          endpoint: mockSubscription.endpoint,
          createdAt: expect.any(Number),
          lastUsed: expect.any(Number),
        });

        // Verify timestamps are reasonable
        expect(getData.details[0].createdAt).toBeGreaterThanOrEqual(beforeTime);
        expect(getData.details[0].createdAt).toBeLessThanOrEqual(afterTime);
      });

      it('should handle subscriptions with special characters in endpoint', async () => {
        const specialSubscription = {
          endpoint: 'https://push.mozilla.org/wpush/v1/gAAAAABh...special%20chars',
          keys: mockSubscription.keys,
        };

        const requestBody = {
          subscription: specialSubscription,
          userAgent: 'Firefox/100.0',
          timestamp: Date.now(),
        };

        const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });
  });

  describe('GET /api/push/subscribe', () => {
    describe('Successful Responses', () => {
      it('should return empty subscriptions list initially', async () => {
        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          success: true,
          subscriptions: 0,
          details: [],
        });
      });

      it('should return subscription statistics after adding subscriptions', async () => {
        // Add a subscription first
        const requestBody = {
          subscription: mockSubscription,
          userAgent: 'Chrome/100.0',
          timestamp: Date.now(),
        };

        const postRequest = new NextRequest('http://localhost:3000/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        });

        await POST(postRequest);

        // Now get statistics
        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.subscriptions).toBe(1);
        expect(data.details).toHaveLength(1);
        expect(data.details[0]).toMatchObject({
          id: mockSubscription.endpoint,
          endpoint: mockSubscription.endpoint,
          createdAt: expect.any(Number),
          lastUsed: expect.any(Number),
        });
      });

      it('should return multiple subscription details', async () => {
        // Add multiple subscriptions
        const subscriptions = [
          {
            endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint1',
            keys: { p256dh: 'key1', auth: 'auth1' },
          },
          {
            endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint2', 
            keys: { p256dh: 'key2', auth: 'auth2' },
          },
        ];

        for (const subscription of subscriptions) {
          const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
            method: 'POST',
            body: JSON.stringify({
              subscription,
              userAgent: 'Chrome/100.0',
              timestamp: Date.now(),
            }),
            headers: { 'Content-Type': 'application/json' },
          });
          await POST(request);
        }

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.subscriptions).toBe(2);
        expect(data.details).toHaveLength(2);
        expect(data.details.map((d: any) => d.endpoint)).toContain(subscriptions[0].endpoint);
        expect(data.details.map((d: any) => d.endpoint)).toContain(subscriptions[1].endpoint);
      });
    });

    describe('Error Handling', () => {
      it('should handle errors during subscription retrieval', async () => {
        // Mock Array.from to throw an error
        const originalArrayFrom = Array.from;
        Array.from = jest.fn().mockImplementation(() => {
          throw new Error('Array.from error');
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
          code: 'GET_SUBSCRIPTIONS_ERROR',
          message: 'Failed to get subscriptions',
          details: {
            timestamp: expect.any(String),
            error: 'Array.from error',
          },
        });

        expect(console.error).toHaveBeenCalledWith('Get subscriptions error:', expect.any(Error));

        // Restore original function
        Array.from = originalArrayFrom;
      });

      it('should handle non-Error exceptions during GET', async () => {
        // Mock Array.from to throw a non-Error
        const originalArrayFrom = Array.from;
        Array.from = jest.fn().mockImplementation(() => {
          throw 'String error'; // eslint-disable-line no-throw-literal
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.details.error).toBe('Unknown error');

        // Restore original function
        Array.from = originalArrayFrom;
      });
    });

    describe('Response Format', () => {
      it('should have consistent response structure', async () => {
        const response = await GET();
        const data = await response.json();

        expect(data).toHaveProperty('success');
        expect(data).toHaveProperty('subscriptions');
        expect(data).toHaveProperty('details');
        expect(Array.isArray(data.details)).toBe(true);
        expect(typeof data.subscriptions).toBe('number');
      });

      it('should have correct Content-Type header', async () => {
        const response = await GET();

        expect(response.headers.get('Content-Type')).toContain('application/json');
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete subscription lifecycle', async () => {
      // Initial state - no subscriptions
      let response = await GET();
      let data = await response.json();
      expect(data.subscriptions).toBe(0);

      // Add subscription
      const requestBody = {
        subscription: mockSubscription,
        userAgent: 'Chrome/100.0',
        timestamp: Date.now(),
      };

      const postRequest = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const postResponse = await POST(postRequest);
      expect(postResponse.status).toBe(200);

      // Verify subscription was added
      response = await GET();
      data = await response.json();
      expect(data.subscriptions).toBe(1);
      expect(data.details[0].endpoint).toBe(mockSubscription.endpoint);
    });

    it('should handle concurrent subscription requests', async () => {
      const subscriptions = Array.from({ length: 5 }, (_, i) => ({
        endpoint: `https://fcm.googleapis.com/fcm/send/endpoint${i}`,
        keys: { p256dh: `key${i}`, auth: `auth${i}` },
      }));

      const requests = subscriptions.map(subscription => {
        const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify({
            subscription,
            userAgent: 'Chrome/100.0',
            timestamp: Date.now(),
          }),
          headers: { 'Content-Type': 'application/json' },
        });
        return POST(request);
      });

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Verify all subscriptions were stored
      const getResponse = await GET();
      const getData = await getResponse.json();
      expect(getData.subscriptions).toBe(5);
    });

    it('should handle subscription updates correctly', async () => {
      const initialTime = Date.now();
      
      // Initial subscription
      const requestBody = {
        subscription: mockSubscription,
        userAgent: 'Chrome/100.0',
        timestamp: initialTime,
      };

      let request = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(request);

      // Update subscription (same endpoint, different user agent)
      const updatedTime = initialTime + 10000;
      const updatedRequestBody = {
        subscription: mockSubscription,
        userAgent: 'Chrome/101.0', // Updated
        timestamp: updatedTime,
      };

      request = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(updatedRequestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const updateResponse = await POST(request);
      expect(updateResponse.status).toBe(200);

      // Verify still only one subscription
      const getResponse = await GET();
      const getData = await getResponse.json();
      expect(getData.subscriptions).toBe(1);
      
      // Verify lastUsed was updated
      expect(getData.details[0].lastUsed).toBeGreaterThan(getData.details[0].createdAt);
    });
  });
});