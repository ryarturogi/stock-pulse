/**
 * Shared Validation Utilities
 * ===========================
 *
 * Common validation functions and patterns used across the application.
 * Provides type-safe validation with consistent error messages.
 */

import { isString, isNumber } from '@/core/types/utils';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Stock symbol validation
 */
export function validateSymbol(symbol: unknown): ValidationResult {
  if (!isString(symbol)) {
    return { isValid: false, error: 'Symbol must be a string' };
  }

  const trimmed = symbol.trim().toUpperCase();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Symbol cannot be empty' };
  }

  if (trimmed.length > 5) {
    return {
      isValid: false,
      error: 'Symbol cannot be longer than 5 characters',
    };
  }

  // Basic validation: letters only
  if (!/^[A-Z]{1,5}$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Symbol must contain only letters (1-5 characters)',
    };
  }

  return { isValid: true };
}

/**
 * Alert price validation
 */
export function validateAlertPrice(price: unknown): ValidationResult {
  if (typeof price === 'string') {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) {
      return { isValid: false, error: 'Price must be a valid number' };
    }
    return validateAlertPriceNumber(numPrice);
  }

  if (!isNumber(price)) {
    return { isValid: false, error: 'Price must be a number' };
  }

  return validateAlertPriceNumber(price);
}

/**
 * Internal alert price number validation
 */
function validateAlertPriceNumber(price: number): ValidationResult {
  if (price <= 0) {
    return { isValid: false, error: 'Price must be greater than 0' };
  }

  if (price >= 1000000) {
    return { isValid: false, error: 'Price must be less than $1,000,000' };
  }

  // Check for reasonable decimal places (max 2)
  const decimalPlaces = (price.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return {
      isValid: false,
      error: 'Price cannot have more than 2 decimal places',
    };
  }

  return { isValid: true };
}

/**
 * Email validation (for notifications)
 */
export function validateEmail(email: unknown): ValidationResult {
  if (!isString(email)) {
    return { isValid: false, error: 'Email must be a string' };
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Email cannot be empty' };
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

/**
 * URL validation (for API endpoints)
 */
export function validateUrl(url: unknown): ValidationResult {
  if (!isString(url)) {
    return { isValid: false, error: 'URL must be a string' };
  }

  const trimmed = url.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'URL cannot be empty' };
  }

  try {
    new URL(trimmed);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Please enter a valid URL' };
  }
}

/**
 * Refresh interval validation
 */
