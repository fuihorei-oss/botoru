import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import AuthScreen, { isAuthenticated } from './components/AuthScreen.jsx';
import { signInAnon } from './utils/firebase.js';

function Root() {
  const [authed, setAuthed]   = useState(() => isAuthenticated());
  const [ready, setReady]     = useState(false);

  useEffect(() => {
    signInAnon().finally(() => setReady(true));
  }, []);

  if (!ready) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d1a' }}>
      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>接続中...</div>
    </div>
  );

  if (!authed) return <AuthScreen onAuth={() => setAuthed(true)} />;
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
