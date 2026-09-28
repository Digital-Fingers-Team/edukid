import { useEffect, useRef } from 'react';

/** Calls cb every animation frame with the elapsed ms (capped at 50 so a background tab does not jump). */
export function useFrame(cb: (dtMs: number) => void, active: boolean) {
  const saved = useRef(cb);
  saved.current = cb;
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      saved.current(Math.min(50, t - last));
      last = t;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}
