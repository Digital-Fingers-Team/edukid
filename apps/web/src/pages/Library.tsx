import { useState } from 'react';
import { Art } from '../art/Art';
import { ChildScreen } from '../components/ChildScreen';
import { library } from '../content';

export function Library() {
  const [video, setVideo] = useState<string | null>(null);
  return (
    <ChildScreen title="المكتبة">
      <h2 className="section-title">كتب</h2>
      <div className="tiles">
        {library.books.map((b) => (
          <a key={b.id} className="tile sky" href={b.file} target="_blank" rel="noopener"><Art code={b.art} />{b.title}</a>
        ))}
      </div>
      {library.videos.length > 0 && (
        <>
          <h2 className="section-title">أغاني</h2>
          {video && (
            <div className="video-frame">
              <iframe src={`https://www.youtube-nocookie.com/embed/${video}?rel=0&modestbranding=1`} title="فيديو"
                allow="encrypted-media; picture-in-picture" allowFullScreen />
            </div>
          )}
          <div className="tiles">
            {library.videos.map((v) => (
              <button key={v.id} className="tile sun" onClick={() => setVideo(v.youtubeId)}><Art code="1F3B5" />{v.title}</button>
            ))}
          </div>
          <p className="muted small-note">الفيديوهات من يوتيوب ومحتاجة إنترنت.</p>
        </>
      )}
    </ChildScreen>
  );
}
