import { expect, test } from '@playwright/test';

test('parent can export, reject malformed import, and reset learning data twice', async ({ page }) => {
  await page.goto('/parent');
  await expect(page.getByRole('heading', { name: /grown-up check/i })).toBeVisible();
  const hold = page.getByRole('button', { name: /hold to continue/i });
  const box = await hold.boundingBox();
  expect(box).toBeTruthy();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2100);
  await page.mouse.up();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button', { name: /yes, open dashboard/i }).click();
  await expect(page.getByRole('heading', { name: /learning dashboard/i })).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /export data/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^wordquest-backup-.*\.json$/);
  await expect(page.getByRole('status')).toContainText(/backup downloaded/i);

  await page.setInputFiles('#backup-import', {
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ schemaVersion: 999 })),
  });
  await expect(page.getByRole('status')).toContainText(/import rejected/i);

  await page.getByRole('button', { name: /reset data/i }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await expect(page.getByRole('button', { name: /reset learning data/i })).toBeDisabled();
  await page.getByLabel(/type reset to confirm/i).fill('RESET');
  await page.getByRole('button', { name: /reset learning data/i }).click();
  await expect(page.getByRole('status')).toContainText(/learning data reset/i);
  await expect(page.getByText(/No game attempts yet/i)).toBeVisible();
});
