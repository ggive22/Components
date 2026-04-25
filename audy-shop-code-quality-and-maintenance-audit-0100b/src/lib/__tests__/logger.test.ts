import { describe, expect, test, vi } from 'vitest';
import { logger } from '@/lib/logger';

describe('logger', () => {
  test('should exist', () => {
    expect(logger).toBeDefined();
    expect(logger.info).toBeTypeOf('function');
    expect(logger.error).toBeTypeOf('function');
    expect(logger.warn).toBeTypeOf('function');
    expect(logger.debug).toBeTypeOf('function');
  });

  test('should call console methods', () => {
    const consoleSpy = vi.spyOn(console, 'info');
    logger.info('test', 'Test message');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('should format log messages correctly', () => {
    const consoleSpy = vi.spyOn(console, 'info');
    logger.info('test-module', 'Test message', { key: 'value' });
    expect(consoleSpy).toHaveBeenCalledWith(
      '[AudyShop:test-module]',
      'Test message',
      { key: 'value' }
    );
    consoleSpy.mockRestore();
  });
});