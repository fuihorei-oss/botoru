import { db, auth } from './firebase';
import {
  collection, doc, setDoc, deleteDoc, onSnapshot,
  updateDoc, getDoc, addDoc, writeBatch, getDocs,
} from 'firebase/firestore';

// ── ログ ─────────────────────────────────────────────────────────────

async function writeLog(action, detail = {}) {
  try {
    await addDoc(collection(db, 'logs'), {
      action,
      ...detail,
      at: Date.now(),
      by: auth.currentUser?.uid || 'unknown',
    });
  } catch { }
}

// IDにスラッシュが含まれると Firestore のパスが壊れるため置換する
function safeId(id) {
  return (id || '').replace(/\//g, '_');
}

// ── ボトル ────────────────────────────────────────────────────────────

export function subscribeBottles(callback, onError) {
  return onSnapshot(
    collection(db, 'bottles'),
    snapshot => callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => { if (onError) onError(err); }
  );
}

export function subscribeCasts(callback) {
  return onSnapshot(
    doc(db, 'config', 'casts'),
    snapshot => callback(snapshot.exists() ? (snapshot.data().list || []) : []),
    () => callback([])
  );
}

export async function upsertBottle(bottle) {
  const { id, ...data } = bottle;
  await setDoc(doc(db, 'bottles', safeId(id)), data);
  await writeLog('upsert_bottle', { name: data.name || '' });
}

export async function deleteBottle(id) {
  await deleteDoc(doc(db, 'bottles', safeId(id)));
  await writeLog('delete_bottle');
}

export async function batchUpsertBottles(bottles) {
  const CHUNK = 450;
  for (let i = 0; i < bottles.length; i += CHUNK) {
    const batch = writeBatch(db);
    bottles.slice(i, i + CHUNK).forEach(({ id, ...data }) => {
      batch.set(doc(db, 'bottles', safeId(id)), data);
    });
    await batch.commit();
  }
  await writeLog('batch_upsert_bottles', { count: bottles.length });
}

export async function batchDeleteBottles(bottles) {
  const CHUNK = 450;
  for (let i = 0; i < bottles.length; i += CHUNK) {
    const batch = writeBatch(db);
    bottles.slice(i, i + CHUNK).forEach(({ id }) => {
      batch.delete(doc(db, 'bottles', safeId(id)));
    });
    await batch.commit();
  }
  await writeLog('batch_delete_bottles', { count: bottles.length });
}

export async function updateCasts(names) {
  await setDoc(doc(db, 'config', 'casts'), { list: names });
  await writeLog('update_casts', { count: names.length });
}

// ── LocalStorage マイグレーション ─────────────────────────────────────

export async function migrateFromLocalStorage(onProgress) {
  const metaSnap = await getDoc(doc(db, 'config', 'migrated'));
  if (metaSnap.exists() && metaSnap.data().value === true) return false;

  const localBottles = JSON.parse(localStorage.getItem('cabaret_bottles') || '[]');
  const localCasts   = JSON.parse(localStorage.getItem('cabaret_casts')   || '[]');

  if (localBottles.length === 0 && localCasts.length === 0) {
    await setDoc(doc(db, 'config', 'migrated'), { value: true });
    return false;
  }

  const CHUNK = 450;
  for (let i = 0; i < localBottles.length; i += CHUNK) {
    const batch = writeBatch(db);
    localBottles.slice(i, i + CHUNK).forEach(({ id, ...data }) => {
      batch.set(doc(db, 'bottles', safeId(id)), data);
    });
    await batch.commit();
    if (onProgress) onProgress(Math.min(i + CHUNK, localBottles.length), localBottles.length);
  }

  await setDoc(doc(db, 'config', 'casts'), { list: localCasts });
  await setDoc(doc(db, 'config', 'migrated'), { value: true });
  localStorage.removeItem('cabaret_bottles');
  localStorage.removeItem('cabaret_casts');
  return true;
}

// ── ユーザー管理 ──────────────────────────────────────────────────────

export async function createUser(uid, email, name) {
  await setDoc(doc(db, 'users', uid), {
    email,
    name: name || '',
    role: 'pending',
    createdAt: Date.now(),
  });
}

export async function getUserRole(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data().role : null;
}

export function subscribeUserRole(uid, callback) {
  return onSnapshot(
    doc(db, 'users', uid),
    snap => { callback(snap.exists() ? snap.data().role : null); },
    _err => { callback(null); }
  );
}

export function subscribeUserData(uid, callback) {
  return onSnapshot(
    doc(db, 'users', uid),
    snap => {
      if (snap.exists()) {
        const { role, name } = snap.data();
        callback({ role: role || null, name: name || '' });
      } else {
        callback({ role: null, name: '' });
      }
    },
    () => callback({ role: null, name: '' })
  );
}

export async function approveUser(uid) {
  await updateDoc(doc(db, 'users', uid), { role: 'staff' });
}

export async function revokeUser(uid) {
  await updateDoc(doc(db, 'users', uid), { role: 'pending' });
}

export function subscribeAllUsers(callback) {
  return onSnapshot(collection(db, 'users'), snap => {
    callback(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
  });
}
