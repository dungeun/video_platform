/**
 * @company/utils - 배열 유틸리티 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  isEmpty,
  hasDuplicates,
  removeDuplicates,
  shuffle,
  chunk,
  flatten,
  deepFlatten,
  intersection,
  union,
  difference,
  symmetricDifference,
  groupBy,
  partition,
  sum,
  average,
  max,
  min,
  compact,
  removeFalsy
} from '../array';

describe('Array Validation', () => {
  describe('isEmpty', () => {
    it('detects empty arrays', () => {
      const result = isEmpty([]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('detects non-empty arrays', () => {
      const result = isEmpty([1, 2, 3]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });

    it('handles invalid input', () => {
      const result = isEmpty('not an array' as any);
      expect(result.success).toBe(false);
    });
  });

  describe('hasDuplicates', () => {
    it('detects duplicates', () => {
      const result = hasDuplicates([1, 2, 2, 3]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('detects no duplicates', () => {
      const result = hasDuplicates([1, 2, 3, 4]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });
  });
});

describe('Array Manipulation', () => {
  describe('removeDuplicates', () => {
    it('removes duplicate values', () => {
      const result = removeDuplicates([1, 2, 2, 3, 3, 4]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([1, 2, 3, 4]);
      }
    });
  });

  describe('shuffle', () => {
    it('shuffles array elements', () => {
      const original = [1, 2, 3, 4, 5];
      const result = shuffle(original);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(5);
        expect(result.data.sort()).toEqual([1, 2, 3, 4, 5]);
        // 원본 배열은 변경되지 않아야 함
        expect(original).toEqual([1, 2, 3, 4, 5]);
      }
    });
  });

  describe('chunk', () => {
    it('splits array into chunks', () => {
      const result = chunk([1, 2, 3, 4, 5], 2);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([[1, 2], [3, 4], [5]]);
      }
    });

    it('handles invalid chunk size', () => {
      const result = chunk([1, 2, 3], 0);
      expect(result.success).toBe(false);
    });
  });

  describe('flatten', () => {
    it('flattens one level', () => {
      const result = flatten([1, [2, 3], [4, 5]]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([1, 2, 3, 4, 5]);
      }
    });
  });

  describe('deepFlatten', () => {
    it('flattens all levels', () => {
      const result = deepFlatten([1, [2, [3, [4, 5]]]]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([1, 2, 3, 4, 5]);
      }
    });
  });
});

describe('Array Set Operations', () => {
  describe('intersection', () => {
    it('finds common elements', () => {
      const result = intersection([1, 2, 3], [2, 3, 4]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort()).toEqual([2, 3]);
      }
    });
  });

  describe('union', () => {
    it('combines arrays without duplicates', () => {
      const result = union([1, 2], [2, 3]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort()).toEqual([1, 2, 3]);
      }
    });
  });

  describe('difference', () => {
    it('finds elements in first array but not second', () => {
      const result = difference([1, 2, 3], [2, 3, 4]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([1]);
      }
    });
  });

  describe('symmetricDifference', () => {
    it('finds elements not in both arrays', () => {
      const result = symmetricDifference([1, 2, 3], [2, 3, 4]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort()).toEqual([1, 4]);
      }
    });
  });
});

describe('Array Grouping', () => {
  describe('groupBy', () => {
    it('groups objects by key', () => {
      const items = [
        { category: 'A', value: 1 },
        { category: 'B', value: 2 },
        { category: 'A', value: 3 }
      ];
      const result = groupBy(items, 'category');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          A: [{ category: 'A', value: 1 }, { category: 'A', value: 3 }],
          B: [{ category: 'B', value: 2 }]
        });
      }
    });
  });

  describe('partition', () => {
    it('splits array by predicate', () => {
      const result = partition([1, 2, 3, 4, 5], n => n % 2 === 0);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0]).toEqual([2, 4]); // even numbers
        expect(result.data[1]).toEqual([1, 3, 5]); // odd numbers
      }
    });
  });
});

describe('Array Statistics', () => {
  describe('sum', () => {
    it('calculates sum of numbers', () => {
      const result = sum([1, 2, 3, 4, 5]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(15);
      }
    });

    it('handles invalid input', () => {
      const result = sum([1, 'invalid', 3] as any);
      expect(result.success).toBe(false);
    });
  });

  describe('average', () => {
    it('calculates average of numbers', () => {
      const result = average([1, 2, 3, 4, 5]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(3);
      }
    });

    it('handles empty array', () => {
      const result = average([]);
      expect(result.success).toBe(false);
    });
  });

  describe('max', () => {
    it('finds maximum value', () => {
      const result = max([1, 5, 3, 2, 4]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(5);
      }
    });
  });

  describe('min', () => {
    it('finds minimum value', () => {
      const result = min([1, 5, 3, 2, 4]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }
    });
  });
});

describe('Array Filtering', () => {
  describe('compact', () => {
    it('removes null and undefined', () => {
      const result = compact([1, null, 2, undefined, 3]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([1, 2, 3]);
      }
    });
  });

  describe('removeFalsy', () => {
    it('removes falsy values', () => {
      const result = removeFalsy([1, 0, 2, false, 3, '', 4, null, 5]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([1, 2, 3, 4, 5]);
      }
    });
  });
});