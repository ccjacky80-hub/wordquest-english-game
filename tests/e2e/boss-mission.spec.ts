import { expect, test } from '@playwright/test';

test('boss mission unlocks from learned words and completes three story steps', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/play/boss-mission');
  await page.evaluate(() => indexedDB.deleteDatabase('wordquest'));
  await page.reload();
  await expect(page.getByText(/complete day3/i)).toBeVisible();

  await page.evaluate(() => {
    const request = indexedDB.open('wordquest');
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('attempts', 'readwrite');
      const store = transaction.objectStore('attempts');
      const ids = ['C0430', 'C0431', 'C0432', 'C0402', 'C0433', 'C0434', 'C0435', 'C0436', 'C0437', 'C0438', 'C0439', 'C0440', 'C0441', 'C0442', 'C0403', 'C0399'];
      ids.forEach((wordId, index) => {
        const day = index < 6 ? 1 : index < 11 ? 2 : 3;
        store.put({ id: `seed-${wordId}`, sessionId: `day${day}-picture-match`, gameType: 'picture-match', wordId, promptType: 'image-to-word', outcome: 'independentCorrect', attemptIndex: 1, hintsUsed: 0, audioReplayCount: 0, occurredAt: `2026-09-08T10:${String(index).padStart(2, '0')}:00.000Z`, contentVersion: 1 });
      });
      transaction.oncomplete = () => db.close();
    };
  });
  await page.waitForFunction(() => new Promise<boolean>((resolve) => {
    const request = indexedDB.open('wordquest');
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('attempts', 'readonly');
      const requestCount = transaction.objectStore('attempts').count();
      requestCount.onsuccess = () => { resolve(requestCount.result === 16); db.close(); };
    };
  }));
  await page.reload();
  await expect(page.locator('[data-boss-step="find-eagle"]')).toBeVisible();

  await page.locator('[data-word-id]').click();
  await expect(page.locator('[data-boss-step="place-feather"]')).toBeVisible();

  const source = page.locator('.drag-source');
  const target = page.locator('.drop-target');
  await source.dragTo(target);
  await expect(page.locator('[data-boss-step="move-eagle"]')).toBeVisible();

  await page.locator('.drag-source').dragTo(page.locator('.drop-target'));
  await expect(page.getByRole('heading', { name: /animal kingdom story shines/i })).toBeVisible();
  await expect(page.getByText(/attempts sent through the Learning Engine/i)).toBeVisible();
  expect(pageErrors).toEqual([]);
});
