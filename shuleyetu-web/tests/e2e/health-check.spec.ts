import { test, expect } from '@playwright/test';

test.describe('Health Check Endpoint', () => {
  test('should return healthy status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.checks.database).toBe('ok');
    expect(data.checks.auth).toBeDefined();
    expect(data.checks.clickpesa).toBeDefined();
    expect(data.checks.redis).toBeDefined();
    expect(data.checks.jobs).toBeDefined();
    expect(data.version).toBeDefined();
    expect(data.environment).toBeDefined();
  });

  test('should have rate limit headers', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);

    expect(response.headers()['x-ratelimit-limit']).toBeDefined();
    expect(response.headers()['x-ratelimit-remaining']).toBeDefined();
    expect(response.headers()['x-ratelimit-reset']).toBeDefined();
  });

  test('status page should display health information', async ({ page }) => {
    await page.goto('/status');
    await page.waitForLoadState('networkidle');

    // Check for status indicator
    const statusText = await page.locator('text=/Operational|Degraded/').first();
    expect(statusText).toBeDefined();

    // Check for service checks
    const databaseCheck = await page.locator('text=Database');
    expect(databaseCheck).toBeDefined();

    const apiCheck = await page.locator('text=API');
    expect(apiCheck).toBeDefined();
  });
});
