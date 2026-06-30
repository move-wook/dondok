import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useAuth } from '../auth/AuthProvider';
import { getActiveSeason, getTeamFeed, toggleReaction, addComment, deleteComment } from '../lib/queries';
import CertCard from '../components/CertCard';
import CertUploadModal from '../components/CertUploadModal';

export default function FeedPage() {
  const { user } = useAuth();
  const today = dayjs().format('YYYY-MM-DD');
  const [season, setSeason] = useState(null);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [month, setMonth] = useState(dayjs().startOf('month'));
  const [selected, setSelected] = useState(null); // null = 전체 피드
  const [collapsed, setCollapsed] = useState(false);

  const load = async (s) => {
    const sea = s ?? season;
    if (!sea) return;
    setFeed(await getTeamFeed(sea.season_id));
  };

  useEffect(() => {
    (async () => {
      const s = await getActiveSeason();
      setSeason(s);
      if (s) await load(s);
      setLoading(false);
    })();
  }, []);

  // 스크롤 내리면 달력 월간 → 주간 접힘
  useEffect(() => {
    const onScroll = () => setCollapsed(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const onToggle = async (id, e) => { await toggleReaction(id, user.id, e); await load(); };
  const onAddComment = async (id, t) => { await addComment(id, user.id, t); await load(); };
  const onDeleteComment = async (id) => { await deleteComment(id); await load(); };

  // 팀 인증을 날짜별로 (달력 마커 + 그날 최근 사진)
  const dayInfo = useMemo(() => {
    const m = {};
    for (const c of feed) {
      (m[c.cert_date] ??= { count: 0, img: null });
      m[c.cert_date].count++;
      if (!m[c.cert_date].img && c.imageUrl) m[c.cert_date].img = c.imageUrl; // feed는 최신순 → 첫 이미지 = 최근
    }
    return m;
  }, [feed]);

  const monthCells = useMemo(() => {
    const start = month.startOf('month').startOf('week');
    const end = month.endOf('month').endOf('week');
    const arr = [];
    let d = start;
    while (d.isBefore(end) || d.isSame(end, 'day')) { arr.push(d); d = d.add(1, 'day'); }
    return arr;
  }, [month]);

  const weekCells = useMemo(() => {
    const base = dayjs(selected || today).startOf('week');
    return Array.from({ length: 7 }, (_, i) => base.add(i, 'day'));
  }, [selected, today]);

  const cells = collapsed ? weekCells : monthCells;
  const shown = selected ? feed.filter((c) => c.cert_date === selected) : feed;

  const renderCell = (d) => {
    const key = d.format('YYYY-MM-DD');
    const info = dayInfo[key];
    const dim = !collapsed && d.month() !== month.month();
    const isToday = key === today;
    const isSel = key === selected;
    return (
      <button
        key={key}
        onClick={() => setSelected(isSel ? null : key)}
        className={`relative aspect-square overflow-hidden rounded-lg text-[11px] ${dim ? 'opacity-30' : ''} ${isSel ? 'ring-2 ring-gray-900' : ''}`}
      >
        {info?.img ? (
          <img src={info.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className={`absolute inset-0 ${info ? 'bg-gray-200' : 'bg-gray-100'}`} />
        )}
        <span className={`absolute left-1 top-0.5 ${info?.img ? 'text-white drop-shadow' : 'text-gray-500'} ${isToday ? 'font-extrabold' : ''}`}>
          {d.date()}
        </span>
        {isToday && <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-gray-900" />}
      </button>
    );
  };

  return (
    <div>
      {/* sticky 달력 (스크롤 시 주간으로 접힘) */}
      <div className="sticky top-[52px] z-10 bg-gray-50 px-4 pb-3 pt-2">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-extrabold text-gray-900">{month.format('YYYY년 M월')}</span>
          {!collapsed && (
            <div className="flex items-center gap-1 text-gray-400">
              <button onClick={() => setMonth(month.subtract(1, 'month'))} className="px-2">‹</button>
              <button onClick={() => { setMonth(dayjs().startOf('month')); setSelected(null); }} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">오늘</button>
              <button onClick={() => setMonth(month.add(1, 'month'))} className="px-2">›</button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-400">
          {['일', '월', '화', '수', '목', '금', '토'].map((w) => <div key={w}>{w}</div>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">{cells.map(renderCell)}</div>
      </div>

      {/* 피드 */}
      <div className="space-y-3 px-4 pt-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-gray-900">
            {selected ? `${dayjs(selected).format('M월 D일')} 인증` : '우리 팀 피드'}
          </h2>
          {selected && <button onClick={() => setSelected(null)} className="text-xs font-medium text-gray-400">전체보기</button>}
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">불러오는 중…</p>
        ) : shown.length === 0 ? (
          <p className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400">
            {selected ? '이 날은 인증이 없어요.' : '아직 인증이 없어요. 첫 인증을 올려보세요!'}
          </p>
        ) : (
          shown.map((c) => (
            <CertCard key={c.cert_id} cert={c} userId={user.id} onToggle={onToggle} onAddComment={onAddComment} onDeleteComment={onDeleteComment} />
          ))
        )}
      </div>

      {/* 업로드 FAB (탭바 위) */}
      <button onClick={() => setModal(true)} className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-3xl text-white shadow-lg active:scale-95" aria-label="인증 올리기">
        ＋
      </button>
      {season && (
        <CertUploadModal open={modal} onClose={() => setModal(false)} onDone={() => load()} userId={user.id} seasonId={season.season_id} />
      )}
    </div>
  );
}
