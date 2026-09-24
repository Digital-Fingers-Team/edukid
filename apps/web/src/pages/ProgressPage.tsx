import { useLiveQuery } from 'dexie-react-hooks';
import { ParentScreen } from '../components/ParentScreen';
import { RatingChart } from '../components/RatingChart';
import { LEVEL_NAMES, toArabicDigits } from '../content';
import { addDays, weekStart } from '../logic/dates';
import { stage2PerWeek, summarizeWeek } from '../logic/stages';
import { db } from '../store/db';
import { updateChild } from '../store/repo';
import { useChild, useTodayPlan } from './ChildLayout';

export function ProgressPage() {
  const child = useChild();
  const plan = useTodayPlan(child);
  const ratings = useLiveQuery(() => db.ratings.where('childId').equals(child.id).toArray(), [child.id]) ?? [];
  const sessions = useLiveQuery(() => db.sessions.where('childId').equals(child.id).toArray(), [child.id]) ?? [];
  const current = weekStart(plan.today);
  const weeks = Array.from({ length: 8 }, (_, i) => addDays(current, -7 * i)).map((start) => ({
    ...summarizeWeek(ratings, start),
    sessions: sessions.filter((s) => s.date >= start && s.date < addDays(start, 7) && s.durationSec >= 60).length,
  }));

  const frequency = child.stage === 1 ? 'جلسة كل يوم'
    : ({ 3: '٣ جلسات في الأسبوع', 2: 'جلستين في الأسبوع', 1: 'جلسة في الأسبوع', 0.5: 'جلسة كل أسبوعين' } as Record<number, string>)[
      stage2PerWeek(child.stageSince, plan.today)] ?? '';

  return (
    <ParentScreen title={`تقدّم ${child.name}`}>
      {plan.proposal === 'stage2' && (
        <section className="panel proposal">
          <h2>جاهزين للمرحلة التانية</h2>
          <p>آخر ٣ أسابيع التقييمات كانت ٠ أو ١ أغلب الأيام. في المرحلة التانية الجلسات بتقل تدريجيًا، والتقييم اليومي بيستمر. الأفضل تاخدوا رأي الأخصائي.</p>
          <button className="btn btn-primary" onClick={() => void updateChild(child.id, { stage: 2, stageSince: plan.today })}>ننتقل للمرحلة التانية</button>
        </section>
      )}
      {plan.proposal === 'stage1' && (
        <section className="panel proposal">
          <h2>التلعثم زاد شوية</h2>
          <p>ده بيحصل ومش معناه إن فيه حاجة غلط. نقترح ترجعوا للجلسات اليومية لحد ما التقييمات تنزل تاني.</p>
          <button className="btn btn-primary" onClick={() => void updateChild(child.id, { stage: 1, stageSince: plan.today })}>نرجع للجلسات اليومية</button>
        </section>
      )}

      <section className="panel">
        <h2>آخر ٤ أسابيع</h2>
        <RatingChart ratings={ratings} today={plan.today} />
      </section>

      <section className="panel">
        <h2>أسبوع بأسبوع</h2>
        <table className="weeks">
          <thead><tr><th>الأسبوع</th><th>المتوسط</th><th>أيام متقيّمة</th><th>جلسات</th></tr></thead>
          <tbody>
            {weeks.map((w) => (
              <tr key={w.start}>
                <td>{toArabicDigits(w.start.slice(5).replace('-', '/'))}</td>
                <td>{w.average === null ? '—' : toArabicDigits(w.average.toFixed(1))}</td>
                <td>{toArabicDigits(w.rated)}</td>
                <td>{toArabicDigits(w.sessions)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>الوضع الحالي</h2>
        <p>المرحلة {child.stage === 1 ? 'الأولى' : 'التانية'} · {frequency} · مستوى الكلام: {LEVEL_NAMES[child.level]}</p>
        <details>
          <summary>تغيير المرحلة يدويًا (لو الأخصائي طلب كده)</summary>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn" onClick={() => void updateChild(child.id, { stage: 1, stageSince: plan.today })}>المرحلة الأولى</button>
            <button className="btn" onClick={() => void updateChild(child.id, { stage: 2, stageSince: plan.today })}>المرحلة التانية</button>
          </div>
        </details>
      </section>
    </ParentScreen>
  );
}
