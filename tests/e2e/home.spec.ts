import { expect, test } from '@playwright/test';

test('home exposes the next mission', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /animal kingdom/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /start the next mission/i })).toBeVisible();
});
