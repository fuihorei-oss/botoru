import { version } from '../../package.json';
import { STORES } from '../utils/stores';

// ログイン後にどの店舗を開くか選ぶ画面。
export default function StorePicker({ onSelect, userName }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f5f5f7' }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🍾</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: 0 }}>店舗を選択</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>
            {userName ? `${userName} さん、` : ''}どの店舗を開きますか？
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {STORES.map(s => (
            <button key={s.id} onClick={() => onSelect(s.id)}
              style={{
                padding: '20px', borderRadius: 16, border: '1px solid #f0f0f0',
                background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{s.name}</span>
              <span style={{ fontSize: 20, color: '#d1d5db' }}>›</span>
            </button>
          ))}
        </div>

        <p style={{ fontSize: 11, textAlign: 'center', color: '#d1d5db', marginTop: 24 }}>v{version}</p>
      </div>
    </div>
  );
}
