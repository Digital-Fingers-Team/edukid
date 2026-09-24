export function Balloon({ size, color, wobble }: { size: number; color: string; wobble: boolean }) {
  const s = 0.35 + size * 0.65;
  return (
    <svg className={`balloon${wobble ? ' wobble' : ''}`} viewBox="0 0 120 200" width="100%" height="100%" aria-hidden="true">
      <path d="M60 150 C52 165 70 175 58 198" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      <g style={{ transform: `scale(${s})`, transformOrigin: '60px 150px', transition: 'transform .15s linear' }}>
        <ellipse cx="60" cy="80" rx="46" ry="56" fill={color} stroke="var(--ink)" strokeWidth="4" />
        <path d="M34 60 Q40 42 56 36" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="7" strokeLinecap="round" />
        <path d="M53 136 L67 136 L60 146 Z" fill={color} stroke="var(--ink)" strokeWidth="4" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
