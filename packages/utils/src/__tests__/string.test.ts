/**
 * @company/utils - 문자열 유틸리티 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  toTitleCase,
  isEmpty,
  isBlank,
  isNumeric,
  isAlpha,
  isAlphaNumeric,
  isEmail,
  isUrl,
  truncate,
  padLeft,
  padRight,
  reverse,
  countOccurrences,
  containsIgnoreCase,
  replaceAll,
  escapeHtml,
  unescapeHtml,
  generateRandomString,
  generateSlug
} from '../string';

describe('String Case Conversion', () => {
  describe('toCamelCase', () => {
    it('converts strings to camelCase', () => {
      const result = toCamelCase('hello world');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('helloWorld');
      }
    });

    it('handles special characters', () => {
      const result = toCamelCase('hello-world_test');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('helloWorldTest');
      }
    });

    it('handles invalid input', () => {
      const result = toCamelCase(123 as any);
      expect(result.success).toBe(false);
    });
  });

  describe('toPascalCase', () => {
    it('converts strings to PascalCase', () => {
      const result = toPascalCase('hello world');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('HelloWorld');
      }
    });
  });

  describe('toSnakeCase', () => {
    it('converts strings to snake_case', () => {
      const result = toSnakeCase('HelloWorld');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('hello_world');
      }
    });
  });

  describe('toKebabCase', () => {
    it('converts strings to kebab-case', () => {
      const result = toKebabCase('HelloWorld');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('hello-world');
      }
    });
  });

  describe('toTitleCase', () => {
    it('converts strings to Title Case', () => {
      const result = toTitleCase('hello world');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Hello World');
      }
    });
  });
});

describe('String Validation', () => {
  describe('isEmpty', () => {
    it('detects empty strings', () => {
      const result = isEmpty('');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('detects non-empty strings', () => {
      const result = isEmpty('hello');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });
  });

  describe('isBlank', () => {
    it('detects blank strings', () => {
      const result = isBlank('   ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('detects non-blank strings', () => {
      const result = isBlank(' hello ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });
  });

  describe('isNumeric', () => {
    it('validates numeric strings', () => {
      const result = isNumeric('12345');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('rejects non-numeric strings', () => {
      const result = isNumeric('123abc');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });
  });

  describe('isAlpha', () => {
    it('validates alphabetic strings', () => {
      const result = isAlpha('abcDEF');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('rejects non-alphabetic strings', () => {
      const result = isAlpha('abc123');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });
  });

  describe('isAlphaNumeric', () => {
    it('validates alphanumeric strings', () => {
      const result = isAlphaNumeric('abc123');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('rejects strings with special characters', () => {
      const result = isAlphaNumeric('abc-123');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });
  });

  describe('isEmail', () => {
    it('validates correct email format', () => {
      const result = isEmail('test@example.com');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('rejects invalid email format', () => {
      const result = isEmail('invalid-email');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });
  });

  describe('isUrl', () => {
    it('validates correct URL format', () => {
      const result = isUrl('https://example.com');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('rejects invalid URL format', () => {
      const result = isUrl('not-a-url');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });
  });
});

describe('String Manipulation', () => {
  describe('truncate', () => {
    it('truncates long strings', () => {
      const result = truncate('Hello World', 5);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('He...');
      }
    });

    it('keeps short strings unchanged', () => {
      const result = truncate('Hi', 10);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Hi');
      }
    });
  });

  describe('padLeft', () => {
    it('pads strings on the left', () => {
      const result = padLeft('123', 5, '0');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('00123');
      }
    });
  });

  describe('padRight', () => {
    it('pads strings on the right', () => {
      const result = padRight('123', 5, '0');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('12300');
      }
    });
  });

  describe('reverse', () => {
    it('reverses strings', () => {
      const result = reverse('hello');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('olleh');
      }
    });
  });

  describe('countOccurrences', () => {
    it('counts string occurrences', () => {
      const result = countOccurrences('hello world hello', 'hello');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(2);
      }
    });
  });
});

describe('String Search', () => {
  describe('containsIgnoreCase', () => {
    it('finds substrings ignoring case', () => {
      const result = containsIgnoreCase('Hello World', 'WORLD');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });
  });

  describe('replaceAll', () => {
    it('replaces all occurrences', () => {
      const result = replaceAll('hello world hello', 'hello', 'hi');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('hi world hi');
      }
    });
  });
});

describe('HTML Escaping', () => {
  describe('escapeHtml', () => {
    it('escapes HTML entities', () => {
      const result = escapeHtml('<div>"test"</div>');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('&lt;div&gt;&quot;test&quot;&lt;&#x2F;div&gt;');
      }
    });
  });

  describe('unescapeHtml', () => {
    it('unescapes HTML entities', () => {
      const result = unescapeHtml('&lt;div&gt;&quot;test&quot;&lt;&#x2F;div&gt;');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('<div>"test"</div>');
      }
    });
  });
});

describe('String Generation', () => {
  describe('generateRandomString', () => {
    it('generates random strings of specified length', () => {
      const result = generateRandomString(10);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(10);
        expect(typeof result.data).toBe('string');
      }
    });

    it('uses custom charset', () => {
      const result = generateRandomString(5, '12345');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatch(/^[12345]+$/);
      }
    });
  });

  describe('generateSlug', () => {
    it('generates URL-friendly slugs', () => {
      const result = generateSlug('Hello World! 123');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('hello-world-123');
      }
    });

    it('handles special characters', () => {
      const result = generateSlug('Test@#$%String');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('teststring');
      }
    });
  });
});