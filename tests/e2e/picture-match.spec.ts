import { expect, test } from '@playwright/test';

test('picture match completes with retry feedback and persists session progress', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/play/picture-match');
  await expect(page.getByRole('heading', { name: /which word is it/i })).toBeVisible();
  await expect(page.locator('.picture-match-target')).toBeVisible();
  await expect(page.locator('.picture-match-choice')).toHaveCount(4);
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('wordquest');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['attempts', 'wordProgress', 'reviewQueue'], 'readwrite');
      transaction.objectStore('attempts').clear();
      transaction.objectStore('wordProgress').clear();
      transaction.objectStore('reviewQueue').clear();
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  }));
  await page.reload();
  await expect(page.locator('.picture-match-choice')).toHaveCount(4);

  const firstTargetId = await page.locator('.picture-match-target').getAttribute('data-word-id');
  const wrongChoice = page.locator('.picture-match-choice').filter({
    hasNot: page.locator(`[data-word-id="${firstTargetId}"]`),
  }).first();
  await wrongChoice.click();
  await expect(page.getByText(/not this one|look closely|clue|answer|revisit/i)).toBeVisible();
  await page.waitForTimeout(500);

  for (let round = 0; round < 6; round += 1) {
    const targetId = await page.locator('.picture-match-target').getAttribute('data-word-id');
    expect(targetId).toBeTruthy();
    await page.locator(`.picture-match-choice[data-word-id="${targetId}"]`).click();
    await expect.poll(async () => {
      if (await page.getByRole('heading', { name: /your word eyes are brighter/i }).isVisible()) return 'complete';
      return await page.locator('.picture-match-target').getAttribute('data-word-id');
    }, { timeout: 3000 }).not.toBe(targetId);
    if (await page.getByRole('heading', { name: /your word eyes are brighter/i }).isVisible()) break;
  }

  await expect(page.getByRole('heading', { name: /your word eyes are brighter/i })).toBeVisible();
  await expect(page.getByText(/progress is saved on this device/i)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/No words are due right now|Which word is it/i)).toBeVisible();
  expect(pageErrors).toEqual([]);
});
