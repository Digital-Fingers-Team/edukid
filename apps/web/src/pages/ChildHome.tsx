import { Link } from 'react-router';
import { Art } from '../art/Art';
import { Turtle } from '../art/Turtle';
import { Icon } from '../components/Icon';
import { toArabicDigits } from '../content';
import { useChild, useTodayPlan } from './ChildLayout';

export function ChildHome() {
  const child = useChild();
  const plan = useTodayPlan(child);
  const target = child.stage === 1
    ? '١٠ دقايق لعب مع ماما أو بابا'
    : plan.perWeek < 1
      ? 'جلسة كل أسبوعين'
      : `الأسبوع ده: ${toArabicDigits(plan.weekCount)} من ${toArabicDigits(plan.perWeek)} جلسات`;

  return (
    <div className="kid page home">
      <header className="home-head">
        <Art code={child.avatar} size={56} />
        <h1 className="kid-title">أهلاً يا {child.name}</h1>
        <Link className="round-btn" to="settings" aria-label="إعدادات ولي الأمر"><Icon name="gear" /></Link>
      </header>

      {plan.proposal && (
        <Link className="notice" to="progress">
          {plan.proposal === 'stage2'
            ? 'التقييمات حلوة ٣ أسابيع ورا بعض — شكلكم جاهزين للمرحلة التانية. اعرف أكتر'
            : 'التلعثم زاد الأسبوع ده. ممكن نرجع للجلسات اليومية؟ اعرف أكتر'}
        </Link>
      )}

      <h2 className="section-title">خطة النهارده</h2>
      <div className="tiles">
        <Link className="tile wide clay plan" to="session">
          <Turtle size={96} walking={!plan.doneToday} />
          <span>
            جلسة الكلام
            <span className="sub">{target}</span>
            {plan.doneToday && <span className="badge done"><Icon name="check" size={18} />خلصناها النهارده</span>}
          </span>
        </Link>
        <Link className="tile wide sun plan" to="rate">
          <Art code="1F4C8" size={72} />
          <span>
            تقييم اليوم
            <span className="sub">
              {plan.rating === undefined ? 'لولي الأمر: قيّم كلام النهارده من ٠ لـ ٩' : `النهارده: ${toArabicDigits(plan.rating)}`}
            </span>
          </span>
        </Link>
      </div>

      <h2 className="section-title">نلعب</h2>
      <div className="tiles">
        <Link className="tile sage" to="voice"><Art code="1F3A4" />ألعاب الصوت</Link>
        <Link className="tile sky" to="learn"><Art code="1F524" />نتعلم</Link>
        <Link className="tile sun" to="stories"><Art code="1F4DA" />حكايات</Link>
        <Link className="tile clay" to="stickers"><Art code="1F31F" />ملصقاتي</Link>
      </div>

      <nav className="parent-strip" aria-label="لولي الأمر">
        <Link to="progress">التقدم</Link>
        <Link to="/guide">الدليل</Link>
        <Link to="library">المكتبة</Link>
        <Link to="settings">الإعدادات</Link>
      </nav>
    </div>
  );
}
