import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { getActiveSeason, getRanking, getTeamProgress, getMemberStats, leaveTeam, deleteTeam, deleteAccount } from '../lib/queries';
import TeamSummaryCard from '../components/TeamSummaryCard';
import MemberList from '../components/MemberList';

export default function DashboardPage() {
  const { profile } = useOutletContext();
  const { user } = useAuth();
  const [progress, setProgress] = useState({ streak: 0, week: { done: 0, goal: 0 } });
  const [rankInfo, setRankInfo] = useState({ rank: null, fat: 0 });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const season = await getActiveSeason();
        if (!season) { setErr('진행 중인 시즌이 없습니다.'); return; }
        if (!profile.team_id) return;
        const [rank, prog, mem] = await Promise.all([
          getRanking(season.season_id),
          getTeamProgress(profile.team_id, season.season_id),
          getMemberStats(season.season_id, profile.team_id).catch(() => null), // RPC 미배포 대비
        ]);
        const idx = rank.findIndex((r) => r.team_id === profile.team_id);
        setRankInfo({ rank: idx >= 0 ? idx + 1 : null, fat: idx >= 0 ? Number(rank[idx].avg_fat_loss_pct) : 0 });
        setProgress(prog);
        if (mem) setMembers(mem);
        else setErr('member_stats RPC 미배포 — 0005_member_stats.sql 실행 필요');
      } catch (e) {
        setErr(e.message ?? '불러오기 실패');
      } finally {
        setLoading(false);
      }
    })();
  }, [profile.team_id]);

  return (
    <div className="space-y-4 p-4">
      <TeamSummaryCard
        teamName={profile.team?.name}
        inviteCode={profile.team?.invite_code}
        rank={rankInfo.rank}
        fatLossPct={rankInfo.fat}
        streak={progress.streak}
        week={progress.week}
      />

      <div>
        <h3 className="mb-3 mt-2 flex items-baseline gap-1.5 text-lg font-extrabold text-gray-900">
          팀원 {members.length > 0 && <span className="text-sm font-bold text-gray-400">{members.length}명</span>}
        </h3>
        {loading ? (
          <p className="text-sm text-gray-400">불러오는 중…</p>
        ) : members.length === 0 ? (
          <p className="rounded-2xl border border-gray-100 bg-white p-5 text-sm text-gray-400">{err || '팀원 정보가 없어요.'}</p>
        ) : (
          <MemberList members={members} currentUserId={user.id} />
        )}
      </div>

      {/* 팀 관리 */}
      <div className="pt-2">
        {profile.role === 'LEADER' ? (
          <button onClick={onDeleteTeam} className="w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-red-500 active:scale-[0.99]">
            팀 삭제
          </button>
        ) : (
          <button onClick={onLeaveTeam} className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-500 active:scale-[0.99]">
            팀 나가기
          </button>
        )}
        <button onClick={onDeleteAccount} className="mt-2 w-full py-2 text-xs text-gray-300 underline underline-offset-2">
          회원 탈퇴
        </button>
      </div>
    </div>
  );

  async function onLeaveTeam() {
    if (!window.confirm('팀에서 나갈까요?')) return;
    await leaveTeam(user.id);
    window.location.assign('/');
  }
  async function onDeleteTeam() {
    if (!window.confirm('팀을 삭제할까요? 모든 팀원이 팀에서 나가게 됩니다.')) return;
    await deleteTeam(profile.team_id);
    window.location.assign('/');
  }
  async function onDeleteAccount() {
    if (profile.role === 'LEADER') {
      alert('팀 리더는 먼저 "팀 삭제"를 한 뒤 탈퇴할 수 있어요.');
      return;
    }
    if (!window.confirm('정말 탈퇴할까요?\n모든 기록(인바디·인증·댓글)이 삭제되고 되돌릴 수 없어요.')) return;
    try {
      await deleteAccount();
      window.location.assign('/login');
    } catch (e) {
      if (e.message === 'LEADER') alert('팀 리더는 먼저 팀을 삭제하세요.');
      else alert('탈퇴 실패: ' + (e.message ?? e));
    }
  }
}
