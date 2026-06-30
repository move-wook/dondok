import { useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import dayjs from 'dayjs';
import { supabase } from '../lib/supabase';
import { addCertification } from '../lib/queries';

const MEALS = ['아침', '점심', '저녁', '간식'];

export default function CertUploadModal({ open, onClose, onDone, userId, seasonId }) {
  const fileRef = useRef(null);
  const [certType, setCertType] = useState('MEAL');
  const [mealTime, setMealTime] = useState('아침');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [memo, setMemo] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!open) return null;

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const submit = async () => {
    setErr('');
    if (!file) return setErr('사진을 첨부해주세요.');
    setBusy(true);
    try {
      const compressed = await imageCompression(file, { maxWidthOrHeight: 1280, maxSizeMB: 0.7 });
      const path = `${userId}/cert/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from('cert-images').upload(path, compressed);
      if (upErr) throw upErr;
      await addCertification({
        userId,
        seasonId,
        certType,
        mealTime,
        imagePath: path,
        memo,
        certDate: dayjs().format('YYYY-MM-DD'),
      });
      onDone?.();
      onClose();
    } catch (e) {
      const m = e.message ?? String(e);
      setErr(m.includes('duplicate') || m.includes('unique') ? '이미 같은 인증을 했어요.' : '업로드 실패: ' + m);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md space-y-4 rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">인증 올리기</h3>

        <div className="flex rounded-lg bg-gray-100 p-1 text-sm">
          <button onClick={() => setCertType('MEAL')} className={`flex-1 rounded-md py-2 ${certType === 'MEAL' ? 'bg-white font-semibold shadow' : 'text-gray-500'}`}>🍴 식단</button>
          <button onClick={() => setCertType('WORKOUT')} className={`flex-1 rounded-md py-2 ${certType === 'WORKOUT' ? 'bg-white font-semibold shadow' : 'text-gray-500'}`}>💪 운동</button>
        </div>

        {certType === 'MEAL' && (
          <div className="flex gap-2">
            {MEALS.map((t) => (
              <button key={t} onClick={() => setMealTime(t)} className={`flex-1 rounded-lg border py-1.5 text-sm ${mealTime === t ? 'border-gray-800 font-semibold' : 'border-gray-200 text-gray-500'}`}>{t}</button>
            ))}
          </div>
        )}

        <button onClick={() => fileRef.current?.click()} className="w-full rounded-lg border-2 border-dashed border-gray-300 py-6 text-gray-500">
          {preview ? <img src={preview} alt="" className="mx-auto max-h-48 rounded" /> : '📷 사진 첨부'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />

        <textarea className="w-full rounded-lg border border-gray-300 p-2 text-sm" rows={2} placeholder="메모 (선택)" value={memo} onChange={(e) => setMemo(e.target.value)} />

        {err && <p className="text-sm text-red-500">{err}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl bg-gray-100 py-3 font-semibold text-gray-700">취소</button>
          <button disabled={busy} onClick={submit} className="flex-1 rounded-xl bg-gray-900 py-3 font-bold text-white active:scale-[0.98] transition disabled:bg-gray-300">{busy ? '올리는 중…' : '인증하기'}</button>
        </div>
      </div>
    </div>
  );
}
