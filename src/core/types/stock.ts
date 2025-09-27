/**
 * Stock-Specific Types for React Developer Test Requirements
 * =========================================================
 *
 * Enhanced types specifically for the stock tracking application
 * following the test requirements with Finnhub API integration.
 */

import type { ComponentProps, ApiResponse } from './utils';

// Import DOM types for WebSocket
/// <reference lib="dom" />

// Global types for NodeJS
declare global {
  namespace NodeJS {
    interface Timeout {
      ref(): Timeout;
      unref(): Timeout;
    }
  }
}

// ============================================================================
// CORE STOCK TYPES
// ============================================================================

/**
 * Available stock options for the dropdown
 */
export interface StockOption {
  symbol: string;
  name: string;
  exchange?: string;
  type?: 'stock' | 'etf' | 'mutual_fund';
}

/**
 * Real-time stock quote from Finnhub API
 */
export interface FinnhubStockQuote {
  symbol: string;
  current: number;
  change: number;
  percentChange: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
}

/**
 * Watched stock with alert configuration
 */
export interface WatchedStock {
  id: string;
  symbol: string;
  name: string;
  alertPrice: number;
  currentPrice?: number;
  change?: number;
  percentChange?: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
  isLoading?: boolean;
  lastUpdated?: number;
  priceHistory?: PriceDataPoint[];
  isAlertTriggered?: boolean | undefined;
  alertTriggeredAt?: number;
}

/**
 * Price data point for charting
 */
export interface PriceDataPoint {
  time: number;
  price: number;
  volume?: number;
}

/**
 * Chart data structure for Recharts
 */
export interface ChartDataPoint {
  timestamp: string;
  index: number; // Numeric index for Brush component positioning
  [symbol: string]: number | string;
}

/**
 * WebSocket connection status
 */
export type WebSocketStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'disconnecting'
  | 'reconnecting'
  | 'offline';

/**
 * Refresh time intervals for live data
 */
export type RefreshInterval = '30s' | '1m' | '2m' | '5m' | '10m' | '30m' | '1h';

/**
 * Refresh interval configuration
 */
export interface RefreshIntervalConfig {
  value: RefreshInterval;
  label: string;
  milliseconds: number;
}

/**
 * Available refresh intervals for live data (Conservative for API rate limits)
 */
export const REFRESH_INTERVALS: RefreshIntervalConfig[] = [
  { value: '30s', label: '30 seconds', milliseconds: 30 * 1000 },
  { value: '1m', label: '1 minute', milliseconds: 60 * 1000 },
  { value: '2m', label: '2 minutes', milliseconds: 2 * 60 * 1000 },
  { value: '5m', label: '5 minutes', milliseconds: 5 * 60 * 1000 },
  { value: '10m', label: '10 minutes', milliseconds: 10 * 60 * 1000 },
  { value: '30m', label: '30 minutes', milliseconds: 30 * 60 * 1000 },
  { value: '1h', label: '1 hour', milliseconds: 60 * 60 * 1000 },
];

/**
 * WebSocket message types
 */
export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'trade' | 'ping' | 'pong';
  symbol?: string;
  data?: TradeData | TradeData[] | string | Record<string, unknown>;
}

/**
 * Trade data from WebSocket
 */
export interface TradeData {
  s: string; // symbol
  p: number; // price
  t: number; // timestamp
  v?: number; // volume
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

/**
 * Props for StockForm component
 */
export type StockFormProps = ComponentProps<{
  availableStocks: StockOption[];
  onAddStock: (symbol: string, alertPrice: number, stockName?: string) => void;
  watchedStocks?: WatchedStock[];
  isLoading?: boolean;
}>;

/**
 * Props for StockCard component
 */
export type StockCardProps = ComponentProps<{
  stock: WatchedStock;
  onRemove?: ((symbol: string) => void) | undefined;
}>;

/**
 * Props for StockCards component
 */
export type StockCardsProps = ComponentProps<{
  stocks: WatchedStock[];
  onRemoveStock?: (symbol: string) => void;
}>;

/**
 * Props for StockChart component
 */
export type StockChartProps = ComponentProps<{
  stocks: WatchedStock[];
  timeRange?: '1H' | '1D' | '1W' | '1M';
  height?: number;
}>;

/**
 * Props for WebSocketStatus component
 */
export type WebSocketStatusProps = ComponentProps<{
  status: WebSocketStatus;
  lastUpdate?: number;
}>;

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * Stock tracking store state
 */
export interface StockStoreState {
  // Watched stocks
  watchedStocks: WatchedStock[];

  // WebSocket connection
  webSocketStatus: WebSocketStatus;
  webSocketConnection: EventSource | null;
  refreshInterval: NodeJS.Timeout | number | null;
  isConnecting: boolean;
  lastUpdateTimes: Map<string, number>;

  // Refresh configuration
  refreshTimeInterval: RefreshInterval;

  // Live data toggle
  isLiveDataEnabled: boolean;

