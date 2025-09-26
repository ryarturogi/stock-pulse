/**
 * Tests for Symbol Search API Route
 * =================================
 */

import { NextRequest } from 'next/server';
import { GET } from './route';

// Mock fetch
global.fetch = jest.fn();

// Mock environment
const originalEnv = process.env;

beforeAll(() => {
  process.env.FINNHUB_API_KEY = 'test-api-key';
});

afterAll(() => {
  process.env = originalEnv;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Symbol Search API', () => {
  it('should return error when no query parameter is provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/symbol-search');
    
    const response = await GET(request);
    const body = await response.json();
    
    expect(response.status).toBe(400);
    expect(body.error).toBe('Search query is required');
  });

  it('should return error when API key is not configured', async () => {
    delete process.env.FINNHUB_API_KEY;
    
    const request = new NextRequest('http://localhost:3000/api/symbol-search?q=AAPL');
    
    const response = await GET(request);
    const body = await response.json();
    
    expect(response.status).toBe(500);
    expect(body.error).toBe('API key not configured');
    
    // Restore API key
    process.env.FINNHUB_API_KEY = 'test-api-key';
  });
});