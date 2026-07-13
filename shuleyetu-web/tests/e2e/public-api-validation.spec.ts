import { test, expect } from '@playwright/test';

test.describe('Public API validation and rate limiting', () => {
  test('contact API rejects invalid body with Zod details', async ({ request }) => {
    const response = await request.post('/api/contact', {
      data: { name: '', email: 'not-an-email', subject: 'Invalid', message: '' },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid request body');
    expect(data.details).toBeDefined();
  });

  test('newsletter API rejects invalid email', async ({ request }) => {
    const response = await request.post('/api/newsletter', {
      data: { email: 'bad-email' },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid request body');
  });

  test('public order API rejects invalid UUID', async ({ request }) => {
    const response = await request.post('/api/orders/public', {
      data: { orderId: 'not-a-uuid', token: 'test-token' },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid request body');
  });

  test('vendor review API rejects missing rating', async ({ request }) => {
    const response = await request.post('/api/vendors/reviews', {
      data: { vendor_id: '550e8400-e29b-41d4-a716-446655440000' },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid request body');
  });

  test('health endpoint returns status checks and rate limit headers', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toMatch(/healthy|degraded/);
    expect(data.checks.database).toBeDefined();
    expect(data.checks.auth).toBeDefined();
    expect(data.checks.clickpesa).toBeDefined();

    expect(response.headers()['x-ratelimit-limit']).toBeDefined();
    expect(response.headers()['x-ratelimit-remaining']).toBeDefined();
  });
});
