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
  changePercent?: number;
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
  [symbol: string]: number | string;
}

/**
 * WebSocket connection status
 */
export type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

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
  data?: any;
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
export interface StockFormProps extends ComponentProps {
  availableStocks: StockOption[];
  onAddStock: (symbol: string, alertPrice: number) => void;
  watchedStocks?: WatchedStock[];
  isLoading?: boolean;
}

/**
 * Props for StockCard component
 */
export interface StockCardProps extends ComponentProps {
  stock: WatchedStock;
  onRemove?: ((symbol: string) => void) | undefined;
}

/**
 * Props for StockCards component
 */
export interface StockCardsProps extends ComponentProps {
  stocks: WatchedStock[];
  onRemoveStock?: (symbol: string) => void;
}

/**
 * Props for StockChart component
 */
export interface StockChartProps extends ComponentProps {
  stocks: WatchedStock[];
  timeRange?: '1H' | '1D' | '1W' | '1M';
  height?: number;
}

/**
 * Props for WebSocketStatus component
 */
export interface WebSocketStatusProps extends ComponentProps {
  status: WebSocketStatus;
  lastUpdate?: number;
}

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
  webSocketConnection: any; // WebSocket | null;
  refreshInterval: any; // NodeJS.Timeout | null;
  isConnecting: boolean;
  lastUpdateTimes: Map<string, number>;
  
  // Refresh configuration
  refreshTimeInterval: RefreshInterval;
  
  // Live data toggle
  isLiveDataEnabled: boolean;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addStock: (_symbol: string, _name: string, _alertPrice: number) => void;
  removeStock: (_symbol: string) => void;
  updateStockPrice: (_symbol: string, _quote: FinnhubStockQuote) => void;
  updateAlertPrice: (_symbol: string, _newAlertPrice: number) => void;
  setWebSocketStatus: (_status: WebSocketStatus) => void;
  setWebSocketConnection: (_connection: any) => void;
  setLoading: (_loading: boolean) => void;
  setError: (_error: string | null) => void;
  clearError: () => void;
  
  
  // WebSocket actions
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  
  // Periodic refresh actions
  startPeriodicRefresh: () => void;
  stopPeriodicRefresh: () => void;
  setRefreshTimeInterval: (_interval: RefreshInterval) => void;
  
  // Live data toggle actions
  setLiveDataEnabled: (_enabled: boolean) => void;
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * Finnhub quote API response
 */
export interface FinnhubQuoteResponse {
  c: number;  // current price
  d: number;  // change
  dp: number; // percent change
  h: number;  // high
  l: number;  // low
  o: number;  // open
  pc: number; // previous close
  t: number;  // timestamp
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
export const isFinnhubStockQuote = (value: unknown): value is FinnhubStockQuote => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as FinnhubStockQuote).symbol === 'string' &&
    typeof (value as FinnhubStockQuote).current === 'number' &&
    typeof (value as FinnhubStockQuote).change === 'number' &&
    typeof (value as FinnhubStockQuote).percentChange === 'number'
  );
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

/**
 * Default stock options for the test
 */
export const DEFAULT_STOCK_OPTIONS: StockOption[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
  { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ' },
];

/**
 * Stock color mapping for charts
 */
export const STOCK_COLORS: StockColorMap = {
  AAPL: '#2563eb',  // blue-600 (Apple brand blue)
  GOOGL: '#ea4335', // Google brand red
  MSFT: '#16a34a',  // green-600
  AMZN: '#ff9900',  // Amazon orange
  TSLA: '#dc2626',  // red-600
  META: '#1877f2',  // Meta brand blue
  NVDA: '#76b900',  // NVIDIA green
  NFLX: '#e50914',  // Netflix red
};

/**
 * WebSocket configuration
 */
export const WEBSOCKET_CONFIG = {
  RECONNECT_INTERVAL: 5000,
  MAX_RECONNECT_ATTEMPTS: 5,
  PING_INTERVAL: 30000,
  SUBSCRIPTION_LIMIT: 50,
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  WATCHED_STOCKS: 'stockpulse_watched_stocks',
  LAST_SYNC: 'stockpulse_last_sync',
  VERSION: 'stockpulse_version',
} as const;

/**
 * PWA configuration
 */
export const PWA_CONFIG = {
  VERSION: '1.0.0',
  CACHE_NAME: 'stockpulse-v1',
  SYNC_INTERVAL: 30000, // 30 seconds
  MAX_STORAGE_ITEMS: 100,
} as const;
