import { expect, test } from '@playwright/test';

test('home to treasure hunt saves progress and keeps reward after refresh', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /ready for a word adventure/i })).toBeVisible();
  await page.getByRole('link', { name: /start today's mission/i }).click();
  await expect(page).toHaveURL(/\/mission\/?$/);
  const day1Words = await page.locator('.word-preview span').allTextContents();
  expect(day1Words).toEqual(['lion', 'zebra', 'tiger', 'panda', 'giraffe', 'monkey']);

  await page.getByRole('link', { name: /begin the adventure/i }).click();
  await expect(page).toHaveURL(/\/play\/treasure-hunt\/?$/);
  await expect(page.getByRole('heading', { name: /find the animal/i })).toBeVisible();

  for (const word of day1Words) {
    const choice = page.locator('button.treasure-choice').filter({
      has: page.locator(`img[alt="${word}"]`),
    });
    await expect(choice).toBeVisible();
    await choice.click();
  }

  await expect(page.getByRole('heading', { name: /the trail is brighter/i })).toBeVisible();
  await expect(page.getByText(/progress is saved on this device/i)).toBeVisible();

  const progressCount = await page.evaluate(async () => {
    return await new Promise<number>((resolve, reject) => {
      const request = indexedDB.open('wordquest');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction('wordProgress', 'readonly');
        const countRequest = transaction.objectStore('wordProgress').count();
        countRequest.onerror = () => reject(countRequest.error);
        countRequest.onsuccess = () => {
          resolve(countRequest.result);
          db.close();
        };
      };
    });
  });
  expect(progressCount).toBe(6);

  await page.reload();
  await expect(page.getByRole('heading', { name: /the trail is brighter/i })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
