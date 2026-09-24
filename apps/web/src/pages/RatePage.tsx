import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { ParentScreen } from '../components/ParentScreen';
import { RatingScale } from '../components/RatingScale';
import { addDays, todayKey } from '../logic/dates';
import { db } from '../store/db';
import { saveRating } from '../store/repo';
import { useChild } from './ChildLayout';

export function RatePage() {
  const child = useChild();
  const nav = useNavigate();
  const today = todayKey();
  const [date, setDate] = useState(today);
  const current = useLiveQuery(() => db.ratings.get([child.id, date]), [child.id, date]);
  const [saved, setSaved] = useState(false);

  async function pick(v: number) {
    await saveRating(child.id, date, v);
    setSaved(true);
  }

  return (
    <ParentScreen title="تقييم اليوم">
      <div className="segmented" role="tablist">
        <button role="tab" aria-selected={date === today} onClick={() => { setDate(today); setSaved(false); }}>النهارده</button>
        <button role="tab" aria-selected={date !== today} onClick={() => { setDate(addDays(today, -1)); setSaved(false); }}>امبارح</button>
      </div>
      <section className="panel">
        <h2>كلام {child.name} كان عامل إزاي {date === today ? 'النهارده' : 'امبارح'}؟</h2>
        <p className="muted">فكّر في اليوم كله، مش الجلسة بس. ٠ يعني مفيش تلعثم خالص، و٩ يعني شديد جدًا.</p>
        <RatingScale value={current?.value} onPick={(v) => void pick(v)} />
        {saved && <p className="saved" role="status">اتسجل. شكرًا!</p>}
      </section>
      {saved && <button className="btn btn-primary btn-block" onClick={() => nav('..', { relative: 'path' })}>رجوع للرئيسية</button>}
    </ParentScreen>
  );
}
