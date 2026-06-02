import { generateId } from './storage';

// 引用符・カンマ・改行を含むCSVを正しく解析する
export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\r') {
      // 無視
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// "2025.10.11" / "2025-10-11" / "2025/10/11" → "2025-10-11"。不正なら空
function normalizeDate(s) {
  const m = (s || '').trim().match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
  if (!m) return '';
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

function splitCasts(s) {
  return (s || '')
    .split(/[,、，/]/)
    .map(x => x.trim())
    .filter(Boolean);
}

// ボトル管理テーブルのCSVをアプリのデータ形式に変換する
export function csvToBottles(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) return { bottles: [], casts: [] };

  const header = rows[0].map(h => h.trim());
  const idx = name => header.indexOf(name);
  const col = {
    name:        idx('ボトル'),
    keepName:    idx('ネーム'),
    amount:      idx('残量'),
    physical:    idx('現物保管'),
    unopened:    idx('未開封'),
    cast:        idx('指名 (from ネーム)'),
    note:        idx('備考'),
  };

  const clean = v => {
    let s = (v || '').trim();
    if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
    return s.replace(/""/g, '"').trim();
  };
  const get = (row, i) => (i >= 0 && i < row.length ? clean(row[i]) : '');
  const bottles = [];
  const castSet = new Set();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const name = get(row, col.name);
    if (!name) continue; // 銘柄が無い行はスキップ

    const castName = splitCasts(get(row, col.cast));
    castName.forEach(c => castSet.add(c));

    const rawNote = get(row, col.note);
    const purchaseDate = normalizeDate(rawNote);
    // 日付として解釈できない備考はメモに残す
    const notes = purchaseDate ? '' : rawNote;

    const amountNum = parseFloat(get(row, col.amount));

    bottles.push({
      id: generateId(),
      name,
      keepName: get(row, col.keepName),
      remainingAmount: Number.isFinite(amountNum) ? amountNum : 30,
      remainingUnit: 'cm',
      isPhysical: !!get(row, col.physical),
      isUnopened: !!get(row, col.unopened),
      customerName: '',
      castName,
      notes,
      purchaseDate,
      updatedAt: Date.now(),
    });
  }

  return { bottles, casts: [...castSet] };
}

// 複数のCSV（部分エクスポート）を統合し、重複を除いて1つにまとめる
export function mergeBottleCsvs(texts) {
  const seen = new Set();
  const bottles = [];
  const castSet = new Set();
  for (const text of texts) {
    const res = csvToBottles(text);
    res.casts.forEach(c => castSet.add(c));
    for (const b of res.bottles) {
      const key = `${b.name}|${b.keepName}|${b.purchaseDate}|${b.remainingAmount}`;
      if (seen.has(key)) continue;
      seen.add(key);
      bottles.push(b);
    }
  }
  return { bottles, casts: [...castSet] };
}
