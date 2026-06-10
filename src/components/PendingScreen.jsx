import { signOutUser } from '../utils/firebase';

export default function PendingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f5f5f7' }}>
      <div style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>承認待ちです</h2>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 32px', lineHeight: 1.6 }}>
          管理者がアカウントを承認するまでお待ちください。<br />
          承認されると自動的にアプリが使えるようになります。
        </p>
        <button
          onClick={signOutUser}
          style={{ padding: '12px 32px', borderRadius: 12, fontSize: 14, fontWeight: 'bold', border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280', cursor: 'pointer' }}
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}