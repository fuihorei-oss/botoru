const CAST_COLORS = [
  '#f472b6', '#a78bfa', '#34d399', '#60a5fa',
  '#fbbf24', '#f87171', '#fb923c', '#2dd4bf',
  '#e879f9', '#a3e635',
];

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function castColor(name) {
  if (!name) return 'rgba(255,255,255,0.5)';
  return CAST_COLORS[hashStr(name) % CAST_COLORS.length];
}
