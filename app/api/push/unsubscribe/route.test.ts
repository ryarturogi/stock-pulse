/**
 * Integration Tests for Push Unsubscribe API Route
 * ================================================
 * 
 * Tests for the push notification unsubscription endpoint
 */

import { NextRequest } from 'next/server';
import { POST } from './route';

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

describe('/api/push/unsubscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Clear in-memory subscriptions and add test data
    const route = require('./route');
    route.subscriptions?.clear?.();
    
    // Add some test subscriptions
    route.subscriptions?.set?.('subscription-1', {
      endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint1',
      keys: { p256dh: 'key1', auth: 'auth1' },
      timestamp: Date.now(),
    });
    
    route.subscriptions?.set?.('subscription-2', {
      endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint2',
      keys: { p256dh: 'key2', auth: 'auth2' },
      timestamp: Date.now(),
    });
  });

  describe('Specific Subscription Removal', () => {
    it('should remove specific subscription successfully', async () => {
      const requestBody = {
        subscriptionId: 'subscription-1',
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'Subscription removed successfully',
      });

      expect(console.log).toHaveBeenCalledWith(
        '✅ Push subscription removed: subscription-1'
      );
    });

    it('should return 404 for non-existent subscription', async () => {
      const requestBody = {
        subscriptionId: 'non-existent-subscription',
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        code: 'SUBSCRIPTION_NOT_FOUND',
        message: 'Subscription not found',
        details: { timestamp: expect.any(String) },
      });
    });

    it('should handle empty subscriptionId', async () => {
      const requestBody = {
        subscriptionId: '',
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      // Empty string is falsy, so it should clear all subscriptions
      expect(response.status).toBe(200);
      expect(data.message).toContain('subscriptions removed successfully');
    });

    it('should handle null subscriptionId', async () => {
      const requestBody = {
        subscriptionId: null,
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      // null is falsy, so it should clear all subscriptions
      expect(response.status).toBe(200);
      expect(data.message).toContain('subscriptions removed successfully');
    });

    it('should handle undefined subscriptionId', async () => {
      const requestBody = {
        timestamp: Date.now(),
        // subscriptionId is undefined
      };

      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      // undefined is falsy, so it should clear all subscriptions
      expect(response.status).toBe(200);
      expect(data.message).toContain('subscriptions removed successfully');
    });
  });

  describe('Bulk Subscription Removal', () => {
    it('should remove all subscriptions when no subscriptionId provided', async () => {
      const requestBody = {
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: '2 subscriptions removed successfully',
      });

      expect(console.log).toHaveBeenCalledWith(
        '✅ All push subscriptions removed: 2 subscriptions cleared'
      );
    });

    it('should handle bulk removal when no subscriptions exist', async () => {
      // Clear all subscriptions first
      const route = require('./route');
      route.subscriptions?.clear?.();

      const requestBody = {
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: '0 subscriptions removed successfully',
      });

      expect(console.log).toHaveBeenCalledWith(
        '✅ All push subscriptions removed: 0 subscriptions cleared'
      );
    });

    it('should remove all subscriptions with explicit empty subscriptionId', async () => {
      const requestBody = {
        subscriptionId: '',
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('2 subscriptions removed successfully');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        code: 'UNSUBSCRIPTION_ERROR',
        message: 'Failed to process unsubscription',
        details: {
          timestamp: expect.any(String),
          error: expect.stringContaining('JSON'),
        },
      });

      expect(console.error).toHaveBeenCalledWith(
        'Push unsubscription error:',
        expect.any(Error)
      );
    });

    it('should handle empty request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: '',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('UNSUBSCRIPTION_ERROR');
      expect(data.message).toBe('Failed to process unsubscription');
    });

    it('should handle request with no Content-Type header', async () => {
      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ subscriptionId: 'test' }),
      });

      const response = await POST(request);

      // Should still work or fail gracefully
      expect([200, 500]).toContain(response.status);
    });

    it('should handle non-Error exceptions', async () => {
      // Mock Map.delete to throw a non-Error
      const route = require('./route');
      const originalDelete = route.subscriptions?.delete;
      if (route.subscriptions) {
        route.subscriptions.delete = jest.fn().mockImplementation(() => {
          throw 'String error'; // eslint-disable-line no-throw-literal
        });
      }

      const requestBody = {
        subscriptionId: 'subscription-1',
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.details.error).toBe('Unknown error');

      // Restore original function
      if (route.subscriptions && originalDelete) {
        route.subscriptions.delete = originalDelete;
      }
    });

    it('should log unsubscription processing errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(request);

      expect(console.error).toHaveBeenCalledWith(
        'Push unsubscription error:',
        expect.any(Error)
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long subscription IDs', async () => {
      const longSubscriptionId = 'a'.repeat(1000);
      
      const requestBody = {
        subscriptionId: longSubscriptionId,
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404); // Not found since it doesn't exist
      expect(data.code).toBe('SUBSCRIPTION_NOT_FOUND');
    });

    it('should handle subscription IDs with special characters', async () => {
      const specialSubscriptionId = 'subscription-with-special-chars-!@#$%^&*()[]{}';
      
      // Add the special subscription first
      const route = require('./route');
      route.subscriptions?.set?.(specialSubscriptionId, {
        endpoint: 'https://example.com/endpoint',
        timestamp: Date.now(),
      });

      const requestBody = {
        subscriptionId: specialSubscriptionId,
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle unicode subscription IDs', async () => {
      const unicodeSubscriptionId = 'subscription-ñáéíóú-🚀-测试';
      
      // Add the unicode subscription first
      const route = require('./route');
      route.subscriptions?.set?.(unicodeSubscriptionId, {
        endpoint: 'https://example.com/endpoint',
        timestamp: Date.now(),
      });

      const requestBody = {
        subscriptionId: unicodeSubscriptionId,
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle numeric subscription IDs', async () => {
      const numericSubscriptionId = 12345;
      
      const requestBody = {
        subscriptionId: numericSubscriptionId,
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404); // Not found since it doesn't exist
      expect(data.code).toBe('SUBSCRIPTION_NOT_FOUND');
    });

    it('should handle boolean subscription IDs', async () => {
      const booleanSubscriptionId = true;
      
      const requestBody = {
        subscriptionId: booleanSubscriptionId,
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404); // Not found since it doesn't exist
      expect(data.code).toBe('SUBSCRIPTION_NOT_FOUND');
    });
  });

  describe('Response Format Consistency', () => {
    it('should have correct Content-Type header for success', async () => {
      const requestBody = {
        subscriptionId: 'subscription-1',
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.headers.get('Content-Type')).toContain('application/json');
    });

    it('should have correct Content-Type header for errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.headers.get('Content-Type')).toContain('application/json');
    });

    it('should have consistent success response structure', async () => {
      const requestBody = {
        subscriptionId: 'subscription-1',
        timestamp: Date.now(),
      };

      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('message');
      expect(typeof data.success).toBe('boolean');
      expect(typeof data.message).toBe('string');
    });

    it('should have consistent error response structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('code');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('details');
      expect(data.details).toHaveProperty('timestamp');
      expect(data.details).toHaveProperty('error');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle multiple unsubscription requests for same subscription', async () => {
      const requestBody = {
        subscriptionId: 'subscription-1',
        timestamp: Date.now(),
      };

      const request1 = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const request2 = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response1 = await POST(request1);
      const response2 = await POST(request2);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(404); // Already removed
    });

    it('should handle mixed unsubscription operations', async () => {
      // Remove specific subscription
      const specificRequest = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ subscriptionId: 'subscription-1' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const specificResponse = await POST(specificRequest);
      expect(specificResponse.status).toBe(200);

      // Clear all remaining subscriptions
      const bulkRequest = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ timestamp: Date.now() }),
        headers: { 'Content-Type': 'application/json' },
      });

      const bulkResponse = await POST(bulkRequest);
      const bulkData = await bulkResponse.json();

      expect(bulkResponse.status).toBe(200);
      expect(bulkData.message).toBe('1 subscriptions removed successfully'); // Only 1 remaining
    });

    it('should handle concurrent unsubscription requests', async () => {
      const requests = ['subscription-1', 'subscription-2'].map(id => {
        return new NextRequest('http://localhost:3000/api/push/unsubscribe', {
          method: 'POST',
          body: JSON.stringify({ subscriptionId: id }),
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const responses = await Promise.all(requests.map(req => POST(req)));

      // Both should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});