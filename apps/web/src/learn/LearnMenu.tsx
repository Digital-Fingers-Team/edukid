import { Link, useParams } from 'react-router';
import { Art } from '../art/Art';
import { ChildScreen } from '../components/ChildScreen';
import { SUBJECTS, type GameKind } from '../content';
import { useChild } from '../pages/ChildLayout';

const GAME_NAMES: Record<GameKind, { title: string; art: string }> = {
  listen: { title: 'اسمع واختار', art: '1F442' },
  match: { title: 'وصّل', art: '1F9E9' },
  count: { title: 'عدّ', art: '1F522' },
  trace: { title: 'ارسم', art: '270F' },
};
const TONES = ['sage', 'sky', 'sun', 'clay'];

export function LearnMenu() {
  const child = useChild();
  const { subject } = useParams();
  const meta = SUBJECTS.find((s) => s.id === subject);
  if (meta) {
    return (
      <ChildScreen title={meta.title}>
        <div className="tiles">
          {meta.games.map((g, i) => (
            <Link key={g} className={`tile ${TONES[i % 4]}`} to={g}><Art code={GAME_NAMES[g].art} />{GAME_NAMES[g].title}</Link>
          ))}
        </div>
      </ChildScreen>
    );
  }
  return (
    <ChildScreen title="نتعلم">
      <div className="tiles">
        {SUBJECTS.filter((s) => s.minKg <= child.kg).map((s, i) => (
          <Link key={s.id} className={`tile ${TONES[i % 4]}`} to={s.id}><Art code={s.art} />{s.title}</Link>
        ))}
      </div>
    </ChildScreen>
  );
}
