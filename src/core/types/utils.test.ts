/**
 * Unit Tests for Core Type Utilities
 * ==================================
 * 
 * Tests for type guards and utility functions
 */

import {
  isString,
  isNumber,
  isDefined,
  isBoolean,
  isObject,
  isArray,
  isFunction,
  isDate,
  isPromise,
  assertIs,
  safeCast,
} from './utils';

describe('Core Type Utilities', () => {
  describe('isString', () => {
    it('should return true for valid strings', () => {
      expect(isString('hello')).toBe(true);
      expect(isString('')).toBe(true);
      expect(isString('123')).toBe(true);
      expect(isString(String(123))).toBe(true);
      expect(isString(`template string`)).toBe(true);
    });

    it('should return false for non-strings', () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString({})).toBe(false);
      expect(isString([])).toBe(false);
      expect(isString(true)).toBe(false);
      expect(isString(Symbol('test'))).toBe(false);
      expect(isString(BigInt(123))).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('should return true for valid numbers', () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-123)).toBe(true);
      expect(isNumber(123.45)).toBe(true);
      expect(isNumber(Infinity)).toBe(true);
      expect(isNumber(-Infinity)).toBe(true);
      expect(isNumber(Number.MAX_VALUE)).toBe(true);
      expect(isNumber(Number.MIN_VALUE)).toBe(true);
      expect(isNumber(1e10)).toBe(true);
    });

    it('should return false for non-numbers and NaN', () => {
      expect(isNumber('123')).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
      expect(isNumber({})).toBe(false);
      expect(isNumber([])).toBe(false);
      expect(isNumber(true)).toBe(false);
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber('NaN')).toBe(false);
      expect(isNumber(Number('abc'))).toBe(false);
    });
  });

  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined('hello')).toBe(true);
      expect(isDefined(123)).toBe(true);
      expect(isDefined(0)).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined({})).toBe(true);
      expect(isDefined([])).toBe(true);
      expect(isDefined('')).toBe(true);
      expect(isDefined(NaN)).toBe(true);
      expect(isDefined(Symbol('test'))).toBe(true);
    });

    it('should return false for undefined and null', () => {
      expect(isDefined(undefined)).toBe(false);
      expect(isDefined(null)).toBe(false);
    });

    it('should act as type guard', () => {
      const value: string | null | undefined = Math.random() > 0.5 ? 'test' : null;
      if (isDefined(value)) {
        // TypeScript should infer value as string here
        expect(typeof value).toBe('string');
      }
    });
  });

  describe('isBoolean', () => {
    it('should return true for valid booleans', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean(Boolean(0))).toBe(true);
      expect(isBoolean(Boolean(1))).toBe(true);
      expect(isBoolean(!!0)).toBe(true);
      expect(isBoolean(!!1)).toBe(true);
    });

    it('should return false for non-booleans', () => {
      expect(isBoolean('true')).toBe(false);
      expect(isBoolean('false')).toBe(false);
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean(null)).toBe(false);
      expect(isBoolean(undefined)).toBe(false);
      expect(isBoolean({})).toBe(false);
      expect(isBoolean([])).toBe(false);
    });
  });

  describe('isObject', () => {
    it('should return true for valid objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
      expect(isObject(new Date())).toBe(true);
      expect(isObject(new Error())).toBe(true);
      expect(isObject(/regex/)).toBe(true);
    });

    it('should return false for non-objects', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject(true)).toBe(false);
      expect(isObject([])).toBe(false);
      expect(isObject(() => {})).toBe(false);
    });
  });

  describe('isArray', () => {
    it('should return true for valid arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray(['a', 'b', 'c'])).toBe(true);
      expect(isArray(new Array(5))).toBe(true);
      expect(isArray(Array.from('hello'))).toBe(true);
    });

    it('should return false for non-arrays', () => {
      expect(isArray({})).toBe(false);
      expect(isArray(null)).toBe(false);
      expect(isArray(undefined)).toBe(false);
      expect(isArray('string')).toBe(false);
      expect(isArray(123)).toBe(false);
      expect(isArray(true)).toBe(false);
      expect(isArray(() => {})).toBe(false);
    });

    it('should preserve array type information', () => {
      const value: unknown = [1, 2, 3];
      if (isArray<number>(value)) {
        expect(value.length).toBe(3);
        expect(value[0]).toBe(1);
      }
    });
  });

  describe('isFunction', () => {
    it('should return true for valid functions', () => {
      expect(isFunction(() => {})).toBe(true);
      expect(isFunction(function() {})).toBe(true);
      expect(isFunction(async () => {})).toBe(true);
      expect(isFunction(Math.max)).toBe(true);
      expect(isFunction(console.log)).toBe(true);
      expect(isFunction(Array.isArray)).toBe(true);
      expect(isFunction(class TestClass {})).toBe(true);
    });

    it('should return false for non-functions', () => {
      expect(isFunction({})).toBe(false);
      expect(isFunction([])).toBe(false);
      expect(isFunction(null)).toBe(false);
      expect(isFunction(undefined)).toBe(false);
      expect(isFunction('function')).toBe(false);
      expect(isFunction(123)).toBe(false);
      expect(isFunction(true)).toBe(false);
    });
  });

  describe('isDate', () => {
    it('should return true for valid dates', () => {
      expect(isDate(new Date())).toBe(true);
      expect(isDate(new Date('2023-01-01'))).toBe(true);
      expect(isDate(new Date(2023, 0, 1))).toBe(true);
      expect(isDate(new Date(Date.now()))).toBe(true);
    });

    it('should return false for invalid dates and non-dates', () => {
      expect(isDate(new Date('invalid'))).toBe(false);
      expect(isDate('2023-01-01')).toBe(false);
      expect(isDate(Date.now())).toBe(false);
      expect(isDate({})).toBe(false);
      expect(isDate(null)).toBe(false);
      expect(isDate(undefined)).toBe(false);
    });
  });

  describe('isPromise', () => {
    it('should return true for valid promises', () => {
      expect(isPromise(Promise.resolve())).toBe(true);
      expect(isPromise(Promise.reject().catch(() => {}))).toBe(true);
      expect(isPromise(new Promise(() => {}))).toBe(true);
      expect(isPromise((async () => {})())).toBe(true);
    });

    it('should return false for non-promises', () => {
      expect(isPromise({})).toBe(false);
      expect(isPromise({ then: () => {} })).toBe(false);
      expect(isPromise(null)).toBe(false);
      expect(isPromise(undefined)).toBe(false);
      expect(isPromise('promise')).toBe(false);
      expect(isPromise(() => {})).toBe(false);
    });
  });

  describe('assertIs', () => {
    it('should return value when guard passes', () => {
      const value = 'test';
      const result = assertIs(value, isString);
      expect(result).toBe('test');
    });

    it('should throw error when guard fails', () => {
      expect(() => assertIs(123, isString)).toThrow('Type assertion failed');
      expect(() => assertIs(null, isString)).toThrow('Type assertion failed');
      expect(() => assertIs(undefined, isString)).toThrow('Type assertion failed');
    });

    it('should work with custom type guards', () => {
      const isPositiveNumber = (value: unknown): value is number => 
        isNumber(value) && value > 0;
      
      expect(assertIs(5, isPositiveNumber)).toBe(5);
      expect(() => assertIs(-5, isPositiveNumber)).toThrow('Type assertion failed');
      expect(() => assertIs('5', isPositiveNumber)).toThrow('Type assertion failed');
    });
  });

  describe('safeCast', () => {
    it('should return value when guard passes', () => {
      const result = safeCast('test', isString, 'fallback');
      expect(result).toBe('test');
    });

    it('should return fallback when guard fails', () => {
      const result = safeCast(123, isString, 'fallback');
      expect(result).toBe('fallback');
    });

    it('should work with different types', () => {
      expect(safeCast(42, isNumber, 0)).toBe(42);
      expect(safeCast('42', isNumber, 0)).toBe(0);
      
      expect(safeCast(true, isBoolean, false)).toBe(true);
      expect(safeCast('true', isBoolean, false)).toBe(false);
      
      expect(safeCast([1, 2, 3], isArray, [])).toEqual([1, 2, 3]);
      expect(safeCast('not array', isArray, [])).toEqual([]);
    });

    it('should work with complex fallbacks', () => {
      const defaultUser = { name: 'Anonymous', id: 0 };
      const validUser = { name: 'John', id: 123 };
      
      const isUser = (value: unknown): value is typeof validUser => 
        isObject(value) && 'name' in value && 'id' in value;
      
      expect(safeCast(validUser, isUser, defaultUser)).toEqual(validUser);
      expect(safeCast('invalid', isUser, defaultUser)).toEqual(defaultUser);
    });
  });

  describe('Type Guard Edge Cases', () => {
    it('should handle Symbol values', () => {
      const symbol = Symbol('test');
      expect(isString(symbol)).toBe(false);
      expect(isObject(symbol)).toBe(false);
      expect(isFunction(symbol)).toBe(false);
    });

    it('should handle BigInt values', () => {
      const bigint = BigInt(123);
      expect(isNumber(bigint)).toBe(false);
      expect(isString(bigint)).toBe(false);
      expect(isObject(bigint)).toBe(false);
    });

    it('should handle prototype pollution attempts', () => {
      const maliciousObj = JSON.parse('{"__proto__":{"isAdmin":true}}');
      expect(isObject(maliciousObj)).toBe(true);
      expect('isAdmin' in maliciousObj).toBe(false); // Prototype pollution should not work
    });

    it('should handle circular references', () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;
      
      expect(isObject(circular)).toBe(true);
      expect(isArray(circular)).toBe(false);
    });

    it('should handle frozen and sealed objects', () => {
      const frozen = Object.freeze({ test: 'value' });
      const sealed = Object.seal({ test: 'value' });
      
      expect(isObject(frozen)).toBe(true);
      expect(isObject(sealed)).toBe(true);
    });
  });
});