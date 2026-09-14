import { expect, test } from '@playwright/test';

test('map reflects the Day1 activity progress', async ({ page }) => {
  await page.goto('/favicon.ico');
  await page.evaluate(() => new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase('wordquest');
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  }));
  await page.goto('/map');

  await expect(page.getByText(/Day 1 practice · 0 of 4 activities complete/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /lion, practice now/i })).toHaveAttribute('href', /\/mission\/?$/);
  await expect(page.getByLabel(/zebra locked/i)).toBeVisible();
  await expect(page.getByLabel(/tiger locked/i)).toBeVisible();
  await expect(page.getByLabel(/panda locked/i)).toBeVisible();
  await expect(page.getByLabel(/giraffe locked/i)).toBeVisible();
  await expect(page.getByLabel(/monkey locked/i)).toBeVisible();
});
