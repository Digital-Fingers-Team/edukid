import { ParentScreen } from '../components/ParentScreen';
import { guide } from '../content';

export function Guide() {
  return (
    <ParentScreen title="دليل ولي الأمر" back="/children">
      {guide.map((s, i) => (
        <details key={s.id} className="panel guide" open={i === 0}>
          <summary><h2>{s.title}</h2></summary>
          {s.body.map((p) => <p key={p}>{p}</p>)}
          {s.do && (<><h3>ساعده كده</h3><ul className="do-list">{s.do.map((x) => <li key={x}>{x}</li>)}</ul></>)}
          {s.dont && (<><h3>ابعد عن</h3><ul className="dont-list">{s.dont.map((x) => <li key={x}>{x}</li>)}</ul></>)}
        </details>
      ))}
    </ParentScreen>
  );
}
