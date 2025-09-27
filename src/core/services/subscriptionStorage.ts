/**
 * Subscription Storage Service
 * ===========================
 *
 * Handles persistent storage of push notification subscriptions.
 * Uses file-based storage that can be easily upgraded to database storage.
 */

import { promises as fs } from 'fs';
import path from 'path';

import type { PushSubscriptionData } from '@/core/types';

interface SubscriptionStorageData {
  subscriptions: Record<string, PushSubscriptionData>;
  lastUpdated: number;
}

/**
 * Subscription storage service for persistent subscription management
 */
export class SubscriptionStorageService {
  private static instance: SubscriptionStorageService;
  private storagePath: string;
  private subscriptions: Map<string, PushSubscriptionData> = new Map();
  private isInitialized = false;

  private constructor() {
    // Use a data directory in the project root
    this.storagePath = path.join(process.cwd(), 'data', 'subscriptions.json');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SubscriptionStorageService {
    if (!SubscriptionStorageService.instance) {
      SubscriptionStorageService.instance = new SubscriptionStorageService();
    }
    return SubscriptionStorageService.instance;
  }

  /**
   * Initialize storage - load existing subscriptions
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.storagePath);
      await fs.mkdir(dataDir, { recursive: true });

      // Try to load existing subscriptions
      try {
        const data = await fs.readFile(this.storagePath, 'utf-8');
        const storageData: SubscriptionStorageData = JSON.parse(data);

        // Convert back to Map
        this.subscriptions = new Map(Object.entries(storageData.subscriptions));

        console.log(
          `📦 Loaded ${this.subscriptions.size} subscriptions from storage`
        );
      } catch {
        // File doesn't exist or is corrupted, start with empty storage
        console.log('📦 Starting with empty subscription storage');
        this.subscriptions = new Map();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize subscription storage:', error);
      // Fallback to in-memory storage
      this.subscriptions = new Map();
      this.isInitialized = true;
    }
  }

  /**
   * Save subscriptions to persistent storage
   */
  private async saveToStorage(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const storageData: SubscriptionStorageData = {
        subscriptions: Object.fromEntries(this.subscriptions),
        lastUpdated: Date.now(),
      };

      await fs.writeFile(
        this.storagePath,
        JSON.stringify(storageData, null, 2),
        'utf-8'
      );
      console.log(
        `💾 Saved ${this.subscriptions.size} subscriptions to storage`
      );
    } catch (error) {
      console.error('Failed to save subscriptions to storage:', error);
      // Continue with in-memory storage
    }
  }

  /**
   * Store a subscription
   */
  public async storeSubscription(
    subscriptionId: string,
    data: PushSubscriptionData
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.subscriptions.set(subscriptionId, data);
    await this.saveToStorage();
  }

  /**
   * Get a subscription by ID
   */
  public async getSubscription(
    subscriptionId: string
  ): Promise<PushSubscriptionData | undefined> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.subscriptions.get(subscriptionId);
  }

  /**
   * Get all subscriptions
   */
  public async getAllSubscriptions(): Promise<
    Map<string, PushSubscriptionData>
  > {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Map(this.subscriptions);
  }

  /**
   * Remove a subscription
   */
  public async removeSubscription(subscriptionId: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const removed = this.subscriptions.delete(subscriptionId);
    if (removed) {
      await this.saveToStorage();
    }
    return removed;
  }

  /**
   * Remove all subscriptions
   */
  public async clearAllSubscriptions(): Promise<number> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const count = this.subscriptions.size;
    this.subscriptions.clear();
    await this.saveToStorage();
    return count;
  }

  /**
   * Get subscription count
   */
  public async getSubscriptionCount(): Promise<number> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.subscriptions.size;
  }

  /**
   * Get subscription statistics
   */
  public async getSubscriptionStats(): Promise<{
    total: number;
    byDeviceType: Record<string, number>;
    byBrowserType: Record<string, number>;
    oldestSubscription?: number;
    newestSubscription?: number;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const stats: {
      total: number;
      byDeviceType: Record<string, number>;
      byBrowserType: Record<string, number>;
      oldestSubscription?: number;
      newestSubscription?: number;
    } = {
      total: this.subscriptions.size,
      byDeviceType: {} as Record<string, number>,
      byBrowserType: {} as Record<string, number>,
    };

    for (const [, data] of this.subscriptions) {
      // Count by device type
      const deviceType = data.deviceType || 'unknown';
      stats.byDeviceType[deviceType] =
        (stats.byDeviceType[deviceType] || 0) + 1;

      // Count by browser type
      const browserType = data.browserType || 'unknown';
      stats.byBrowserType[browserType] =
        (stats.byBrowserType[browserType] || 0) + 1;

      // Track oldest and newest
      const createdAt = data.createdAt;
      if (!stats.oldestSubscription || createdAt < stats.oldestSubscription) {
        stats.oldestSubscription = createdAt;
      }
      if (!stats.newestSubscription || createdAt > stats.newestSubscription) {
        stats.newestSubscription = createdAt;
      }
    }

    return stats;
  }

  /**
   * Clean up old subscriptions (older than specified days)
   */
  public async cleanupOldSubscriptions(daysOld: number = 30): Promise<number> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    let removedCount = 0;

    for (const [id, data] of this.subscriptions) {
      if (data.createdAt < cutoffTime) {
        this.subscriptions.delete(id);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      await this.saveToStorage();
      console.log(`🧹 Cleaned up ${removedCount} old subscriptions`);
    }

    return removedCount;
  }
}

/**
 * Export singleton instance
 */
export const getSubscriptionStorage = () =>
  SubscriptionStorageService.getInstance();
