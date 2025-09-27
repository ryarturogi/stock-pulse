/**
 * Unit Tests for SubscriptionStorageService
 * ========================================
 *
 * Tests for the persistent subscription storage service
 */

import { promises as fs } from 'fs';
import path from 'path';

import {
  SubscriptionStorageService,
  getSubscriptionStorage,
} from './subscriptionStorage';
import type { PushSubscriptionData } from '@/core/types';

// Mock PushSubscription for testing
const createMockPushSubscription = (endpoint: string) =>
  ({
    endpoint,
    expirationTime: null,
    options: {},
    getKey: jest.fn(),
    toJSON: jest.fn(() => ({ endpoint })),
    unsubscribe: jest.fn(),
  }) as any;

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

// Mock path module
jest.mock('path', () => ({
  join: jest.fn(),
  dirname: jest.fn(),
}));

describe('SubscriptionStorageService', () => {
  let service: SubscriptionStorageService;
  let mockStoragePath: string;
  let mockDataDir: string;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    mockStoragePath = '/tmp/test-subscriptions.json';
    mockDataDir = '/tmp';

    (path.join as jest.Mock).mockReturnValue(mockStoragePath);
    (path.dirname as jest.Mock).mockReturnValue(mockDataDir);

    // Reset singleton instance
    (SubscriptionStorageService as any).instance = null;

    service = SubscriptionStorageService.getInstance();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SubscriptionStorageService.getInstance();
      const instance2 = SubscriptionStorageService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should work with getSubscriptionStorage helper', () => {
      const instance1 = getSubscriptionStorage();
      const instance2 = SubscriptionStorageService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('should initialize with empty storage when no file exists', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      await service.initialize();

      expect(fs.mkdir).toHaveBeenCalledWith(mockDataDir, { recursive: true });
      expect(fs.readFile).toHaveBeenCalledWith(mockStoragePath, 'utf-8');
      expect(await service.getSubscriptionCount()).toBe(0);
    });

    it('should load existing subscriptions from file', async () => {
      const mockData = {
        subscriptions: {
          'test-endpoint-1': {
            subscription: createMockPushSubscription('test-endpoint-1'),
            deviceType: 'desktop',
            browserType: 'chrome',
            createdAt: 1234567890,
            lastUsed: 1234567890,
          },
          'test-endpoint-2': {
            subscription: createMockPushSubscription('test-endpoint-2'),
            deviceType: 'mobile',
            browserType: 'safari',
            createdAt: 1234567891,
            lastUsed: 1234567891,
          },
        },
        lastUpdated: 1234567892,
      };

      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

      await service.initialize();

      expect(await service.getSubscriptionCount()).toBe(2);

      const subscription1 = await service.getSubscription('test-endpoint-1');
      expect(subscription1?.deviceType).toBe('desktop');

      const subscription2 = await service.getSubscription('test-endpoint-2');
      expect(subscription2?.deviceType).toBe('mobile');
    });

    it('should handle corrupted file gracefully', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue('invalid json');

      await service.initialize();

      expect(await service.getSubscriptionCount()).toBe(0);
    });

    it('should handle initialization errors gracefully', async () => {
      (fs.mkdir as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      await service.initialize();

      // Should fallback to in-memory storage
      expect(await service.getSubscriptionCount()).toBe(0);
    });
  });

  describe('Subscription Management', () => {
    beforeEach(async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      await service.initialize();
    });

    it('should store and retrieve subscriptions', async () => {
      const subscriptionData: PushSubscriptionData = {
        subscription: createMockPushSubscription('test-endpoint'),
        deviceType: 'desktop',
        browserType: 'chrome',
        createdAt: Date.now(),
        lastUsed: Date.now(),
      };

      await service.storeSubscription('test-endpoint', subscriptionData);

      expect(fs.writeFile).toHaveBeenCalled();
      expect(await service.getSubscriptionCount()).toBe(1);

      const retrieved = await service.getSubscription('test-endpoint');
      expect(retrieved).toEqual(subscriptionData);
    });

    it('should remove subscriptions', async () => {
      const subscriptionData: PushSubscriptionData = {
        subscription: createMockPushSubscription('test-endpoint'),
        deviceType: 'desktop',
        browserType: 'chrome',
        createdAt: Date.now(),
        lastUsed: Date.now(),
      };

      await service.storeSubscription('test-endpoint', subscriptionData);
      expect(await service.getSubscriptionCount()).toBe(1);

      const removed = await service.removeSubscription('test-endpoint');
      expect(removed).toBe(true);
      expect(await service.getSubscriptionCount()).toBe(0);
      expect(fs.writeFile).toHaveBeenCalledTimes(2); // Once for store, once for remove
    });

    it('should return false when removing non-existent subscription', async () => {
      const removed = await service.removeSubscription('non-existent');
      expect(removed).toBe(false);
    });

    it('should clear all subscriptions', async () => {
      // Add multiple subscriptions
      const subscription1: PushSubscriptionData = {
        subscription: createMockPushSubscription('test-endpoint-1'),
        deviceType: 'desktop',
        browserType: 'chrome',
        createdAt: Date.now(),
        lastUsed: Date.now(),
      };

      const subscription2: PushSubscriptionData = {
        subscription: createMockPushSubscription('test-endpoint-2'),
        deviceType: 'mobile',
        browserType: 'safari',
        createdAt: Date.now(),
        lastUsed: Date.now(),
      };

      await service.storeSubscription('test-endpoint-1', subscription1);
      await service.storeSubscription('test-endpoint-2', subscription2);
      expect(await service.getSubscriptionCount()).toBe(2);

      const removedCount = await service.clearAllSubscriptions();
      expect(removedCount).toBe(2);
      expect(await service.getSubscriptionCount()).toBe(0);
    });

    it('should get all subscriptions', async () => {
      const subscription1: PushSubscriptionData = {
        subscription: createMockPushSubscription('test-endpoint-1'),
        deviceType: 'desktop',
        browserType: 'chrome',
        createdAt: Date.now(),
        lastUsed: Date.now(),
      };

      const subscription2: PushSubscriptionData = {
        subscription: createMockPushSubscription('test-endpoint-2'),
        deviceType: 'mobile',
        browserType: 'safari',
        createdAt: Date.now(),
        lastUsed: Date.now(),
      };

      await service.storeSubscription('test-endpoint-1', subscription1);
      await service.storeSubscription('test-endpoint-2', subscription2);

      const allSubscriptions = await service.getAllSubscriptions();
      expect(allSubscriptions.size).toBe(2);
      expect(allSubscriptions.has('test-endpoint-1')).toBe(true);
      expect(allSubscriptions.has('test-endpoint-2')).toBe(true);
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      await service.initialize();
    });

    it('should generate correct statistics', async () => {
      const now = Date.now();
      const oneHourAgo = now - 3600000;
      const twoHoursAgo = now - 7200000;

      // Add subscriptions with different device types and timestamps
      await service.storeSubscription('endpoint-1', {
        subscription: createMockPushSubscription('endpoint-1'),
        deviceType: 'desktop',
        browserType: 'chrome',
        createdAt: twoHoursAgo,
        lastUsed: now,
      });

      await service.storeSubscription('endpoint-2', {
        subscription: createMockPushSubscription('endpoint-2'),
        deviceType: 'mobile',
        browserType: 'safari',
        createdAt: oneHourAgo,
        lastUsed: now,
      });

      await service.storeSubscription('endpoint-3', {
        subscription: createMockPushSubscription('endpoint-3'),
        deviceType: 'desktop',
        browserType: 'firefox',
        createdAt: now,
        lastUsed: now,
      });

      const stats = await service.getSubscriptionStats();

      expect(stats.total).toBe(3);
      expect(stats.byDeviceType).toEqual({
        desktop: 2,
        mobile: 1,
      });
      expect(stats.byBrowserType).toEqual({
        chrome: 1,
        safari: 1,
        firefox: 1,
      });
      expect(stats.oldestSubscription).toBe(twoHoursAgo);
      expect(stats.newestSubscription).toBe(now);
    });

    it('should handle empty statistics', async () => {
      const stats = await service.getSubscriptionStats();

      expect(stats.total).toBe(0);
      expect(stats.byDeviceType).toEqual({});
      expect(stats.byBrowserType).toEqual({});
      expect(stats.oldestSubscription).toBeUndefined();
      expect(stats.newestSubscription).toBeUndefined();
    });
  });

  describe('Cleanup', () => {
    beforeEach(async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      await service.initialize();
    });

    it('should clean up old subscriptions', async () => {
      const now = Date.now();
      const oneDayAgo = now - 86400000;
      const threeDaysAgo = now - 259200000;

      // Add subscriptions with different ages
      await service.storeSubscription('recent', {
        subscription: createMockPushSubscription('recent'),
        deviceType: 'desktop',
        browserType: 'chrome',
        createdAt: oneDayAgo,
        lastUsed: now,
      });

      await service.storeSubscription('old', {
        subscription: createMockPushSubscription('old'),
        deviceType: 'mobile',
        browserType: 'safari',
        createdAt: threeDaysAgo,
        lastUsed: now,
      });

      await service.storeSubscription('very-old', {
        subscription: createMockPushSubscription('very-old'),
        deviceType: 'desktop',
        browserType: 'firefox',
        createdAt: threeDaysAgo,
        lastUsed: now,
      });

      expect(await service.getSubscriptionCount()).toBe(3);

      // Clean up subscriptions older than 2 days
      const removedCount = await service.cleanupOldSubscriptions(2);

      expect(removedCount).toBe(2);
      expect(await service.getSubscriptionCount()).toBe(1);

      // Only the recent subscription should remain
      const remaining = await service.getAllSubscriptions();
      expect(remaining.has('recent')).toBe(true);
      expect(remaining.has('old')).toBe(false);
      expect(remaining.has('very-old')).toBe(false);
    });

    it('should not remove any subscriptions if none are old enough', async () => {
      const now = Date.now();
      const oneDayAgo = now - 86400000;

      await service.storeSubscription('recent', {
        subscription: createMockPushSubscription('recent'),
        deviceType: 'desktop',
        browserType: 'chrome',
        createdAt: oneDayAgo,
        lastUsed: now,
      });

      const removedCount = await service.cleanupOldSubscriptions(30); // 30 days

      expect(removedCount).toBe(0);
      expect(await service.getSubscriptionCount()).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle write errors gracefully', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));
      (fs.writeFile as jest.Mock).mockRejectedValue(new Error('Write failed'));

      await service.initialize();

      const subscriptionData: PushSubscriptionData = {
        subscription: createMockPushSubscription('test-endpoint'),
        deviceType: 'desktop',
        browserType: 'chrome',
        createdAt: Date.now(),
        lastUsed: Date.now(),
      };

      // Should not throw, but continue with in-memory storage
      await expect(
        service.storeSubscription('test-endpoint', subscriptionData)
      ).resolves.not.toThrow();

      // Should still work in memory
      expect(await service.getSubscriptionCount()).toBe(1);
    });

    it('should handle multiple initialization calls', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      await service.initialize();
      await service.initialize(); // Second call should not cause issues

      expect(fs.mkdir).toHaveBeenCalledTimes(1); // Should only be called once
    });
  });
});
