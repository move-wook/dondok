import { useEffect, useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import dayjs from 'dayjs';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { getActiveSeason, getMyInbody } from '../lib/queries';

const empty = { weightKg: '', skeletalMuscleKg: '', bodyFatKg: '', bodyFatPercent: '' };

export default function InbodyPage() {
  const { user } = useAuth();
  const fileRef = useRef(null);
  const [season, setSeason] = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ measuredDate: dayjs().format('YYYY-MM-DD'), ...empty });
  const [imagePath, setImagePath] = useState(null);
  const [ocrState, setOcrState] = useState('idle'); // idle | uploading | done | low
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const reload = async (s) => {
    const sea = s ?? season;
    if (!sea) return;
    setHistory(await getMyInbody(user.id, sea.season_id));
  };

  useEffect(() => {
    getActiveSeason().then(async (s) => {
      setSeason(s);
      if (s) setHistory(await getMyInbody(user.id, s.season_id));
    });
  }, [user]);

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !season) return;
    setMsg('');
    setOcrState('uploading');
    try {
      const compressed = await imageCompression(file, { maxWidthOrHeight: 1280, maxSizeMB: 0.7 });
      const path = `${user.id}/inbody/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from('cert-images').upload(path, compressed);
      if (upErr) throw upErr;
      setImagePath(path);

      const { data: ocr, error } = await supabase.functions.invoke('extract_inbody', { body: { path } });
      if (error) throw error;
      // 추출값으로 폼 자동 채움 (사용자가 확인/보정)
      setForm((f) => ({
        ...f,
        weightKg: numOrEmpty(ocr.weightKg),
        skeletalMuscleKg: numOrEmpty(ocr.skeletalMuscleKg),
        bodyFatKg: numOrEmpty(ocr.bodyFatKg),
        bodyFatPercent: numOrEmpty(ocr.bodyFatPercent),
      }));
      setOcrState(ocr.confidence === 'high' ? 'done' : 'low');
    } catch (e2) {
      setOcrState('low');
      setMsg('자동 인식에 실패했어요. 수기로 입력해주세요. (' + (e2.message ?? e2) + ')');
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!form.weightKg) return setMsg('체중은 필수입니다.');
    setSaving(true);
    try {
      const isBaseline = history.length === 0; // 시즌 첫 기록 = baseline
      const { error } = await supabase.from('inbody_history').insert({
        user_id: user.id,
        season_id: season.season_id,
        measured_date: form.measuredDate,
        weight_kg: Number(form.weightKg),
        skeletal_muscle_kg: form.skeletalMuscleKg ? Number(form.skeletalMuscleKg) : null,
        body_fat_kg: form.bodyFatKg ? Number(form.bodyFatKg) : null,
        body_fat_percent: form.bodyFatPercent ? Number(form.bodyFatPercent) : null,
        image_path: imagePath,
        is_baseline: isBaseline,
      });
      if (error) throw error;
      setForm({ measuredDate: dayjs().format('YYYY-MM-DD'), ...empty });
      setImagePath(null);
      setOcrState('idle');
      setMsg('저장되었습니다.');
      await reload();
    } catch (e2) {
      setMsg('저장 실패: ' + (e2.message ?? e2));
    } finally {
      setSaving(false);
    }
  };

  const chartData = history.map((h) => ({
    date: dayjs(h.measured_date).format('M/D'),
    체중: Number(h.weight_kg),
    체지방: h.body_fat_kg != null ? Number(h.body_fat_kg) : null,
  }));

  const last = history[0] ? history[history.length - 1] : null;

  if (!season) {
    return <div className="p-6 text-gray-500">진행 중인 시즌이 없습니다. 운영자에게 문의하세요.</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-bold text-gray-800">인바디</h2>

      {/* 추이 차트 */}
      {chartData.length > 0 && (
        <div className="rounded-xl border bg-white p-3">
          <p className="mb-2 text-sm font-medium text-gray-600">추이</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} domain={['auto', 'auto']} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="체중" stroke="#111827" dot />
              <Line type="monotone" dataKey="체지방" stroke="#ef4444" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 입력 폼 */}
      <form onSubmit={save} className="rounded-xl border bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">새 기록 {history.length === 0 && '(첫 기록 = 기준값)'}</p>
          <button type="button" onClick={() => fileRef.current?.click()} className="rounded-md bg-gray-100 px-3 py-1.5 text-sm">
            📷 사진으로 자동 입력
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />
        </div>

        {ocrState === 'uploading' && <p className="text-sm text-gray-500">사진 분석 중…</p>}
        {ocrState === 'done' && <p className="text-sm text-green-600">자동 인식 완료 — 값을 확인하고 저장하세요.</p>}
        {ocrState === 'low' && <p className="text-sm text-amber-600">자동 인식이 불확실해요. 값을 직접 확인/입력해주세요.</p>}

        <Field label="측정일">
          <input type="date" className={inp} value={form.measuredDate} onChange={(e) => setForm({ ...form, measuredDate: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="체중(kg)"><input type="number" step="0.1" className={inp} value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} /></Field>
          <Field label="골격근량(kg)"><input type="number" step="0.1" className={inp} value={form.skeletalMuscleKg} onChange={(e) => setForm({ ...form, skeletalMuscleKg: e.target.value })} /></Field>
          <Field label="체지방량(kg)"><input type="number" step="0.1" className={inp} value={form.bodyFatKg} onChange={(e) => setForm({ ...form, bodyFatKg: e.target.value })} /></Field>
          <Field label="체지방률(%)"><input type="number" step="0.1" className={inp} value={form.bodyFatPercent} onChange={(e) => setForm({ ...form, bodyFatPercent: e.target.value })} /></Field>
        </div>
        {msg && <p className="text-sm text-gray-600">{msg}</p>}
        <button disabled={saving} className="w-full rounded-lg bg-gray-900 py-2.5 font-semibold text-white disabled:opacity-50">
          {saving ? '저장중…' : '저장'}
        </button>
      </form>

      {last && (
        <p className="text-center text-xs text-gray-400">
          최근 측정: {dayjs(last.measured_date).format('YYYY-MM-DD')} · {last.weight_kg}kg
        </p>
      )}
    </div>
  );
}

const inp = 'w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-800 focus:outline-none';
const numOrEmpty = (v) => (typeof v === 'number' && v > 0 ? String(v) : '');
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      {children}
    </label>
  );
}
