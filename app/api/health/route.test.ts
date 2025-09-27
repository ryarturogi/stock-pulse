/**
 * Integration Tests for Health Check API Route
 * ===========================================
 *
 * Tests for the application health monitoring endpoint
 */

// Mock NextResponse for proper header handling in tests
const mockJsonResponse = (data: any, init: any = {}) => {
  const headers = init?.headers || {};
  const mockHeaders = {
    get: (name: string) => headers[name] || null,
    has: (name: string) => name in headers,
    set: (name: string, value: string) => {
      headers[name] = value;
    },
    delete: (name: string) => delete headers[name],
    forEach: (callback: (value: string, key: string) => void) => {
      Object.entries(headers).forEach(([key, value]) =>
        callback(value as string, key)
      );
    },
    entries: () => Object.entries(headers)[Symbol.iterator](),
    keys: () => Object.keys(headers)[Symbol.iterator](),
    values: () => Object.values(headers)[Symbol.iterator](),
  };

  return {
    json: async () => data,
    headers: mockHeaders,
    status: init?.status || 200,
  };
};

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation(mockJsonResponse),
  },
}));

const { GET } = require('./route');

// Mock fetch globally with simpler implementation
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({ status: 'ok' }),
  headers: new Headers({ 'content-type': 'application/json' }),
});

// Mock process methods
const mockProcess = {
  uptime: jest.fn().mockReturnValue(12345),
  memoryUsage: jest.fn().mockReturnValue({
    rss: 123456789,
    heapTotal: 987654321,
    heapUsed: 456789123,
    external: 789123456,
    arrayBuffers: 321654987,
  }),
};

Object.defineProperty(global, 'process', {
  value: {
    ...process,
    uptime: mockProcess.uptime,
    memoryUsage: mockProcess.memoryUsage,
  },
  writable: true,
});

// Mock AbortController
global.AbortController = jest.fn().mockImplementation(() => ({
  signal: { aborted: false },
  abort: jest.fn(),
}));

// Keep original setTimeout and clearTimeout for basic functionality
const originalSetTimeout = setTimeout;
const originalClearTimeout = clearTimeout;
global.setTimeout = jest
  .fn()
  .mockImplementation((fn, delay) => originalSetTimeout(fn, delay)) as any;
global.clearTimeout = jest.fn().mockImplementation(originalClearTimeout);

