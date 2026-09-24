import { useCallback, useEffect, useRef, useState } from 'react';
import { rmsToLevel } from '../logic/motion';

export type MicStatus = 'idle' | 'asking' | 'on' | 'denied' | 'unsupported';

export function useMicLevel() {
  const [status, setStatus] = useState<MicStatus>('idle');
  const level = useRef(0);
  const cleanup = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    cleanup.current?.();
    cleanup.current = null;
    level.current = 0;
  }, []);

  const start = useCallback(async () => {
    if (cleanup.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof AudioContext === 'undefined') {
      setStatus('unsupported');
      return;
    }
    setStatus('asking');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
      });
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      let raf = 0;
      const tick = () => {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i]! * buf[i]!;
        level.current = rmsToLevel(Math.sqrt(sum / buf.length));
        raf = requestAnimationFrame(tick);
      };
      tick();
      cleanup.current = () => {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((t) => t.stop());
        void ctx.close();
      };
      setStatus('on');
    } catch {
      setStatus('denied');
    }
  }, []);

  useEffect(() => stop, [stop]);
  return { status, level, start, stop };
}
