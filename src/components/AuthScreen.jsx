import { useState } from 'react';

const HASH = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';
const SESSION_KEY = 'botoru_auth';

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === HASH;
}

export default function AuthScreen({ onAuth }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const h = await sha256(input);
    if (h === HASH) {
      sessionStorage.setItem(SESSION_KEY, HASH);
      onAuth();
    } else {
      setError(true);
      setInput('');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%)' }}>
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍾</div>
          <h1 className="text-2xl font-black text-white tracking-tight">ボトル管理</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>パスワードを入力してください</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            placeholder="パスワード"
            autoFocus
            className="w-full rounded-2xl px-5 py-4 text-white text-center text-xl tracking-widest outline-none"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: error ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.15)',
            }}
          />
          {error && (
            <p className="text-center text-sm" style={{ color: '#f87171' }}>
              パスワードが違います
            </p>
          )}
          <button
            type="submit"
            disabled={!input || loading}
            className="w-full py-4 rounded-2xl font-bold text-white text-lg transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
          >
            {loading ? '確認中...' : '入室'}
          </button>
        </form>
      </div>
    </div>
  );
}
