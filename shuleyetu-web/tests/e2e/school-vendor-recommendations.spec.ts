import { test, expect } from '@playwright/test';

test.describe('School-specific vendor recommendations', () => {
  test('vendors page has school filter and shows recommendations', async ({ page }) => {
    await page.goto('/vendors');
    await page.waitForLoadState('networkidle');

    const schoolSelect = page.locator('select').filter({ hasText: /All schools|Shule zote/ });
    await expect(schoolSelect).toBeVisible();

    // Select demo school if available
    const demoOption = page.locator('option').filter({ hasText: /Demo Secondary School/ });
    if (await demoOption.count() > 0) {
      await schoolSelect.selectOption({ label: 'Demo Secondary School' });
      await page.waitForTimeout(500);
      await expect(page.locator('text=Showing vendors for Demo Secondary School').first()).toBeVisible();
      await expect(page.locator('text=School-Approved').first()).toBeVisible();
    }
  });
});
