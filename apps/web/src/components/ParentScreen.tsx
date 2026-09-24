import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../store/db';
import { Icon } from './Icon';

export function ParentScreen({ title, back = '..', children }: { title: string; back?: string; children: ReactNode }) {
  const nav = useNavigate();
  const pending = useLiveQuery(() => db.outbox.count(), []) ?? 0;
  return (
    <div className="parent page">
      <header className="parent-bar">
        <button className="round-btn" onClick={() => nav(back, { relative: 'path' })} aria-label="رجوع">
          <Icon name="back" />
        </button>
        <h1>{title}</h1>
        {pending > 0 && <span className="chip" title="هيتبعت أول ما النت يرجع">محفوظ على الجهاز</span>}
      </header>
      <main>{children}</main>
    </div>
  );
}
