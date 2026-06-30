import { useState } from 'react';

export default function CommentSection({ comments, userId, onAdd, onDelete }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      await onAdd(t);
      setText('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-1.5 border-t pt-2">
      {comments.map((c) => (
        <div key={c.comment_id} className="flex items-start gap-1.5 text-sm">
          <span className="font-semibold text-gray-700">{c.nickname}</span>
          <span className="text-gray-700 break-all">{c.content}</span>
          {c.user_id === userId && (
            <button onClick={() => onDelete(c.comment_id)} className="ml-auto shrink-0 text-xs text-gray-300 hover:text-gray-500">
              삭제
            </button>
          )}
        </div>
      ))}
      <form onSubmit={submit} className="flex gap-2 pt-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="댓글 달기…"
          maxLength={300}
          className="flex-1 rounded-full border border-gray-200 px-3 py-1.5 text-sm focus:border-gray-800 focus:outline-none"
        />
        <button disabled={busy} className="rounded-full bg-gray-900 px-3 text-sm font-medium text-white disabled:opacity-50">
          등록
        </button>
      </form>
    </div>
  );
}
