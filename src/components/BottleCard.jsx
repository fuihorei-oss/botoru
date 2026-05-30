import { formatDate } from '../utils/date';
import { castColor, getCastNames } from '../utils/castColors';

const MAX_G  = 700;
const MAX_CM = 30;

function AmountRing({ value, unit }) {
  const u   = unit || 'g';
  const max = u === 'cm' ? MAX_CM : MAX_G;
  const v   = value ?? max;
  const pct = Math.min(100, Math.max(0, (v / max) * 100));
  const r   = 20;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  const color  = pct > 60 ? '#10b981' : pct > 30 ? '#f59e0b' : '#ef4444';
  const label  = u === 'cm' ? `${v}` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`;

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 56, height: 56 }}>
      <svg width={56} height={56} viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={28} cy={28} r={r} fill="none" stroke="#e5e7eb" strokeWidth={5} />
        <circle cx={28} cy={28} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
        <span style={{ fontWeight: 'bold', color, fontSize: 11 }}>{label}</span>
        <span style={{ color, fontSize: 9 }}>{u}</span>
      </div>
    </div>
  );
}

export default function BottleCard({ bottle, onClick }) {
  const dateLabel = formatDate(bottle.purchaseDate);
  const castNames = getCastNames(bottle);

  const cardBg = bottle.isPhysical
    ? 'linear-gradient(145deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))'
    : bottle.isUnopened
      ? 'linear-gradient(145deg, rgba(59,130,246,0.08), rgba(59,130,246,0.02))'
      : '#ffffff';
  const cardBorder = bottle.isPhysical
    ? '1px solid rgba(16,185,129,0.3)'
    : bottle.isUnopened
      ? '1px solid rgba(59,130,246,0.3)'
      : '1px solid #e5e7eb';

  return (
    <button onClick={() => onClick(bottle)}
      style={{
        width: '100%', textAlign: 'left', borderRadius: 16, padding: 16,
        background: cardBg, border: cardBorder, cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
      onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
      onMouseOut={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <AmountRing value={bottle.remainingAmount} unit={bottle.remainingUnit} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 'bold', color: '#111827', fontSize: 15 }}>{bottle.name}</span>
            {bottle.isPhysical && (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)', flexShrink: 0 }}>
                📦 現物
              </span>
            )}
            {bottle.isUnopened && (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(59,130,246,0.1)', color: '#2563eb', border: '1px solid rgba(59,130,246,0.25)', flexShrink: 0 }}>
                🔒 未開封
              </span>
            )}
          </div>

          {bottle.keepName && (
            <div style={{ fontSize: 12, color: '#7c3aed', marginTop: 2 }}>🏷 {bottle.keepName}</div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px 12px', marginTop: 4 }}>
            {dateLabel && <span style={{ fontSize: 12, color: '#9ca3af' }}>{dateLabel}</span>}
            {bottle.customerName && <span style={{ fontSize: 12, color: '#6b7280' }}>👤 {bottle.customerName}</span>}
          </div>

          {castNames.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {castNames.map(name => (
                <span key={name} style={{ fontSize: 12, fontWeight: 'bold', color: castColor(name) }}>
                  ✨ {name}
                </span>
              ))}
            </div>
          )}

          {bottle.notes && (
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {bottle.notes}
            </div>
          )}
        </div>

        <div style={{ color: '#d1d5db', fontSize: 18, flexShrink: 0 }}>›</div>
      </div>
    </button>
  );
}