export function validateRefreshInterval(interval: unknown): ValidationResult {
  if (!isString(interval)) {
    return { isValid: false, error: 'Refresh interval must be a string' };
  }

  const validIntervals = ['30s', '1m', '2m', '5m', '10m', '30m', '1h'];

  if (!validIntervals.includes(interval)) {
    return {
      isValid: false,
      error: `Refresh interval must be one of: ${validIntervals.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Form validation utilities
 */
export interface FormValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (_value: unknown) => ValidationResult;
}

/**
 * Generic form field validation
 */
export function validateFormField(
  value: unknown,
  fieldName: string,
  options: FormValidationOptions = {}
): ValidationResult {
  const {
    required = false,
    minLength,
    maxLength,
    pattern,
    customValidator,
  } = options;

  // Required validation
  if (required && (value === null || value === undefined || value === '')) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  // If not required and empty, it's valid
  if (!required && (value === null || value === undefined || value === '')) {
    return { isValid: true };
  }

  // Ensure it's a string for further validation
  if (!isString(value)) {
    return { isValid: false, error: `${fieldName} must be a string` };
  }

  const stringValue = value.trim();

  // Length validations
  if (minLength !== undefined && stringValue.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters long`,
    };
  }

  if (maxLength !== undefined && stringValue.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} cannot be longer than ${maxLength} characters`,
    };
  }

  // Pattern validation
  if (pattern && !pattern.test(stringValue)) {
    return {
      isValid: false,
      error: `${fieldName} has invalid format`,
    };
  }

  // Custom validation
  if (customValidator) {
    return customValidator(stringValue);
  }

  return { isValid: true };
}

/**
 * Validate multiple fields at once
 */
export function validateForm(
  data: Record<string, unknown>,
  validationRules: Record<string, FormValidationOptions>
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const [fieldName, rules] of Object.entries(validationRules)) {
    const value = data[fieldName];
    const result = validateFormField(value, fieldName, rules);

    if (!result.isValid && result.error) {
      errors[fieldName] = result.error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Stock form specific validation
 */
export function validateStockForm(formData: {
  symbol?: unknown;
  alertPrice?: unknown;
  name?: unknown;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Validate symbol
  const symbolResult = validateSymbol(formData.symbol);
  if (!symbolResult.isValid && symbolResult.error) {
    errors.symbol = symbolResult.error;
  }

  // Validate alert price
  const priceResult = validateAlertPrice(formData.alertPrice);
  if (!priceResult.isValid && priceResult.error) {
    errors.alertPrice = priceResult.error;
  }

  // Validate name (optional but if provided should be valid)
  if (
    formData.name !== undefined &&
    formData.name !== null &&
    formData.name !== ''
  ) {
    const nameResult = validateFormField(formData.name, 'Stock name', {
      minLength: 1,
      maxLength: 100,
    });
    if (!nameResult.isValid && nameResult.error) {
      errors.name = nameResult.error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * API request validation utilities
 */
export function validateApiRequest(
  body: unknown,
  requiredFields: string[]
): ValidationResult {
  if (typeof body !== 'object' || body === null) {
    return { isValid: false, error: 'Request body must be an object' };
  }

  const data = body as Record<string, unknown>;

  for (const field of requiredFields) {
    if (!(field in data) || data[field] === undefined || data[field] === null) {
      return { isValid: false, error: `Missing required field: ${field}` };
    }
  }

  return { isValid: true };
}

/**
 * Sanitization utilities
 */
export function sanitizeSymbol(symbol: unknown): string {
  if (!isString(symbol)) return '';
  return symbol.trim().toUpperCase();
}

export function sanitizePrice(price: unknown): number | null {
  if (isNumber(price)) return price;
  if (isString(price)) {
    const parsed = parseFloat(price);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function sanitizeString(
  value: unknown,
  maxLength: number = 1000
): string {
  if (!isString(value)) return '';
  return value.trim().slice(0, maxLength);
}

/**
 * Enhanced input sanitization for security
 */
export function sanitizeHtml(input: unknown): string {
  if (!isString(input)) return '';

  // Remove potentially dangerous HTML tags and attributes
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    .replace(/<link\b[^<]*>/gi, '')
    .replace(/<meta\b[^<]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Validate and sanitize search queries
 */
export function validateSearchQuery(query: unknown): ValidationResult {
  if (!isString(query)) {
    return { isValid: false, error: 'Search query must be a string' };
  }

  const trimmed = query.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Search query cannot be empty' };
  }

  if (trimmed.length > 100) {
    return {
      isValid: false,
      error: 'Search query too long (max 100 characters)',
    };
  }

  // Check for potentially malicious patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        error: 'Search query contains invalid characters',
      };
    }
  }

  return { isValid: true };
}

/**
 * Validate numeric ranges
 */
export function validateNumericRange(
  value: unknown,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  if (!isNumber(value)) {
    return { isValid: false, error: `${fieldName} must be a number` };
  }

  if (value < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}` };
  }

  if (value > max) {
    return { isValid: false, error: `${fieldName} must be at most ${max}` };
  }

  return { isValid: true };
}

/**
 * Validate array inputs
 */
export function validateArray(
  value: unknown,
  fieldName: string,
  maxLength: number = 100
): ValidationResult {
  if (!Array.isArray(value)) {
    return { isValid: false, error: `${fieldName} must be an array` };
  }

  if (value.length === 0) {
    return { isValid: false, error: `${fieldName} cannot be empty` };
  }

  if (value.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} cannot have more than ${maxLength} items`,
    };
  }

  return { isValid: true };
}

/**
 * Validate object structure
 */
export function validateObjectStructure(
  value: unknown,
  requiredKeys: string[],
  fieldName: string
): ValidationResult {
  if (typeof value !== 'object' || value === null) {
    return { isValid: false, error: `${fieldName} must be an object` };
  }

  const obj = value as Record<string, unknown>;

  for (const key of requiredKeys) {
    if (!(key in obj)) {
      return {
        isValid: false,
        error: `${fieldName} is missing required property: ${key}`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Validation helper for quick checks (returns boolean)
 */
export const isValidSymbol = (symbol: unknown): boolean =>
  validateSymbol(symbol).isValid;
export const isValidAlertPrice = (price: unknown): boolean =>
  validateAlertPrice(price).isValid;
export const isValidEmail = (email: unknown): boolean =>
  validateEmail(email).isValid;
export const isValidUrl = (url: unknown): boolean => validateUrl(url).isValid;
export const isValidSearchQuery = (query: unknown): boolean =>
  validateSearchQuery(query).isValid;
