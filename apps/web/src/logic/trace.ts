/** alpha: RGBA pixels of a cols×cols canvas the glyph was drawn on. */
export function glyphCells(alpha: Uint8ClampedArray, cols: number): Set<number> {
  const cells = new Set<number>();
  for (let i = 0; i < cols * cols; i++) if (alpha[i * 4 + 3]! > 100) cells.add(i);
  return cells;
}

export function cellsNear(x: number, y: number, cellPx: number, cols: number, radiusCells = 1): number[] {
  const cx = Math.floor(x / cellPx);
  const cy = Math.floor(y / cellPx);
  const out: number[] = [];
  for (let dy = -radiusCells; dy <= radiusCells; dy++) {
    for (let dx = -radiusCells; dx <= radiusCells; dx++) {
      const gx = cx + dx;
      const gy = cy + dy;
      if (gx >= 0 && gy >= 0 && gx < cols && gy < cols) out.push(gy * cols + gx);
    }
  }
  return out;
}

export function coverage(glyph: Set<number>, touched: Set<number>): number {
  if (glyph.size === 0) return 0;
  let hit = 0;
  for (const c of glyph) if (touched.has(c)) hit++;
  return hit / glyph.size;
}
