import { test, expect } from '@playwright/test';

test.describe('Critical user paths', () => {
  test('homepage loads with language toggle', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Shuleyetu').first()).toBeVisible();
  });

  test('vendors page loads', async ({ page }) => {
    await page.goto('/vendors');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Vendors').first()).toBeVisible();
  });

  test('status page displays health checks', async ({ page }) => {
    await page.goto('/status');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Operational').or(page.locator('text=Degraded')).first()).toBeVisible();
    await expect(page.locator('text=Database').first()).toBeVisible();
  });

  test('contact page renders form', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });

  test('order creation page renders vendor selector', async ({ page }) => {
    await page.goto('/orders/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Create New Order').first()).toBeVisible();
  });
});
