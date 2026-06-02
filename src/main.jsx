import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import { onAuth } from './utils/firebase.js';

function Root() {
  const [user, setUser] = useState(undefined); // undefined = 確認中

  useEffect(() => onAuth(setUser), []);

  // 認証確認中でも、以前のスナップショットがあればAppを先に描画する
  // （Firebase RTDBは内部でauth tokenを待つため安全）
  const hasSnapshot = !!localStorage.getItem('botoru_snapshot');

  if (user === null) return <AuthScreen />;
  if (user === undefined && !hasSnapshot) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7' }}>
      <div style={{ color: '#9ca3af', fontSize: 14 }}>読み込み中...</div>
    </div>
  );
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
