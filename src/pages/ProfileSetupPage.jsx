import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { getMyProfile, deleteAccount } from '../lib/queries';

export default function ProfileSetupPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!user) return;
    getMyProfile(user.id).then((p) => {
      if (p) {
        if (p.nickname && p.nickname !== '회원') setNickname(p.nickname);
        if (p.gender) setGender(p.gender);
        if (p.height_cm != null) setHeightCm(String(p.height_cm));
      }
    });
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!nickname.trim()) return setErr('닉네임을 입력하세요.');
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profile')
        .upsert({
          id: user.id,
          nickname: nickname.trim(),
          gender: gender || null,
          height_cm: heightCm ? Number(heightCm) : null,
        });
      if (error) throw error;
      const p = await getMyProfile(user.id);
      navigate(p?.team_id ? '/' : '/setup/team', { replace: true });
    } catch (e2) {
      setErr(e2.message ?? '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-6 py-10">
      <div className="mb-4 flex justify-end">
        <button onClick={signOut} className="text-sm text-gray-400">로그아웃</button>
      </div>
      <h2 className="text-xl font-bold text-gray-800">프로필 설정</h2>
      <p className="mt-1 text-sm text-gray-500">챌린지에 표시될 정보예요.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="닉네임">
          <input className={inputCls} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="독한이" maxLength={30} />
        </Field>
        <Field label="성별">
          <select className={inputCls} value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">선택 안 함</option>
            <option value="M">남</option>
            <option value="F">여</option>
          </select>
        </Field>
        <Field label="키 (cm)">
          <input className={inputCls} type="number" step="0.1" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="175.0" />
        </Field>
        {err && <p className="text-sm text-red-500">{err}</p>}
        <button disabled={saving} className={btnCls}>
          {saving ? '저장중…' : '저장하고 계속'}
        </button>
      </form>

      <button onClick={onDeleteAccount} className="mt-10 w-full py-2 text-xs text-gray-300 underline underline-offset-2">
        회원 탈퇴
      </button>
    </div>
  );

  async function onDeleteAccount() {
    if (!window.confirm('정말 탈퇴할까요?\n모든 기록이 삭제되고 되돌릴 수 없어요.')) return;
    try {
      await deleteAccount();
      window.location.assign('/login');
    } catch (e) {
      alert(e.message === 'LEADER' ? '팀 리더는 먼저 팀을 삭제하세요.' : '탈퇴 실패: ' + (e.message ?? e));
    }
  }
}

const inputCls = 'w-full rounded-xl border border-transparent bg-gray-100 px-4 py-3.5 text-[15px] text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none transition';
const btnCls = 'w-full rounded-xl bg-gray-900 py-4 text-[16px] font-bold text-white active:scale-[0.98] transition disabled:bg-gray-300';
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}
