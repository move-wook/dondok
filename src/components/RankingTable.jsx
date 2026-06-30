export default function RankingTable({ rows, myTeamId }) {
  if (!rows?.length) {
    return <p className="rounded-2xl border border-gray-100 bg-white p-5 text-sm text-gray-400">아직 랭킹 데이터가 없어요. 인바디를 등록하면 집계됩니다.</p>;
  }
  return (
    <div className="space-y-2">
      {rows.map((r, i) => {
        const mine = r.team_id === myTeamId;
        const medal = ['🥇', '🥈', '🥉'][i];
        return (
          <div
            key={r.team_id}
            className={`flex items-center gap-3 rounded-2xl border p-3.5 ${
              mine ? 'border-gray-900 bg-white' : 'border-gray-100 bg-white'
            }`}
          >
            <div className="w-7 text-center text-lg font-extrabold text-gray-900">{medal ?? i + 1}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-gray-900">
                {r.team_name}
                {mine && <span className="ml-1 text-xs font-medium text-gray-400">우리팀</span>}
              </p>
              <p className="text-xs text-gray-400">체지방 -{fmt(r.avg_fat_loss_pct)}% · 보너스 {r.bonus_point}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-gray-900">{fmt(r.final_score)}</p>
              <p className="text-[10px] text-gray-400">점</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const fmt = (n) => (n == null ? '0' : Number(n).toFixed(1));
