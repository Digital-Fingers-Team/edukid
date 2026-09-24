import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { cellsNear, coverage, glyphCells } from '../logic/trace';
import { speak } from '../lib/speak';
import type { GameProps } from './LearnRound';

const SIZE = 300;
const COLS = 30;
const CELL = SIZE / COLS;

export function TraceGame({ items, onDone }: GameProps) {
  const item = items[0]!;
  const glyph = [...item.label][0]!;
  const canvas = useRef<HTMLCanvasElement>(null);
  const cells = useRef<Set<number>>(new Set());
  const touched = useRef<Set<number>>(new Set());
  const drawing = useRef(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    speak(item.say, item.lang);
    const off = document.createElement('canvas');
    off.width = off.height = COLS;
    const octx = off.getContext('2d');
    const ctx = canvas.current?.getContext('2d');
    if (!octx || !ctx) return;
    const font = (px: number) => `800 ${px}px "Baloo Bhaijaan 2", sans-serif`;
    octx.font = font(COLS * 0.8);
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillText(glyph, COLS / 2, COLS / 2);
    cells.current = glyphCells(octx.getImageData(0, 0, COLS, COLS).data, COLS);
    touched.current = new Set();
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.font = font(SIZE * 0.8);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--line');
    ctx.fillText(glyph, SIZE / 2, SIZE / 2);
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--clay');
  }, [glyph, item.say, item.lang]);

  function point(e: PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * SIZE, y: ((e.clientY - r.top) / r.height) * SIZE };
  }
  function down(e: PointerEvent<HTMLCanvasElement>) {
    if (done) return;
    drawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = point(e);
    const ctx = canvas.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function move(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || done) return;
    const { x, y } = point(e);
    const ctx = canvas.current!.getContext('2d')!;
    ctx.lineTo(x, y);
    ctx.stroke();
    for (const c of cellsNear(x, y, CELL, COLS, 1)) touched.current.add(c);
    if (coverage(cells.current, touched.current) >= 0.7) {
      setDone(true);
      speak(item.lang === 'ar' ? 'برافو!' : 'Great!', item.lang);
      setTimeout(() => onDone([{ itemId: item.id, correct: true }]), 900);
    }
  }

  return (
    <div className="learn-game">
      <p className="learn-hint">امشي بصباعك على {item.lang === 'ar' ? 'الحرف' : 'the letter'}</p>
      <canvas ref={canvas} width={SIZE} height={SIZE} className={`trace-pad${done ? ' yay' : ''}`}
        onPointerDown={down} onPointerMove={move} onPointerUp={() => { drawing.current = false; }}
        onPointerCancel={() => { drawing.current = false; }} aria-label={`ارسم ${item.label}`} />
    </div>
  );
}
