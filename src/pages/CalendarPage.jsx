import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../auth/AuthProvider';
import { getActiveSeason, getTeamMembers, getMonthCerts } from '../lib/queries';

export default function CalendarPage() {
  const { profile } = useOutletContext();
  const { user } = useAuth();
  const [season, setSeason] = useState(null);
  const [members, setMembers] = useState([]);
  const [targetUser, setTargetUser] = useState(user.id);
  const [month, setMonth] = useState(dayjs().startOf('month'));
  const [certs, setCerts] = useState([]);

  useEffect(() => {
    (async () => {
      setSeason(await getActiveSeason());
      if (profile.team_id) setMembers(await getTeamMembers(profile.team_id));
    })();
  }, [profile.team_id]);

  useEffect(() => {
    if (!season) return;
    const from = month.startOf('month').format('YYYY-MM-DD');
    const to = month.endOf('month').format('YYYY-MM-DD');
    getMonthCerts(targetUser, season.season_id, from, to).then(setCerts);
  }, [season, targetUser, month]);

  const byDate = useMemo(() => {
    const m = {};
    certs.forEach((c) => { (m[c.cert_date] ??= []).push(c); });
    return m;
  }, [certs]);

  const days = useMemo(() => {
    const start = month.startOf('month').startOf('week');
    const end = month.endOf('month').endOf('week');
    const arr = [];
    let d = start;
    while (d.isBefore(end) || d.isSame(end, 'day')) {
      arr.push(d);
      d = d.add(1, 'day');
    }
    return arr;
  }, [month]);

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">달력</h2>
        <select value={targetUser} onChange={(e) => setTargetUser(e.target.value)} className="rounded-lg border px-2 py-1 text-sm">
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.id === user.id ? '나' : m.nickname}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => setMonth(month.subtract(1, 'month'))} className="px-3 py-1 text-gray-500">‹</button>
        <span className="text-sm font-medium">{month.format('YYYY년 M월')}</span>
        <button onClick={() => setMonth(month.add(1, 'month'))} className="px-3 py-1 text-gray-500">›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
        {['일', '월', '화', '수', '목', '금', '토'].map((w) => <div key={w}>{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = d.format('YYYY-MM-DD');
          const items = byDate[key] ?? [];
          const thumb = items.find((c) => c.imageUrl)?.imageUrl;
          const inMonth = d.month() === month.month();
          return (
            <div key={key} className={`relative aspect-square overflow-hidden rounded-md border text-[10px] ${inMonth ? 'bg-white' : 'bg-gray-50 text-gray-300'}`}>
              {thumb && <img src={thumb} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />}
              <span className={`absolute left-1 top-0.5 ${thumb ? 'text-white drop-shadow' : ''}`}>{d.date()}</span>
              {items.length > 0 && (
                <span className="absolute bottom-0.5 right-0.5 text-[10px]">
                  {items.some((c) => c.cert_type === 'MEAL') ? '🍴' : ''}
                  {items.some((c) => c.cert_type === 'WORKOUT') ? '💪' : ''}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
