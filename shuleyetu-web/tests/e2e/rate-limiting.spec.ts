import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Rate Limiting', () => {
  test('should enforce rate limiting on payment endpoint', async ({ request }) => {
    const endpoint = '/api/clickpesa/pay';
    const payload = {
      orderId: 'test-order',
      token: 'test-token',
    };

    // Make requests up to the limit
    const responses = [];
    for (let i = 0; i < 11; i++) {
      const response = await request.post(endpoint, { data: payload });
      responses.push(response.status());
    }

    // First 10 should succeed (or fail with 404, not 429)
    for (let i = 0; i < 10; i++) {
      expect([200, 400, 404]).toContain(responses[i]);
    }

    // 11th should be rate limited (429)
    expect(responses[10]).toBe(429);
  });

  test('should return rate limit headers', async ({ request }) => {
    const response = await request.get('/api/health');
    
    expect(response.headers()['x-ratelimit-limit']).toBeDefined();
    expect(response.headers()['x-ratelimit-remaining']).toBeDefined();
    expect(response.headers()['x-ratelimit-reset']).toBeDefined();
  });

  test('should include retry-after header when rate limited', async ({ request }) => {
    const endpoint = '/api/clickpesa/pay';
    const payload = {
      orderId: 'test-order',
      token: 'test-token',
    };

    // Exceed rate limit
    for (let i = 0; i < 11; i++) {
      await request.post(endpoint, { data: payload });
    }

    // Next request should have retry-after header
    const response = await request.post(endpoint, { data: payload });
    if (response.status() === 429) {
      expect(response.headers()['retry-after']).toBeDefined();
    }
  });
});
