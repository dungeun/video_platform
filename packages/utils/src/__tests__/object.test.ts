/**
 * @repo/utils - 객체 유틸리티 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  isEmpty,
  hasKey,
  hasKeys,
  deepClone,
  shallowClone,
  merge,
  deepMerge,
  pick,
  omit,
  compact,
  removeFalsy,
  mapKeys,
  mapValues,
  invert,
  get,
  set,
  isSubset
} from '../object';

describe('Object Validation', () => {
  describe('isEmpty', () => {
    it('detects empty objects', () => {
      const result = isEmpty({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('detects non-empty objects', () => {
      const result = isEmpty({ key: 'value' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });

    it('handles invalid input', () => {
      const result = isEmpty(null as any);
      expect(result.success).toBe(false);
    });
  });

  describe('hasKey', () => {
    it('detects existing keys', () => {
      const result = hasKey({ a: 1, b: 2 }, 'a');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('detects missing keys', () => {
      const result = hasKey({ a: 1, b: 2 }, 'c');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });
  });

  describe('hasKeys', () => {
    it('detects all existing keys', () => {
      const result = hasKeys({ a: 1, b: 2, c: 3 }, ['a', 'b']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('detects missing keys', () => {
      const result = hasKeys({ a: 1, b: 2 }, ['a', 'c']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });
  });
});

describe('Object Cloning', () => {
  describe('deepClone', () => {
    it('creates deep copy of objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const result = deepClone(original);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(original);
        expect(result.data).not.toBe(original);
        expect(result.data.b).not.toBe(original.b);
      }
    });

    it('handles arrays', () => {
      const original = [1, [2, 3], { a: 4 }];
      const result = deepClone(original);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(original);
        expect(result.data).not.toBe(original);
        expect(result.data[1]).not.toBe(original[1]);
        expect(result.data[2]).not.toBe(original[2]);
      }
    });

    it('handles dates', () => {
      const original = new Date('2023-01-01');
      const result = deepClone(original);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(original);
        expect(result.data).not.toBe(original);
      }
    });

    it('handles primitives', () => {
      const result = deepClone('hello');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('hello');
      }
    });
  });

  describe('shallowClone', () => {
    it('creates shallow copy of objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const result = shallowClone(original);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(original);
        expect(result.data).not.toBe(original);
        expect(result.data.b).toBe(original.b); // shallow copy
      }
    });
  });
});

describe('Object Merging', () => {
  describe('merge', () => {
    it('merges objects', () => {
      const result = merge({ a: 1, b: 2 }, { b: 3, c: 4 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ a: 1, b: 3, c: 4 });
      }
    });
  });

  describe('deepMerge', () => {
    it('deeply merges objects', () => {
      const target = { a: 1, b: { x: 1, y: 2 } };
      const source = { b: { y: 3, z: 4 }, c: 5 };
      const result = deepMerge(target, source);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          a: 1,
          b: { x: 1, y: 3, z: 4 },
          c: 5
        });
      }
    });
  });
});

describe('Object Filtering', () => {
  describe('pick', () => {
    it('picks specified keys', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const result = pick(obj, ['a', 'c']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ a: 1, c: 3 });
      }
    });
  });

  describe('omit', () => {
    it('omits specified keys', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const result = omit(obj, ['b', 'd']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ a: 1, c: 3 });
      }
    });
  });

  describe('compact', () => {
    it('removes null and undefined values', () => {
      const obj = { a: 1, b: null, c: undefined, d: 0, e: false };
      const result = compact(obj);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ a: 1, d: 0, e: false });
      }
    });
  });

  describe('removeFalsy', () => {
    it('removes falsy values', () => {
      const obj = { a: 1, b: 0, c: false, d: null, e: '', f: 'hello' };
      const result = removeFalsy(obj);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ a: 1, f: 'hello' });
      }
    });
  });
});

describe('Object Transformation', () => {
  describe('mapKeys', () => {
    it('transforms object keys', () => {
      const obj = { firstName: 'John', lastName: 'Doe' };
      const result = mapKeys(obj, key => key.toUpperCase());
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ FIRSTNAME: 'John', LASTNAME: 'Doe' });
      }
    });
  });

  describe('mapValues', () => {
    it('transforms object values', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = mapValues(obj, value => value * 2);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ a: 2, b: 4, c: 6 });
      }
    });
  });

  describe('invert', () => {
    it('swaps keys and values', () => {
      const obj = { a: '1', b: '2', c: '3' };
      const result = invert(obj);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ '1': 'a', '2': 'b', '3': 'c' });
      }
    });
  });
});

describe('Nested Object Access', () => {
  describe('get', () => {
    it('gets nested values', () => {
      const obj = { a: { b: { c: 'value' } } };
      const result = get(obj, 'a.b.c');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('value');
      }
    });

    it('returns default for missing paths', () => {
      const obj = { a: { b: {} } };
      const result = get(obj, 'a.b.c', 'default');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('default');
      }
    });
  });

  describe('set', () => {
    it('sets nested values', () => {
      const obj = { a: { b: {} } };
      const result = set(obj, 'a.b.c', 'value');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.a.b.c).toBe('value');
        // 원본 객체는 변경되지 않아야 함
        expect(obj.a.b).not.toHaveProperty('c');
      }
    });

    it('creates missing intermediate objects', () => {
      const obj = {};
      const result = set(obj, 'a.b.c', 'value');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ a: { b: { c: 'value' } } });
      }
    });
  });
});

describe('Object Comparison', () => {
  describe('isSubset', () => {
    it('detects subset relationship', () => {
      const subset = { a: 1, b: 2 };
      const superset = { a: 1, b: 2, c: 3 };
      const result = isSubset(subset, superset);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('detects non-subset relationship', () => {
      const subset = { a: 1, b: 3 };
      const superset = { a: 1, b: 2, c: 3 };
      const result = isSubset(subset, superset);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });
  });
});