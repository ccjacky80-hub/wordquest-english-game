import { expect, test } from '@playwright/test';

test('picture match completes with retry feedback and persists session progress', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/play/picture-match');
  await expect(page.getByRole('heading', { name: /which word is it/i })).toBeVisible();
  await expect(page.locator('.picture-match-target')).toBeVisible();
  await expect(page.locator('.picture-match-choice')).toHaveCount(4);

  const firstTargetId = await page.locator('.picture-match-target').getAttribute('data-word-id');
  const wrongChoice = page.locator('.picture-match-choice').filter({
    hasNot: page.locator(`[data-word-id="${firstTargetId}"]`),
  }).first();
  await wrongChoice.click();
  await expect(page.getByText(/not this one|look closely/i)).toBeVisible();
  await page.waitForTimeout(500);

  for (let round = 0; round < 6; round += 1) {
    const targetId = await page.locator('.picture-match-target').getAttribute('data-word-id');
    expect(targetId).toBeTruthy();
    await page.locator(`.picture-match-choice[data-word-id="${targetId}"]`).click();
    await page.waitForTimeout(750);
    if (await page.getByRole('heading', { name: /your word eyes are brighter/i }).isVisible()) break;
  }

  await expect(page.getByRole('heading', { name: /your word eyes are brighter/i })).toBeVisible();
  await expect(page.getByText(/progress is saved on this device/i)).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: /your word eyes are brighter/i })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
