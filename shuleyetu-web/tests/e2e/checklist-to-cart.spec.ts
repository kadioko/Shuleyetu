import { test, expect } from '@playwright/test';

test.describe('Checklist to cart integration', () => {
  test('checklist loads and shows inventory matches', async ({ page }) => {
    await page.goto('/checklist');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Back-to-School Checklist').first()).toBeVisible();

    // Select primary level
    await page.getByRole('button', { name: /Primary School/i }).click();
    await page.waitForTimeout(500);

    // Wait for inventory matches to load
    await expect(page.locator('text=Available from vendors').first()).toBeVisible({ timeout: 8000 });

    // Check an item and add its first match to cart
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    await firstCheckbox.click();

    const addButton = page.locator('button:text-is("Add to cart")').first();
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Cart drawer should open with the item
    await expect(page.locator('text=Your Cart').first()).toBeVisible({ timeout: 5000 });
  });

  test('auto-fill button adds checked items to cart', async ({ page }) => {
    await page.goto('/checklist');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Primary School/i }).click();
    await page.waitForTimeout(500);

    // Check first two items
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    await expect(page.locator('text=Auto-fill cart from matches').first()).toBeVisible();
    await page.locator('button:text-is("Auto-fill cart from matches")').first().click();

    // Cart drawer should open
    await expect(page.locator('text=Your Cart').first()).toBeVisible({ timeout: 5000 });
  });
});
