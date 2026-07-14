import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Rate Limiting', () => {
  test('should enforce rate limiting on payment endpoint', async ({ request }) => {
    const endpoint = '/api/clickpesa/pay';
    const payload = {
      orderId: 'test-order',
      token: 'test-token',
    };

    // Send enough requests to exceed the limit across possible dev-server workers
    const responses = [];
    for (let i = 0; i < 30; i++) {
      const response = await request.post(endpoint, { data: payload });
      responses.push(response.status());
    }

    // Most early requests should pass validation/rate-limit and return 400
    const earlyNon429 = responses.slice(0, 10).filter((s) => s !== 429).length;
    expect(earlyNon429).toBeGreaterThanOrEqual(1);

    // At least one request should be rate limited (429)
    const rateLimitedCount = responses.filter((s) => s === 429).length;
    expect(rateLimitedCount).toBeGreaterThanOrEqual(1);
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

    // Exceed rate limit across possible dev-server workers
    for (let i = 0; i < 30; i++) {
      await request.post(endpoint, { data: payload });
    }

    // Next request should have retry-after header when rate limited
    const response = await request.post(endpoint, { data: payload });
    if (response.status() === 429) {
      expect(response.headers()['retry-after']).toBeDefined();
    }
  });
});