describe('/api/health', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset environment variables
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      NEXT_PUBLIC_APP_VERSION: '1.2.3',
      VERCEL_ENV: 'development',
      VERCEL_REGION: 'iad1',
      VERCEL_URL: 'test.vercel.app',
    };

    // Reset mocks to success state
    mockProcess.uptime.mockReturnValue(12345);
    mockProcess.memoryUsage.mockReturnValue({
      rss: 123456789,
      heapTotal: 987654321,
      heapUsed: 456789123,
      external: 789123456,
      arrayBuffers: 321654987,
    });

    // Mock successful Finnhub API response
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Successful Health Checks', () => {
    it('should return healthy status with all checks', async () => {
      const response = await GET();

      expect(response).toBeDefined();
      expect(response.status).toBe(200);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
      expect(data.responseTime).toMatch(/^\d+ms$/);

      expect(data.checks).toBeDefined();
      expect(data.checks.uptime).toBe(12345);
      expect(data.checks.memory).toEqual({
        rss: 123456789,
        heapTotal: 987654321,
        heapUsed: 456789123,
        external: 789123456,
        arrayBuffers: 321654987,
      });
      expect(data.checks.environment).toBe('test');
      expect(data.checks.version).toBe('1.2.3');

      expect(data.checks.vercel).toEqual({
        env: 'development',
        region: 'iad1',
        url: 'test.vercel.app',
      });

      expect(data.checks.externalApis.finnhub.status).toBe('healthy');
      expect(data.checks.externalApis.finnhub.responseTime).toMatch(/^\d+ms$/);
    });

    it('should include correct cache headers', async () => {
      const response = await GET();

      expect(response.headers.get('Cache-Control')).toBe(
        'no-cache, no-store, must-revalidate'
      );
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });

    it('should have reasonable response time', async () => {
      const response = await GET();
      const data = await response.json();

      const reportedResponseTime = parseInt(
        data.responseTime.replace('ms', '')
      );

      // Response time should be reasonable (within 1 second for tests)
      expect(reportedResponseTime).toBeLessThan(1000);
      expect(reportedResponseTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing environment variables gracefully', async () => {
      delete process.env.NEXT_PUBLIC_APP_VERSION;
      delete process.env.VERCEL_ENV;
      delete process.env.VERCEL_REGION;
      delete process.env.VERCEL_URL;

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.checks.version).toBe('1.0.0'); // Default version
      expect(data.checks.vercel).toEqual({
        env: undefined,
        region: undefined,
        url: undefined,
      });
    });
  });

  describe('External API Health Checks', () => {
    it('should handle healthy external API', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      const response = await GET();
      const data = await response.json();

      expect(data.checks.externalApis.finnhub.status).toBe('healthy');
      expect(fetch).toHaveBeenCalledWith('https://finnhub.io/api/v1/', {
        method: 'HEAD',
        signal: expect.any(Object),
      });
    });

    it('should handle degraded external API (non-200 response)', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200); // Main app still healthy
      expect(data.checks.externalApis.finnhub.status).toBe('degraded');
    });

    it('should handle unhealthy external API (network error)', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200); // Main app still healthy
      expect(data.checks.externalApis.finnhub.status).toBe('unhealthy');
    });

    it('should handle external API timeout', async () => {
      // Mock fetch to never resolve (simulating timeout)
      (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      // Mock AbortController to simulate timeout
      const mockAbort = jest.fn();
      (global.AbortController as jest.Mock).mockImplementation(() => ({
        signal: { aborted: false },
        abort: mockAbort,
      }));

      // Mock setTimeout to immediately call the abort function
      const mockSetTimeout = jest.fn().mockImplementation(fn => {
        if (typeof fn === 'function') {
          fn(); // Immediately call to simulate timeout
        }
        return 'timeout-id' as unknown as NodeJS.Timeout;
      });
      global.setTimeout = mockSetTimeout as unknown as typeof setTimeout;

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.checks.externalApis.finnhub.status).toBe('unhealthy');
      expect(mockAbort).toHaveBeenCalled();
    }, 15000);

    it('should include response time for external API checks', async () => {
      (fetch as jest.Mock).mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ ok: true, status: 200 }), 100)
          )
      );

      const response = await GET();
      const data = await response.json();

      expect(data.checks.externalApis.finnhub.responseTime).toMatch(/^\d+ms$/);
      const responseTime = parseInt(
        data.checks.externalApis.finnhub.responseTime.replace('ms', '')
      );
      expect(responseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('System Information', () => {
    it('should include correct system uptime', async () => {
      mockProcess.uptime.mockReturnValue(54321);

      const response = await GET();
      const data = await response.json();

      expect(data.checks.uptime).toBe(54321);
      expect(mockProcess.uptime).toHaveBeenCalled();
    });

    it('should include memory usage information', async () => {
      const customMemory = {
        rss: 999888777,
        heapTotal: 111222333,
        heapUsed: 444555666,
        external: 777888999,
        arrayBuffers: 123123123,
      };
      mockProcess.memoryUsage.mockReturnValue(customMemory);

      const response = await GET();
      const data = await response.json();

      expect(data.checks.memory).toEqual(customMemory);
      expect(mockProcess.memoryUsage).toHaveBeenCalled();
    });

    it('should include correct environment information', async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalVersion = process.env.NEXT_PUBLIC_APP_VERSION;

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
      });
      process.env.NEXT_PUBLIC_APP_VERSION = '2.1.0';

      const response = await GET();
      const data = await response.json();

      expect(data.checks.environment).toBe('production');
      expect(data.checks.version).toBe('2.1.0');

      // Restore original values
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
      });
      process.env.NEXT_PUBLIC_APP_VERSION = originalVersion;
    });

    it('should include Vercel deployment information', async () => {
      process.env.VERCEL_ENV = 'production';
      process.env.VERCEL_REGION = 'sfo1';
      process.env.VERCEL_URL = 'myapp.vercel.app';

      const response = await GET();
      const data = await response.json();

      expect(data.checks.vercel).toEqual({
        env: 'production',
        region: 'sfo1',
        url: 'myapp.vercel.app',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle process.uptime() throwing error', async () => {
      mockProcess.uptime.mockImplementation(() => {
        throw new Error('Process uptime error');
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data.error).toBe('Process uptime error');
      expect(data.responseTime).toMatch(/^\d+ms$/);
      expect(data.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it('should handle process.memoryUsage() throwing error', async () => {
      mockProcess.memoryUsage.mockImplementation(() => {
        throw new Error('Memory usage error');
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data.error).toBe('Memory usage error');
    });

    it('should handle non-Error exceptions', async () => {
      mockProcess.uptime.mockImplementation(() => {
        throw 'String error';
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data.error).toBe('Unknown error');
    });

    it('should include error response time', async () => {
      mockProcess.uptime.mockImplementation(() => {
        throw new Error('Test error');
      });

      const response = await GET();
      const data = await response.json();

      const reportedTime = parseInt(data.responseTime.replace('ms', ''));

      expect(reportedTime).toBeGreaterThanOrEqual(0);
      expect(reportedTime).toBeLessThan(1000); // Should be reasonable in tests
    });

    it('should include correct error response headers', async () => {
      mockProcess.uptime.mockImplementation(() => {
        throw new Error('Test error');
      });

      const response = await GET();

      expect(response.status).toBe(503);
      expect(response.headers.get('Cache-Control')).toBe(
        'no-cache, no-store, must-revalidate'
      );
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });
  });

  describe('Response Format Consistency', () => {
    it('should always include required fields in healthy response', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('responseTime');
      expect(data).toHaveProperty('checks');
      expect(data).not.toHaveProperty('error');
    });

    it('should always include required fields in unhealthy response', async () => {
      mockProcess.uptime.mockImplementation(() => {
        throw new Error('Test error');
      });

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('responseTime');
      expect(data).toHaveProperty('error');
      expect(data).not.toHaveProperty('checks');
    });

    it('should have consistent timestamp format', async () => {
      const response = await GET();
      const data = await response.json();

      // ISO 8601 format
      expect(data.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );

      // Should be a valid date
      const date = new Date(data.timestamp);
      expect(date.getTime()).not.toBeNaN();
    });

    it('should have consistent response time format', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.responseTime).toMatch(/^\d+ms$/);

      const timeValue = parseInt(data.responseTime.replace('ms', ''));
      expect(timeValue).toBeGreaterThanOrEqual(0);
    });

    it('should have correct Content-Type header', async () => {
      const response = await GET();

      expect(response.headers.get('Content-Type')).toContain(
        'application/json'
      );
    });
  });

  describe('Performance', () => {
    it('should respond quickly under normal conditions', async () => {
      const startTime = Date.now();
      const response = await GET();
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
      expect(response.status).toBe(200);
    });

    it('should handle concurrent health check requests', async () => {
      const requests = Array.from({ length: 5 }, () => GET());

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('External API Health Check Function', () => {
    it('should timeout external API calls appropriately', async () => {
      // Mock a slow response that should be aborted
      (fetch as jest.Mock).mockImplementation(
        () =>
          new Promise(resolve => setTimeout(() => resolve({ ok: true }), 10000))
      );

      const mockAbort = jest.fn();
      (global.AbortController as jest.Mock).mockImplementation(() => ({
        signal: { aborted: false },
        abort: mockAbort,
      }));

      // Mock setTimeout to call the abort function after delay
      const mockSetTimeout2 = jest.fn().mockImplementation((fn, delay) => {
        if (typeof fn === 'function' && delay === 5000) {
          setTimeout(fn, 10); // Call abort quickly in test
        }
        return 'timeout-id' as unknown as NodeJS.Timeout;
      });
      global.setTimeout = mockSetTimeout2 as unknown as typeof setTimeout;

      const response = await GET();
      const data = await response.json();

      expect(data.checks.externalApis.finnhub.status).toBe('unhealthy');
      expect(global.clearTimeout).toHaveBeenCalled();
    }, 15000);
  });
});
