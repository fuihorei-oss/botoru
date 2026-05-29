import { db } from './firebase';
import {
  collection, doc, onSnapshot,
  setDoc, deleteDoc, getDoc, writeBatch,
} from 'firebase/firestore';

export function subscribeBottles(callback) {
  return onSnapshot(collection(db, 'bottles'), snapshot => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export function subscribeCasts(callback) {
  return onSnapshot(doc(db, 'config', 'casts'), snap => {
    callback(snap.exists() ? (snap.data().names || []) : []);
  });
}

export async function upsertBottle(bottle) {
  const { id, ...data } = bottle;
  await setDoc(doc(db, 'bottles', id), data);
}

export async function deleteBottle(id) {
  await deleteDoc(doc(db, 'bottles', id));
}

async function runBatch(items, fn) {
  const CHUNK = 499;
  for (let i = 0; i < items.length; i += CHUNK) {
    const batch = writeBatch(db);
    items.slice(i, i + CHUNK).forEach(item => fn(batch, item));
    await batch.commit();
  }
}

export async function batchUpsertBottles(bottles) {
  await runBatch(bottles, (batch, bottle) => {
    const { id, ...data } = bottle;
    batch.set(doc(db, 'bottles', id), data);
  });
}

export async function batchDeleteBottles(bottles) {
  await runBatch(bottles, (batch, bottle) => {
    batch.delete(doc(db, 'bottles', bottle.id));
  });
}

export async function updateCasts(names) {
  await setDoc(doc(db, 'config', 'casts'), { names });
}

export async function migrateFromLocalStorage(onProgress) {
  const metaRef = doc(db, 'config', 'meta');
  const metaSnap = await getDoc(metaRef);
  if (metaSnap.exists() && metaSnap.data().migrated) return false;

  const localBottles = JSON.parse(localStorage.getItem('cabaret_bottles') || '[]');
  const localCasts   = JSON.parse(localStorage.getItem('cabaret_casts')   || '[]');

  if (localBottles.length === 0 && localCasts.length === 0) {
    await setDoc(metaRef, { migrated: true });
    return false;
  }

  const CHUNK = 499;
  let done = 0;
  for (let i = 0; i < localBottles.length; i += CHUNK) {
    const batch = writeBatch(db);
    localBottles.slice(i, i + CHUNK).forEach(bottle => {
      const { id, ...data } = bottle;
      batch.set(doc(db, 'bottles', id), data);
    });
    await batch.commit();
    done += Math.min(CHUNK, localBottles.length - i);
    if (onProgress) onProgress(done, localBottles.length);
  }

  await setDoc(doc(db, 'config', 'casts'), { names: localCasts });
  await setDoc(metaRef, { migrated: true });

  localStorage.removeItem('cabaret_bottles');
  localStorage.removeItem('cabaret_casts');
  return true;
}
