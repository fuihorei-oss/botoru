import { useMemo, useState } from 'react';

function NeckCard({ stat, onSelect, onRename }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(stat.name);
  const emptyCount = stat.bottles.filter(b => (b.remainingAmount ?? 700) === 0).length;

  function startEdit(e) {
    e.stopPropagation();
    setValue(stat.name);
    setEditing(true);
  }

  function save() {
    const trimmed = value.trim();
    if (trimmed && trimmed !== stat.name) onRename(stat.name, trimmed);
    setEditing(false);
  }

  function cancel() { setEditing(false); }

  const cardBase = {
    width: '100%', borderRadius: 16, padding: 16,
    background: '#ffffff', border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  };

  if (editing) {
    return (
      <div style={{ ...cardBase, border: '1px solid #7c3aed' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 14 }}>🏷</span>
          <input
            autoFocus
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
            style={{
              flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid #7c3aed',
              fontSize: 14, fontWeight: 'bold', outline: 'none', color: '#111827', background: '#faf5ff',
            }}
          />
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 10 }}>
          {stat.bottles.length}本のネック名を一括変更します
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save}
            style={{ flex: 1, padding: '8px', borderRadius: 10, fontWeight: 'bold', fontSize: 13, color: '#fff', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
            保存
          </button>
          <button onClick={cancel}
            style={{ flex: 1, padding: '8px', borderRadius: 10, fontSize: 13, color: '#6b7280', border: '1px solid #e5e7eb', cursor: 'pointer', background: '#f9fafb' }}>
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...cardBase, display: 'flex', flexDirection: 'column', gap: 0 }}
      onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
      onMouseOut={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: stat.bottles.length > 0 ? 10 : 0 }}>
        <button onClick={onSelect}
          style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <div style={{ fontWeight: 'bold', color: '#111827', fontSize: 15 }}>🏷 {stat.name}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
            {stat.bottles.length}本
            {emptyCount > 0 && <span style={{ color: '#ef4444', marginLeft: 8 }}>空き{emptyCount}本</span>}
          </div>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button onClick={startEdit}
            style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
            変更
          </button>
          <button onClick={onSelect}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: 18, lineHeight: 1, padding: '0 2px' }}>›</button>
        </div>
      </div>

      {stat.bottles.length > 0 && (
        <button onClick={onSelect}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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
        </button>
      )}
    </div>
  );
}

export default function NeckList({ bottles, onSelectNeck, onRenameNeck }) {
  const [neckQuery, setNeckQuery] = useState('');

  const neckStats = useMemo(() => {
    const map = {};
    bottles.forEach(b => {
      const neck = (b.keepName || '').trim();
      if (!neck) return;
      if (!map[neck]) map[neck] = { name: neck, bottles: [] };
      map[neck].bottles.push(b);
    });
    return Object.values(map).sort((a, b) => b.bottles.length - a.bottles.length);
  }, [bottles]);

  const filtered = neckQuery.trim()
    ? neckStats.filter(s => s.name.includes(neckQuery.trim()))
    : neckStats;

  return (
    <>
      <div style={{ padding: '0 16px 12px' }}>
        <input type="text" value={neckQuery} onChange={e => setNeckQuery(e.target.value)}
          placeholder="ネック名で検索..."
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
            {neckQuery ? '該当するネックが見つかりません' : 'ネックがまだ登録されていません'}
          </div>
        ) : (
          filtered.map(stat => (
            <NeckCard
              key={stat.name}
              stat={stat}
              onSelect={() => onSelectNeck(stat.name)}
              onRename={onRenameNeck}
            />
          ))
        )}
      </main>
    </>
  );
}
