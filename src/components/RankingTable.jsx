export default function RankingTable({ rows, myTeamId }) {
  if (!rows?.length) {
    return <p className="p-4 text-sm text-gray-400">아직 랭킹 데이터가 없어요. 인바디를 등록하면 집계됩니다.</p>;
  }
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="px-3 py-2 text-left">#</th>
            <th className="px-3 py-2 text-left">팀</th>
            <th className="px-3 py-2 text-right">점수</th>
            <th className="px-3 py-2 text-right">체지방</th>
            <th className="px-3 py-2 text-right">보너스</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const mine = r.team_id === myTeamId;
            return (
              <tr key={r.team_id} className={mine ? 'bg-amber-50 font-semibold' : ''}>
                <td className="px-3 py-2">{i + 1}</td>
                <td className="px-3 py-2">{r.team_name}{mine && ' (우리팀)'}</td>
                <td className="px-3 py-2 text-right">{fmt(r.final_score)}</td>
                <td className="px-3 py-2 text-right text-red-500">-{fmt(r.avg_fat_loss_pct)}%</td>
                <td className="px-3 py-2 text-right text-gray-500">{r.bonus_point}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const fmt = (n) => (n == null ? '0' : Number(n).toFixed(1));
