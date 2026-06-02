import { useState } from 'react';
import { version } from '../../package.json';
import { signIn } from '../utils/firebase';

export default function AuthScreen() {
  const [input, setInput]   = useState('');
  const [error, setError]   = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(input);
      // 成功時は onAuthStateChanged が画面を切り替える
    } catch {
      setError(true);
      setInput('');
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f5f5f7' }}>
      <div style={{ width: '100%', maxWidth: 320 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🍾</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: 0 }}>ボトル管理</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>パスワードを入力してください</p>
          <p style={{ fontSize: 11, color: '#d1d5db', marginTop: 2 }}>v{version}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            placeholder="パスワード"
            autoFocus
            style={{
              width: '100%', padding: '14px 20px', borderRadius: 16,
              fontSize: 20, textAlign: 'center', letterSpacing: 8, outline: 'none',
              background: '#ffffff', color: '#111827',
              border: error ? '2px solid #ef4444' : '2px solid #e5e7eb',
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <p style={{ textAlign: 'center', color: '#ef4444', fontSize: 13, margin: 0 }}>
              パスワードが違います
            </p>
          )}
          <button
            type="submit"
            disabled={!input || loading}
            style={{
              padding: '14px', borderRadius: 16, fontWeight: 'bold',
              fontSize: 16, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #7c3aed, #db2777)',
              color: 'white', opacity: (!input || loading) ? 0.4 : 1,
            }}
          >
            {loading ? '確認中...' : '入室'}
          </button>
        </form>
      </div>
    </div>
  );
}
