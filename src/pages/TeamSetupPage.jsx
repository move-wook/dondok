import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { getActiveSeason, deleteAccount } from '../lib/queries';

function genInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export default function TeamSetupPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('create'); // create | join
  const [teamName, setTeamName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const createTeam = async () => {
    setErr('');
    if (!teamName.trim()) return setErr('팀 이름을 입력하세요.');
    setBusy(true);
    try {
      const season = await getActiveSeason();
      if (!season) throw new Error('진행 중인 시즌이 없습니다. 운영자에게 시즌 개설을 요청하세요.');
      const { data: team, error } = await supabase
        .from('team')
        .insert({ season_id: season.season_id, name: teamName.trim(), invite_code: genInviteCode(), leader_id: user.id })
        .select()
        .single();
      if (error) throw error;
      const { error: e2 } = await supabase.from('profile').update({ team_id: team.team_id, role: 'LEADER' }).eq('id', user.id);
      if (e2) throw e2;
      navigate('/', { replace: true });
    } catch (e) {
      setErr(e.message ?? '팀 생성 실패');
    } finally {
      setBusy(false);
    }
  };

  const joinTeam = async () => {
    setErr('');
    if (!code.trim()) return setErr('초대 코드를 입력하세요.');
    setBusy(true);
    try {
      const { data: team, error } = await supabase
        .from('team')
        .select('team_id, name, max_members')
        .eq('invite_code', code.trim().toUpperCase())
        .maybeSingle();
      if (error) throw error;
      if (!team) throw new Error('해당 초대 코드의 팀을 찾을 수 없습니다.');
      const { count, error: e1 } = await supabase
        .from('profile')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', team.team_id);
      if (e1) throw e1;
      if (count >= team.max_members) throw new Error('이미 정원이 가득 찬 팀입니다.');
      const { error: e2 } = await supabase.from('profile').update({ team_id: team.team_id }).eq('id', user.id);
      if (e2) throw e2;
      navigate('/', { replace: true });
    } catch (e) {
      setErr(e.message ?? '가입 실패');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-6 py-10">
      <div className="mb-4 flex justify-end">
        <button onClick={signOut} className="text-sm text-gray-400">로그아웃</button>
      </div>
      <h2 className="text-xl font-bold text-gray-800">팀 만들기 / 참여</h2>
      <div className="mt-5 flex rounded-lg bg-gray-100 p-1 text-sm">
        <TabBtn active={tab === 'create'} onClick={() => setTab('create')}>팀 만들기</TabBtn>
        <TabBtn active={tab === 'join'} onClick={() => setTab('join')}>초대코드 참여</TabBtn>
      </div>

      {tab === 'create' ? (
        <div className="mt-6 space-y-4">
          <input className={inputCls} value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="팀 이름 (예: 독한4인방)" maxLength={50} />
          {err && <p className="text-sm text-red-500">{err}</p>}
          <button disabled={busy} onClick={createTeam} className={btnCls}>{busy ? '처리중…' : '팀 만들기 (내가 리더)'}</button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <input className={`${inputCls} uppercase tracking-widest`} value={code} onChange={(e) => setCode(e.target.value)} placeholder="초대 코드 6자리" maxLength={6} />
          {err && <p className="text-sm text-red-500">{err}</p>}
          <button disabled={busy} onClick={joinTeam} className={btnCls}>{busy ? '처리중…' : '참여하기'}</button>
        </div>
      )}

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
function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`flex-1 rounded-md py-2 ${active ? 'bg-white font-semibold shadow' : 'text-gray-500'}`}>
      {children}
    </button>
  );
}
