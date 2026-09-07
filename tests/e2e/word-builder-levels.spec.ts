import { expect, test } from '@playwright/test';

test('word builder supports L2 shuffled blocks and L3 audio construction', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/play/word-builder');
  await expect(page.locator('.word-builder-prompt')).toBeVisible();
  await page.evaluate(() => indexedDB.deleteDatabase('wordquest'));
  await page.reload();

  await page.getByRole('button', { name: 'L2', exact: true }).click();
  await expect(page.locator('.word-builder-prompt')).toHaveAttribute('data-level', 'L2');
  const l2Target = await page.locator('.word-builder-prompt').getAttribute('data-target-word-id');
  const l2Letters = await page.locator('.letter-tile').evaluateAll((buttons) => buttons.map((button) => button.textContent?.trim()).join(''));
  expect(l2Letters.length).toBeGreaterThan(3);
  await expect(page.locator('.word-builder-prompt h1')).toContainText('_');
  expect(l2Target).toBeTruthy();

  await page.getByRole('button', { name: 'L3', exact: true }).click();
  await expect(page.locator('.word-builder-prompt')).toHaveAttribute('data-level', 'L3');
  await expect(page.locator('.word-builder-prompt h1')).toContainText('_');
  await expect(page.getByRole('button', { name: /listen again/i })).toBeVisible();
  await expect(page.locator('.letter-tile')).toHaveCount(await page.locator('.word-builder-prompt h1').textContent().then((text) => (text ?? '').replace(/_/g, '').length + (text ?? '').match(/_/g)?.length!));
  expect(pageErrors).toEqual([]);
});