  // Connection management
  connectionAttempts: number;
  lastConnectionAttempt?: number;
  reconnectTimeout?: NodeJS.Timeout | null;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  addStock: (symbol: string, name: string, alertPrice: number) => void;
  removeStock: (symbol: string) => void;
  updateStockPrice: (symbol: string, quote: FinnhubStockQuote) => void;
  updateAlertPrice: (symbol: string, newAlertPrice: number) => void;
  setWebSocketStatus: (status: WebSocketStatus) => void;
  setWebSocketConnection: (connection: EventSource | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // WebSocket actions
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  resetWebSocketState: () => void;
  clearReconnectTimeout: () => void;

  // Periodic refresh actions
  startPeriodicRefresh: () => void;
  stopPeriodicRefresh: () => void;
  setRefreshTimeInterval: (interval: RefreshInterval) => void;

  // Live data toggle actions
  setLiveDataEnabled: (enabled: boolean) => void;

  // Testing utilities
  reset: () => void;
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * Finnhub quote API response
 */
export interface FinnhubQuoteResponse {
  c: number; // current price
  d: number; // change
  dp: number; // percent change
  h: number; // high
  l: number; // low
  o: number; // open
  pc: number; // previous close
  t: number; // timestamp
}

/**
 * Stock quote API response
 */
export type StockQuoteResponse = ApiResponse<FinnhubStockQuote>;

/**
 * Available stocks API response
 */
export type AvailableStocksResponse = ApiResponse<StockOption[]>;

// ============================================================================
// PWA TYPES
// ============================================================================

/**
 * Local storage data structure
 */
export interface LocalStorageData {
  watchedStocks: WatchedStock[];
  lastSync: number;
  version: string;
}

/**
 * Push notification payload
 */
export interface PriceAlertNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data: {
    symbol: string;
    currentPrice: number;
    alertPrice: number;
    type: 'above' | 'below';
  };
}

/**
 * Background sync data
 */
export interface BackgroundSyncData {
  stocks: WatchedStock[];
  lastUpdate: number;
  connectionStatus: WebSocketStatus;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Stock color mapping
 */
export type StockColorMap = Record<string, string>;

/**
 * Chart time range options
 */
export type ChartTimeRange = '1H' | '1D' | '1W' | '1M' | '3M' | '1Y';

/**
 * Alert condition types
 */
export type AlertCondition = 'above' | 'below';

/**
 * Price change direction
 */
export type PriceDirection = 'up' | 'down' | 'neutral';

/**
 * Stock market status
 */
export type MarketStatus = 'open' | 'closed' | 'pre-market' | 'after-hours';

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for FinnhubStockQuote
 */
export const isFinnhubStockQuote = (
  value: unknown
): value is FinnhubStockQuote => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const quote = value as FinnhubStockQuote;

  // Check required fields exist and have valid values
  const hasSymbol = typeof quote.symbol === 'string' && quote.symbol.length > 0;
  const hasCurrent =
    typeof quote.current === 'number' &&
    !isNaN(quote.current) &&
    quote.current >= 0;
  const hasChange = typeof quote.change === 'number' && !isNaN(quote.change);
  const hasPercentChange =
    typeof quote.percentChange === 'number' && !isNaN(quote.percentChange);

  // For debugging: log validation details
  if (!hasSymbol || !hasCurrent || !hasChange || !hasPercentChange) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('Quote validation failed:', {
        hasSymbol,
        hasCurrent,
        hasChange,
        hasPercentChange,
        symbol: quote.symbol,
        current: quote.current,
        change: quote.change,
        percentChange: quote.percentChange,
      });
    }
  }

  return hasSymbol && hasCurrent && hasChange && hasPercentChange;
};

/**
 * Type guard for WatchedStock
 */
export const isWatchedStock = (value: unknown): value is WatchedStock => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as WatchedStock).id === 'string' &&
    typeof (value as WatchedStock).symbol === 'string' &&
    typeof (value as WatchedStock).name === 'string' &&
    typeof (value as WatchedStock).alertPrice === 'number'
  );
};

/**
 * Type guard for TradeData
 */
export const isTradeData = (value: unknown): value is TradeData => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as TradeData).s === 'string' &&
    typeof (value as TradeData).p === 'number' &&
    typeof (value as TradeData).t === 'number'
  );
};

// ============================================================================
// CONSTANTS
// ============================================================================

// DEFAULT_STOCK_OPTIONS and STOCK_COLORS moved to @/core/constants

/**
 * WebSocket configuration
 */
export const WEBSOCKET_CONFIG = {
  RECONNECT_INTERVAL: 5000,
  MAX_RECONNECT_ATTEMPTS: 5,
  PING_INTERVAL: 30000,
  SUBSCRIPTION_LIMIT: 50,
} as const;

// STORAGE_KEYS moved to @/core/constants

/**
 * PWA configuration
 */
export const PWA_CONFIG = {
  VERSION: '1.0.0',
  CACHE_NAME: 'stockpulse-v1',
  SYNC_INTERVAL: 30000, // 30 seconds
  MAX_STORAGE_ITEMS: 100,
} as const;

// ============================================================================
// PWA & BACKGROUND SYNC TYPES
// ============================================================================

/**
 * Background sync data structure
 */
export interface BackgroundSyncData {
  stocks: WatchedStock[];
  lastUpdate: number;
  connectionStatus: WebSocketStatus;
}

/**
 * Enhanced push notification payload
 */
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, unknown>;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  timestamp?: number;
  renotify?: boolean;
  vibrate?: number[];
}

/**
 * Push notification service configuration
 */
export interface PushServiceConfig {
  retryAttempts: number;
  retryDelay: number;
  maxNotificationsPerDay: number;
  enableBatching: boolean;
  supportOfflineQueue: boolean;
}

/**
 * Push notification error types
 */
export type PushNotificationError =
  | 'PERMISSION_DENIED'
  | 'SERVICE_WORKER_FAILED'
  | 'SUBSCRIPTION_FAILED'
  | 'NETWORK_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'UNSUPPORTED_BROWSER'
  | 'PWA_NOT_INSTALLED'
  | 'UNKNOWN_ERROR';
