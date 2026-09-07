import { expect, test } from '@playwright/test';

test('completing Day1 advances Mission Intro to Day2 after re-entry', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    indexedDB.deleteDatabase('wordquest');
  });
  await page.goto('/play/treasure-hunt');
  await expect(page.getByRole('heading', { name: /find the animal/i })).toBeVisible();

  for (let round = 0; round < 6; round += 1) {
    const targetId = await page.locator('.treasure-prompt').getAttribute('data-target-word-id');
    const target = page.locator(`.treasure-choice[data-word-id="${targetId}"]`);
    await expect(target).toBeVisible();
    await target.click();
    await page.waitForTimeout(750);
    if (await page.getByRole('heading', { name: /the trail is brighter/i }).isVisible()) break;
  }

  await expect(page.getByRole('heading', { name: /the trail is brighter/i })).toBeVisible();
  await page.goto('/mission');
  await expect(page.getByRole('heading', { name: /day 2/i })).toBeVisible();
  await expect(page.getByText(/5 new words and 6 review words/i)).toBeVisible();
  await expect(page.locator('.word-preview')).toHaveCount(5);
});
