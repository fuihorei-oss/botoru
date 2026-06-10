import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import PendingScreen from './components/PendingScreen.jsx';
import { onAuth } from './utils/firebase.js';
import {
  subscribeUserRole,
  checkRtdbMigrationNeeded,
  migrateFromRealtimeDB,
} from './utils/firestore.js';

function Root() {
  const [user, setUser]           = useState(undefined);
  const [role, setRole]           = useState(undefined);
  const [migrating, setMigrating] = useState(false);
  const [migrateProgress, setMigrateProgress] = useState({ done: 0, total: 0 });

  useEffect(() => onAuth(u => {
    setUser(u);
    if (!u) setRole(null);
  }), []);

  useEffect(() => {
    if (!user) return;
    return subscribeUserRole(user.uid, r => setRole(r));
  }, [user]);

  // 管理者ログイン後にRTDB→Firestoreマイグレーション確認
  useEffect(() => {
    if (role !== 'admin') return;
    (async () => {
      const needed = await checkRtdbMigrationNeeded();
      if (!needed) return;
      setMigrating(true);
      try {
        const total = await migrateFromRealtimeDB((done, t) => {
          setMigrateProgress({ done, total: t });
        });
        console.log(`移行完了: ${total}件`);
      } catch (e) {
        console.error('移行エラー:', e);
      }
      setMigrating(false);
    })();
  }, [role]);

  // マイグレーション中
  if (migrating) {
    const pct = migrateProgress.total > 0
      ? Math.round((migrateProgress.done / migrateProgress.total) * 100)
      : 0;
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7', padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 24 }}>🔄</div>
        <div style={{ fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>データを移行中...</div>
        <div style={{ color: '#9ca3af', fontSize: 13, marginBottom: 24 }}>
          {migrateProgress.done} / {migrateProgress.total} 件
        </div>
        <div style={{ width: 280, height: 8, borderRadius: 4, background: '#e5e7eb' }}>
          <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#7c3aed,#db2777)', width: `${pct}%`, transition: 'width 0.3s' }} />
        </div>
        <div style={{ marginTop: 16, fontSize: 12, color: '#d1d5db' }}>このまましばらくお待ちください</div>
      </div>
    );
  }

  if (user === undefined || (user && role === undefined)) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7' }}>
      <div style={{ color: '#9ca3af', fontSize: 14 }}>読み込み中...</div>
    </div>
  );

  if (!user) return <AuthScreen />;
  if (role === 'pending' || role === null) return <PendingScreen />;
  return <App role={role} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
