import { describe, expect, test } from 'vitest';
import { formatXof } from '@/lib/format';

describe('formatXof', () => {
  test('formats whole numbers correctly', () => {
    expect(formatXof(1000)).toBe('1 000 CFA');
    expect(formatXof(0)).toBe('0 CFA');
    expect(formatXof(1234567)).toBe('1 234 567 CFA');
  });

  test('handles decimal numbers (rounding)', () => {
    expect(formatXof(1000.5)).toBe('1 001 CFA'); // Rounds up
    expect(formatXof(999.9)).toBe('1 000 CFA');   // Rounds up
    expect(formatXof(1000.4)).toBe('1 000 CFA');  // Rounds down
  });

  test('works with negative numbers', () => {
    expect(formatXof(-1000)).toBe('-1 000 CFA');
    expect(formatXof(-1000.5)).toBe('-1 001 CFA'); // Rounds away from zero
  });
});