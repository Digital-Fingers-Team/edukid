import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Art } from '../art/Art';
import { ChildScreen } from '../components/ChildScreen';
import { Icon } from '../components/Icon';
import { speech } from '../content';
import { speak } from '../lib/speak';
import { Dots } from '../games/TurtleBoard';

export function Stories() {
  const { storyId } = useParams();
  const story = speech.stories.find((s) => s.id === storyId);
  const [i, setI] = useState(0);
  if (!story) {
    return (
      <ChildScreen title="حكايات">
        <div className="tiles">
          {speech.stories.map((s, k) => (
            <Link key={s.id} className={`tile ${['sage', 'sky', 'sun', 'clay'][k % 4]}`} to={s.id}><Art code={s.frames[0]!.art} />{s.title}</Link>
          ))}
        </div>
      </ChildScreen>
    );
  }
  const f = story.frames[i]!;
  const last = i === story.frames.length - 1;
  return (
    <ChildScreen title={story.title}>
      <div className="story">
        <div className="talk-card"><Art code={f.art} size={170} /><p>{f.text}</p></div>
        <div className="row">
          <button className="round-btn" onClick={() => speak(f.text, 'ar')} aria-label="اسمع"><Icon name="speaker" /></button>
          {!last && <button className="btn btn-primary" onClick={() => setI(i + 1)}>وبعدين؟</button>}
          {last && <Link className="btn btn-primary" to=".." relative="path">حكاية تانية</Link>}
        </div>
        <Dots n={story.frames.length} at={i} />
        <p className="muted parent-note">لولي الأمر: اسأل طفلك «إيه اللي حصل؟» وسيبه يحكي براحته.</p>
      </div>
    </ChildScreen>
  );
}
