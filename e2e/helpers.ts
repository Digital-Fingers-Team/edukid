import { expect, type Page } from '@playwright/test';

export async function registerWithChild(page: Page, childName = 'نور') {
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  await page.goto('/');
  await page.getByRole('tab', { name: 'حساب جديد' }).click();
  await page.getByLabel('الإيميل').fill(email);
  await page.getByLabel('كلمة السر').fill('secret123');
  await page.getByRole('button', { name: 'إنشاء الحساب' }).click();
  await expect(page.getByRole('heading', { name: 'مين هيلعب النهارده؟' })).toBeVisible();
  await page.getByLabel('اسم الطفل').fill(childName);
  await page.getByRole('button', { name: 'إضافة', exact: true }).click();
  await page.getByRole('link', { name: new RegExp(childName) }).click();
  await expect(page.getByText(`أهلاً يا ${childName}`)).toBeVisible();
  return email;
}

export async function childId(page: Page): Promise<string> {
  return /\/child\/([^/]+)/.exec(page.url())![1]!;
}
