import { expect, test } from '@playwright/test';

test('parent dashboard reports real local learning metrics after a game', async ({ page, context }) => {
  const cleanPage = await context.newPage();
  const pageErrors: string[] = [];
  cleanPage.on('pageerror', (error) => pageErrors.push(error.message));
  await cleanPage.goto('/');
  await cleanPage.close();

  const gamePage = await context.newPage();
  gamePage.on('pageerror', (error) => pageErrors.push(error.message));
  await gamePage.goto('/play/picture-match');
  await expect(gamePage.locator('.picture-match-target')).toBeVisible();
  for (let round = 0; round < 6; round += 1) {
    const targetId = await gamePage.locator('.picture-match-target').getAttribute('data-word-id');
    await gamePage.locator(`.picture-match-choice[data-word-id="${targetId}"]`).click();
    if (round < 5) await expect(gamePage.locator('.picture-match-target')).not.toHaveAttribute('data-word-id', targetId ?? '');
  }
  await expect(gamePage.getByRole('heading', { name: /your word eyes are brighter/i })).toBeVisible();
  await gamePage.close();

  const dashboardPage = await context.newPage();
  dashboardPage.on('pageerror', (error) => pageErrors.push(error.message));
  await dashboardPage.goto('/parent');
  await expect(dashboardPage.getByRole('heading', { name: /learning dashboard/i })).toBeVisible();
  await expect(dashboardPage.getByText(/overall accuracy/i)).toBeVisible();
  await expect(dashboardPage.getByRole('article').filter({ hasText: 'GAME PERFORMANCE' }).getByText('G2 Picture Match', { exact: true })).toBeVisible();
  await expect(dashboardPage.getByRole('cell', { name: 'lion', exact: true })).toBeVisible();
  await expect(dashboardPage.locator('.parent-metric').nth(1).locator('strong')).not.toHaveText('0%');
  expect(pageErrors).toEqual([]);
  await page.close();
});
