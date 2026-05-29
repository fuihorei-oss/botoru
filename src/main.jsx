import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AuthScreen, { isAuthenticated } from './components/AuthScreen.jsx'

function Root() {
  const [authed, setAuthed] = useState(() => isAuthenticated());
  if (!authed) return <AuthScreen onAuth={() => setAuthed(true)} />;
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
