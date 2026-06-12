import { db, auth } from './firebase';
import {
  collection, doc, setDoc, deleteDoc, onSnapshot,
  updateDoc, getDoc, addDoc, writeBatch, getDocs,
} from 'firebase/firestore';
import { DEFAULT_STORE } from './stores';

// ── 現在の店舗 ────────────────────────────────────────────────────────
// ボトル・キャスト・設定は店舗ごとに stores/{storeId}/... 配下に保存する。
// （users は店舗共通のためトップレベルのまま）
let currentStore = DEFAULT_STORE;
export function setStore(storeId) { if (storeId) currentStore = storeId; }
export function getStore() { return currentStore; }

const bottlesCol = (s = currentStore) => collection(db, 'stores', s, 'bottles');
const bottleDoc  = (id, s = currentStore) => doc(db, 'stores', s, 'bottles', safeId(id));
const castsDoc   = (s = currentStore) => doc(db, 'stores', s, 'config', 'casts');

// ── ログ ─────────────────────────────────────────────────────────────

async function writeLog(action, detail = {}) {
  try {
    await addDoc(collection(db, 'logs'), {
      action,
      store: currentStore,
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
    bottlesCol(),
    snapshot => callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => { if (onError) onError(err); }
  );
}

export function subscribeCasts(callback) {
  return onSnapshot(
    castsDoc(),
    snapshot => callback(snapshot.exists() ? (snapshot.data().list || []) : []),
    () => callback([])
  );
}

export async function upsertBottle(bottle) {
  const { id, ...data } = bottle;
  await setDoc(bottleDoc(id), data);
  await writeLog('upsert_bottle', { name: data.name || '' });
}

export async function deleteBottle(id) {
  await deleteDoc(bottleDoc(id));
  await writeLog('delete_bottle');
}

export async function batchUpsertBottles(bottles) {
  const CHUNK = 450;
  for (let i = 0; i < bottles.length; i += CHUNK) {
    const batch = writeBatch(db);
    bottles.slice(i, i + CHUNK).forEach(({ id, ...data }) => {
      batch.set(bottleDoc(id), data);
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
      batch.delete(bottleDoc(id));
    });
    await batch.commit();
  }
  await writeLog('batch_delete_bottles', { count: bottles.length });
}

export async function updateCasts(names) {
  await setDoc(castsDoc(), { list: names });
  await writeLog('update_casts', { count: names.length });
}

// ── 店舗データの移行 ──────────────────────────────────────────────────
// 旧構成（トップレベルの bottles / config/casts）を stores/{storeId} 配下へ
// 一度だけ引き継ぐ。既存データは Virgo に属するものとして移行する。
// 戻り値: 移行を実行したら true、不要なら false。
export async function ensureStoreMigrated(storeId, onProgress) {
  const flagRef = doc(db, 'stores', storeId, 'config', '_migrated');
  const flag = await getDoc(flagRef);
  if (flag.exists() && flag.data().value === true) return false;

  // 既存のトップレベルデータは Virgo にのみ引き継ぐ
  if (storeId === 'virgo') {
    const [bottlesSnap, castsSnap] = await Promise.all([
      getDocs(collection(db, 'bottles')),
      getDoc(doc(db, 'config', 'casts')),
    ]);
    const docs = bottlesSnap.docs;
    if (onProgress) onProgress(0, docs.length);

    const CHUNK = 450;
    for (let i = 0; i < docs.length; i += CHUNK) {
      const batch = writeBatch(db);
      docs.slice(i, i + CHUNK).forEach(d => {
        batch.set(doc(db, 'stores', storeId, 'bottles', d.id), d.data());
      });
      await batch.commit();
      if (onProgress) onProgress(Math.min(i + CHUNK, docs.length), docs.length);
    }
    if (castsSnap.exists()) {
      await setDoc(castsDoc(storeId), { list: castsSnap.data().list || [] });
    }
  }

  await setDoc(flagRef, { value: true, at: Date.now() });
  return true;
}

// ── ユーザー管理（店舗共通） ──────────────────────────────────────────

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
