export function Snake({ length }: { length: number }) {
  const L = 40 + length * 260;
  const pts: string[] = [];
  for (let x = 0; x <= L; x += 6) pts.push(`${x},${40 + Math.sin(x / 20) * 12}`);
  const headY = 40 + Math.sin(L / 20) * 12;
  const body = `M${pts.join(' L')}`;
  return (
    <svg viewBox="-20 0 360 80" width="100%" aria-hidden="true" style={{ transform: 'scaleX(-1)' }}>
      <path d={body} fill="none" stroke="var(--ink)" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
      <path d={body} fill="none" stroke="#E3AE3C" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
      <path d={body} fill="none" stroke="#C98F22" strokeWidth="4" strokeDasharray="2 14" strokeLinecap="round" />
      <g transform={`translate(${L} ${headY})`}>
        <path d="M14 2 L24 -2 M24 -2 L28 -6 M24 -2 L28 2" stroke="#C0463A" strokeWidth="3" strokeLinecap="round" />
        <circle r="17" fill="#E3AE3C" stroke="var(--ink)" strokeWidth="4" />
        <circle cx="5" cy="-6" r="3" fill="var(--ink)" />
      </g>
    </svg>
  );
}
