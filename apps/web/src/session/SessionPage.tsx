import { useCallback, useRef, useState } from 'react';
import type { PracticeSession } from '../../../../shared/types';
import { ChildScreen } from '../components/ChildScreen';
import { HoldButton } from '../components/HoldButton';
import { BubblesBoard } from '../games/BubblesBoard';
import { HELD_LEVEL } from '../games/GameShell';
import { useMicLevel } from '../games/useMicLevel';
import { useChild } from '../pages/ChildLayout';
import { FinishStep } from './FinishStep';
import { TalkingGame } from './TalkingGame';

export function SessionPage() {
  const child = useChild();
  const [step, setStep] = useState<'intro' | 'warmup' | 'talk' | 'finish'>('intro');
  const [session, setSession] = useState<PracticeSession | null>(null);
  const mic = useMicLevel();
  const held = useRef(false);
  const getLevel = useCallback(() => (held.current ? HELD_LEVEL : mic.level.current), [mic.level]);

  return (
    <ChildScreen title="جلسة الكلام">
      {step === 'intro' && (
        <div className="parent panel session-intro">
          <h2>قبل ما تبدأوا</h2>
          <ul className="do-list">
            <li>اقعدوا في مكان هادي، والتلفزيون مقفول.</li>
            <li>إنت كمان اتكلم بهدوء وبطء شوية؛ طفلك هيقلدك.</li>
            <li>شجّع الكلام الناعم. متقولش «اهدى» أو «اتكلم براحة».</li>
          </ul>
          <button className="btn btn-primary btn-block" onClick={async () => { await mic.start(); setStep('warmup'); }}>نبدأ بالتسخين</button>
          <button className="btn btn-quiet btn-block" onClick={() => setStep('talk')}>ندخل على اللعب علطول</button>
        </div>
      )}
      {step === 'warmup' && (
        <>
          <BubblesBoard getLevel={getLevel} goal={12} onFinish={() => { mic.stop(); setStep('talk'); }} />
          {(mic.status === 'denied' || mic.status === 'unsupported') && (
            <div className="fallback"><HoldButton onChange={(v) => { held.current = v; }}>دوس وإنت بتنفخ</HoldButton></div>
          )}
          <button className="btn btn-quiet btn-block" onClick={() => { mic.stop(); setStep('talk'); }}>كفاية تسخين</button>
        </>
      )}
      {step === 'talk' && <TalkingGame child={child} onEnd={(s) => { setSession(s); setStep('finish'); }} />}
      {step === 'finish' && session && <FinishStep child={child} session={session} />}
    </ChildScreen>
  );
}
