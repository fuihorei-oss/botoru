import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useRegisterSW } from 'virtual:pwa-register/react';
import './index.css';
import App from './App.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import PendingScreen from './components/PendingScreen.jsx';
import StorePicker from './components/StorePicker.jsx';
import { onAuth } from './utils/firebase.js';
import { subscribeUserData } from './utils/firestore.js';
import { getSavedStore, saveStore } from './utils/stores.js';

function UpdateBanner() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'linear-gradient(135deg, #7c3aed, #db2777)',
      color: '#fff', padding: '12px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontSize: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    }}>
      <span>🆕 アップデートがあります</span>
      <button onClick={() => updateServiceWorker(true)} style={{
        background: '#fff', color: '#7c3aed', border: 'none',
        borderRadius: 8, padding: '6px 16px', fontWeight: 'bold',
        cursor: 'pointer', fontSize: 13,
      }}>
        今すぐ更新
      </button>
    </div>
  );
}

function Root() {
  const [user, setUser] = useState(undefined);
  const [role, setRole] = useState(undefined);
  const [userName, setUserName] = useState('');
  const [store, setStore] = useState(getSavedStore());

  const chooseStore = (id) => { saveStore(id); setStore(id); };

  useEffect(() => onAuth(u => {
    setUser(u);
    if (!u) { setRole(null); setUserName(''); }
  }), []);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => setRole(r => r === undefined ? null : r), 10000);
    const unsub = subscribeUserData(user.uid, ({ role, name }) => {
      clearTimeout(timer);
      setRole(role);
      setUserName(name);
    });
    return () => { clearTimeout(timer); unsub(); };
  }, [user]);

  if (user === undefined || (user && role === undefined)) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7' }}>
      <div style={{ color: '#9ca3af', fontSize: 14 }}>読み込み中...</div>
    </div>
  );

  if (!user) return <AuthScreen />;
  if (role === 'pending' || role === null) return <PendingScreen />;
  if (!store) return <StorePicker onSelect={chooseStore} userName={userName} />;
  return (
    <>
      <UpdateBanner />
      <App
        key={store}
        store={store}
        role={role}
        userName={userName}
        onChangeStore={() => setStore(null)}
      />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
