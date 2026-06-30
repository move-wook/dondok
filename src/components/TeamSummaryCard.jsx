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
    } catch { /* noop */ }
  };

  return (
    <div className="rounded-2xl bg-gray-900 p-5 text-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{rank ? `${rank}위` : '순위 집계 전'}</p>
          <h2 className="mt-0.5 text-2xl font-extrabold">{teamName ?? '우리 팀'}</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">체지방</p>
          <p className="text-xl font-extrabold">-{(fatLossPct ?? 0).toFixed(1)}%</p>
        </div>
      </div>

      {inviteCode && (
        <button onClick={copy} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm active:scale-95">
          <span className="text-gray-400">초대코드</span>
          <span className="font-mono font-bold tracking-widest">{inviteCode}</span>
          <span className="text-xs text-gray-400">{copied ? '복사됨!' : '복사'}</span>
        </button>
      )}

      <div className="mt-4 flex items-center gap-2 text-sm">
        <span className="rounded-full bg-white/10 px-3 py-1 font-semibold">🔥 {streak ?? 0}일 연속</span>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-gray-400">
          <span>이번 주 팀 인증</span>
          <span>{week?.done ?? 0} / {week?.goal ?? 0}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
