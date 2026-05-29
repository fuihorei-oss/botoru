import { useMemo, useState } from 'react';
import { castColor } from '../utils/castColors';

function CastCard({ stat, onSelect }) {
  const cc = castColor(stat.name);
  const emptyCount = stat.bottles.filter(b => (b.remainingAmount ?? 700) === 0).length;

  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-2xl p-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background: `linear-gradient(145deg, ${cc}18, ${cc}08)`,
        border: `1px solid ${cc}35`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-black text-base flex-shrink-0"
            style={{ background: `${cc}28`, color: cc }}
          >
            {stat.name[0]}
          </div>
          <div>
            <div className="font-bold text-white text-base">{stat.name}</div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {stat.bottles.length}本
              {emptyCount > 0 && (
                <span style={{ color: '#f87171', marginLeft: 6 }}>空き{emptyCount}本</span>
              )}
            </div>
          </div>
        </div>
        <div className="text-white/30 text-lg">›</div>
      </div>

      {stat.bottles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {stat.bottles.slice(0, 5).map(b => (
            <span
              key={b.id}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)' }}
            >
              {b.name}
            </span>
          ))}
          {stat.bottles.length > 5 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}
            >
              他{stat.bottles.length - 5}本
            </span>
          )}
        </div>
      )}
    </button>
  );
}

export default function CastList({ bottles, casts, onSelectCast }) {
  const [castQuery, setCastQuery] = useState('');

  const castStats = useMemo(() => {
    const allNames = new Set([
      ...casts,
      ...bottles.filter(b => b.castName).map(b => b.castName),
    ]);
    return [...allNames]
      .map(name => ({
        name,
        bottles: bottles.filter(b => b.castName === name),
      }))
      .sort((a, b) => b.bottles.length - a.bottles.length);
  }, [casts, bottles]);

  const filtered = castQuery.trim()
    ? castStats.filter(s => s.name.includes(castQuery.trim()))
    : castStats;

  return (
    <>
      <div className="px-4 mb-3">
        <input
          type="text"
          value={castQuery}
          onChange={e => setCastQuery(e.target.value)}
          placeholder="キャスト名で検索..."
          className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        />
      </div>

      <main className="flex-1 px-4 pb-28 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {castQuery ? '該当するキャストが見つかりません' : 'キャストがまだ登録されていません'}
          </div>
        ) : (
          filtered.map(stat => (
            <CastCard key={stat.name} stat={stat} onSelect={() => onSelectCast(stat.name)} />
          ))
        )}
      </main>
    </>
  );
}
