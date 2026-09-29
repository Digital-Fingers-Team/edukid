import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { RecordingMeta } from '../../../../shared/types';
import { api, authMessage } from '../api/client';
import { ParentScreen } from '../components/ParentScreen';
import { toArabicDigits } from '../content';
import { useChild } from './ChildLayout';

const MAX_SEC = 150;
const TYPES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg'];
/** Shown inside dir="ltr" elements so minutes stay before seconds. */
const mmss = (s: number) => `${toArabicDigits(Math.floor(s / 60))}:${toArabicDigits(String(s % 60).padStart(2, '0'))}`;

export function Recordings() {
  const child = useChild();
  const base = `/api/children/${child.id}/recordings`;
  const [list, setList] = useState<RecordingMeta[] | null>(null);
  const [error, setError] = useState('');
  const [secs, setSecs] = useState(0);
  const [recording, setRecording] = useState(false);
  const rec = useRef<{ mr: MediaRecorder; stream: MediaStream; started: number; timer: number; discard: boolean } | null>(null);

  // Leaving the page abandons the recording: stop the mic and upload nothing.
  useEffect(() => () => {
    const r = rec.current;
    if (!r) return;
    r.discard = true;
    window.clearInterval(r.timer);
    if (r.mr.state !== 'inactive') r.mr.stop();
    r.stream.getTracks().forEach((t) => t.stop());
  }, []);

  const load = useCallback(
    () => api<RecordingMeta[]>('GET', base).then(setList).catch((err) => setError(authMessage(err))), [base]);
  useEffect(() => { if (child.recordingConsent) void load(); }, [child.recordingConsent, load]);

  if (!child.recordingConsent) {
    return (
      <ParentScreen title="التسجيلات">
        <section className="panel">
          <p>محتاجين موافقتك الأول قبل ما نسجل صوت {child.name}.</p>
          <Link className="btn" to="../settings" relative="path">روح للإعدادات</Link>
        </section>
      </ParentScreen>
    );
  }

  async function start() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = TYPES.find((t) => MediaRecorder.isTypeSupported(t));
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      const started = Date.now();
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => {
        if (rec.current?.discard) return;
        void upload(new Blob(chunks, { type: mr.mimeType }), stream, started);
      };
      const timer = window.setInterval(() => {
        const s = Math.round((Date.now() - started) / 1000);
        setSecs(s);
        if (s >= MAX_SEC) stop();
      }, 500);
      rec.current = { mr, stream, started, timer, discard: false };
      mr.start(1000);
      setRecording(true);
    } catch {
      setError('مقدرناش نوصل للمايك. اسمح للتطبيق يستخدم المايك وجرّب تاني.');
    }
  }

  function stop() {
    const r = rec.current;
    if (!r || r.mr.state === 'inactive') return;
    window.clearInterval(r.timer);
    r.mr.stop();
    setRecording(false);
  }

  async function upload(blob: Blob, stream: MediaStream, started: number) {
    stream.getTracks().forEach((t) => t.stop());
    const form = new FormData();
    form.append('durationSec', String(Math.round((Date.now() - started) / 1000)));
    form.append('audio', blob, 'sample');
    try { await api('POST', base, form); await load(); } catch (err) { setError(authMessage(err)); }
    setSecs(0);
  }

  return (
    <ParentScreen title="تسجيلات الكلام">
      <section className="panel">
        <p className="muted">سجّل دردشة عادية دقيقتين مع {child.name}: اسأله عن يومه أو عن لعبته المفضلة. متطلبش منه يقول كلام معين.</p>
        {error && <p className="error" role="alert">{error}</p>}
        {!recording
          ? <button className="btn btn-primary" onClick={() => void start()}>ابدأ التسجيل</button>
          : <button className="btn btn-primary" onClick={stop}>وقّف (<bdi dir="ltr">{mmss(secs)}</bdi>)</button>}
        <p className="muted small-note">التسجيل محتاج إنترنت عشان يتحفظ.</p>
      </section>
      <ul className="list">
        {list?.map((r) => (
          <li key={r.id} className="panel rec">
            <div className="rec-head">
              <strong>{new Date(r.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              <span className="chip" dir="ltr">{mmss(r.durationSec)}</span>
            </div>
            <audio controls preload="none" src={`${base}/${r.id}/audio`} />
            <button className="btn btn-quiet" onClick={async () => {
              if (!window.confirm('تمسح التسجيل ده؟')) return;
              await api('DELETE', `${base}/${r.id}`).catch((err) => setError(authMessage(err)));
              await load();
            }}>مسح</button>
          </li>
        ))}
      </ul>
    </ParentScreen>
  );
}
