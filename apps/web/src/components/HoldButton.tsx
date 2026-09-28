import { useState, type ReactNode } from 'react';

export function HoldButton({ onChange, children }: { onChange: (held: boolean) => void; children: ReactNode }) {
  const [held, setHeld] = useState(false);
  const set = (v: boolean) => { setHeld(v); onChange(v); };
  return (
    <button
      type="button"
      className={`hold-btn${held ? ' held' : ''}`}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); set(true); }}
      onPointerUp={() => set(false)}
      onPointerCancel={() => set(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}
