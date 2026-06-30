import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getActiveSeason, getRanking, getTeamProgress } from '../lib/queries';
import RankingTable from '../components/RankingTable';
import TeamSummaryCard from '../components/TeamSummaryCard';

export default function DashboardPage() {
  const { profile } = useOutletContext();
  const [ranking, setRanking] = useState([]);
  const [progress, setProgress] = useState({ streak: 0, week: { done: 0, goal: 0 } });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const season = await getActiveSeason();
        if (!season) {
          setErr('진행 중인 시즌이 없습니다.');
          return;
        }
        const [rank, prog] = await Promise.all([
          getRanking(season.season_id),
          profile.team_id ? getTeamProgress(profile.team_id, season.season_id) : Promise.resolve(null),
        ]);
        setRanking(rank);
        if (prog) setProgress(prog);
      } catch (e) {
        setErr(e.message ?? '불러오기 실패');
      } finally {
        setLoading(false);
      }
    })();
  }, [profile.team_id]);

  const myRow = ranking.findIndex((r) => r.team_id === profile.team_id);

  return (
    <div className="p-4 space-y-4">
      <TeamSummaryCard
        teamName={profile.team?.name}
        inviteCode={profile.team?.invite_code}
        rank={myRow >= 0 ? myRow + 1 : null}
        fatLossPct={myRow >= 0 ? Number(ranking[myRow].avg_fat_loss_pct) : 0}
        streak={progress.streak}
        week={progress.week}
      />

      <div>
        <h3 className="mb-3 mt-2 text-lg font-extrabold text-gray-900">팀 랭킹</h3>
        {loading ? (
          <p className="text-sm text-gray-400">불러오는 중…</p>
        ) : err ? (
          <p className="text-sm text-red-500">{err}</p>
        ) : (
          <RankingTable rows={ranking} myTeamId={profile.team_id} />
        )}
      </div>
    </div>
  );
}
