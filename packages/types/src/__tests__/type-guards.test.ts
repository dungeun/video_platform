/**
 * @company/types - 타입 가드 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  isNotNull,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isFunction,
  isDate,
  isEmail,
  isUrl,
  isUuid,
  isNotEmptyString,
  isPositiveNumber,
  isNonNegativeNumber,
  isInteger,
  hasProperty,
  isArrayOf,
  toString,
  toNumber,
  toBoolean,
  toDate,
  deepClone,
  removeNullish,
  removeEmpty
} from '../index';

describe('Type Guards', () => {
  describe('isNotNull', () => {
    it('returns true for non-null values', () => {
      expect(isNotNull('test')).toBe(true);
      expect(isNotNull(0)).toBe(true);
      expect(isNotNull(false)).toBe(true);
      expect(isNotNull([])).toBe(true);
      expect(isNotNull({})).toBe(true);
    });

    it('returns false for null/undefined', () => {
      expect(isNotNull(null)).toBe(false);
      expect(isNotNull(undefined)).toBe(false);
    });
  });

  describe('isString', () => {
    it('returns true for strings', () => {
      expect(isString('test')).toBe(true);
      expect(isString('')).toBe(true);
    });

    it('returns false for non-strings', () => {
      expect(isString(123)).toBe(false);
      expect(isString(true)).toBe(false);
      expect(isString(null)).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('returns true for valid numbers', () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-123)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
    });

    it('returns false for NaN and non-numbers', () => {
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber('123')).toBe(false);
      expect(isNumber(true)).toBe(false);
    });
  });

  describe('isBoolean', () => {
    it('returns true for booleans', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
    });

    it('returns false for non-booleans', () => {
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean('true')).toBe(false);
    });
  });

  describe('isObject', () => {
    it('returns true for objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
    });

    it('returns false for non-objects', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject([])).toBe(false);
      expect(isObject('test')).toBe(false);
    });
  });

  describe('isArray', () => {
    it('returns true for arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
    });

    it('returns false for non-arrays', () => {
      expect(isArray({})).toBe(false);
      expect(isArray('test')).toBe(false);
    });
  });

  describe('isFunction', () => {
    it('returns true for functions', () => {
      expect(isFunction(() => {})).toBe(true);
      expect(isFunction(function() {})).toBe(true);
    });

    it('returns false for non-functions', () => {
      expect(isFunction({})).toBe(false);
      expect(isFunction('test')).toBe(false);
    });
  });

  describe('isDate', () => {
    it('returns true for valid dates', () => {
      expect(isDate(new Date())).toBe(true);
      expect(isDate(new Date('2023-01-01'))).toBe(true);
    });

    it('returns false for invalid dates', () => {
      expect(isDate(new Date('invalid'))).toBe(false);
      expect(isDate('2023-01-01')).toBe(false);
      expect(isDate(123)).toBe(false);
    });
  });

  describe('isEmail', () => {
    it('returns true for valid emails', () => {
      expect(isEmail('test@example.com')).toBe(true);
      expect(isEmail('user.name@domain.co.kr')).toBe(true);
    });

    it('returns false for invalid emails', () => {
      expect(isEmail('invalid-email')).toBe(false);
      expect(isEmail('@example.com')).toBe(false);
      expect(isEmail('test@')).toBe(false);
    });
  });

  describe('isUrl', () => {
    it('returns true for valid URLs', () => {
      expect(isUrl('https://example.com')).toBe(true);
      expect(isUrl('http://localhost:3000')).toBe(true);
    });

    it('returns false for invalid URLs', () => {
      expect(isUrl('not-a-url')).toBe(false);
      expect(isUrl('example.com')).toBe(false);
    });
  });

  describe('isUuid', () => {
    it('returns true for valid UUIDs', () => {
      expect(isUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    });

    it('returns false for invalid UUIDs', () => {
      expect(isUuid('not-a-uuid')).toBe(false);
      expect(isUuid('123-456-789')).toBe(false);
    });
  });

  describe('isNotEmptyString', () => {
    it('returns true for non-empty strings', () => {
      expect(isNotEmptyString('test')).toBe(true);
      expect(isNotEmptyString(' test ')).toBe(true);
    });

    it('returns false for empty strings', () => {
      expect(isNotEmptyString('')).toBe(false);
      expect(isNotEmptyString('   ')).toBe(false);
      expect(isNotEmptyString(123)).toBe(false);
    });
  });

  describe('isPositiveNumber', () => {
    it('returns true for positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(3.14)).toBe(true);
    });

    it('returns false for non-positive numbers', () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber('1')).toBe(false);
    });
  });

  describe('isNonNegativeNumber', () => {
    it('returns true for non-negative numbers', () => {
      expect(isNonNegativeNumber(0)).toBe(true);
      expect(isNonNegativeNumber(1)).toBe(true);
    });

    it('returns false for negative numbers', () => {
      expect(isNonNegativeNumber(-1)).toBe(false);
      expect(isNonNegativeNumber('0')).toBe(false);
    });
  });

  describe('isInteger', () => {
    it('returns true for integers', () => {
      expect(isInteger(123)).toBe(true);
      expect(isInteger(0)).toBe(true);
      expect(isInteger(-123)).toBe(true);
    });

    it('returns false for non-integers', () => {
      expect(isInteger(3.14)).toBe(false);
      expect(isInteger('123')).toBe(false);
    });
  });

  describe('hasProperty', () => {
    it('returns true when object has property', () => {
      const obj = { key: 'value' };
      expect(hasProperty(obj, 'key')).toBe(true);
    });

    it('returns false when object lacks property', () => {
      const obj = { key: 'value' };
      expect(hasProperty(obj, 'missing')).toBe(false);
    });
  });

  describe('isArrayOf', () => {
    it('returns true when all elements match type guard', () => {
      expect(isArrayOf([1, 2, 3], isNumber)).toBe(true);
      expect(isArrayOf(['a', 'b', 'c'], isString)).toBe(true);
    });

    it('returns false when elements don\'t match', () => {
      expect(isArrayOf([1, 'a', 3], isNumber)).toBe(false);
      expect(isArrayOf('not-array', isString)).toBe(false);
    });
  });
});

describe('Conversion Utilities', () => {
  describe('toString', () => {
    it('converts values to strings', () => {
      expect(toString('test')).toBe('test');
      expect(toString(123)).toBe('123');
      expect(toString(true)).toBe('true');
      expect(toString(null)).toBe('');
      expect(toString(undefined)).toBe('');
    });

    it('converts complex values', () => {
      const date = new Date('2023-01-01');
      expect(toString(date)).toBe(date.toISOString());
      expect(toString({ key: 'value' })).toBe('{"key":"value"}');
      expect(toString([1, 2, 3])).toBe('[1,2,3]');
    });
  });

  describe('toNumber', () => {
    it('converts valid numbers', () => {
      expect(toNumber(123)).toBe(123);
      expect(toNumber('123')).toBe(123);
      expect(toNumber('3.14')).toBe(3.14);
    });

    it('returns null for invalid conversions', () => {
      expect(toNumber('invalid')).toBe(null);
      expect(toNumber({})).toBe(null);
    });
  });

  describe('toBoolean', () => {
    it('converts truthy values', () => {
      expect(toBoolean(true)).toBe(true);
      expect(toBoolean('true')).toBe(true);
      expect(toBoolean('1')).toBe(true);
      expect(toBoolean('yes')).toBe(true);
      expect(toBoolean(1)).toBe(true);
    });

    it('converts falsy values', () => {
      expect(toBoolean(false)).toBe(false);
      expect(toBoolean('false')).toBe(false);
      expect(toBoolean('0')).toBe(false);
      expect(toBoolean(0)).toBe(false);
      expect(toBoolean('')).toBe(false);
    });
  });

  describe('toDate', () => {
    it('converts valid dates', () => {
      const date = new Date();
      expect(toDate(date)).toBe(date);
      expect(toDate('2023-01-01')).toBeInstanceOf(Date);
      expect(toDate(1640995200000)).toBeInstanceOf(Date);
    });

    it('returns null for invalid dates', () => {
      expect(toDate('invalid')).toBe(null);
      expect(toDate({})).toBe(null);
    });
  });
});

describe('Object Utilities', () => {
  describe('deepClone', () => {
    it('clones primitive values', () => {
      expect(deepClone('test')).toBe('test');
      expect(deepClone(123)).toBe(123);
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
    });

    it('clones objects', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });

    it('clones arrays', () => {
      const arr = [1, [2, 3], { a: 4 }];
      const cloned = deepClone(arr);
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[1]).not.toBe(arr[1]);
    });

    it('clones dates', () => {
      const date = new Date();
      const cloned = deepClone(date);
      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
    });
  });

  describe('removeNullish', () => {
    it('removes null and undefined values', () => {
      const obj = { a: 1, b: null, c: undefined, d: 'test' };
      const result = removeNullish(obj);
      expect(result).toEqual({ a: 1, d: 'test' });
    });

    it('keeps falsy but non-nullish values', () => {
      const obj = { a: 0, b: false, c: '', d: null };
      const result = removeNullish(obj);
      expect(result).toEqual({ a: 0, b: false, c: '' });
    });
  });

  describe('removeEmpty', () => {
    it('removes empty values', () => {
      const obj = { 
        a: 1, 
        b: '', 
        c: [], 
        d: {}, 
        e: null, 
        f: undefined, 
        g: 'test' 
      };
      const result = removeEmpty(obj);
      expect(result).toEqual({ a: 1, g: 'test' });
    });
  });
});