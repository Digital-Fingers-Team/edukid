import { describe, expect, it } from 'vitest';
import { cellsNear, coverage, glyphCells } from './trace';

describe('trace', () => {
  it('finds glyph cells from an alpha grid (RGBA)', () => {
    const cols = 4;
    const alpha = new Uint8ClampedArray(cols * cols * 4);
    alpha[(1 * cols + 2) * 4 + 3] = 255; // cell (x=2, y=1)
    alpha[(3 * cols + 0) * 4 + 3] = 20;  // too faint
    expect([...glyphCells(alpha, cols)]).toEqual([6]);
  });
  it('marks cells around a touch point', () => {
    const cells = cellsNear(25, 25, 10, 10, 1).sort((a, b) => a - b);
    expect(cells).toEqual([11, 12, 13, 21, 22, 23, 31, 32, 33]);
  });
  it('ignores touches outside the grid', () => {
    expect(cellsNear(-50, 5, 10, 10, 1)).toEqual([]);
  });
  it('coverage is the share of glyph cells touched', () => {
    expect(coverage(new Set([1, 2, 3, 4]), new Set([1, 2, 3, 99]))).toBe(0.75);
    expect(coverage(new Set(), new Set([1]))).toBe(0);
  });
});
