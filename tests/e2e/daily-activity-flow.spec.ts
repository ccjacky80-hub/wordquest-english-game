import { expect, test, type Page } from '@playwright/test';

test.setTimeout(120_000);

const day1Words: Record<string, string> = {
  C0430: 'lion',
  C0431: 'zebra',
  C0432: 'tiger',
  C0402: 'panda',
  C0433: 'giraffe',
  C0434: 'monkey',
};

async function resetDatabase(page: Page) {
  await page.goto('/favicon.ico');
  await page.evaluate(() => new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase('wordquest');
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  }));
}

async function completeTreasureHunt(page: Page) {
  await page.getByRole('link', { name: /listen & find, next/i }).click();
  await expect(page).toHaveURL(/\/play\/treasure-hunt\/?$/);
  await expect(page.getByRole('heading', { name: /find the animal/i })).toBeVisible();
  for (let round = 0; round < 20; round += 1) {
    if (await page.getByRole('heading', { name: /the trail is brighter/i }).isVisible()) break;
    await expect.poll(async () => {
      if (await page.getByRole('heading', { name: /the trail is brighter/i }).isVisible()) return 'complete';
      const targetId = await page.locator('.treasure-prompt').getAttribute('data-target-word-id');
      const target = page.locator(`.treasure-choice[data-word-id="${targetId}"]`);
      return targetId && await target.isEnabled() ? targetId : '';
    }, { timeout: 3000 }).not.toBe('');
    if (await page.getByRole('heading', { name: /the trail is brighter/i }).isVisible()) break;
    const targetId = await page.locator('.treasure-prompt').getAttribute('data-target-word-id');
    await page.locator(`.treasure-choice[data-word-id="${targetId}"]`).click();
    await page.waitForTimeout(750);
  }
  await expect(page.getByRole('heading', { name: /the trail is brighter/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /next: look & match/i })).toBeVisible();
  await page.getByRole('link', { name: /next: look & match/i }).click();
}

async function completePictureMatch(page: Page) {
  await expect(page).toHaveURL(/\/play\/picture-match\/?$/);
  await expect(page.getByRole('heading', { name: /which word is it/i })).toBeVisible();
  for (let round = 0; round < 20; round += 1) {
    if (await page.getByRole('heading', { name: /your word eyes are brighter/i }).isVisible()) break;
    await expect.poll(async () => {
      if (await page.getByRole('heading', { name: /your word eyes are brighter/i }).isVisible()) return 'complete';
      const targetId = await page.locator('.picture-match-target').getAttribute('data-word-id');
      const target = page.locator(`.picture-match-choice[data-word-id="${targetId}"]`);
      return targetId && await target.isEnabled() ? targetId : '';
    }, { timeout: 3000 }).not.toBe('');
    if (await page.getByRole('heading', { name: /your word eyes are brighter/i }).isVisible()) break;
    const targetId = await page.locator('.picture-match-target').getAttribute('data-word-id');
    await page.locator(`.picture-match-choice[data-word-id="${targetId}"]`).click();
    await page.waitForTimeout(750);
  }
  await expect(page.getByRole('heading', { name: /your word eyes are brighter/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /next: build words/i })).toBeVisible();
  await page.getByRole('link', { name: /next: build words/i }).click();
}

async function completeWordBuilder(page: Page) {
  await expect(page).toHaveURL(/\/play\/word-builder\/?$/);
  await expect(page.locator('.word-builder-prompt')).toBeVisible();
  for (let round = 0; round < 20; round += 1) {
    if (await page.getByRole('heading', { name: /your word trail grows/i }).isVisible()) break;
    await expect(page.locator('.word-builder-prompt')).toBeVisible();
    const targetId = await page.locator('.word-builder-prompt').getAttribute('data-target-word-id');
    const word = day1Words[targetId!];
    expect(word).toBeTruthy();
    const missing = word.length >= 5 ? word.slice(-2).split('') : word.slice(-1).split('');
    for (const letter of missing) {
      await page.getByRole('button', { name: letter, exact: true }).click();
    }
    await page.waitForTimeout(750);
  }
  await expect(page.getByRole('heading', { name: /your word trail grows/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /next: put it somewhere/i })).toBeVisible();
  await page.getByRole('link', { name: /next: put it somewhere/i }).click();
}

async function completePutItSomewhere(page: Page) {
  await expect(page).toHaveURL(/\/play\/put-it-somewhere\/?$/);
  await expect(page.locator('.drag-instruction')).toBeVisible();
  for (let round = 0; round < 20; round += 1) {
    if (await page.getByText(/today's practice is complete/i).isVisible()) break;
    const source = page.locator('.drag-source');
    const target = page.locator('.drop-target:not(.drop-target-distractor)').first();
    await expect(source).toBeVisible();
    await expect(target).toBeVisible();
    await source.dragTo(target);
    await page.waitForTimeout(800);
  }
  await expect(page.getByText(/today's practice is complete/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /see today's summary/i })).toBeVisible();
  await page.getByRole('link', { name: /see today's summary/i }).click();
}

test('Day1 activity chain ends with a clear daily completion summary', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await resetDatabase(page);
  await page.goto('/mission');
  await expect(page.getByRole('heading', { name: /day 1/i })).toBeVisible();
  await expect(page.getByText(/15.*min practice/i)).toBeVisible();
  await expect(page.getByText(/0\/4.*activities done/i)).toBeVisible();

  await completeTreasureHunt(page);
  await completePictureMatch(page);
  await completeWordBuilder(page);
  await completePutItSomewhere(page);

  await expect(page).toHaveURL(/\/mission\/?\?completed=1$/);
  await expect(page.getByRole('heading', { name: /today's practice is complete/i })).toBeVisible();
  await expect(page.getByText(/everything for today is done/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /keep practising/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /finish for today/i })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
