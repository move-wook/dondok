const EMOJIS = ['🔥', '👍', '💪', '👏'];

export default function ReactionBar({ reactions, userId, onToggle }) {
  const reactorsFor = (e) => reactions.filter((r) => r.emoji === e);
  const mine = (e) => reactions.some((r) => r.emoji === e && r.user_id === userId);
  const groups = EMOJIS
    .map((e) => ({ emoji: e, names: reactorsFor(e).map((r) => r.nickname) }))
    .filter((g) => g.names.length > 0);

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1.5">
        {EMOJIS.map((e) => {
          const c = reactorsFor(e).length;
          return (
            <button
              key={e}
              onClick={() => onToggle(e)}
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm active:scale-95 ${
                mine(e) ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
              }`}
            >
              <span>{e}</span>
              {c > 0 && <span className="text-xs text-gray-500">{c}</span>}
            </button>
          );
        })}
      </div>
      {groups.length > 0 && (
        <div className="space-y-0.5">
          {groups.map((g) => (
            <p key={g.emoji} className="text-xs text-gray-400">
              {g.emoji} {g.names.join(', ')}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
