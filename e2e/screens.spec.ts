// Visual review pass (not an assertion suite): phone-size screenshots of every screen, light and dark.
import { test, type Page } from '@playwright/test';
import { childId, registerWithChild } from './helpers';

const OUT = process.env.SCREENS_DIR ?? 'test-results/screens';

async function shoot(page: Page, name: string) {
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
}

for (const scheme of ['light', 'dark'] as const) {
  test(`screens (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    await page.goto('/');
    await shoot(page, `${scheme}-01-welcome`);
    await registerWithChild(page);
    const base = `/child/${await childId(page)}`;
    const visit = async (path: string, name: string) => { await page.goto(path); await shoot(page, `${scheme}-${name}`); };
    await visit('/children', '02-children');
    await visit(base, '03-home');
    await visit(`${base}/session`, '04-session-intro');
    await page.getByRole('button', { name: 'ندخل على اللعب علطول' }).click();
    for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'كلام ناعم' }).click();
    await shoot(page, `${scheme}-05-session-talk`);
    await page.getByRole('button', { name: 'خلصنا' }).click();
    await shoot(page, `${scheme}-06-session-reward`);
    await visit(`${base}/rate`, '07-rate');
    await page.getByRole('radio', { name: '٢' }).click();
    await visit(`${base}/progress`, '08-progress');
    await visit(`${base}/voice`, '09-voice-menu');
    await visit(`${base}/voice/turtle`, '10-turtle-intro');
    await page.getByRole('button', { name: 'يلا نبدأ' }).click();
    await shoot(page, `${scheme}-11-turtle-play`);
    await visit(`${base}/voice/balloon`, '12-balloon-intro');
    await page.getByRole('button', { name: 'يلا نبدأ' }).click();
    await shoot(page, `${scheme}-13-balloon-play`);
    await visit(`${base}/voice/snake`, '14-snake-intro');
    await page.getByRole('button', { name: 'يلا نبدأ' }).click();
    await shoot(page, `${scheme}-15-snake-play`);
    await visit(`${base}/learn`, '16-learn-menu');
    await visit(`${base}/learn/ar-letters/listen`, '17-listen-pick');
    await visit(`${base}/learn/ar-letters/match`, '18-match');
    await visit(`${base}/learn/numbers/count`, '19-count');
    await visit(`${base}/learn/ar-letters/trace`, '20-trace');
    await visit(`${base}/stories/nest`, '21-story');
    await visit(`${base}/stickers`, '22-stickers');
    await visit(`${base}/library`, '23-library');
    await visit(`${base}/settings`, '24-settings');
    await visit('/guide', '25-guide');
    await visit('/account', '26-account');
  });
}
