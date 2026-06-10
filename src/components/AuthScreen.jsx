import { useState } from 'react';
import { version } from '../../package.json';
import { signIn, signUp } from '../utils/firebase';
import { createUser } from '../utils/firestore';

const ERROR_MESSAGES = {
  'auth/user-not-found':        'メールアドレスが見つかりません',
  'auth/wrong-password':        'パスワードが間違っています',
  'auth/invalid-credential':    'メールアドレスまたはパスワードが間違っています',
  'auth/email-already-in-use':  'このメールアドレスは既に登録されています',
  'auth/weak-password':         'パスワードは6文字以上にしてください',
  'auth/invalid-email':         'メールアドレスの形式が正しくありません',
};

export default function AuthScreen() {
  const [mode, setMode]       = useState('login');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('メールアドレスとパスワードを入力してください'); return; }
    if (mode === 'signup' && !name.trim()) { setError('名前を入力してください'); return; }
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        const cred = await signUp(email, password);
        await createUser(cred.user.uid, email, name.trim());
      }
      // 成功時は onAuthStateChanged が画面を切り替える
    } catch (err) {
      setError(ERROR_MESSAGES[err.code] || 'エラーが発生しました');
    }
    setLoading(false);
  }

  const inp = {
    width: '100%', padding: '12px 16px', borderRadius: 12, fontSize: 15,
    outline: 'none', background: '#fff', color: '#111827',
    border: '1.5px solid #e5e7eb', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f5f5f7' }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🍾</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: 0 }}>ボトル管理</h1>
          <p style={{ fontSize: 11, color: '#d1d5db', marginTop: 4 }}>v{version}</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0' }}>

          {/* タブ */}
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 12, padding: 4, gap: 4, marginBottom: 20 }}>
            {[['login', 'ログイン'], ['signup', '新規登録']].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 13, fontWeight: 'bold', border: 'none', cursor: 'pointer',
                  background: mode === m ? '#fff' : 'transparent',
                  color: mode === m ? '#111827' : '#9ca3af',
                  boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* エラー */}
          {error && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#ef4444', fontSize: 13 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'signup' && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>名前</label>
                <input type="text" value={name} onChange={e => { setName(e.target.value); setError(''); }}
                  placeholder="山田 太郎" autoFocus style={inp} />
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>メールアドレス</label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="email@example.com" autoFocus={mode === 'login'} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>パスワード</label>
              <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••" style={inp} />
            </div>
            <button type="submit" disabled={!email || !password || loading}
              style={{ marginTop: 4, padding: '14px', borderRadius: 14, fontWeight: 'bold', fontSize: 15, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #7c3aed, #db2777)', color: '#fff',
                opacity: (!email || !password || loading) ? 0.4 : 1,
              }}>
              {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '登録する'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
