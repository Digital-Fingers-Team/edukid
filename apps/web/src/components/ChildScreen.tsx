import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Icon } from './Icon';

export function ChildScreen({ title, back = '..', children }: { title?: string; back?: string; children: ReactNode }) {
  const nav = useNavigate();
  return (
    <div className="kid page">
      <header className="kid-bar">
        <button className="round-btn" onClick={() => nav(back, { relative: 'path' })} aria-label="رجوع">
          <Icon name="back" />
        </button>
        {title && <h1 className="kid-title">{title}</h1>}
      </header>
      <main>{children}</main>
    </div>
  );
}
