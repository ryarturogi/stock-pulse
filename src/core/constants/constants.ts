/**
 * Application-wide constants
 */

/**
 * API configuration
 */
export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'https://api.stockpulse.com',
  TIMEOUT: parseInt(process.env.NEXT_PUBLIC_REQUEST_TIMEOUT || '5000', 10),
  RETRY_ATTEMPTS: 3,
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 60,
    REQUESTS_PER_HOUR: 1000,
  },
} as const;

/**
 * External API keys and endpoints (Server-side only - never exposed to client)
 */
export const EXTERNAL_APIS = {
  FINNHUB: {
    BASE_URL: 'https://finnhub.io/api/v1',
    API_KEY: process.env.FINNHUB_API_KEY,
  },
} as const;

/**
 * Application routes
 */
export const ROUTES = {
  HOME: '/',
  PORTFOLIO: '/portfolio',
  WATCHLIST: '/watchlist',
  ALERTS: '/alerts',
  NEWS: '/news',
  SEARCH: '/search',
  STOCK_DETAIL: '/stock',
  SETTINGS: '/settings',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'stockpulse_user_preferences',
  PORTFOLIO_DATA: 'stockpulse_portfolio_data',
  WATCHLIST_DATA: 'stockpulse_watchlist_data',
  THEME: 'stockpulse_theme',
  AUTH_TOKEN: 'stockpulse_auth_token',
  REFRESH_TOKEN: 'stockpulse_refresh_token',
} as const;

/**
 * Default values
 */
export const DEFAULTS = {
  CHART_POINTS: 100,
  PAGINATION_LIMIT: 20,
  PRICE_DECIMAL_PLACES: 2,
  PERCENTAGE_DECIMAL_PLACES: 2,
  CURRENCY: 'USD',
  LANGUAGE: 'en',
  THEME: 'light',
} as const;

/**
 * Market hours (EST)
 */
export const MARKET_HOURS = {
  OPEN_HOUR: 9,
  OPEN_MINUTE: 30,
  CLOSE_HOUR: 16,
  CLOSE_MINUTE: 0,
  TIMEZONE: 'America/New_York',
} as const;

/**
 * Chart configuration
 */
export const CHART_CONFIG = {
  COLORS: {
    POSITIVE: '#22c55e',
    NEGATIVE: '#ef4444',
    NEUTRAL: '#6b7280',
    BACKGROUND: '#f9fafb',
    GRID: '#e5e7eb',
  },
  TIME_RANGES: {
    '1D': { days: 1, interval: '5m' },
    '5D': { days: 5, interval: '15m' },
    '1M': { days: 30, interval: '1h' },
    '3M': { days: 90, interval: '1d' },
    '6M': { days: 180, interval: '1d' },
    '1Y': { days: 365, interval: '1d' },
    '5Y': { days: 1825, interval: '1wk' },
    'MAX': { days: null, interval: '1mo' },
  },
} as const;

/**
 * Notification types and settings
 */
export const NOTIFICATIONS = {
  TYPES: {
    PRICE_ALERT: 'price_alert',
    NEWS: 'news',
    PORTFOLIO_UPDATE: 'portfolio_update',
    SYSTEM: 'system',
  },
  PRIORITIES: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
  },
  DISPLAY_DURATION: {
    SUCCESS: 3000,
    INFO: 5000,
    WARNING: 7000,
    ERROR: 10000,
  },
} as const;

/**
 * Stock exchanges
 */
export const EXCHANGES = {
  NYSE: 'New York Stock Exchange',
  NASDAQ: 'NASDAQ',
  AMEX: 'American Stock Exchange',
  OTC: 'Over-the-Counter',
  LSE: 'London Stock Exchange',
  TSE: 'Tokyo Stock Exchange',
  TSX: 'Toronto Stock Exchange',
} as const;

/**
 * Common stock symbols for quick access
 */
export const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'AMD', name: 'Advanced Micro Devices' },
  { symbol: 'CRM', name: 'Salesforce Inc.' },
] as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  API_ERROR: 'API error. Please try again later.',
  INVALID_SYMBOL: 'Invalid stock symbol.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  RATE_LIMITED: 'Too many requests. Please wait before trying again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  PORTFOLIO_UPDATED: 'Portfolio updated successfully.',
  STOCK_ADDED: 'Stock added to watchlist.',
  STOCK_REMOVED: 'Stock removed from watchlist.',
  ALERT_CREATED: 'Price alert created successfully.',
  ALERT_DELETED: 'Price alert deleted successfully.',
  PREFERENCES_SAVED: 'Preferences saved successfully.',
} as const;