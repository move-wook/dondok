import { useState } from 'react';

export default function TeamSummaryCard({ teamName, inviteCode, rank, fatLossPct, streak, week }) {
  const pct = week && week.goal > 0 ? Math.min(100, Math.round((week.done / week.goal) * 100)) : 0;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-gray-800">{teamName ?? '우리 팀'}</h2>
        <span className="text-sm text-gray-500">
          {rank ? `${rank}위` : '순위 집계 전'} · 체지방 -{(fatLossPct ?? 0).toFixed(1)}%
        </span>
      </div>

      {inviteCode && (
        <button
          onClick={copy}
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-sm active:scale-95"
        >
          <span className="text-gray-500">초대코드</span>
          <span className="font-mono font-bold tracking-widest text-gray-800">{inviteCode}</span>
          <span className="text-xs text-gray-400">{copied ? '복사됨!' : '복사'}</span>
        </button>
      )}

      <div className="mt-3 flex items-center gap-4">
        <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-600">
          🔥 {streak ?? 0}일 연속 풀인증
        </span>
      </div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-gray-500">
          <span>이번 주 팀 인증</span>
          <span>{week?.done ?? 0} / {week?.goal ?? 0}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
