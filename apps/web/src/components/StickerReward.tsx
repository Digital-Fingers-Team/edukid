import { useEffect, useState } from 'react';
import { Art } from '../art/Art';
import { stickers } from '../content';
import { shuffle } from '../logic/leitner';
import { db } from '../store/db';
import { addSticker } from '../store/repo';

type StickerDef = (typeof stickers)[number];

export function StickerReward({ childId, onDone, doneLabel = 'يلا' }: { childId: string; onDone: () => void; doneLabel?: string }) {
  const [choices, setChoices] = useState<StickerDef[] | null>(null);
  const [picked, setPicked] = useState<StickerDef | null>(null);

  useEffect(() => {
    let alive = true;
    void db.stickers.where('childId').equals(childId).toArray().then((owned) => {
      const have = new Set(owned.map((o) => o.stickerId));
      const fresh = shuffle(stickers.filter((s) => !have.has(s.id)));
      const rest = shuffle(stickers.filter((s) => have.has(s.id)));
      if (alive) setChoices([...fresh, ...rest].slice(0, 3));
    });
    return () => { alive = false; };
  }, [childId]);

  async function pick(s: StickerDef) {
    setPicked(s);
    await addSticker(childId, s.id);
  }

  if (!choices) return null;
  return (
    <section className="reward" aria-live="polite">
      {!picked ? (
        <>
          <h2 className="reward-title">برافو إنك لعبت! اختار ملصق</h2>
          <div className="reward-choices">
            {choices.map((s) => (
              <button key={s.id} className="sticker-choice" data-art={s.art} aria-label={`ملصق ${s.art}`} onClick={() => void pick(s)}>
                <Art code={s.art} size={88} />
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="sticker-won"><Art code={picked.art} size={150} /></div>
          <h2 className="reward-title">الملصق راح في كتاب الملصقات!</h2>
          <button className="btn btn-primary" onClick={onDone}>{doneLabel}</button>
        </>
      )}
    </section>
  );
}
