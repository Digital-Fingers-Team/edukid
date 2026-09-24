import { useLiveQuery } from 'dexie-react-hooks';
import { Art } from '../art/Art';
import { ChildScreen } from '../components/ChildScreen';
import { stickers, toArabicDigits } from '../content';
import { db } from '../store/db';
import { useChild } from './ChildLayout';

export function StickerBook() {
  const child = useChild();
  const owned = useLiveQuery(() => db.stickers.where('childId').equals(child.id).toArray(), [child.id]) ?? [];
  const have = new Set(owned.map((o) => o.stickerId));
  return (
    <ChildScreen title="كتاب الملصقات">
      <p className="book-count">{toArabicDigits(have.size)} من {toArabicDigits(stickers.length)}</p>
      <div className="sticker-grid">
        {stickers.map((s) => (
          <div key={s.id} className={`sticker-slot${have.has(s.id) ? ' got' : ''}`}>
            {have.has(s.id) ? <Art code={s.art} size={64} alt="ملصق" /> : <span className="visually-hidden">لسه</span>}
          </div>
        ))}
      </div>
    </ChildScreen>
  );
}
