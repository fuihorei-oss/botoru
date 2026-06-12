import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
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
export const db   = getFirestore(app, 'default');
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
