import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { safeParse, formatZodErrors, emailSchema, uuidSchema, paginationSchema } from './validation';

describe('Validation utilities', () => {
  it('safeParse returns data on valid input', () => {
    const result = safeParse(z.string().email(), 'test@example.com');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('test@example.com');
    }
  });

  it('safeParse returns error on invalid input', () => {
    const result = safeParse(z.string().email(), 'not-an-email');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it('formatZodErrors returns human-readable string', () => {
    const result = safeParse(z.object({ name: z.string().min(1) }), { name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = formatZodErrors(result.error);
      expect(message).toContain('name');
    }
  });

  it('emailSchema validates emails', () => {
    expect(safeParse(emailSchema, 'user@example.com').success).toBe(true);
    expect(safeParse(emailSchema, 'bad').success).toBe(false);
  });

  it('uuidSchema validates UUIDs', () => {
    expect(safeParse(uuidSchema, '550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
    expect(safeParse(uuidSchema, 'not-a-uuid').success).toBe(false);
  });

  it('paginationSchema coerces and defaults', () => {
    const result = safeParse(paginationSchema, { page: '2', limit: '25' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(25);
    }
  });

  it('paginationSchema clamps limit to max 100', () => {
    const result = safeParse(paginationSchema, { page: '1', limit: '500' });
    expect(result.success).toBe(false);
  });
});
