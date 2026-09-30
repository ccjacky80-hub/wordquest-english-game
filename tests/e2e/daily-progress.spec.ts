import { expect, test } from '@playwright/test';

test('completing one Day1 activity keeps Mission Intro on Day1', async ({ page }) => {
  await page.goto('/favicon.ico');
  await page.evaluate(() => new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase('wordquest');
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  }));
  await page.goto('/play/treasure-hunt');
  await expect(page.getByRole('heading', { name: /find the animal/i })).toBeVisible();

  for (let round = 0; round < 6; round += 1) {
    const prompt = page.locator('.treasure-prompt');
    const targetId = await prompt.getAttribute('data-target-word-id');
    expect(targetId).toBeTruthy();
    const target = page.locator(`.treasure-choice[data-word-id="${targetId}"]`);
    await expect(target).toBeVisible();
    await target.click();
    if (round < 5) {
      await expect(prompt).not.toHaveAttribute('data-target-word-id', targetId!, { timeout: 3000 });
    }
  }

  await expect(page.getByRole('heading', { name: /the trail is brighter/i })).toBeVisible({ timeout: 3000 });
  const missionPage = await page.context().newPage();
  await page.close();
  await missionPage.goto('/mission');
  await expect(missionPage.getByRole('heading', { name: /day 1: help the animals/i })).toBeVisible();
  await expect(missionPage.getByText(/Learn 6 new words and practise for about 15 minutes/i)).toBeVisible();
  await expect(missionPage.getByRole('status')).toContainText(/Step 2 of 4: Look & match/i);
  await expect(missionPage.locator('.word-preview')).toHaveCount(6);
  await expect(missionPage.locator('body')).not.toContainText('&apos;');
  await missionPage.close();
});
