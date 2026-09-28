import { expect, test } from '@playwright/test';
import { childId, registerWithChild } from './helpers';

test('parent runs a session, rates the day and sees progress; data reaches the server', async ({ page }) => {
  await registerWithChild(page);
  const id = await childId(page);

  await page.getByRole('link', { name: /جلسة الكلام/ }).click();
  await page.getByRole('button', { name: 'ندخل على اللعب علطول' }).click();
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'كلام ناعم' }).click();
  await page.getByRole('button', { name: 'فيه مطبات' }).click();
  await page.getByRole('button', { name: 'خلصنا' }).click();

  await page.getByRole('button', { name: /ملصق/ }).first().click();
  await page.getByRole('button', { name: 'كمّل' }).click();
  await page.getByRole('button', { name: 'تقييم اليوم' }).click();
  await page.getByRole('radio', { name: '٢' }).click();
  await expect(page.getByRole('status')).toHaveText('اتسجل. شكرًا!');
  await page.getByRole('button', { name: 'رجوع للرئيسية' }).click();

  await page.getByRole('link', { name: 'التقدم' }).click();
  await expect(page.getByRole('img', { name: /المتوسط ٢.٠/ })).toBeVisible();

  await expect.poll(async () => {
    const sync = await (await page.request.get(`/api/children/${id}/sync?since=0`)).json();
    return [sync.sessions[0]?.smooth, sync.sessions[0]?.bumpy, sync.ratings[0]?.value, sync.stickers.length];
  }, { timeout: 30_000 }).toEqual([6, 1, 2, 1]);
});

test('the turtle walks with the (fake) microphone', async ({ page }) => {
  await registerWithChild(page, 'عمر');
  await page.getByRole('link', { name: /ألعاب الصوت/ }).click();
  await page.getByRole('link', { name: 'السلحفاة' }).click();
  await page.getByRole('button', { name: 'يلا نبدأ' }).click();
  await expect(page.getByText('وصلت السلحفاة!')).toBeVisible({ timeout: 30_000 });
});

test('learning round updates item progress', async ({ page }) => {
  await registerWithChild(page, 'مايا');
  const id = await childId(page);
  await page.getByRole('link', { name: /نتعلم/ }).click();
  await page.getByRole('link', { name: 'الألوان' }).click();
  await page.getByRole('link', { name: 'اسمع واختار' }).click();
  for (let i = 0; i < 6; i++) {
    const game = page.locator('[data-target-id]');
    const target = await game.getAttribute('data-target-id');
    await game.locator(`[data-id="${target}"]`).click();
    await page.waitForTimeout(1200);
  }
  await expect(page.getByRole('button', { name: /ملصق/ }).first()).toBeVisible();
  await expect.poll(async () => (await (await page.request.get(`/api/children/${id}/sync?since=0`)).json()).items.length,
    { timeout: 30_000 }).toBe(6);
});
