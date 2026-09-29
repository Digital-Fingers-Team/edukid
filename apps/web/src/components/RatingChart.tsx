import { useState } from 'react';
import { toArabicDigits } from '../content';
import { addDays } from '../logic/dates';
import type { DayRating } from '../logic/stages';

const W = 336;
const H = 170;
const TOP = 12;
const BASE = 140;
const PLOT_END = W - 24; // axis labels live in the right gutter

export function RatingChart({ ratings, today, days = 28 }: { ratings: DayRating[]; today: string; days?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const byDate = new Map(ratings.map((r) => [r.date, r.value]));
  const slot = PLOT_END / days;
  const cols = Array.from({ length: days }, (_, i) => {
    const date = addDays(today, -(days - 1 - i));
    return { date, value: byDate.get(date), x: PLOT_END - (i + 1) * slot }; // oldest on the right (RTL)
  });
  const rated = cols.filter((c) => c.value !== undefined);
  const avg = rated.length ? rated.reduce((a, c) => a + c.value!, 0) / rated.length : null;
  const label = `تقييمات آخر ${toArabicDigits(days)} يوم. ${
    avg === null ? 'لسه مفيش تقييمات.' : `المتوسط ${toArabicDigits(avg.toFixed(1))} من ٩ في ${toArabicDigits(rated.length)} يوم.`}`;
  const y = (v: number) => BASE - (v / 9) * (BASE - TOP);
  const tip = hover === null ? null : cols[hover]!;

  return (
    <div className="chart-wrap">
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} onPointerLeave={() => setHover(null)}>
        {[0, 3, 6, 9].map((v) => (
          <g key={v}>
            <line x1="0" x2={PLOT_END} y1={y(v)} y2={y(v)} className="grid" />
            <text x={W - 4} y={y(v) + 4} className="axis" textAnchor="end">{toArabicDigits(v)}</text>
          </g>
        ))}
        {cols.map((c, i) => (
          <g key={c.date}>
            {c.value === undefined
              ? <circle cx={c.x + slot / 2} cy={BASE} r="2" className="missing" />
              : <path className={`bar${hover === i ? ' on' : ''}`}
                  d={barPath(c.x + 1, slot - 2, y(Math.max(c.value, 0.25)))} />}
            {/* hit target taller and wider than the mark */}
            <rect x={c.x} y={TOP} width={slot} height={BASE - TOP + 8} className="hit"
              onPointerEnter={() => setHover(i)} onPointerDown={() => setHover(i)} />
          </g>
        ))}
        <text x={PLOT_END} y={H - 6} className="axis" textAnchor="end">من ٤ أسابيع</text>
        <text x="0" y={H - 6} className="axis" textAnchor="start">النهارده</text>
      </svg>
      {tip && (
        <div className="chart-tip" role="status">
          {toArabicDigits(tip.date.slice(5).replace('-', '/'))}: {tip.value === undefined ? 'مفيش تقييم' : toArabicDigits(tip.value)}
        </div>
      )}
    </div>
  );
}

/** Bar with a 4px rounded top, square base on the baseline. */
function barPath(x: number, w: number, top: number): string {
  const r = Math.min(4, w / 2, BASE - top);
  return `M${x} ${BASE} V${top + r} Q${x} ${top} ${x + r} ${top} H${x + w - r} Q${x + w} ${top} ${x + w} ${top + r} V${BASE} Z`;
}
