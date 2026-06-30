export default function MemberList({ members, currentUserId }) {
  return (
    <div className="space-y-2">
      {members.map((m, i) => {
        const isMe = m.user_id === currentUserId;
        const top = i === 0 && m.fat_loss_pct != null;
        return (
          <div key={m.user_id} className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-base font-extrabold text-white">
                  {m.nickname?.[0] ?? '?'}
                </div>
                {top && <span className="absolute -right-1 -top-1 text-base">👑</span>}
              </div>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 truncate font-bold text-gray-900">
                  {m.nickname}
                  {m.role === 'LEADER' && <span className="rounded bg-gray-900 px-1.5 py-0.5 text-[10px] font-medium text-white">리더</span>}
                  {isMe && <span className="text-xs font-normal text-gray-400">나</span>}
                </p>
                <p className="text-xs text-gray-400">인증 {m.cert_count}회</p>
              </div>

              <div className="text-right">
                {m.fat_loss_pct != null ? (
                  <p className="text-lg font-extrabold text-gray-900">-{Number(m.fat_loss_pct).toFixed(1)}%</p>
                ) : (
                  <p className="text-sm text-gray-300">기록 전</p>
                )}
                <p className="text-[10px] text-gray-400">체지방 감량</p>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <Chip on={m.today_meal}>🍴 식단</Chip>
              <Chip on={m.today_workout}>💪 운동</Chip>
              <span className="ml-auto self-center text-[11px] text-gray-400">오늘</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Chip({ on, children }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs ${on ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}>
      {on ? '✅ ' : ''}{children}
    </span>
  );
}
