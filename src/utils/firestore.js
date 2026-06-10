import { db, rtdb, auth } from './firebase';
import {
  collection, doc, setDoc, deleteDoc, onSnapshot,
  updateDoc, getDoc, addDoc, writeBatch, getDocs,
} from 'firebase/firestore';
import { ref, get as rtdbGet, onValue as rtdbOnValue } from 'firebase/database';

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
  await setDoc(doc(db, 'bottles', id), data);
  await writeLog('upsert_bottle', { name: data.name || '' });
}

export async function deleteBottle(id) {
  await deleteDoc(doc(db, 'bottles', id));
  await writeLog('delete_bottle');
}

export async function batchUpsertBottles(bottles) {
  const CHUNK = 450;
  for (let i = 0; i < bottles.length; i += CHUNK) {
    const batch = writeBatch(db);
    bottles.slice(i, i + CHUNK).forEach(({ id, ...data }) => {
      batch.set(doc(db, 'bottles', id), data);
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
      batch.delete(doc(db, 'bottles', id));
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
      batch.set(doc(db, 'bottles', id), data);
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

// ── Realtime DB → Firestore マイグレーション ──────────────────────────

export async function checkRtdbMigrationNeeded() {
  const snap = await getDoc(doc(db, 'config', 'rtdb_migrated'));
  return !snap.exists();
}

export async function migrateFromRealtimeDB(onProgress) {
  const snapshot = await rtdbGet(ref(rtdb, '/'));
  const data = snapshot.val();
  if (!data) {
    await setDoc(doc(db, 'config', 'rtdb_migrated'), { value: true, at: Date.now() });
    return 0;
  }

  const bottles = data.bottles ? Object.entries(data.bottles) : [];
  const total = bottles.length;
  const CHUNK = 450;

  // ボトル移行
  for (let i = 0; i < bottles.length; i += CHUNK) {
    const batch = writeBatch(db);
    bottles.slice(i, i + CHUNK).forEach(([id, bottle]) => {
      batch.set(doc(db, 'bottles', id), bottle);
    });
    await batch.commit();
    if (onProgress) onProgress(Math.min(i + CHUNK, total), total);
  }

  // キャスト移行
  if (data.config?.casts) {
    const casts = Array.isArray(data.config.casts)
      ? data.config.casts
      : Object.values(data.config.casts);
    await setDoc(doc(db, 'config', 'casts'), { list: casts.filter(Boolean) });
  }

  // ユーザー移行
  if (data.users) {
    const batch = writeBatch(db);
    Object.entries(data.users).forEach(([uid, user]) => {
      batch.set(doc(db, 'users', uid), user);
    });
    await batch.commit();
  }

  // 移行完了フラグ
  await setDoc(doc(db, 'config', 'rtdb_migrated'), { value: true, at: Date.now() });

  return total;
}

// ── ユーザー管理 ──────────────────────────────────────────────────────

export async function createUser(uid, email) {
  await setDoc(doc(db, 'users', uid), {
    email,
    role: 'pending',
    createdAt: Date.now(),
  });
}

export async function getUserRole(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data().role : null;
}

export function subscribeUserRole(uid, callback) {
  return onSnapshot(doc(db, 'users', uid), snap => {
    if (snap.exists()) {
      callback(snap.data().role);
    } else {
      // Firestoreにユーザーがいない場合はRTDBを参照（移行前の管理者対応）
      rtdbOnValue(ref(rtdb, `users/${uid}/role`), s => callback(s.val()), { onlyOnce: true });
    }
  });
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