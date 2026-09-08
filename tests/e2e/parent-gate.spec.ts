import { expect, test } from '@playwright/test';

test('parent gate requires a two-second hold and confirmation', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/parent');
  await expect(page.getByRole('heading', { name: /grown-up check/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /learning dashboard/i })).not.toBeVisible();

  const hold = page.getByRole('button', { name: /hold to continue/i });
  await hold.hover();
  await page.mouse.down();
  await page.waitForTimeout(2100);
  await page.mouse.up();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: /open the caregiver dashboard/i })).toBeVisible();
  await page.getByRole('button', { name: /yes, open dashboard/i }).click();
  await expect(page.getByRole('heading', { name: /learning dashboard/i })).toBeVisible();
  expect(pageErrors).toEqual([]);

  await page.reload();
  await expect(page.getByRole('heading', { name: /grown-up check/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /learning dashboard/i })).not.toBeVisible();
});
