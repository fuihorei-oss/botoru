import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import AuthScreen, { isAuthenticated } from './components/AuthScreen.jsx';
import { signInAnon } from './utils/firebase.js';

function ErrorScreen({ error }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0d0d1a', padding: 24 }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
      <div style={{ color: 'white', fontWeight: 'bold', marginBottom: 8 }}>接続エラー</div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', maxWidth: 300, wordBreak: 'break-all' }}>
        {String(error)}
      </div>
    </div>
  );
}

function Root() {
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [ready, setReady]   = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => {
    signInAnon()
      .catch(err => setError(err))
      .finally(() => setReady(true));
  }, []);

  if (error) return <ErrorScreen error={error.message || error} />;

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
