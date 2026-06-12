// 店舗の定義。データは Firestore の stores/{id}/... 配下に店舗ごとに分離される。
export const STORES = [
  { id: 'virgo',  name: 'Virgo'  },
  { id: 'regina', name: 'Regina' },
];

export const DEFAULT_STORE = 'virgo';
const STORAGE_KEY = 'botoru_store';

export function isValidStore(id) {
  return STORES.some(s => s.id === id);
}

export function storeName(id) {
  return STORES.find(s => s.id === id)?.name || id;
}

// 最後に開いていた店舗を記憶する（次回ログイン時の初期選択に使う）
export function getSavedStore() {
  const id = localStorage.getItem(STORAGE_KEY);
  return isValidStore(id) ? id : null;
}

export function saveStore(id) {
  if (isValidStore(id)) localStorage.setItem(STORAGE_KEY, id);
}
