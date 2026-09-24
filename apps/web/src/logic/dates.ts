const pad = (n: number) => String(n).padStart(2, '0');

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parse(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y!, m! - 1, d!, 12); // noon avoids DST edge cases
}

export function addDays(key: string, n: number): string {
  const d = parse(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

/** Weeks start on Saturday (Egypt). */
export function weekStart(key: string): string {
  const back = (parse(key).getDay() + 1) % 7; // Sat→0, Sun→1 … Fri→6
  return addDays(key, -back);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000);
}

export const todayKey = () => toDateKey(new Date());
