import { db, auth } from './firebase';
import { ref, set, remove, onValue, update, get, push } from 'firebase/database';

async function writeLog(action, detail = {}) {
  try {
    await push(ref(db, 'logs'), {
      action,
      ...detail,
      at: Date.now(),
      by: auth.currentUser?.uid || 'unknown',
    });
  } catch {
    // ログ記録の失敗で本処理を止めない
  }
}

export function subscribeBottles(callback) {
  return onValue(ref(db, 'bottles'), snapshot => {
    const data = snapshot.val() || {};
    callback(Object.entries(data).map(([id, b]) => ({ id, ...b })));
  });
}

export function subscribeCasts(callback) {
  return onValue(ref(db, 'config/casts'), snapshot => {
    callback(snapshot.val() || []);
  });
}

export async function upsertBottle(bottle) {
  const { id, ...data } = bottle;
  await set(ref(db, `bottles/${id}`), data);
  await writeLog('upsert_bottle', { name: data.name || '' });
}

export async function deleteBottle(id) {
  await remove(ref(db, `bottles/${id}`));
  await writeLog('delete_bottle');
}

export async function batchUpsertBottles(bottles) {
  const updates = {};
  bottles.forEach(({ id, ...data }) => { updates[`bottles/${id}`] = data; });
  await update(ref(db), updates);
  await writeLog('batch_upsert_bottles', { count: bottles.length });
}

export async function batchDeleteBottles(bottles) {
  const updates = {};
  bottles.forEach(({ id }) => { updates[`bottles/${id}`] = null; });
  await update(ref(db), updates);
  await writeLog('batch_delete_bottles', { count: bottles.length });
}

export async function updateCasts(names) {
  await set(ref(db, 'config/casts'), names);
  await writeLog('update_casts', { count: names.length });
}

export async function migrateFromLocalStorage(onProgress) {
  const metaSnap = await get(ref(db, 'config/migrated'));
  if (metaSnap.val() === true) return false;

  const localBottles = JSON.parse(localStorage.getItem('cabaret_bottles') || '[]');
  const localCasts   = JSON.parse(localStorage.getItem('cabaret_casts')   || '[]');

  if (localBottles.length === 0 && localCasts.length === 0) {
    await set(ref(db, 'config/migrated'), true);
    return false;
  }

  const CHUNK = 200;
  for (let i = 0; i < localBottles.length; i += CHUNK) {
    const updates = {};
    localBottles.slice(i, i + CHUNK).forEach(({ id, ...data }) => {
      updates[`bottles/${id}`] = data;
    });
    await update(ref(db), updates);
    if (onProgress) onProgress(Math.min(i + CHUNK, localBottles.length), localBottles.length);
  }

  await set(ref(db, 'config/casts'), localCasts);
  await set(ref(db, 'config/migrated'), true);

  localStorage.removeItem('cabaret_bottles');
  localStorage.removeItem('cabaret_casts');
  return true;
}
