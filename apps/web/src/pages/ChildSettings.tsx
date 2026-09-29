import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Kg } from '../../../../shared/types';
import { Art } from '../art/Art';
import { ParentScreen } from '../components/ParentScreen';
import { avatars } from '../content';
import { authMessage } from '../api/client';
import { deleteChild, updateChild } from '../store/repo';
import { useChild } from './ChildLayout';

export function ChildSettings() {
  const child = useChild();
  const nav = useNavigate();
  const [name, setName] = useState(child.name);
  const [error, setError] = useState('');

  return (
    <ParentScreen title={`إعدادات ${child.name}`}>
      <section className="panel">
        <div className="field">
          <label htmlFor="n">الاسم</label>
          <input id="n" value={name} maxLength={40} onChange={(e) => setName(e.target.value)}
            onBlur={() => { if (name.trim() && name.trim() !== child.name) void updateChild(child.id, { name: name.trim() }); }} />
        </div>
        <fieldset className="field">
          <legend>المرحلة الدراسية</legend>
          <div className="segmented">
            {([1, 2] as Kg[]).map((k) => (
              <button key={k} type="button" aria-selected={child.kg === k} onClick={() => void updateChild(child.id, { kg: k })}>KG{k}</button>
            ))}
          </div>
        </fieldset>
        <fieldset className="field">
          <legend>الصورة</legend>
          <div className="avatar-pick">
            {avatars.map((a) => (
              <button key={a} type="button" aria-pressed={a === child.avatar} aria-label={`صورة ${a}`}
                onClick={() => void updateChild(child.id, { avatar: a })}><Art code={a} size={44} /></button>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="panel">
        <h2>تسجيلات الكلام</h2>
        <p className="muted">
          تقدر تسجل عينة كلام دقيقتين كل شهر، عشان تسمع الفرق مع الوقت أو تشاركها مع أخصائي التخاطب.
          التسجيلات بتتحفظ على السيرفر بتاعنا، ومحدش يقدر يسمعها غيرك، وتقدر تمسحها في أي وقت.
        </p>
        <label className="toggle">
          <input type="checkbox" checked={child.recordingConsent}
            onChange={(e) => void updateChild(child.id, { recordingConsent: e.target.checked })} />
          موافق على حفظ تسجيلات صوت {child.name}
        </label>
        {child.recordingConsent && <Link className="btn" to="../recordings" relative="path">التسجيلات</Link>}
      </section>

      <section className="panel danger">
        <h2>مسح الطفل</h2>
        <p className="muted">هيتمسح كل حاجة تخص {child.name}: الجلسات والتقييمات والتسجيلات.</p>
        {error && <p className="error">{error}</p>}
        <button className="btn" onClick={async () => {
          if (!window.confirm(`متأكد إنك عايز تمسح ${child.name} وكل بياناته؟`)) return;
          try { await deleteChild(child.id); nav('/children'); } catch (err) { setError(authMessage(err)); }
        }}>مسح {child.name}</button>
      </section>
    </ParentScreen>
  );
}
