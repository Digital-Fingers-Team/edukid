import { useState } from 'react';
import { useNavigate } from 'react-router';
import { api, authMessage } from '../api/client';
import { useAuth } from '../auth/AuthProvider';
import { ParentScreen } from '../components/ParentScreen';
import { clearLocal } from '../store/db';

export function Account() {
  const { state, logout } = useAuth();
  const nav = useNavigate();
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const email = state.status === 'parent' ? state.me.email : '';

  return (
    <ParentScreen title="الحساب" back="/children">
      <section className="panel">
        <p>داخل بـ <bdi dir="ltr">{email}</bdi></p>
        <button className="btn" onClick={async () => { await logout(); nav('/'); }}>تسجيل الخروج</button>
      </section>

      <section className="panel">
        <h2>عن التطبيق</h2>
        <p>EduKid بيساعد الأسرة تدعم طفلها اللي بيتلعثم في البيت، على طريقة برنامج ليدكومب (Lidcombe) اللي بيعتمد على ولي الأمر. التطبيق مش بديل عن أخصائي التخاطب.</p>
        <p className="muted small-note">الرسومات من OpenMoji (openmoji.org) — رخصة CC BY-SA 4.0.</p>
      </section>

      <section className="panel danger">
        <h2>مسح الحساب</h2>
        <p className="muted">هيتمسح الحساب وكل الأطفال والجلسات والتقييمات والتسجيلات من السيرفر ومن الجهاز. مفيش رجوع.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="field">
          <label htmlFor="confirm">اكتب «امسح» للتأكيد</label>
          <input id="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <button className="btn" disabled={confirm.trim() !== 'امسح'} onClick={async () => {
          try {
            await api('DELETE', '/api/me');
            await clearLocal();
            await logout().catch(() => {});
            nav('/');
          } catch (err) { setError(authMessage(err)); }
        }}>امسح الحساب نهائيًا</button>
      </section>
    </ParentScreen>
  );
}
