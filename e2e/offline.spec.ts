import { expect, test } from '@playwright/test';
import { childId, registerWithChild } from './helpers';

test('a rating made offline is kept and uploaded when the connection returns', async ({ page, context }) => {
  await registerWithChild(page);
  const id = await childId(page);
  await page.getByRole('link', { name: /تقييم اليوم/ }).click();
  await context.setOffline(true);
  await page.getByRole('radio', { name: '٤' }).click();
  await expect(page.getByText('محفوظ على الجهاز')).toBeVisible();
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.getByText('محفوظ على الجهاز')).toBeHidden({ timeout: 40_000 });
  const sync = await (await page.request.get(`/api/children/${id}/sync?since=0`)).json();
  expect(sync.ratings.map((r: { value: number }) => r.value)).toEqual([4]);
});

test('the app opens with no connection after the first visit', async ({ page, context }) => {
  await registerWithChild(page);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload(); // let the service worker take control
  await expect(page.getByText('أهلاً يا نور')).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('أهلاً يا نور')).toBeVisible();
});
