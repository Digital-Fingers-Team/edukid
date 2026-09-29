import type { ShapeName } from '../content';

const D: Record<ShapeName, string> = {
  circle: 'M50 12a38 38 0 1 0 0.01 0Z',
  square: 'M16 16H84V84H16Z',
  triangle: 'M50 12L88 84H12Z',
  rectangle: 'M8 28H92V72H8Z',
  star: 'M50 8l11 27 29 2-22 19 7 29-25-16-25 16 7-29-22-19 29-2Z',
  heart: 'M50 86C18 62 8 44 18 28c9-14 26-13 32 2 6-15 23-16 32-2 10 16 0 34-32 58Z',
};
export function Shape({ shape, size = 72 }: { shape: ShapeName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <path d={D[shape]} fill="var(--sky-soft)" stroke="var(--ink)" strokeWidth="5" strokeLinejoin="round" />
    </svg>
  );
}
