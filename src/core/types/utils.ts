/**
 * Comprehensive TypeScript Utility Types for StockPulse
 * =======================================================
 * 
 * This file contains reusable utility types that should be used throughout
 * the application to ensure type safety and consistency.
 */

// ============================================================================
// BASIC UTILITY TYPES
// ============================================================================

/**
 * Makes all properties in T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Makes all properties in T required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Makes specified keys K in T optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Makes specified keys K in T required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Creates a type with all properties of T except those in K, made optional
 */
export type OptionalExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Extracts all string literal types from T
 */
export type StringKeys<T> = Extract<keyof T, string>;

/**
 * Extracts all number literal types from T
 */
export type NumberKeys<T> = Extract<keyof T, number>;

/**
 * Creates a union of all values in T
 */
export type ValueOf<T> = T[keyof T];

/**
 * Creates a type that requires at least one property from T
 */
export type AtLeastOne<T> = {
  [K in keyof T]: Pick<T, K> & Partial<Omit<T, K>>;
}[keyof T];

/**
 * Creates a type that allows exactly one property from T
 */
export type ExactlyOne<T> = {
  [K in keyof T]: Pick<T, K> & {
    [_P in Exclude<keyof T, K>]?: never;
  };
}[keyof T];

// ============================================================================
// FUNCTION UTILITY TYPES
// ============================================================================

/**
 * Extracts return type from async function
 */
export type AsyncReturnType<T extends (..._args: unknown[]) => Promise<unknown>> = T extends (
  ..._args: unknown[]
) => Promise<infer R>
  ? R
  : never;

/**
 * Creates a type-safe event handler
 */
export type EventHandler<T = Event> = (_event: T) => void;

/**
 * Creates a type-safe async event handler
 */
export type AsyncEventHandler<T = Event> = (_event: T) => Promise<void>;

/**
 * Extracts parameters from a function type
 */
export type Parameters<T extends (..._args: unknown[]) => unknown> = T extends (
  ..._args: infer P
) => unknown
  ? P
  : never;

/**
 * Creates a function type with specific parameters and return type
 */
export type Fn<P extends readonly unknown[] = [], R = void> = (..._args: P) => R;

/**
 * Creates an async function type with specific parameters and return type
 */
export type AsyncFn<P extends readonly unknown[] = [], R = void> = (
  ..._args: P
) => Promise<R>;

// ============================================================================
// API UTILITY TYPES
// ============================================================================

/**
 * Standard API response wrapper
 */
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
};

/**
 * Paginated API response
 */
export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}>;

/**
 * API error response
 */
export type ApiError = {
  success: false;
  error: string;
  code?: number;
  details?: Record<string, unknown>;
  timestamp: string;
};

/**
 * HTTP methods enum
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Request configuration
 */
export type RequestConfig = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
};

// ============================================================================
// FORM UTILITY TYPES
// ============================================================================

/**
 * Form field state
 */
export type FieldState<T = string> = {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
};

/**
 * Form state for all fields
 */
export type FormState<T extends Record<string, unknown>> = {
  [K in keyof T]: FieldState<T[K]>;
};

/**
 * Form validation result
 */
export type ValidationResult = {
  isValid: boolean;
  errors: Record<string, string>;
};

/**
 * Form submit handler
 */
export type FormSubmitHandler<T> = (_values: T) => Promise<void> | void;

// ============================================================================
// COMPONENT UTILITY TYPES
// ============================================================================

/**
 * Component props with children
 */
export type WithChildren<T = {}> = T & {
  children?: React.ReactNode;
};

/**
 * Component props with className
 */
export type WithClassName<T = {}> = T & {
  className?: string;
};

/**
 * Component props with optional ref
 */
export type WithRef<T = {}, R = HTMLElement> = T & {
  ref?: React.Ref<R>;
};

/**
 * Component props with all common properties
 */
export type ComponentProps<T = {}> = WithChildren<WithClassName<T>>;

/**
 * Props for components that can be disabled
 */
export type Disableable<T = {}> = T & {
  disabled?: boolean;
};

