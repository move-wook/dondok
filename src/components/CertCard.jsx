import dayjs from 'dayjs';
import ReactionBar from './ReactionBar';
import CommentSection from './CommentSection';

export default function CertCard({ cert, userId, onToggle, onAddComment, onDeleteComment, onDeleteCert }) {
  const isMeal = cert.cert_type === 'MEAL';
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      {cert.imageUrl && (
        <img src={cert.imageUrl} alt="" className="max-h-80 w-full object-cover" />
      )}
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-800">{cert.nickname}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{dayjs(cert.created_at).format('M/D HH:mm')}</span>
            {cert.user_id === userId && (
              <button onClick={() => onDeleteCert?.(cert)} className="text-xs text-gray-300 hover:text-red-500">삭제</button>
            )}
          </div>
        </div>
        <span
          className={`inline-block rounded px-1.5 py-0.5 text-xs ${
            isMeal ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
          }`}
        >
          {isMeal ? `🍴 식단${cert.meal_time ? ' · ' + cert.meal_time : ''}` : '💪 운동'}
        </span>
        {cert.memo && <p className="text-sm text-gray-700">{cert.memo}</p>}
        <ReactionBar
          reactions={cert.reactions}
          userId={userId}
          onToggle={(emoji) => onToggle(cert.cert_id, emoji)}
        />
        <CommentSection
          comments={cert.comments ?? []}
          userId={userId}
          onAdd={(text) => onAddComment(cert.cert_id, text)}
          onDelete={onDeleteComment}
        />
      </div>
    </div>
  );
}
