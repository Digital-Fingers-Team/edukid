import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Kg } from '../../../../shared/types';
import { Art } from '../art/Art';
import { avatars } from '../content';
import { db } from '../store/db';
import { createChild, refreshChildren } from '../store/repo';
import { authMessage } from '../api/client';

export function Children() {
  const children = useLiveQuery(() => db.children.toArray(), []);
  const [adding, setAdding] = useState(false);
  useEffect(() => { void refreshChildren().catch(() => {}); }, []);

  return (
    <div className="page kid">
      <h1 className="kid-title children-title">مين هيلعب النهارده؟</h1>
      <div className="children-grid">
        {children?.map((c) => (
          <Link key={c.id} className="tile" to={`/child/${c.id}`}>
            <Art code={c.avatar} size={80} />
            {c.name}
            <span className="sub">{c.kg === 1 ? 'KG1' : 'KG2'}</span>
          </Link>
        ))}
        {!adding && children && children.length > 0 && (
          <button className="tile add-tile" onClick={() => setAdding(true)}>
            <span className="plus-mark" aria-hidden="true">+</span>
            إضافة طفل
          </button>
        )}
      </div>
      {(adding || children?.length === 0) && <AddChild onDone={() => setAdding(false)} />}
      <nav className="parent-strip"><Link to="/guide">دليل ولي الأمر</Link><Link to="/account">الحساب</Link></nav>
    </div>
  );
}

function AddChild({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [kg, setKg] = useState<Kg>(1);
  const [avatar, setAvatar] = useState(avatars[0]!);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await createChild({ name: name.trim(), kg, avatar });
      onDone();
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel parent add-child" onSubmit={submit}>
      <h2>طفل جديد</h2>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="field">
        <label htmlFor="child-name">اسم الطفل</label>
        <input id="child-name" required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <fieldset className="field">
        <legend>المرحلة</legend>
        <div className="segmented">
          <button type="button" aria-selected={kg === 1} onClick={() => setKg(1)}>KG1</button>
          <button type="button" aria-selected={kg === 2} onClick={() => setKg(2)}>KG2</button>
        </div>
      </fieldset>
      <fieldset className="field">
        <legend>اختار صورة</legend>
        <div className="avatar-pick">
          {avatars.map((a) => (
            <button key={a} type="button" aria-pressed={a === avatar} onClick={() => setAvatar(a)} aria-label={`صورة ${a}`}>
              <Art code={a} size={48} />
            </button>
          ))}
        </div>
      </fieldset>
      <button className="btn btn-primary btn-block" disabled={busy}>إضافة</button>
    </form>
  );
}
