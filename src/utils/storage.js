const STORAGE_KEY = 'cabaret_bottles';
const CAST_STORAGE_KEY = 'cabaret_casts';

export function loadBottles() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveBottles(bottles) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bottles));
}

export function loadCasts() {
  try {
    const data = localStorage.getItem(CAST_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCasts(casts) {
  localStorage.setItem(CAST_STORAGE_KEY, JSON.stringify(casts));
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
