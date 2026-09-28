export function Art({ code, alt = '', size = 64 }: { code: string; alt?: string; size?: number }) {
  return <img src={`/art/${code}.svg`} alt={alt} width={size} height={size} draggable={false} />;
}
