import { describe, expect, test } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  test('returns a string', () => {
    expect(typeof cn('test')).toBe('string');
  });

  test('merges classes', () => {
    expect(cn('class1', 'class2')).toContain('class1');
    expect(cn('class1', 'class2')).toContain('class2');
  });

  test('handles falsy values', () => {
    expect(cn('class1', false, null, undefined, 'class2')).toBe('class1 class2');
  });

  test('works with objects', () => {
    expect(cn('class1', { 'class2': true, 'class3': false })).toBe('class1 class2');
  });

  test('works with arrays', () => {
    expect(cn('class1', ['class2', false, 'class3'])).toBe('class1 class2 class3');
  });
});