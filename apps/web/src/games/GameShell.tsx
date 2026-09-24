import { useCallback, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ChildScreen } from '../components/ChildScreen';
import { HoldButton } from '../components/HoldButton';
import { StickerReward } from '../components/StickerReward';
import { useChild } from '../pages/ChildLayout';
import { useMicLevel } from './useMicLevel';

export const HELD_LEVEL = 0.55;

export function GameShell({ title, hint, render }: {
  title: string;
  hint: string;
  render: (getLevel: () => number, finish: () => void) => ReactNode;
}) {
  const child = useChild();
  const nav = useNavigate();
  const mic = useMicLevel();
  const held = useRef(false);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const getLevel = useCallback(() => (held.current ? HELD_LEVEL : mic.level.current), [mic.level]);
  const finish = useCallback(() => { mic.stop(); setFinished(true); }, [mic]);

  if (finished) {
    return (
      <ChildScreen title={title}>
        <StickerReward childId={child.id} onDone={() => nav('..', { relative: 'path' })} />
      </ChildScreen>
    );
  }
  if (!started) {
    return (
      <ChildScreen title={title}>
        <div className="game-intro">
          <p className="speech-bubble">{hint}</p>
          <p className="muted parent-note">لولي الأمر: اقعد جنب طفلك وقول الكلمة الأول بهدوء، وهو يقلدك.</p>
          <button className="btn btn-primary" onClick={async () => { await mic.start(); setStarted(true); }}>يلا نبدأ</button>
        </div>
      </ChildScreen>
    );
  }
  const fallback = mic.status === 'denied' || mic.status === 'unsupported';
  return (
    <ChildScreen title={title}>
      {render(getLevel, finish)}
      {fallback && (
        <div className="fallback">
          <p className="muted">المايك مش شغال. دوسوا مع بعض على الزرار وإنتوا بتتكلموا.</p>
          <HoldButton onChange={(v) => { held.current = v; }}>دوس وإنت بتتكلم</HoldButton>
        </div>
      )}
    </ChildScreen>
  );
}
