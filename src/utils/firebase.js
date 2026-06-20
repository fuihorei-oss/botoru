import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'AIzaSyAlBpzSh2JdaN4HUwzrTEisYyLZed0Zsx8',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'botoru-87670.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'botoru-87670',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'botoru-87670.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID|| '1052878163655',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:1052878163655:web:453a46bc3c097da29ff8e2',
};

const app = initializeApp(firebaseConfig);
// オフライン永続キャッシュ（IndexedDB）を有効化。
// 再訪問時はコレクション全件を読み直さず、前回同期以降の差分だけサーバーから取得する
// （= 読み取り課金を大幅に削減）。全件をクライアントに保持するため検索・絞り込みは従来どおり。
// 環境によっては永続キャッシュの初期化が失敗しうるため、失敗時は従来のキャッシュへ
// フォールバックし、アプリ自体が起動不能（白画面）になるのを防ぐ。
function createDb() {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    }, 'default');
  } catch (e) {
    console.warn('[firebase] 永続キャッシュの初期化に失敗。通常キャッシュで継続します:', e);
    return getFirestore(app, 'default');
  }
}
export const db = createDb();
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch(() => {});

export function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signUp(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function signOutUser() {
  return fbSignOut(auth);
}

export function onAuth(callback) {
  return onAuthStateChanged(auth, callback);
}
