import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Child, PracticeSession } from '../../../../shared/types';
import { StickerReward } from '../components/StickerReward';
import { LEVEL_NAMES, toArabicDigits } from '../content';
import { suggestLevel } from '../logic/levels';
import { db } from '../store/db';
import { updateChild } from '../store/repo';

export function FinishStep({ child, session }: { child: Child; session: PracticeSession }) {
  const nav = useNavigate();
  const [rewarded, setRewarded] = useState(false);
  const [answered, setAnswered] = useState(false);
  const sessions = useLiveQuery(() => db.sessions.where('childId').equals(child.id).toArray(), [child.id]) ?? [];
  const rated = useLiveQuery(() => db.ratings.get([child.id, session.date]), [child.id, session.date]);
  const suggestion = suggestLevel(child.level, sessions);

  if (!rewarded) return <StickerReward childId={child.id} onDone={() => setRewarded(true)} doneLabel="كمّل" />;

  return (
    <div className="parent finish">
      <section className="panel">
        <h2>جلسة النهارده</h2>
        <p>
          {toArabicDigits(Math.max(1, Math.round(session.durationSec / 60)))} دقيقة ·
          كلام ناعم {toArabicDigits(session.smooth)} مرة · مطبات {toArabicDigits(session.bumpy)} مرة
        </p>
        <p className="muted">الأرقام دي ليك إنت بس، مش للطفل. المهم إنكم لعبتوا مع بعض.</p>
      </section>
      {suggestion.move !== 'stay' && !answered && (
        <section className="panel">
          <h2>{suggestion.move === 'up' ? 'نجرب مستوى أصعب؟' : 'نرجع لمستوى أسهل؟'}</h2>
          <p>
            {suggestion.move === 'up'
              ? `آخر ٣ جلسات في «${LEVEL_NAMES[child.level]}» كانت ناعمة أغلب الوقت. نقترح «${LEVEL_NAMES[suggestion.level]}».`
              : `آخر جلستين كان فيهم مطبات كتير. نقترح نرجع لـ«${LEVEL_NAMES[suggestion.level]}» شوية.`}
          </p>
          <div className="row">
            <button className="btn btn-primary" onClick={() => { void updateChild(child.id, { level: suggestion.level }); setAnswered(true); }}>ماشي</button>
            <button className="btn" onClick={() => setAnswered(true)}>نفضل زي ما إحنا</button>
          </div>
        </section>
      )}
      <button className="btn btn-primary btn-block" onClick={() => nav(rated ? '..' : '../rate', { relative: 'path' })}>
        {rated ? 'رجوع للرئيسية' : 'تقييم اليوم'}
      </button>
    </div>
  );
}
