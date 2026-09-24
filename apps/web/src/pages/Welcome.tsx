import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { authMessage } from '../api/client';
import { Turtle } from '../art/Turtle';

export function Welcome() {
  const { state, login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (state.status === 'parent') return <Navigate to="/children" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await (mode === 'login' ? login : register)(email, password);
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page welcome">
      <section className="welcome-hero">
        <Turtle size={200} />
        <h1 className="welcome-title">كلام ناعم، خطوة بخطوة</h1>
        <p className="welcome-lead">
          برنامج في البيت لأطفال الحضانة اللي عندهم تلعثم: عشر دقايق لعب كل يوم مع ماما أو بابا،
          وتقييم بسيط يوضّح التقدم أسبوع بأسبوع. ومعاه ألعاب للحروف والأرقام.
        </p>
      </section>

      <form className="panel" onSubmit={submit}>
        <div className="segmented" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => setMode('login')}>عندي حساب</button>
          <button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => setMode('register')}>حساب جديد</button>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="field">
          <label htmlFor="email">الإيميل</label>
          <input id="email" type="email" dir="ltr" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">كلمة السر</label>
          <input id="password" type="password" dir="ltr" minLength={8} required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password} onChange={(e) => setPassword(e.target.value)} />
          {mode === 'register' && <small className="muted">٨ حروف أو أرقام على الأقل</small>}
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}>{mode === 'login' ? 'دخول' : 'إنشاء الحساب'}</button>
      </form>

      <p className="muted disclaimer">
        التطبيق ده بيساعد الأسرة في البيت، لكنه مش بديل عن أخصائي التخاطب. لو طفلك بيتلعثم، الأفضل يتابع مع أخصائي.
      </p>
    </div>
  );
}
