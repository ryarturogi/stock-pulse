/**
 * E2E Tests for API Integration
 * =============================
 * 
 * Tests for API endpoints and external service integration
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

test.describe('API Integration Tests', () => {
  let apiContext: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test.describe('Stock Quote API', () => {
    test('should fetch stock quote successfully', async () => {
      const response = await apiContext.get('/api/quote?symbol=AAPL');
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('symbol', 'AAPL');
      expect(data.data).toHaveProperty('current');
      expect(data.data).toHaveProperty('change');
      expect(data.data).toHaveProperty('percentChange');
      expect(data.data).toHaveProperty('high');
      expect(data.data).toHaveProperty('low');
      expect(data.data).toHaveProperty('open');
      expect(data.data).toHaveProperty('previousClose');
      expect(data.data).toHaveProperty('timestamp');
    });

    test('should handle invalid stock symbols', async () => {
      const response = await apiContext.get('/api/quote?symbol=INVALID_SYMBOL');
      
      expect(response.status()).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('code', 'INVALID_SYMBOL');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('details');
    });

    test('should require symbol parameter', async () => {
      const response = await apiContext.get('/api/quote');
      
      expect(response.status()).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('code', 'MISSING_SYMBOL');
      expect(data).toHaveProperty('message');
    });

    test('should handle rate limiting gracefully', async () => {
      // Make multiple rapid requests
      const promises = Array.from({ length: 10 }, () =>
        apiContext.get('/api/quote?symbol=AAPL')
      );
      
      const responses = await Promise.all(promises);
      
      // Most should succeed, some might be rate limited
      const successResponses = responses.filter(r => r.status() === 200);
      const rateLimitedResponses = responses.filter(r => r.status() === 429);
      
      expect(successResponses.length).toBeGreaterThan(0);
      
      // If rate limited, should have proper headers
      if (rateLimitedResponses.length > 0) {
        const rateLimitedResponse = rateLimitedResponses[0];
        const retryAfter = rateLimitedResponse.headers()['retry-after'];
        expect(retryAfter).toBeTruthy();
      }
    });

    test('should return consistent data format', async () => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT'];
      
      for (const symbol of symbols) {
        const response = await apiContext.get(`/api/quote?symbol=${symbol}`);
        
        if (response.status() === 200) {
          const data = await response.json();
          
          // Verify consistent structure
          expect(data.data.symbol).toBe(symbol);
          expect(typeof data.data.current).toBe('number');
          expect(typeof data.data.change).toBe('number');
          expect(typeof data.data.percentChange).toBe('number');
          expect(typeof data.data.timestamp).toBe('number');
        }
      }
    });
  });

  test.describe('Health Check API', () => {
    test('should return healthy status', async () => {
      const response = await apiContext.get('/api/health');
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('memory');
      expect(data).toHaveProperty('environment');
    });

    test('should include system metrics', async () => {
      const response = await apiContext.get('/api/health');
      const data = await response.json();
      
      expect(data.memory).toHaveProperty('used');
      expect(data.memory).toHaveProperty('total');
      expect(data.memory).toHaveProperty('percentage');
      
      expect(typeof data.uptime).toBe('number');
      expect(data.uptime).toBeGreaterThan(0);
    });

    test('should check external API connectivity', async () => {
      const response = await apiContext.get('/api/health');
      const data = await response.json();
      
      expect(data).toHaveProperty('externalApis');
      expect(data.externalApis).toHaveProperty('finnhub');
      
      // Should be either 'connected' or 'error' with details
      const finnhubStatus = data.externalApis.finnhub;
      expect(['connected', 'error']).toContain(finnhubStatus.status);
    });
  });

  test.describe('WebSocket Proxy API', () => {
    test('should establish WebSocket proxy connection', async () => {
      const response = await apiContext.get('/api/websocket-proxy?symbols=AAPL');
      
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toBe('text/event-stream');
      expect(response.headers()['cache-control']).toBe('no-cache');
      expect(response.headers()['connection']).toBe('keep-alive');
    });

    test('should require symbols parameter', async () => {
      const response = await apiContext.get('/api/websocket-proxy');
      
      expect(response.status()).toBe(400);
      
      const text = await response.text();
      expect(text).toContain('Symbols parameter required');
    });

    test('should handle multiple symbols', async () => {
      const response = await apiContext.get('/api/websocket-proxy?symbols=AAPL,GOOGL,MSFT');
      
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toBe('text/event-stream');
    });

    test('should prevent duplicate connections', async () => {
      // Start first connection
      const response1 = await apiContext.get('/api/websocket-proxy?symbols=AAPL');
      expect(response1.status()).toBe(200);
      
      // Attempt second connection with same symbols
      const response2 = await apiContext.get('/api/websocket-proxy?symbols=AAPL');
      expect(response2.status()).toBe(409);
      
      const text = await response2.text();
      expect(text).toContain('Connection already exists');
    });

    test('should handle connection cooldowns', async () => {
      // This test would need to trigger a cooldown scenario
      // which might happen after rate limiting or connection failures
      const response = await apiContext.get('/api/websocket-proxy?symbols=RATE_LIMITED_SYMBOL');
      
      if (response.status() === 429) {
        const text = await response.text();
        expect(text).toContain('cooldown');
      }
    });
  });

  test.describe('Push Notification APIs', () => {
    test('should handle push subscription', async () => {
      const subscriptionData = {
        subscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
          keys: {
            p256dh: 'test-p256dh-key',
            auth: 'test-auth-key',
          },
        },
        userAgent: 'Mozilla/5.0 (Test Browser)',
        timestamp: Date.now(),
      };

      const response = await apiContext.post('/api/push/subscribe', {
        data: subscriptionData,
      });
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('message', 'Subscription stored successfully');
    });

    test('should validate push subscription data', async () => {
      const invalidData = {
        subscription: {
          // Missing endpoint
          keys: {
            p256dh: 'test-key',
          },
        },
      };

      const response = await apiContext.post('/api/push/subscribe', {
        data: invalidData,
      });
      
      expect(response.status()).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('code', 'INVALID_SUBSCRIPTION');
    });

    test('should get subscription statistics', async () => {
      const response = await apiContext.get('/api/push/subscribe');
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('subscriptions');
      expect(data).toHaveProperty('details');
      expect(Array.isArray(data.details)).toBe(true);
    });

    test('should handle push unsubscription', async () => {
      // First subscribe
      const subscriptionData = {
        subscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-2',
          keys: {
            p256dh: 'test-key-2',
            auth: 'test-auth-2',
          },
        },
        userAgent: 'Test Browser',
        timestamp: Date.now(),
      };

      await apiContext.post('/api/push/subscribe', { data: subscriptionData });

      // Then unsubscribe
      const unsubscribeData = {
        subscriptionId: subscriptionData.subscription.endpoint,
        timestamp: Date.now(),
      };

      const response = await apiContext.post('/api/push/unsubscribe', {
        data: unsubscribeData,
      });
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('message', 'Subscription removed successfully');
    });

    test('should handle bulk unsubscription', async () => {
      const response = await apiContext.post('/api/push/unsubscribe', {
        data: { timestamp: Date.now() },
      });
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.message).toContain('subscriptions removed successfully');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle malformed JSON requests', async () => {
      const response = await apiContext.post('/api/push/subscribe', {
        data: 'invalid json',
        headers: {
          'content-type': 'application/json',
        },
      });
      
      expect(response.status()).toBe(500);
      
      const data = await response.json();
      expect(data).toHaveProperty('code');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('details');
    });

    test('should handle missing environment variables', async () => {
      // This would test behavior when FINNHUB_API_KEY is not set
      // In real testing, you might temporarily unset env vars
      const response = await apiContext.get('/api/websocket-proxy?symbols=AAPL');
      
      // If API key is missing, should return 500
      if (response.status() === 500) {
        const text = await response.text();
        expect(text).toContain('API key not configured');
      }
    });

    test('should return proper CORS headers', async () => {
      const response = await apiContext.get('/api/health');
      
      const headers = response.headers();
      expect(headers['access-control-allow-origin']).toBeTruthy();
    });

    test('should handle large request payloads', async () => {
      const largeData = {
        subscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/test',
          keys: {
            p256dh: 'a'.repeat(1000), // Large key
            auth: 'b'.repeat(1000),
          },
        },
        userAgent: 'c'.repeat(1000),
        timestamp: Date.now(),
      };

      const response = await apiContext.post('/api/push/subscribe', {
        data: largeData,
      });
      
      // Should either succeed or fail gracefully
      expect([200, 400, 413]).toContain(response.status());
    });
  });

  test.describe('Performance and Reliability', () => {
    test('should respond within acceptable time limits', async () => {
      const endpoints = [
        '/api/health',
        '/api/quote?symbol=AAPL',
        '/api/push/subscribe',
      ];

      for (const endpoint of endpoints) {
        const startTime = Date.now();
        
        if (endpoint.includes('subscribe')) {
          await apiContext.get(endpoint);
        } else {
          await apiContext.get(endpoint);
        }
        
        const responseTime = Date.now() - startTime;
        
        // API should respond within 5 seconds
        expect(responseTime).toBeLessThan(5000);
        
        // Health check should be particularly fast
        if (endpoint.includes('health')) {
          expect(responseTime).toBeLessThan(1000);
        }
      }
    });

    test('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 20 }, (_, i) =>
        apiContext.get(`/api/quote?symbol=STOCK${i}`)
      );
      
      const responses = await Promise.all(promises);
      
      // Should handle all requests without server errors
      const serverErrors = responses.filter(r => r.status() >= 500);
      expect(serverErrors.length).toBe(0);
      
      // Most should succeed (some might be rate limited)
      const successResponses = responses.filter(r => r.status() === 200);
      expect(successResponses.length).toBeGreaterThan(0);
    });

    test('should maintain session state correctly', async () => {
      // Subscribe to push notifications
      const subscriptionData = {
        subscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/session-test',
          keys: {
            p256dh: 'session-test-key',
            auth: 'session-test-auth',
          },
        },
        userAgent: 'Session Test',
        timestamp: Date.now(),
      };

      await apiContext.post('/api/push/subscribe', { data: subscriptionData });

      // Check subscription exists
      const statsResponse = await apiContext.get('/api/push/subscribe');
      const stats = await statsResponse.json();
      
      const hasSubscription = stats.details.some(
        (sub: any) => sub.endpoint === subscriptionData.subscription.endpoint
      );
      expect(hasSubscription).toBe(true);

      // Unsubscribe
      await apiContext.post('/api/push/unsubscribe', {
        data: {
          subscriptionId: subscriptionData.subscription.endpoint,
          timestamp: Date.now(),
        },
      });

      // Verify subscription is removed
      const finalStatsResponse = await apiContext.get('/api/push/subscribe');
      const finalStats = await finalStatsResponse.json();
      
      const stillHasSubscription = finalStats.details.some(
        (sub: any) => sub.endpoint === subscriptionData.subscription.endpoint
      );
      expect(stillHasSubscription).toBe(false);
    });
  });

  test.describe('Security', () => {
    test('should sanitize input parameters', async () => {
      const maliciousSymbol = '<script>alert("xss")</script>';
      const response = await apiContext.get(`/api/quote?symbol=${encodeURIComponent(maliciousSymbol)}`);
      
      // Should not execute script, should return safe error
      expect(response.status()).toBe(400);
      
      const data = await response.json();
      expect(data.message).not.toContain('<script>');
    });

    test('should validate content types', async () => {
      const response = await apiContext.post('/api/push/subscribe', {
        data: '{"test": "data"}',
        headers: {
          'content-type': 'text/plain', // Wrong content type
        },
      });
      
      // Should handle gracefully
      expect([400, 415, 500]).toContain(response.status());
    });

    test('should handle oversized requests', async () => {
      const oversizedData = {
        subscription: {
          endpoint: 'https://test.com/' + 'a'.repeat(10000),
          keys: {
            p256dh: 'b'.repeat(10000),
            auth: 'c'.repeat(10000),
          },
        },
      };

      const response = await apiContext.post('/api/push/subscribe', {
        data: oversizedData,
      });
      
      // Should reject oversized requests
      expect([400, 413]).toContain(response.status());
    });
  });
});