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

// ネーム "お客さん名/番号/指名キャスト" を分解する。
// 3区画なら末尾を指名として取り出し、ネック名（客/番号）と分ける。
// 戻り値の extraCasts は、指名列が空の行を補うためのキャスト。
function deriveNeck(neckRaw, castNames) {
  const s = (neckRaw || '').trim();
  if (!s) return { customerName: '', keepName: '', extraCasts: [] };
  const parts = s.split('/').map(p => p.trim());
  const customerName = parts.length >= 2 ? parts[0] : '';

  // 3区画以上: 末尾は指名キャスト
  if (parts.length >= 3) {
    return {
      customerName,
      keepName: parts.slice(0, -1).join('/'),
      extraCasts: parts[parts.length - 1].split(/[,、，]/).map(x => x.trim()).filter(Boolean),
    };
  }

  // 2区画: 末尾が指名列と一致するときだけ指名として取り除く
  if (parts.length === 2 && castNames.length) {
    const lastCasts = parts[1].split(/[,、，]/).map(x => x.trim()).filter(Boolean);
    if (lastCasts.length && lastCasts.every(c => castNames.includes(c))) {
      return { customerName, keepName: parts[0], extraCasts: [] };
    }
  }

  return { customerName, keepName: s, extraCasts: [] };
}

// ボトル管理テーブルのCSVをアプリのデータ形式に変換する
export function csvToBottles(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) return { bottles: [], casts: [] };

  const header = rows[0].map(h => h.trim());
  const idx = name => header.indexOf(name);
  // 最初に見つかった候補列のインデックスを返す（Airtableの列名ゆれに対応）
  const idxAny = (...names) => {
    for (const n of names) { const i = idx(n); if (i >= 0) return i; }
    return -1;
  };
  const col = {
    name:        idxAny('ボトル', '銘柄'),
    keepName:    idxAny('ネーム', 'P-Key (from ネーム)'),
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

    const colCasts = splitCasts(get(row, col.cast));
    const { customerName, keepName, extraCasts } = deriveNeck(get(row, col.keepName), colCasts);
    const castName = [...new Set([...colCasts, ...extraCasts])];
    castName.forEach(c => castSet.add(c));

    const rawNote = get(row, col.note);
    const purchaseDate = normalizeDate(rawNote);
    // 日付として解釈できない備考はメモに残す
    const notes = purchaseDate ? '' : rawNote;

    const amountNum = parseFloat(get(row, col.amount));

    bottles.push({
      id: generateId(),
      name,
      keepName,
      remainingAmount: Number.isFinite(amountNum) ? amountNum : null,
      remainingUnit: 'cm',
      isPhysical: !!get(row, col.physical),
      isUnopened: !!get(row, col.unopened),
      customerName,
      castName,
      notes,
      purchaseDate,
      updatedAt: Date.now(),
    });
  }

  return { bottles, casts: [...castSet] };
}

// AirtableのCSVから残量データだけを抽出する（既存ボトルへの補完用）
export function parseAmountsFromCsv(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];

  const header = rows[0].map(h => h.trim());
  const idxAny = (...names) => { for (const n of names) { const i = header.indexOf(n); if (i >= 0) return i; } return -1; };
  const clean = v => { let s = (v || '').trim(); if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1); return s.replace(/""/g, '"').trim(); };
  const get = (row, i) => (i >= 0 && i < row.length ? clean(row[i]) : '');

  const colName   = idxAny('ボトル', '銘柄');
  const colKeep   = idxAny('ネーム', 'P-Key (from ネーム)');
  const colAmount = idxAny('残量');
  const colCast   = idxAny('指名 (from ネーム)');

  if (colAmount < 0) return [];

  const results = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const name = get(row, colName);
    if (!name) continue;
    const amountNum = parseFloat(get(row, colAmount));
    if (!Number.isFinite(amountNum)) continue;
    const colCasts = splitCasts(get(row, colCast));
    const { keepName } = deriveNeck(get(row, colKeep), colCasts);
    results.push({ name, keepName, remainingAmount: amountNum, remainingUnit: 'cm' });
  }
  return results;
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
