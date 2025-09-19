/**
 * TypeScript Types Index
 * ======================
 * 
 * Central export point for all TypeScript utilities and domain-specific types.
 * Use this file to import all type utilities throughout the application.
 * 
 * @example
 * import { ApiResponse, AsyncState, ComponentProps, StockQuote } from '@/types';
 */

// Export all utility types
export * from './utils';

// Export stock-specific types
export * from './stock';

// Re-export commonly used React types for convenience
export type {
  ComponentType,
  ReactNode,
  ReactElement,
  PropsWithChildren,
  HTMLAttributes,
  CSSProperties,
} from 'react';

// Re-export Next.js types
export type {
  Metadata,
  NextRequest,
  NextResponse,
} from 'next';

// ============================================================================
// DOMAIN-SPECIFIC TYPES (StockPulse Business Logic)
// ============================================================================

/**
 * Stock quote data structure
 */
export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  dividendYield?: number;
  high52Week?: number;
  low52Week?: number;
  timestamp: string;
}

/**
 * Portfolio holding structure
 */
export interface PortfolioHolding {
  id: string;
  symbol: string;
  shares: number;
  averageCost: number;
  currentPrice: number;
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  addedAt: string;
  updatedAt: string;
}

/**
 * User portfolio structure
 */
export interface Portfolio {
  id: string;
  name: string;
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  holdings: PortfolioHolding[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Watchlist item structure
 */
export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  targetPrice?: number;
  notes?: string;
  addedAt: string;
}

/**
 * Price alert structure
 */
export interface PriceAlert {
  id: string;
  symbol: string;
  condition: 'above' | 'below';
  targetPrice: number;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
}

/**
 * Market news article structure
 */
export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  relatedSymbols: string[];
  imageUrl?: string;
}

/**
 * API response wrapper (uses utility type from utils.ts)
 * @deprecated Use ApiResponse from utils.ts instead
 */
export interface LegacyApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Pagination structure
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * User preferences structure
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    priceAlerts: boolean;
    news: boolean;
  };
  refreshInterval: number;
}

/**
 * Application state structure
 */
export interface AppState {
  user: {
    isAuthenticated: boolean;
    preferences: UserPreferences;
  };
  market: {
    isOpen: boolean;
    lastUpdate: string;
  };
  ui: {
    loading: boolean;
    error?: string;
    theme: 'light' | 'dark';
  };
}


/**
 * Time range options for charts
 */
export type TimeRange = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'MAX';

/**
 * Stock search result structure
 */
export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: 'stock' | 'etf' | 'mutual_fund';
}

/**
 * Notification structure
 */
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}