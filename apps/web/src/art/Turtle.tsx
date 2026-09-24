export function Turtle({ size = 160, walking = false, mood = 'happy' }: { size?: number; walking?: boolean; mood?: 'happy' | 'sleepy' }) {
  return (
    <svg className={`turtle${walking ? ' walking' : ''}`} width={size} height={size * 0.7} viewBox="0 0 160 112" aria-hidden="true">
      <g stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <rect className="leg leg-back" x="38" y="70" width="18" height="24" rx="8" fill="#9CC5A1" />
        <rect className="leg leg-front" x="96" y="70" width="18" height="24" rx="8" fill="#9CC5A1" />
        <path d="M22 76 L10 82 L24 84 Z" fill="#9CC5A1" />
        <path d="M24 78 C24 30 124 26 128 78 Z" fill="#5E8C6B" />
        <path d="M50 76 L58 52 L80 44 L102 52 L108 76" fill="none" stroke="#2E4A36" strokeWidth="3" />
        <path d="M80 44 L80 76" fill="none" stroke="#2E4A36" strokeWidth="3" />
        <path d="M20 78 H132" fill="none" />
        <circle cx="140" cy="62" r="17" fill="#9CC5A1" />
        {mood === 'happy'
          ? <path d="M136 70 Q142 75 148 69" fill="none" strokeWidth="3" />
          : <path d="M137 71 H147" fill="none" strokeWidth="3" />}
      </g>
      {mood === 'happy'
        ? <circle cx="145" cy="57" r="3.2" fill="var(--ink)" />
        : <path d="M141 57 Q145 60 149 57" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" />}
      <circle cx="131" cy="66" r="3.5" fill="#E8A3A3" opacity=".8" />
    </svg>
  );
}
