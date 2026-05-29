import { formatDate } from '../utils/date';
import { castColor } from '../utils/castColors';

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
  const color  = pct > 60 ? '#34d399' : pct > 30 ? '#fbbf24' : '#f87171';
  const label  = u === 'cm' ? `${v}` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`;

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 56, height: 56 }}>
      <svg width={56} height={56} viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={28} cy={28} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={5} />
        <circle
          cx={28} cy={28} r={r} fill="none"
          stroke={color} strokeWidth={5}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="font-bold" style={{ color, fontSize: 11 }}>{label}</span>
        <span style={{ color, fontSize: 9 }}>{u}</span>
      </div>
    </div>
  );
}

export default function BottleCard({ bottle, onClick }) {
  const dateLabel = formatDate(bottle.purchaseDate);
  const cc = bottle.castName ? castColor(bottle.castName) : null;

  return (
    <button
      onClick={() => onClick(bottle)}
      className="w-full text-left rounded-2xl p-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background: bottle.isPhysical
          ? 'linear-gradient(145deg, rgba(52,211,153,0.1) 0%, rgba(52,211,153,0.04) 100%)'
          : bottle.isUnopened
            ? 'linear-gradient(145deg, rgba(96,165,250,0.1) 0%, rgba(96,165,250,0.04) 100%)'
            : 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
        border: bottle.isPhysical
          ? '1px solid rgba(52,211,153,0.25)'
          : bottle.isUnopened
            ? '1px solid rgba(96,165,250,0.25)'
            : '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div className="flex items-center gap-4">
        {/* 残量リング */}
        <AmountRing value={bottle.remainingAmount} unit={bottle.remainingUnit} />

        {/* メイン情報 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-base truncate">{bottle.name}</span>
            {bottle.isPhysical && (
              <span className="text-xs px-1.5 py-0.5 rounded-md flex-shrink-0"
                style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
                📦 現物
              </span>
            )}
            {bottle.isUnopened && (
              <span className="text-xs px-1.5 py-0.5 rounded-md flex-shrink-0"
                style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' }}>
                🔒 未開封
              </span>
            )}
          </div>

          {bottle.keepName && (
            <div className="text-xs truncate mt-0.5" style={{ color: 'rgba(196,181,253,0.8)' }}>🏷 {bottle.keepName}</div>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
            {dateLabel && (
              <span className="text-xs text-purple-300">{dateLabel}</span>
            )}
            {bottle.customerName && (
              <span className="text-xs text-white/60">👤 {bottle.customerName}</span>
            )}
            {bottle.castName && (
              <span className="text-xs font-bold" style={{ color: cc }}>✨ {bottle.castName}</span>
            )}
          </div>

          {bottle.notes && (
            <div className="text-xs text-white/40 mt-1 truncate">{bottle.notes}</div>
          )}
        </div>

        <div className="text-white/30 text-lg flex-shrink-0">›</div>
      </div>
    </button>
  );
}
