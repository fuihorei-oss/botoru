import { useState } from 'react';
import { todayString, getDayOfWeek } from '../utils/date';
import { generateId } from '../utils/storage';
import { castColor } from '../utils/castColors';

const MAX_G   = 700;
const MAX_CM  = 30;
const QUICK_G  = [700, 600, 500, 400, 300, 200, 100, 0];
const QUICK_CM = [30, 20, 10, 5, 1, 0.5, 0];

function AmountBar({ value, unit }) {
  const max = unit === 'cm' ? MAX_CM : MAX_G;
  const pct = Math.min(100, Math.max(0, ((value ?? max) / max) * 100));
  const color = pct > 60 ? '#10b981' : pct > 30 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ width: '100%', height: 10, borderRadius: 5, background: '#f3f4f6', overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: 5, background: color, width: `${pct}%`, transition: 'width 0.3s' }} />
    </div>
  );
}

function normalizeCastName(bottle) {
  if (!bottle) return [];
  if (Array.isArray(bottle.castName)) return bottle.castName;
  if (bottle.castName) return [bottle.castName];
  return [];
}

export default function BottleForm({ bottle, casts = [], onSave, onDelete, onClose }) {
  const isEdit = !!bottle;
  const [showCastChips, setShowCastChips] = useState(false);
  const [castInput, setCastInput] = useState('');

  const [form, setForm] = useState({
    name: '', keepName: '', purchaseDate: todayString(),
    remainingAmount: MAX_G, remainingUnit: 'g',
    isPhysical: false, isUnopened: false,
    customerName: '', castName: [], notes: '',
    ...bottle, castName: normalizeCastName(bottle),
  });

  const dayLabel = getDayOfWeek(form.purchaseDate);
  const unit = form.remainingUnit || 'g';
  const quickOptions = unit === 'cm' ? QUICK_CM : QUICK_G;

  const inp = { background: '#f9fafb', border: '1px solid #e5e7eb', color: '#111827', borderRadius: 12, padding: '10px 16px', width: '100%', outline: 'none', fontSize: 14, boxSizing: 'border-box' };

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }
  function switchUnit(u) { set('remainingUnit', u); set('remainingAmount', u === 'cm' ? MAX_CM : MAX_G); }
  function toggleCast(name) {
    const cur = form.castName;
    set('castName', cur.includes(name) ? cur.filter(n => n !== name) : [...cur, name]);
  }
  function addCastInput() {
    const name = castInput.trim();
    if (name && !form.castName.includes(name)) set('castName', [...form.castName, name]);
    setCastInput('');
  }
  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, id: form.id || generateId(), updatedAt: Date.now() });
  }

  const activeChip  = (cc) => ({ background: cc, color: '#fff', border: `1px solid ${cc}`, borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' });
  const inactiveChip = (cc) => ({ background: '#f9fafb', color: cc, border: `1px solid ${cc}60`, borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' });
  const quickBtn = (active) => ({ background: active ? '#7c3aed' : '#f3f4f6', color: active ? '#fff' : '#374151', border: active ? '1px solid #7c3aed' : '1px solid #e5e7eb', borderRadius: 8, padding: '4px 12px', fontSize: 13, cursor: 'pointer' });
  const toggleBtn = (active, activeColor, activeBg) => ({
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px 12px', borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer',
    background: active ? activeBg : '#f9fafb',
    border: active ? `1px solid ${activeColor}` : '1px solid #e5e7eb',
    color: active ? activeColor : '#9ca3af',
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 512, borderRadius: '20px 20px 0 0', background: '#ffffff', boxShadow: '0 -4px 32px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 12px' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 'bold', color: '#111827' }}>{isEdit ? 'ボトル編集' : 'ボトル追加'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '80vh', overflowY: 'auto' }}>

          {/* 銘柄 */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>銘柄 <span style={{ color: '#ef4444' }}>*</span></label>
            <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="例：山崎12年、ドンペリ..." style={inp} />
          </div>

          {/* ネック名 */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>ネック名</label>
            <input value={form.keepName} onChange={e => set('keepName', e.target.value)} placeholder="例：田中様ネック..." style={inp} />
          </div>

          {/* 保管状況 */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 8 }}>保管状況</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => set('isPhysical', !form.isPhysical)} style={toggleBtn(form.isPhysical, '#059669', 'rgba(16,185,129,0.1)')}>
                📦 現物保管
              </button>
              <button type="button" onClick={() => set('isUnopened', !form.isUnopened)} style={toggleBtn(form.isUnopened, '#2563eb', 'rgba(59,130,246,0.1)')}>
                🔒 未開封
              </button>
            </div>
          </div>

          {/* 日付 */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>入れた日付</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)}
                style={{ ...inp, flex: 1, colorScheme: 'light' }} />
              {dayLabel && <span style={{ fontSize: 16, fontWeight: 'bold', color: '#7c3aed', width: 32, textAlign: 'center' }}>({dayLabel})</span>}
            </div>
          </div>

          {/* 残量 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 12, color: '#6b7280' }}>残量</label>
              <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                {['g', 'cm'].map(u => (
                  <button key={u} type="button" onClick={() => switchUnit(u)}
                    style={{ padding: '4px 12px', fontSize: 12, fontWeight: 'bold', cursor: 'pointer', border: 'none', background: unit === u ? '#7c3aed' : '#f9fafb', color: unit === u ? '#fff' : '#9ca3af' }}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <input type="number" min={0} step={unit === 'cm' ? 0.5 : 1}
                value={form.remainingAmount}
                onChange={e => set('remainingAmount', Math.max(0, Number(e.target.value)))}
                style={{ ...inp, width: 112, textAlign: 'center', fontWeight: 'bold', fontSize: 18 }} />
              <span style={{ color: '#6b7280', fontWeight: 500 }}>{unit}</span>
            </div>
            <AmountBar value={form.remainingAmount} unit={unit} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {quickOptions.map(v => (
                <button key={v} type="button" onClick={() => set('remainingAmount', v)} style={quickBtn(form.remainingAmount === v)}>
                  {v}{unit}
                </button>
              ))}
            </div>
          </div>

          {/* お客さん名 */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>お客さん名</label>
            <input value={form.customerName} onChange={e => set('customerName', e.target.value)} placeholder="田中様" style={inp} />
          </div>

          {/* 指名の子 */}
          <div style={{ borderRadius: 12, background: '#f9fafb', border: '1px solid #e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px 8px' }}>
              <label style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>指名の子</label>
              {form.castName.length > 0 && <span style={{ fontSize: 12, color: '#9ca3af' }}>{form.castName.length}名</span>}
              {casts.length > 0 && (
                <button type="button" onClick={() => setShowCastChips(v => !v)}
                  style={{ marginLeft: 'auto', fontSize: 12, padding: '2px 10px', borderRadius: 20, background: '#fff', border: '1px solid #e5e7eb', color: '#6b7280', cursor: 'pointer' }}>
                  {showCastChips ? '▲ 閉じる' : '▼ 選択'}
                </button>
              )}
            </div>
            <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {form.castName.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {form.castName.map(name => {
                    const cc = castColor(name);
                    return (
                      <button key={name} type="button" onClick={() => toggleCast(name)}
                        style={{ ...activeChip(cc), display: 'flex', alignItems: 'center', gap: 4 }}>
                        {name} <span style={{ opacity: 0.7, fontSize: 11 }}>×</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 直接入力（常に表示） */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={castInput} onChange={e => setCastInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCastInput())}
                  placeholder="指名キャストを入力して追加..."
                  style={{ ...inp, flex: 1, fontSize: 13 }} />
                <button type="button" onClick={addCastInput}
                  style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.2)', fontSize: 13, cursor: 'pointer' }}>
                  追加
                </button>
              </div>

              {/* 登録済みキャストから選ぶ（登録があり、選択を開いたとき） */}
              {showCastChips && casts.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
                  {casts.map(name => {
                    const cc = castColor(name);
                    const isActive = form.castName.includes(name);
                    return (
                      <button key={name} type="button" onClick={() => toggleCast(name)}
                        style={isActive ? activeChip(cc) : inactiveChip(cc)}>
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
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>メモ</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              placeholder="自由メモ..."
              style={{ ...inp, resize: 'none' }} />
          </div>

          {/* ボタン */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            {isEdit && (
              <button type="button" onClick={() => onDelete(bottle.id)}
                style={{ padding: '12px 16px', borderRadius: 12, color: '#ef4444', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontSize: 14 }}>
                削除
              </button>
            )}
            <button type="submit"
              style={{ flex: 1, padding: '12px', borderRadius: 12, fontWeight: 'bold', fontSize: 15, color: '#fff', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
              {isEdit ? '保存' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
