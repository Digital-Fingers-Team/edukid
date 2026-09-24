const PATHS = {
  back: 'M9 5l7 7-7 7',            // points right: "back" in RTL
  gear: 'M12 8a4 4 0 100 8 4 4 0 000-8zm0-5v3m0 12v3m9-9h-3M6 12H3m15.4-6.4l-2.1 2.1M7.7 16.3l-2.1 2.1m12.8 0l-2.1-2.1M7.7 7.7L5.6 5.6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  play: 'M8 5.5v13l11-6.5z',
  plus: 'M12 5v14M5 12h14',
  speaker: 'M4 9.5h4l5-4v13l-5-4H4zM16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12',
} as const;
export type IconName = keyof typeof PATHS;
export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
