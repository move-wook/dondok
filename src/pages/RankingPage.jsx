import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getActiveSeason, getRanking } from '../lib/queries';
import RankingTable from '../components/RankingTable';

export default function RankingPage() {
  const { profile } = useOutletContext();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const season = await getActiveSeason();
        if (!season) { setErr('진행 중인 시즌이 없습니다.'); return; }
        setRanking(await getRanking(season.season_id));
      } catch (e) {
        setErr(e.message ?? '불러오기 실패');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const top = ranking[0];

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-extrabold text-gray-900">🏆 팀 랭킹</h2>

      {/* 1위 히어로 */}
      {top && (
        <div className="rounded-2xl bg-gray-900 p-5 text-white">
          <p className="text-sm text-gray-400">현재 1위</p>
          <p className="mt-1 text-2xl font-extrabold">🥇 {top.team_name}</p>
          <p className="mt-2 text-sm text-gray-300">
            {Number(top.final_score).toFixed(1)}점 · 체지방 -{Number(top.avg_fat_loss_pct).toFixed(1)}% · 보너스 {top.bonus_point}
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">불러오는 중…</p>
      ) : err ? (
        <p className="text-sm text-red-500">{err}</p>
      ) : (
        <RankingTable rows={ranking} myTeamId={profile.team_id} />
      )}
    </div>
  );
}
