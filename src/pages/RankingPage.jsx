import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import dayjs from 'dayjs';
import { getActiveSeason, getRanking } from '../lib/queries';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function RankingPage() {
  const { profile } = useOutletContext();
  const [season, setSeason] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const s = await getActiveSeason();
        setSeason(s);
        if (!s) { setErr('진행 중인 시즌이 없습니다.'); return; }
        setRanking(await getRanking(s.season_id));
      } catch (e) {
        setErr(e.message ?? '불러오기 실패');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const maxScore = ranking.length ? Math.max(...ranking.map((r) => Number(r.final_score) || 0), 1) : 1;
  const daysLeft = season ? dayjs(season.end_date).endOf('day').diff(dayjs(), 'day') : null;
  const hasPodium = ranking.length >= 3;
  const podium = hasPodium ? ranking.slice(0, 3).map((r, i) => ({ ...r, rank: i + 1 })) : [];
  const rest = hasPodium ? ranking.slice(3) : ranking;
  const podiumOrder = hasPodium ? [podium[1], podium[0], podium[2]] : []; // 2 · 1 · 3

  return (
    <div className="space-y-5 p-4">
      {/* 헤더 + 시즌 카운트다운 */}
      <div className="rounded-2xl bg-gray-900 p-5 text-white">
        <p className="text-sm text-gray-400">🏆 {season?.name ?? '팀 랭킹'}</p>
        <p className="mt-1 text-2xl font-extrabold">
          {daysLeft != null ? (daysLeft >= 0 ? `시즌 종료까지 ${daysLeft}일` : '시즌 종료') : '팀 랭킹'}
        </p>
        <p className="mt-1 text-xs text-gray-500">총 점수 = 체지방감량률 + 체중감량률 + 보너스</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">불러오는 중…</p>
      ) : err ? (
        <p className="text-sm text-red-500">{err}</p>
      ) : ranking.length === 0 ? (
        <p className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-400">아직 랭킹 데이터가 없어요.</p>
      ) : (
        <>
          {/* Top3 포디움 */}
          {hasPodium && (
            <div className="flex items-end justify-center gap-3 px-2">
              {podiumOrder.map((t) => {
                const first = t.rank === 1;
                const mine = t.team_id === profile.team_id;
                return (
                  <div key={t.team_id} className="flex flex-1 flex-col items-center">
                    <span className="text-2xl">{MEDAL[t.rank - 1]}</span>
                    <div className={`relative -mt-1 flex items-center justify-center rounded-full font-extrabold text-white ${first ? 'h-20 w-20 text-2xl' : 'h-16 w-16 text-xl'} ${mine ? 'bg-gray-900 ring-4 ring-gray-300' : 'bg-gray-800'}`}>
                      {t.team_name?.[0] ?? '?'}
                    </div>
                    <p className="mt-2 w-full truncate text-center text-sm font-bold text-gray-900">{t.team_name}</p>
                    <p className="text-xs text-gray-400">{fmt(t.final_score)}점</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* 전체 리스트 (포디움 있으면 4위~, 없으면 전체) */}
          <div className="space-y-2">
            {rest.map((r, i) => {
              const rank = hasPodium ? i + 4 : i + 1;
              const mine = r.team_id === profile.team_id;
              const pct = Math.round((Number(r.final_score) / maxScore) * 100);
              const top1 = !hasPodium && i === 0;
              return (
                <div key={r.team_id} className={`flex items-center gap-3 rounded-2xl border p-3.5 ${mine ? 'border-gray-900 bg-white' : 'border-gray-100 bg-white'}`}>
                  <div className="w-7 text-center text-base font-extrabold text-gray-900">{top1 ? '🥇' : MEDAL[rank - 1] ?? rank}</div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-extrabold text-white">{r.team_name?.[0] ?? '?'}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-gray-900">{r.team_name}{mine && <span className="ml-1 text-xs font-medium text-gray-400">우리팀</span>}</p>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-gray-900" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-gray-900">{fmt(r.final_score)}</p>
                    <p className="text-[10px] text-gray-400">점</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const fmt = (n) => (n == null ? '0' : Number(n).toFixed(1));
