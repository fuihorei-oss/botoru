import { useState, useMemo, useEffect, useCallback } from 'react';
import { buildSearchIndex, searchBottles } from './utils/search';
import { castColor, getCastNames } from './utils/castColors';
import {
  subscribeBottles, subscribeCasts,
  upsertBottle, deleteBottle, batchUpsertBottles, batchDeleteBottles,
  updateCasts, migrateFromLocalStorage,
} from './utils/firestore';
import BottleCard from './components/BottleCard';
import BottleForm from './components/BottleForm';
import CastList from './components/CastList';
import NeckList from './components/NeckList';

function SearchIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

export default function App() {
  const [bottles, setBottles] = useState([]);
  const [casts, setCasts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrateProgress, setMigrateProgress] = useState({ done: 0, total: 0 });
  const [migrateError, setMigrateError] = useState(null);

  const [view, setView]           = useState('bottles');
  const [rawQuery, setRawQuery]   = useState('');
  const [query, setQuery]         = useState('');
  const [castFilter, setCastFilter] = useState('');
  const [neckFilter, setNeckFilter] = useState('');
  const [page, setPage]           = useState(1);
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [editBottle, setEditBottle] = useState(null);
  const [sortOrder, setSortOrder] = useState('updated_desc');
  const [showCastMgr, setShowCastMgr] = useState(false);
  const [newCastInput, setNewCastInput] = useState('');
  const [editingCast, setEditingCast]   = useState(null);
  const [showDataMgr, setShowDataMgr]   = useState(false);

  // Firestore subscriptions + migration
  useEffect(() => {
    let unsubBottles, unsubCasts;

    const startSubscriptions = () => {
      unsubBottles = subscribeBottles(data => { setBottles(data); setLoading(false); });
      unsubCasts = subscribeCasts(setCasts);
    };

    const init = async () => {
      const localCount = JSON.parse(localStorage.getItem('cabaret_bottles') || '[]').length;
      if (localCount > 0) {
        setMigrating(true);
        setMigrateProgress({ done: 0, total: localCount });
        try {
          await migrateFromLocalStorage((done, total) => {
            setMigrateProgress({ done, total });
          });
        } catch (err) {
          setMigrateError(err.message || String(err));
          setMigrating(false);
          startSubscriptions();
          return;
        }
        setMigrating(false);
      }
      startSubscriptions();
    };

    init();
    return () => { unsubBottles?.(); unsubCasts?.(); };
  }, []);

  const sorted = useMemo(() => {
    const arr = [...bottles];
    switch (sortOrder) {
      case 'updated_desc': return arr.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
      case 'date_desc': return arr.sort((a, b) => (b.purchaseDate || '') > (a.purchaseDate || '') ? 1 : -1);
      case 'date_asc':  return arr.sort((a, b) => (a.purchaseDate || '') > (b.purchaseDate || '') ? 1 : -1);
      case 'amount':    return arr.sort((a, b) => (a.remainingAmount ?? 100) - (b.remainingAmount ?? 100));
      case 'name':      return arr.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
      default: return arr;
    }
  }, [bottles, sortOrder]);

  // デバウンス: 入力後300ms後に検索実行（フリーズ防止）
  useEffect(() => {
    const t = setTimeout(() => setQuery(rawQuery), 300);
    return () => clearTimeout(t);
  }, [rawQuery]);

  // フィルター変更時にページをリセット
  useEffect(() => { setPage(1); }, [query, castFilter, neckFilter, dateFrom, dateTo, sortOrder]);

  const fuse = useMemo(() => buildSearchIndex(sorted), [sorted]);
  const filtered = useMemo(() => {
    let results = searchBottles(fuse, query, sorted);
    if (castFilter) results = results.filter(b => getCastNames(b).includes(castFilter));
    if (neckFilter) results = results.filter(b => (b.keepName || '').trim() === neckFilter);
    if (dateFrom)   results = results.filter(b => (b.purchaseDate || '') >= dateFrom);
    if (dateTo)     results = results.filter(b => (b.purchaseDate || '') <= dateTo);
    return results;
  }, [fuse, query, sorted, castFilter, neckFilter, dateFrom, dateTo]);

  async function handleSave(bottle) {
    try {
      await upsertBottle(bottle);
      setShowForm(false);
      setEditBottle(null);
    } catch (err) {
      alert('保存エラー: ' + (err.message || err));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('このボトルを削除しますか？')) return;
    await deleteBottle(id);
    setShowForm(false);
    setEditBottle(null);
  }

  function openAdd()        { setEditBottle(null);   setShowForm(true); }
  function openEdit(bottle) { setEditBottle(bottle); setShowForm(true); }
  function closeForm()      { setShowForm(false);    setEditBottle(null); }

  async function persistCasts(newCasts) {
    setCasts(newCasts);
    await updateCasts(newCasts);
  }

  async function addCast() {
    const name = newCastInput.trim();
    if (!name || casts.includes(name)) return;
    await persistCasts([...casts, name]);
    setNewCastInput('');
  }

  async function removeCast(name) {
    await persistCasts(casts.filter(c => c !== name));
    const affected = bottles.filter(b => getCastNames(b).includes(name))
      .map(b => ({ ...b, castName: getCastNames(b).filter(n => n !== name) }));
    if (affected.length > 0) await batchUpsertBottles(affected);
    if (castFilter === name) setCastFilter('');
  }

  async function renameCast(original, newName) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === original || casts.includes(trimmed)) { setEditingCast(null); return; }
    await persistCasts(casts.map(c => c === original ? trimmed : c));
    const affected = bottles.filter(b => getCastNames(b).includes(original))
      .map(b => ({ ...b, castName: getCastNames(b).map(n => n === original ? trimmed : n) }));
    if (affected.length > 0) await batchUpsertBottles(affected);
    if (castFilter === original) setCastFilter(trimmed);
    setEditingCast(null);
  }

  function handleSelectCast(name) {
    setCastFilter(name);
    setView('bottles');
  }

  function clearFilters() {
    setCastFilter('');
    setNeckFilter('');
    setDateFrom('');
    setDateTo('');
  }

  function handleSelectNeck(name) {
    setNeckFilter(name);
    setView('bottles');
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ bottles, casts })], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `botoru-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!window.confirm(`${(data.bottles || []).length}本のデータをインポートします。現在のデータは上書きされます。よろしいですか？`)) return;
        await batchDeleteBottles(bottles);
        await batchUpsertBottles(data.bottles || []);
        await updateCasts(data.casts || []);
        setShowDataMgr(false);
      } catch {
        alert('ファイルの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  const PAGE_SIZE = 50;
  const visibleBottles = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = filtered.length > page * PAGE_SIZE;

  const emptyCount       = bottles.filter(b => (b.remainingAmount ?? 700) === 0).length;
  const activeFilterCount = (castFilter ? 1 : 0) + (neckFilter ? 1 : 0) + (dateFrom || dateTo ? 1 : 0);
  const isFiltered        = !!query || activeFilterCount > 0;

  // ── Migration screen ─────────────────────────────────────────────
  if (migrating) {
    const pct = migrateProgress.total > 0 ? Math.round((migrateProgress.done / migrateProgress.total) * 100) : 0;
    function skipMigration() {
      localStorage.removeItem('cabaret_bottles'); localStorage.removeItem('cabaret_casts');
      setMigrating(false);
      subscribeBottles(data => { setBottles(data); setLoading(false); }); subscribeCasts(setCasts);
    }
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7', padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 24 }}>🍾</div>
        <div style={{ color: '#111827', fontWeight: 'bold', marginBottom: 8 }}>データをクラウドに移行中...</div>
        <div style={{ color: '#9ca3af', fontSize: 13, marginBottom: 24 }}>{migrateProgress.done} / {migrateProgress.total} 本</div>
        <div style={{ width: 280, height: 8, borderRadius: 4, background: '#e5e7eb', marginBottom: 32 }}>
          <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#7c3aed,#db2777)', width: `${pct}%`, transition: 'width 0.3s' }} />
        </div>
        <button onClick={skipMigration} style={{ background: '#fff', color: '#9ca3af', border: '1px solid #e5e7eb', borderRadius: 12, padding: '8px 20px', fontSize: 13, cursor: 'pointer' }}>
          スキップして後で移行
        </button>
      </div>
    );
  }

  // ── Loading screen ────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7' }}>
        <div style={{ color: '#9ca3af', fontSize: 14 }}>読み込み中...</div>
      </div>
    );
  }

  const modal = { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' };
  const sheet = { position: 'relative', width: '100%', maxWidth: 448, borderRadius: '20px 20px 0 0', background: '#fff', boxShadow: '0 -4px 32px rgba(0,0,0,0.12)' };
  const sheetHeader = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 12px' };
  const sheetTitle = { margin: 0, fontSize: 17, fontWeight: 'bold', color: '#111827' };
  const closeBtn = { background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 };
  const inp = { background: '#f9fafb', border: '1px solid #e5e7eb', color: '#111827', borderRadius: 12, padding: '10px 14px', outline: 'none', fontSize: 14, boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 640, margin: '0 auto' }}>

      {/* ヘッダー */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, padding: '14px 16px 12px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>

        {/* タブ行 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', flexShrink: 0 }}>
            {[['necks','🏷 ネック'],['bottles','🍾 ボトル'],['casts','👑 キャスト']].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: '6px 12px', fontSize: 12, fontWeight: 'bold', border: 'none', cursor: 'pointer', background: view === v ? '#7c3aed' : '#f9fafb', color: view === v ? '#fff' : '#9ca3af' }}>
                {label}
              </button>
            ))}
          </div>

          <p style={{ fontSize: 12, flex: 1, minWidth: 0, color: '#9ca3af', margin: 0 }}>
            全{bottles.length}本
            {emptyCount > 0 && <span style={{ color: '#ef4444', marginLeft: 6 }}>空き{emptyCount}本</span>}
          </p>

          <button onClick={() => setShowDataMgr(true)}
            style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', color: '#9ca3af', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
            <GearIcon />
          </button>

          {view === 'bottles' && (
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
              style={{ fontSize: 12, borderRadius: 8, padding: '4px 8px', outline: 'none', flexShrink: 0, background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151' }}>
              <option value="updated_desc">更新順</option>
              <option value="date_desc">日付↓</option>
              <option value="date_asc">日付↑</option>
              <option value="amount">残量↑</option>
              <option value="name">名前順</option>
            </select>
          )}
        </div>

        {view === 'bottles' && (
          <>
            {/* 検索バー */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                <SearchIcon />
              </span>
              <input type="text" value={rawQuery} onChange={e => setRawQuery(e.target.value)}
                placeholder="銘柄・ネック・お客さん・キャスト・メモで検索"
                style={{ ...inp, width: '100%', paddingLeft: 40, paddingRight: rawQuery ? 36 : 14 }} />
              {rawQuery && (
                <button onClick={() => { setRawQuery(''); setQuery(''); }}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>×</button>
              )}
            </div>

            {/* フィルターパネル */}
            <div style={{ borderRadius: 12, background: '#f9fafb', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <button onClick={() => setShowFilter(v => !v)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>絞り込み</span>
                {!showFilter && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                    {neckFilter && <span style={{ fontSize: 11, fontWeight: 'bold', padding: '2px 8px', borderRadius: 20, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', flexShrink: 0 }}>🏷 {neckFilter}</span>}
                    {castFilter && <span style={{ fontSize: 11, fontWeight: 'bold', padding: '2px 8px', borderRadius: 20, background: `${castColor(castFilter)}18`, color: castColor(castFilter), flexShrink: 0 }}>{castFilter}</span>}
                    {(dateFrom || dateTo) && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', flexShrink: 0 }}>📅 {dateFrom || '…'} 〜 {dateTo || '…'}</span>}
                    {activeFilterCount === 0 && <span style={{ fontSize: 11, color: '#d1d5db' }}>指名・日付</span>}
                  </div>
                )}
                {activeFilterCount > 0 && !showFilter && (
                  <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 20, background: '#7c3aed', color: '#fff', fontWeight: 'bold', flexShrink: 0 }}>{activeFilterCount}</span>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{showFilter ? '▲' : '▼'}</span>
              </button>

              {showFilter && (
                <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ paddingTop: 12 }}>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 8px' }}>指名の子</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <button onClick={() => setCastFilter('')}
                        style={{ padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', border: 'none', background: !castFilter ? '#7c3aed' : '#f3f4f6', color: !castFilter ? '#fff' : '#6b7280' }}>
                        すべて
                      </button>
                      {casts.map(name => {
                        const cc = castColor(name); const isActive = castFilter === name;
                        return (
                          <button key={name} onClick={() => setCastFilter(isActive ? '' : name)}
                            style={{ padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', background: isActive ? cc : '#f3f4f6', color: isActive ? '#fff' : cc, border: `1px solid ${cc}40` }}>
                            {name}
                          </button>
                        );
                      })}
                      <button onClick={() => setShowCastMgr(true)}
                        style={{ padding: '5px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer', background: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb' }}>
                        ＋ 管理
                      </button>
                    </div>
                  </div>

                  <div>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 8px' }}>入れた日付</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inp, flex: 1 }} />
                      <span style={{ color: '#d1d5db', flexShrink: 0 }}>〜</span>
                      <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...inp, flex: 1 }} />
                    </div>
                  </div>

                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters}
                      style={{ padding: '8px', borderRadius: 10, fontSize: 13, cursor: 'pointer', background: 'rgba(239,68,68,0.06)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}>
                      フィルターをクリア
                    </button>
                  )}
                </div>
              )}
            </div>

            {isFiltered && (
              <p style={{ fontSize: 11, marginTop: 6, paddingLeft: 2, color: '#9ca3af' }}>{filtered.length}件表示</p>
            )}
          </>
        )}
      </header>

      {/* ボトルリスト */}
      {view === 'bottles' && (
        <main style={{ flex: 1, padding: '12px 16px 112px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
              {isFiltered ? '該当するボトルが見つかりません' : 'ボトルがまだ登録されていません'}
            </div>
          ) : (
            <>
              {visibleBottles.map(bottle => <BottleCard key={bottle.id} bottle={bottle} onClick={openEdit} />)}
              {hasMore && (
                <button onClick={() => setPage(p => p + 1)}
                  style={{ padding: '12px', borderRadius: 12, background: '#f9fafb', border: '1px solid #e5e7eb', color: '#6b7280', fontSize: 13, cursor: 'pointer' }}>
                  もっと見る（残り{filtered.length - page * PAGE_SIZE}件）
                </button>
              )}
            </>
          )}
        </main>
      )}

      {/* ネックビュー */}
      {view === 'necks' && <NeckList bottles={bottles} onSelectNeck={handleSelectNeck} />}

      {/* キャストビュー */}
      {view === 'casts' && <CastList bottles={bottles} casts={casts} onSelectCast={handleSelectCast} />}

      {/* FAB */}
      {view === 'bottles' && (
        <button onClick={openAdd}
          style={{ position: 'fixed', bottom: 24, right: 20, width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', zIndex: 40, background: 'linear-gradient(135deg, #7c3aed, #db2777)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)', color: '#fff' }}>
          <PlusIcon />
        </button>
      )}

      {showForm && <BottleForm bottle={editBottle} casts={casts} onSave={handleSave} onDelete={handleDelete} onClose={closeForm} />}

      {/* データ管理モーダル */}
      {showDataMgr && (
        <div style={modal}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} onClick={() => setShowDataMgr(false)} />
          <div style={sheet}>
            <div style={sheetHeader}><h2 style={sheetTitle}>データ管理</h2><button onClick={() => setShowDataMgr(false)} style={closeBtn}>×</button></div>
            <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>全{bottles.length}本 / キャスト{casts.length}名</p>
              <button onClick={exportData} style={{ padding: '12px', borderRadius: 12, fontWeight: 'bold', fontSize: 14, color: '#fff', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
                💾 バックアップをダウンロード
              </button>
              <label style={{ padding: '12px', borderRadius: 12, fontWeight: 'bold', fontSize: 14, textAlign: 'center', display: 'block', cursor: 'pointer', background: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb' }}>
                📂 バックアップから復元
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={importData} />
              </label>
              <p style={{ fontSize: 11, textAlign: 'center', color: '#d1d5db', margin: 0 }}>※ 復元すると現在のデータは上書きされます</p>
            </div>
          </div>
        </div>
      )}

      {/* キャスト管理モーダル */}
      {showCastMgr && (
        <div style={modal}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} onClick={() => setShowCastMgr(false)} />
          <div style={sheet}>
            <div style={sheetHeader}><h2 style={sheetTitle}>キャスト管理</h2><button onClick={() => setShowCastMgr(false)} style={closeBtn}>×</button></div>
            <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={newCastInput} onChange={e => setNewCastInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCast())}
                  placeholder="キャスト名を入力..."
                  style={{ ...inp, flex: 1 }} />
                <button onClick={addCast}
                  style={{ padding: '10px 16px', borderRadius: 12, fontWeight: 'bold', color: '#fff', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
                  追加
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 256, overflowY: 'auto' }}>
                {casts.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: '#9ca3af', margin: 0 }}>まだ登録されていません</p>
                ) : (
                  casts.map(name => {
                    const cc = castColor(name); const isEditing = editingCast?.original === name;
                    return (
                      <div key={name} style={{ borderRadius: 10, padding: '10px 12px', background: '#f9fafb', border: `1px solid ${isEditing ? cc + '40' : '#e5e7eb'}` }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: cc, flexShrink: 0 }} />
                            <input autoFocus value={editingCast.value}
                              onChange={e => setEditingCast(v => ({ ...v, value: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') renameCast(name, editingCast.value); if (e.key === 'Escape') setEditingCast(null); }}
                              style={{ ...inp, flex: 1, padding: '4px 8px', fontSize: 13 }} />
                            <button onClick={() => renameCast(name, editingCast.value)}
                              style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 'bold', background: cc, color: '#fff', border: 'none', cursor: 'pointer' }}>保存</button>
                            <button onClick={() => setEditingCast(null)}
                              style={{ padding: '4px 8px', borderRadius: 8, fontSize: 12, background: '#f3f4f6', color: '#9ca3af', border: 'none', cursor: 'pointer' }}>✕</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: cc, flexShrink: 0 }} />
                            <span style={{ fontWeight: 'bold', fontSize: 13, flex: 1, color: cc }}>{name}</span>
                            <button onClick={() => setEditingCast({ original: name, value: name })}
                              style={{ padding: '3px 10px', borderRadius: 8, fontSize: 12, background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb', cursor: 'pointer' }}>変更</button>
                            <button onClick={() => removeCast(name)}
                              style={{ padding: '3px 10px', borderRadius: 8, fontSize: 12, background: 'rgba(239,68,68,0.06)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer' }}>削除</button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
