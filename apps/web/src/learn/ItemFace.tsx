import { Art } from '../art/Art';
import { Shape } from '../art/Shape';
import type { ContentItem } from '../content';

/** side 'question' shows the picture/amount; side 'answer' shows the letter/word/number. */
export function ItemFace({ item, side = 'answer' }: { item: ContentItem; side?: 'question' | 'answer' }) {
  if (item.swatch) return <span className="swatch" style={{ background: item.swatch }} />;
  if (item.shape) return <Shape shape={item.shape} />;
  if (side === 'question') {
    if (item.art) return <Art code={item.art} size={72} />;
    if (item.count !== undefined) return <DotGroup n={item.count} />;
  }
  if (item.subject === 'en-words' && item.art) return <Art code={item.art} size={72} />;
  return <span className={`face-text${item.lang === 'en' ? ' en' : ''}`}>{item.label}</span>;
}

export function DotGroup({ n }: { n: number }) {
  return (
    <span className="dot-group" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => <span key={i} />)}
    </span>
  );
}
