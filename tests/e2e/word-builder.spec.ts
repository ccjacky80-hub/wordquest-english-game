import { expect, test } from '@playwright/test';

const day1Words: Record<string, string> = {
  C0430: 'lion',
  C0431: 'zebra',
  C0432: 'tiger',
  C0402: 'panda',
  C0433: 'giraffe',
  C0434: 'monkey',
};

test('word builder L1 fills missing letters and persists completion', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/play/word-builder');
  await expect(page.locator('.game-shell')).toBeVisible();
  await page.evaluate(() => indexedDB.deleteDatabase('wordquest'));
  await page.reload();
  await expect(page.locator('.word-builder-prompt')).toBeVisible();

  for (let round = 0; round < 6; round += 1) {
    const targetId = await page.locator('.word-builder-prompt').getAttribute('data-target-word-id');
    expect(targetId).toBeTruthy();
    const word = day1Words[targetId!];
    expect(word).toBeTruthy();
    const missing = word.length >= 5 ? word.slice(-2).split('') : word.slice(-1).split('');

    if (round === 0) {
      const wrongLetter = await page.locator('.letter-tile').evaluateAll(
        (buttons, expected) => buttons.find((button) => !expected.includes(button.getAttribute('data-letter') ?? ''))?.getAttribute('data-letter'),
        missing,
      );
      expect(wrongLetter).toBeTruthy();
      await page.locator(`.letter-tile[data-letter="${wrongLetter}"]`).click();
      if (missing.length === 2) {
        await page.getByRole('button', { name: missing[0], exact: true }).click();
      }
      await expect(page.getByText(/letters bounce/i)).toBeVisible();
      await page.waitForTimeout(650);
    }

    for (const letter of missing) {
      await page.getByRole('button', { name: letter, exact: true }).click();
    }
    await expect(page.getByText(/great build|word trail/i)).toBeVisible();
    await page.waitForTimeout(750);
    if (await page.getByRole('heading', { name: /your word trail grows/i }).isVisible()) break;
  }

  await expect(page.getByRole('heading', { name: /your word trail grows/i })).toBeVisible();
  await expect(page.getByText(/progress is saved on this device/i)).toBeVisible();
  const attemptCount = await page.evaluate(async () => {
    return await new Promise<number>((resolve, reject) => {
      const request = indexedDB.open('wordquest');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction('attempts', 'readonly');
        const countRequest = transaction.objectStore('attempts').count();
        countRequest.onerror = () => reject(countRequest.error);
        countRequest.onsuccess = () => {
          resolve(countRequest.result);
          db.close();
        };
      };
    });
  });
  expect(attemptCount).toBeGreaterThanOrEqual(7);

  await page.reload();
  await expect(page.locator('.word-builder-prompt')).toBeVisible();
  await expect(page.locator('.word-builder-prompt')).not.toHaveAttribute('data-target-word-id', 'C0430');
  expect(pageErrors).toEqual([]);
});