/**
 * Props for components with loading state
 */
export type Loadable<T = {}> = T & {
  loading?: boolean;
};

/**
 * Props for components with size variants
 */
export type Sizeable<T = {}> = T & {
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

/**
 * Props for components with color variants
 */
export type Colorable<T = {}> = T & {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
};

// ============================================================================
// STATE MANAGEMENT UTILITY TYPES
// ============================================================================

/**
 * Async state for data fetching
 */
export type AsyncState<T = unknown, E = Error> = {
  data?: T;
  loading: boolean;
  error?: E;
  lastUpdated?: Date;
};

/**
 * Action creator type
 */
export type ActionCreator<T = unknown> = (..._args: unknown[]) => T;

/**
 * Store state type
 */
export type StoreState<T> = T & {
  reset: () => void;
  setState: (_partial: Partial<T>) => void;
};

// ============================================================================
// DATE AND TIME UTILITY TYPES
// ============================================================================

/**
 * Time periods for stock data
 */
export type TimePeriod = '1d' | '1w' | '1m' | '3m' | '6m' | '1y' | 'max';

/**
 * Date range type
 */
export type DateRange = {
  start: Date;
  end: Date;
};

/**
 * Timestamp type (ISO string)
 */
export type Timestamp = string;

// ============================================================================
// ENVIRONMENT UTILITY TYPES
// ============================================================================

/**
 * Environment types
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * Feature flags type
 */
export type FeatureFlags = {
  [key: string]: boolean;
};

/**
 * Environment configuration
 */
export type EnvConfig = {
  environment: Environment;
  apiUrl: string;
  features: FeatureFlags;
  debug: boolean;
};

// ============================================================================
// STOCK-SPECIFIC UTILITY TYPES
// ============================================================================

/**
 * Stock symbol type
 */
export type StockSymbol = string;

/**
 * Currency type
 */
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD';

/**
 * Stock exchange type
 */
export type Exchange = 'NYSE' | 'NASDAQ' | 'LSE' | 'TSE' | 'TSX';

/**
 * Price change type
 */
export type PriceChange = {
  absolute: number;
  percentage: number;
  direction: 'up' | 'down' | 'neutral';
};

// ============================================================================
// CONDITIONAL UTILITY TYPES
// ============================================================================

/**
 * If T is true, return A, otherwise return B
 */
export type If<T extends boolean, A, B> = T extends true ? A : B;

/**
 * Check if T is never
 */
export type IsNever<T> = [T] extends [never] ? true : false;

/**
 * Check if T is any
 */
export type IsAny<T> = 0 extends 1 & T ? true : false;

/**
 * Check if T is unknown
 */
export type IsUnknown<T> = IsAny<T> extends true
  ? false
  : unknown extends T
  ? true
  : false;

/**
 * Check if T equals U
 */
export type Equals<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;

// ============================================================================
// UTILITY FUNCTIONS FOR TYPE CHECKING
// ============================================================================

/**
 * Type guard for checking if value is not null or undefined
 */
export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

/**
 * Type guard for checking if value is a string
 */
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

/**
 * Type guard for checking if value is a number
 */
export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

/**
 * Type guard for checking if value is a boolean
 */
export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

/**
 * Type guard for checking if value is an object
 */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/**
 * Type guard for checking if value is an array
 */
export const isArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value);
};

/**
 * Type guard for checking if value is a function
 */
export const isFunction = (value: unknown): value is Function => {
  return typeof value === 'function';
};

/**
 * Type guard for checking if value is a date
 */
export const isDate = (value: unknown): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

/**
 * Type guard for checking if value is a promise
 */
export const isPromise = <T>(value: unknown): value is Promise<T> => {
  return value instanceof Promise;
};

/**
 * Type assertion helper
 */
export const assertIs = <T>(value: unknown, guard: (value: unknown) => value is T): T => {
  if (!guard(value)) {
    throw new Error('Type assertion failed');
  }
  return value;
};

/**
 * Safe type casting with fallback
 */
export const safeCast = <T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  fallback: T
): T => {
  return guard(value) ? value : fallback;
};