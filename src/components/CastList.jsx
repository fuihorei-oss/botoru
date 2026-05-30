import { useMemo, useState } from 'react';
import { castColor, getCastNames } from '../utils/castColors';

function CastCard({ stat, onSelect }) {
  const cc = castColor(stat.name);
  const emptyCount = stat.bottles.filter(b => (b.remainingAmount ?? 700) === 0).length;

  return (
    <button onClick={onSelect}
      style={{
        width: '100%', textAlign: 'left', borderRadius: 16, padding: 16,
        background: '#ffffff', border: `1px solid ${cc}30`,
        cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.15s',
      }}
      onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
      onMouseOut={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, background: `${cc}18`, color: cc, flexShrink: 0 }}>
            {stat.name[0]}
          </div>
          <div>
            <div style={{ fontWeight: 'bold', color: '#111827', fontSize: 15 }}>{stat.name}</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
              {stat.bottles.length}本
              {emptyCount > 0 && <span style={{ color: '#ef4444', marginLeft: 8 }}>空き{emptyCount}本</span>}
            </div>
          </div>
        </div>
        <div style={{ color: '#d1d5db', fontSize: 18 }}>›</div>
      </div>

      {stat.bottles.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {stat.bottles.slice(0, 5).map(b => (
            <span key={b.id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f5f5f7', color: '#6b7280', border: '1px solid #e5e7eb' }}>
              {b.name}
            </span>
          ))}
          {stat.bottles.length > 5 && (
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f5f5f7', color: '#9ca3af' }}>
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
    const allNames = new Set([...casts, ...bottles.flatMap(b => getCastNames(b))]);
    return [...allNames]
      .map(name => ({ name, bottles: bottles.filter(b => getCastNames(b).includes(name)) }))
      .sort((a, b) => b.bottles.length - a.bottles.length);
  }, [casts, bottles]);

  const filtered = castQuery.trim()
    ? castStats.filter(s => s.name.includes(castQuery.trim()))
    : castStats;

  return (
    <>
      <div style={{ padding: '0 16px 12px' }}>
        <input type="text" value={castQuery} onChange={e => setCastQuery(e.target.value)}
          placeholder="キャスト名で検索..."
          style={{
            width: '100%', padding: '10px 16px', borderRadius: 12, fontSize: 14,
            background: '#ffffff', color: '#111827', border: '1px solid #e5e7eb',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>
      <main style={{ flex: 1, padding: '0 16px 112px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
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
