import { useState, useMemo, useEffect, useRef } from 'react';
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
  const [query, setQuery]         = useState('');
  const [castFilter, setCastFilter] = useState('');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [editBottle, setEditBottle] = useState(null);
  const [sortOrder, setSortOrder] = useState('date_desc');
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
      case 'date_desc': return arr.sort((a, b) => (b.purchaseDate || '') > (a.purchaseDate || '') ? 1 : -1);
      case 'date_asc':  return arr.sort((a, b) => (a.purchaseDate || '') > (b.purchaseDate || '') ? 1 : -1);
      case 'amount':    return arr.sort((a, b) => (a.remainingAmount ?? 100) - (b.remainingAmount ?? 100));
      case 'name':      return arr.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
      default: return arr;
    }
  }, [bottles, sortOrder]);

  const fuse = useMemo(() => buildSearchIndex(sorted), [sorted]);
  const filtered = useMemo(() => {
    let results = searchBottles(fuse, query, sorted);
    if (castFilter) results = results.filter(b => getCastNames(b).includes(castFilter));
    if (dateFrom)   results = results.filter(b => (b.purchaseDate || '') >= dateFrom);
    if (dateTo)     results = results.filter(b => (b.purchaseDate || '') <= dateTo);
    return results;
  }, [fuse, query, sorted, castFilter, dateFrom, dateTo]);

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
    setDateFrom('');
    setDateTo('');
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

  const emptyCount       = bottles.filter(b => (b.remainingAmount ?? 700) === 0).length;
  const activeFilterCount = (castFilter ? 1 : 0) + (dateFrom || dateTo ? 1 : 0);
  const isFiltered        = !!query || activeFilterCount > 0;

  // ── Migration screen ──────────────────────────────────────────────
  if (migrating) {
    const pct = migrateProgress.total > 0
      ? Math.round((migrateProgress.done / migrateProgress.total) * 100) : 0;

    function skipMigration() {
      localStorage.removeItem('cabaret_bottles');
      localStorage.removeItem('cabaret_casts');
      setMigrating(false);
      const unsubB = subscribeBottles(data => { setBottles(data); setLoading(false); });
      const unsubC = subscribeCasts(setCasts);
    }

    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0d0d1a', padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 24 }}>🍾</div>
        <div style={{ color: 'white', fontWeight: 'bold', marginBottom: 8 }}>データをクラウドに移行中...</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>
          {migrateProgress.done} / {migrateProgress.total} 本
        </div>
        <div style={{ width: 280, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.1)', marginBottom: 32 }}>
          <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#7c3aed,#db2777)', width: `${pct}%`, transition: 'width 0.3s' }} />
        </div>
        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginBottom: 12 }}>
          時間がかかる場合は以下をタップ
        </div>
        <button onClick={skipMigration}
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '8px 20px', fontSize: 13, cursor: 'pointer' }}>
          スキップして後で移行
        </button>
      </div>
    );
  }

  // ── Loading screen ────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d1a' }}>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ maxWidth: 640, margin: '0 auto' }}>

      {/* ヘッダー */}
      <header className="sticky top-0 z-30 pt-4 pb-3 px-4"
        style={{ background: 'linear-gradient(180deg, #0d0d1a 85%, transparent)', backdropFilter: 'blur(8px)' }}>

        {/* タブ行 */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex rounded-xl overflow-hidden flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setView('bottles')}
              className="px-3 py-1.5 text-sm font-bold transition-all"
              style={view === 'bottles' ? { background: '#7c3aed', color: 'white' } : { color: 'rgba(255,255,255,0.45)' }}>
              🍾 ボトル
            </button>
            <button onClick={() => setView('casts')}
              className="px-3 py-1.5 text-sm font-bold transition-all"
              style={view === 'casts' ? { background: '#7c3aed', color: 'white' } : { color: 'rgba(255,255,255,0.45)' }}>
              👑 キャスト
            </button>
          </div>

          <p className="text-xs flex-1 min-w-0" style={{ color: 'rgba(255,255,255,0.4)' }}>
            全{bottles.length}本
            {emptyCount > 0 && <span style={{ color: '#f87171', marginLeft: 6 }}>空き{emptyCount}本</span>}
          </p>

          <button onClick={() => setShowDataMgr(true)}
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <GearIcon />
          </button>

          {view === 'bottles' && (
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
              className="text-xs rounded-lg px-2 py-1.5 outline-none flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', colorScheme: 'dark' }}>
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
            <div className="relative mb-2">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <SearchIcon />
              </span>
              <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="銘柄・お客さん・メモで検索"
                className="w-full rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }} />
              {query && (
                <button onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xl leading-none"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>×</button>
              )}
            </div>

            {/* フィルターパネル */}
            <div className="rounded-xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <button onClick={() => setShowFilter(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left">
                <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>絞り込み</span>
                {!showFilter && (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {castFilter && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: `${castColor(castFilter)}25`, color: castColor(castFilter) }}>
                        {castFilter}
                      </span>
                    )}
                    {(dateFrom || dateTo) && (
                      <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: 'rgba(124,58,237,0.25)', color: '#a78bfa' }}>
                        📅 {dateFrom || '…'} 〜 {dateTo || '…'}
                      </span>
                    )}
                    {activeFilterCount === 0 && (
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>指名・日付</span>
                    )}
                  </div>
                )}
                {activeFilterCount > 0 && !showFilter && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                    style={{ background: '#7c3aed', color: 'white' }}>{activeFilterCount}</span>
                )}
                <span className="ml-auto text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {showFilter ? '▲' : '▼'}
                </span>
              </button>

              {showFilter && (
                <div className="px-3 pb-3 space-y-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="pt-3">
                    <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>指名の子</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setCastFilter('')}
                        className="px-3.5 py-1.5 rounded-full text-sm font-bold transition-all"
                        style={!castFilter
                          ? { background: '#7c3aed', color: 'white' }
                          : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.12)' }}>
                        すべて
                      </button>
                      {casts.map(name => {
                        const cc = castColor(name);
                        const isActive = castFilter === name;
                        return (
                          <button key={name} onClick={() => setCastFilter(isActive ? '' : name)}
                            className="px-3.5 py-1.5 rounded-full text-sm font-bold transition-all"
                            style={isActive
                              ? { background: cc, color: '#0d0d1a' }
                              : { background: 'rgba(255,255,255,0.06)', color: cc, border: `1px solid ${cc}55` }}>
                            {name}
                          </button>
                        );
                      })}
                      <button onClick={() => setShowCastMgr(true)}
                        className="px-3.5 py-1.5 rounded-full text-sm transition-all"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        ＋ 管理
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>入れた日付</p>
                    <div className="flex items-center gap-2">
                      <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                        className="flex-1 rounded-xl px-3 py-2 text-sm text-white outline-none"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', colorScheme: 'dark' }} />
                      <span className="text-white/30 flex-shrink-0">〜</span>
                      <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                        className="flex-1 rounded-xl px-3 py-2 text-sm text-white outline-none"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', colorScheme: 'dark' }} />
                    </div>
                  </div>

                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters}
                      className="w-full py-2 rounded-xl text-sm font-medium"
                      style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                      フィルターをクリア
                    </button>
                  )}
                </div>
              )}
            </div>

            {isFiltered && (
              <p className="text-xs mt-2 pl-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {filtered.length}件表示
              </p>
            )}
          </>
        )}
      </header>

      {/* ボトルリスト */}
      {view === 'bottles' && (
        <main className="flex-1 px-4 pb-28 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-20" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {isFiltered ? '該当するボトルが見つかりません' : 'ボトルがまだ登録されていません'}
            </div>
          ) : (
            filtered.map(bottle => (
              <BottleCard key={bottle.id} bottle={bottle} onClick={openEdit} />
            ))
          )}
        </main>
      )}

      {/* キャストビュー */}
      {view === 'casts' && (
        <CastList bottles={bottles} casts={casts} onSelectCast={handleSelectCast} />
      )}

      {/* FAB */}
      {view === 'bottles' && (
        <button onClick={openAdd}
          className="fixed bottom-6 right-5 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white z-40"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', boxShadow: '0 4px 24px rgba(124,58,237,0.5)' }}
          title="ボトルを追加">
          <PlusIcon />
        </button>
      )}

      {/* フォームモーダル */}
      {showForm && (
        <BottleForm bottle={editBottle} casts={casts}
          onSave={handleSave} onDelete={handleDelete} onClose={closeForm} />
      )}

      {/* データ管理モーダル */}
      {showDataMgr && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDataMgr(false)} />
          <div className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl"
            style={{ background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <h2 className="text-lg font-bold text-white">データ管理</h2>
              <button onClick={() => setShowDataMgr(false)} className="text-white/50 hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="px-5 pb-6 space-y-3">
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                全{bottles.length}本 / キャスト{casts.length}名
              </p>
              <button onClick={exportData}
                className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
                💾 バックアップをダウンロード
              </button>
              <label className="w-full py-3 rounded-xl font-bold text-center block cursor-pointer transition-all hover:opacity-90"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}>
                📂 バックアップから復元
                <input type="file" accept=".json" className="hidden" onChange={importData} />
              </label>
              <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                ※ 復元すると現在のデータは上書きされます
              </p>
            </div>
          </div>
        </div>
      )}

      {/* キャスト管理モーダル */}
      {showCastMgr && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCastMgr(false)} />
          <div className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl"
            style={{ background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <h2 className="text-lg font-bold text-white">キャスト管理</h2>
              <button onClick={() => setShowCastMgr(false)} className="text-white/50 hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="px-5 pb-5 space-y-3">
              <div className="flex gap-2">
                <input value={newCastInput} onChange={e => setNewCastInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCast())}
                  placeholder="キャスト名を入力..."
                  className="flex-1 rounded-xl px-4 py-2.5 text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }} />
                <button onClick={addCast}
                  className="px-4 py-2.5 rounded-xl font-bold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
                  追加
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {casts.length === 0 ? (
                  <p className="text-center py-6 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    まだ登録されていません
                  </p>
                ) : (
                  casts.map(name => {
                    const cc = castColor(name);
                    const isEditing = editingCast?.original === name;
                    return (
                      <div key={name} className="rounded-xl px-3 py-2.5"
                        style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${isEditing ? cc + '50' : 'rgba(255,255,255,0.08)'}` }}>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cc }} />
                            <input autoFocus value={editingCast.value}
                              onChange={e => setEditingCast(v => ({ ...v, value: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === 'Enter') renameCast(name, editingCast.value);
                                if (e.key === 'Escape') setEditingCast(null);
                              }}
                              className="flex-1 rounded-lg px-2 py-1 text-sm text-white outline-none"
                              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }} />
                            <button onClick={() => renameCast(name, editingCast.value)}
                              className="text-xs px-2.5 py-1 rounded-lg font-bold flex-shrink-0"
                              style={{ background: cc, color: '#0d0d1a' }}>保存</button>
                            <button onClick={() => setEditingCast(null)}
                              className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
                              style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.07)' }}>✕</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cc }} />
                            <span className="font-bold text-sm flex-1" style={{ color: cc }}>{name}</span>
                            <button onClick={() => setEditingCast({ original: name, value: name })}
                              className="text-xs px-2.5 py-1 rounded-lg flex-shrink-0"
                              style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.07)' }}>変更</button>
                            <button onClick={() => removeCast(name)}
                              className="text-xs px-2.5 py-1 rounded-lg flex-shrink-0"
                              style={{ color: 'rgba(248,113,113,0.7)', background: 'rgba(248,113,113,0.08)' }}>削除</button>
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
