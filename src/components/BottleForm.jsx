import { useState } from 'react';
import { todayString, getDayOfWeek } from '../utils/date';
import { generateId } from '../utils/storage';
import { castColor } from '../utils/castColors';

const MAX_G  = 700;
const MAX_CM = 30;

const QUICK_G  = [700, 600, 500, 400, 300, 200, 100, 0];
const QUICK_CM = [30, 25, 20, 15, 10, 5, 2.5, 0];

function AmountBar({ value, unit }) {
  const max = unit === 'cm' ? MAX_CM : MAX_G;
  const pct = Math.min(100, Math.max(0, ((value ?? max) / max) * 100));
  const color = pct > 60 ? '#34d399' : pct > 30 ? '#fbbf24' : '#f87171';
  return (
    <div className="relative w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
      <div
        className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function BottleForm({ bottle, casts = [], onSave, onDelete, onClose }) {
  const isEdit = !!bottle;
  const [showCastChips, setShowCastChips] = useState(false);

  const [form, setForm] = useState({
    name: '',
    keepName: '',
    purchaseDate: todayString(),
    remainingAmount: MAX_G,
    remainingUnit: 'g',
    isPhysical: false,
    isUnopened: false,
    customerName: '',
    castName: '',
    notes: '',
    ...bottle,
  });

  const dayLabel = getDayOfWeek(form.purchaseDate);
  const unit = form.remainingUnit || 'g';
  const quickOptions = unit === 'cm' ? QUICK_CM : QUICK_G;

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function switchUnit(newUnit) {
    set('remainingUnit', newUnit);
    set('remainingAmount', newUnit === 'cm' ? MAX_CM : MAX_G);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, id: form.id || generateId(), updatedAt: Date.now() });
  }

  const inputStyle = { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' };
  const activeBtn   = { background: '#7c3aed', color: 'white', border: '1px solid #7c3aed' };
  const inactiveBtn = { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-lg font-bold text-white">{isEdit ? 'ボトル編集' : 'ボトル追加'}</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* 銘柄 */}
          <div>
            <label className="block text-xs text-white/60 mb-1">銘柄 <span className="text-pink-400">*</span></label>
            <input
              required
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="例：山崎12年、ドンペリ..."
              className="w-full rounded-xl px-4 py-2.5 text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-purple-500"
              style={inputStyle}
            />
          </div>

          {/* ネック名 */}
          <div>
            <label className="block text-xs text-white/60 mb-1">ネック名</label>
            <input
              value={form.keepName}
              onChange={e => set('keepName', e.target.value)}
              placeholder="例：田中様ネック、VIPルーム用..."
              className="w-full rounded-xl px-4 py-2.5 text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-purple-500"
              style={inputStyle}
            />
          </div>

          {/* 保管状況 */}
          <div>
            <label className="block text-xs text-white/60 mb-2">保管状況</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => set('isPhysical', !form.isPhysical)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-sm transition-all"
                style={form.isPhysical
                  ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.5)', color: '#34d399' }
                  : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }
                }
              >
                <span>📦</span> 現物保管
              </button>
              <button
                type="button"
                onClick={() => set('isUnopened', !form.isUnopened)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-sm transition-all"
                style={form.isUnopened
                  ? { background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.5)', color: '#60a5fa' }
                  : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }
                }
              >
                <span>🔒</span> 未開封
              </button>
            </div>
          </div>

          {/* 入れた日付 */}
          <div>
            <label className="block text-xs text-white/60 mb-1">入れた日付</label>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={form.purchaseDate}
                onChange={e => set('purchaseDate', e.target.value)}
                className="flex-1 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-purple-500"
                style={{ ...inputStyle, colorScheme: 'dark' }}
              />
              {dayLabel && (
                <span className="text-lg font-bold text-purple-300 w-8 text-center">({dayLabel})</span>
              )}
            </div>
          </div>

          {/* 残量 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white/60">残量</label>
              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                {['g', 'cm'].map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => switchUnit(u)}
                    className="px-3 py-1 text-xs font-bold transition-all"
                    style={unit === u
                      ? { background: '#7c3aed', color: 'white' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }
                    }
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <input
                type="number"
                min={0}
                max={unit === 'cm' ? 99 : 9999}
                step={unit === 'cm' ? 0.5 : 1}
                value={form.remainingAmount}
                onChange={e => set('remainingAmount', Math.max(0, Number(e.target.value)))}
                className="w-28 rounded-xl px-4 py-2.5 text-white text-center font-bold text-lg outline-none focus:ring-2 focus:ring-purple-500"
                style={inputStyle}
              />
              <span className="text-white/60 font-medium">{unit}</span>
            </div>

            <AmountBar value={form.remainingAmount} unit={unit} />

            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickOptions.map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set('remainingAmount', v)}
                  className="px-3 py-1 rounded-lg text-sm font-medium transition-all"
                  style={form.remainingAmount === v ? activeBtn : inactiveBtn}
                >
                  {v}{unit}
                </button>
              ))}
            </div>
          </div>

          {/* お客さん名 */}
          <div>
            <label className="block text-xs text-white/60 mb-1">お客さん名</label>
            <input
              value={form.customerName}
              onChange={e => set('customerName', e.target.value)}
              placeholder="田中様"
              className="w-full rounded-xl px-4 py-2.5 text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-purple-500"
              style={inputStyle}
            />
          </div>

          {/* 指名の子（折りたたみ式） */}
          <div className="rounded-xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>

            {/* ヘッダー行：入力 + トグル */}
            <div className="flex items-center gap-2 px-3 pt-3 pb-2">
              <label className="text-xs text-white/60 flex-shrink-0">指名の子</label>
              {form.castName && (
                <span className="text-xs font-bold flex-shrink-0"
                  style={{ color: castColor(form.castName) }}>
                  {form.castName}
                </span>
              )}
              {casts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCastChips(v => !v)}
                  className="ml-auto text-xs px-2 py-0.5 rounded-full flex-shrink-0 transition-all"
                  style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.06)' }}
                >
                  {showCastChips ? '▲ 閉じる' : '▼ 選択'}
                </button>
              )}
            </div>

            <div className="px-3 pb-3">
              <input
                value={form.castName}
                onChange={e => set('castName', e.target.value)}
                placeholder="さくら"
                className="w-full rounded-xl px-4 py-2.5 text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-purple-500"
                style={inputStyle}
              />

              {/* 展開時のチップ */}
              {showCastChips && casts.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {casts.map(name => {
                    const cc = castColor(name);
                    const isActive = form.castName === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => set('castName', isActive ? '' : name)}
                        className="px-3.5 py-1.5 rounded-full text-sm font-bold transition-all"
                        style={isActive
                          ? { background: cc, color: '#0d0d1a' }
                          : { background: 'rgba(255,255,255,0.06)', color: cc, border: `1px solid ${cc}60` }
                        }
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* メモ */}
          <div>
            <label className="block text-xs text-white/60 mb-1">メモ</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder="自由メモ..."
              className="w-full rounded-xl px-4 py-2.5 text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              style={inputStyle}
            />
          </div>

          {/* 保存・削除ボタン */}
          <div className="flex gap-3 pt-2">
            {isEdit && (
              <button
                type="button"
                onClick={() => onDelete(bottle.id)}
                className="px-4 py-2.5 rounded-xl text-red-400 font-medium transition-all"
                style={{ border: '1px solid rgba(248,113,113,0.3)' }}
              >
                削除
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
            >
              {isEdit ? '保存' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
