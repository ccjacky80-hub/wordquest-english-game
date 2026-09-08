import { expect, test } from '@playwright/test';

test('put it somewhere supports wrong then correct drag with no page errors', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/play/put-it-somewhere');
  await expect(page.locator('.drag-instruction')).toBeVisible();
  await page.evaluate(() => indexedDB.deleteDatabase('wordquest'));
  await page.reload();
  await expect(page.locator('.drag-source')).toBeVisible();

  const source = page.locator('.drag-source');
  const wrongTarget = page.locator('[data-target-label="another place"]');
  await source.dragTo(wrongTarget);
  await expect(page.getByText(/read the sentence again/i)).toBeVisible();
  await page.waitForTimeout(600);

  const correctTarget = page.locator('.drop-target:not(.drop-target-distractor)').first();
  await expect(correctTarget).toBeVisible();
  await source.dragTo(correctTarget);
  await expect(page.getByText(/great listening and placing/i)).toBeVisible();
  await page.waitForTimeout(800);

  await expect(page.locator('.drag-instruction')).toBeVisible();
  expect(pageErrors).toEqual([]);
});
