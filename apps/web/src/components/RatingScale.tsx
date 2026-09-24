import { toArabicDigits } from '../content';

const tone = (v: number) => (v <= 1 ? 'low' : v <= 4 ? 'mid' : 'high');

export function RatingScale({ value, onPick }: { value?: number; onPick: (v: number) => void }) {
  return (
    <div className="rating">
      <div className="rating-row" role="radiogroup" aria-label="تقييم من ٠ لـ ٩">
        {Array.from({ length: 10 }, (_, v) => (
          <button key={v} type="button" role="radio" aria-checked={value === v}
            className={`rating-dot ${tone(v)}`} onClick={() => onPick(v)}>
            {toArabicDigits(v)}
          </button>
        ))}
      </div>
      <div className="rating-legend">
        <span>٠ مفيش تلعثم</span><span>١ خفيف جدًا</span><span>٩ شديد جدًا</span>
      </div>
    </div>
  );
}
