import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { getActiveSeason, getTeamFeed, toggleReaction, addComment, deleteComment } from '../lib/queries';
import CertCard from '../components/CertCard';
import CertUploadModal from '../components/CertUploadModal';

export default function FeedPage() {
  const { user } = useAuth();
  const [season, setSeason] = useState(null);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

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

  const onToggle = async (certId, emoji) => {
    await toggleReaction(certId, user.id, emoji);
    await load();
  };

  const onAddComment = async (certId, text) => {
    await addComment(certId, user.id, text);
    await load();
  };

  const onDeleteComment = async (commentId) => {
    await deleteComment(commentId);
    await load();
  };

  return (
    <div className="space-y-3 p-4 pb-24">
      <h2 className="text-lg font-bold text-gray-800">우리 팀 피드</h2>
      {loading ? (
        <p className="text-sm text-gray-400">불러오는 중…</p>
      ) : feed.length === 0 ? (
        <p className="text-sm text-gray-400">아직 인증이 없어요. 첫 인증을 올려보세요!</p>
      ) : (
        feed.map((c) => (
          <CertCard
            key={c.cert_id}
            cert={c}
            userId={user.id}
            onToggle={onToggle}
            onAddComment={onAddComment}
            onDeleteComment={onDeleteComment}
          />
        ))
      )}

      <button
        onClick={() => setModal(true)}
        className="fixed bottom-6 right-6 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-3xl text-white shadow-lg active:scale-95"
        aria-label="인증 올리기"
      >
        ＋
      </button>
      {season && (
        <CertUploadModal
          open={modal}
          onClose={() => setModal(false)}
          onDone={() => load()}
          userId={user.id}
          seasonId={season.season_id}
        />
      )}
    </div>
  );
}
