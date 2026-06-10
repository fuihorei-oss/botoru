import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import PendingScreen from './components/PendingScreen.jsx';
import { onAuth } from './utils/firebase.js';
import { subscribeUserRole } from './utils/firestore.js';

function Root() {
  const [user, setUser] = useState(undefined); // undefined = 確認中
  const [role, setRole] = useState(undefined); // undefined = 確認中

  useEffect(() => onAuth(u => {
    setUser(u);
    if (!u) setRole(null);
  }), []);

  useEffect(() => {
    if (!user) return;
    return subscribeUserRole(user.uid, r => setRole(r));
  }, [user]);

  // ロード中
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
