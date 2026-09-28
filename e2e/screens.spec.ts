// Visual review pass: phone-size screenshots of every screen, light and dark.
// It also fails if any screen is wider than the phone (sideways scrolling / overlapping taps).
import { expect, test, type Page } from '@playwright/test';
import { childId, registerWithChild } from './helpers';

const OUT = process.env.SCREENS_DIR ?? 'test-results/screens';

for (const scheme of ['light', 'dark'] as const) {
  test(`screens (${scheme})`, async ({ page }) => {
    test.setTimeout(600_000);
    const tooWide: string[] = [];
    const shoot = async (name: string) => {
      await page.waitForTimeout(700);
      const { scroll, view } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, view: window.innerWidth }));
      if (scroll > view + 1) tooWide.push(`${name}: ${scroll}px > ${view}px`);
      await page.screenshot({ path: `${OUT}/${scheme}-${name}.png`, fullPage: true });
    };
    const visit = async (path: string, name: string) => { await page.goto(path); await shoot(name); };

    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    await page.goto('/');
    await shoot('01-welcome');
    await registerWithChild(page);
    const base = `/child/${await childId(page)}`;
    await visit('/children', '02-children');
    await visit(base, '03-home');
    await visit(`${base}/session`, '04-session-intro');
    await page.getByRole('button', { name: 'ندخل على اللعب علطول' }).click();
    for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'كلام ناعم' }).click();
    await shoot('05-session-talk');
    await page.getByRole('button', { name: 'خلصنا' }).click();
    await shoot('06-session-reward');
    await visit(`${base}/rate`, '07-rate');
    await page.getByRole('radio', { name: '٢' }).click({ timeout: 10_000 });
    await visit(`${base}/progress`, '08-progress');
    await visit(`${base}/voice`, '09-voice-menu');
    for (const [game, n] of [['turtle', 10], ['balloon', 12], ['snake', 14], ['bubbles', 16]] as const) {
      await visit(`${base}/voice/${game}`, `${n}-${game}-intro`);
      await page.getByRole('button', { name: 'يلا نبدأ' }).click();
      await shoot(`${n + 1}-${game}-play`);
    }
    await visit(`${base}/learn`, '20-learn-menu');
    await visit(`${base}/learn/ar-letters/listen`, '21-listen-pick');
    await visit(`${base}/learn/ar-letters/match`, '22-match');
    await visit(`${base}/learn/numbers/count`, '23-count');
    await visit(`${base}/learn/ar-letters/trace`, '24-trace');
    await visit(`${base}/stories/nest`, '25-story');
    await visit(`${base}/stickers`, '26-stickers');
    await visit(`${base}/library`, '27-library');
    await visit(`${base}/settings`, '28-settings');
    await visit('/guide', '29-guide');
    await visit('/account', '30-account');
    expect(tooWide).toEqual([]);
  });
}
