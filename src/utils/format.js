export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function getDateOffset(daysOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatTanggalIndo(dateStr, includeDay = true) {
  if (!dateStr) return '-';
  const [year, month, day] = String(dateStr).split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(
    'id-ID',
    includeDay
      ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
      : { day: 'numeric', month: 'short', year: 'numeric' }
  );
}

export function getSplitTitle(pkg = {}) {
  if (pkg.titleLine1 && pkg.titleLine2) {
    return { line1: pkg.titleLine1, line2: pkg.titleLine2 };
  }
  const words = (pkg.name || 'SAJIAN NUSANTARA').toUpperCase().split(' ').filter(Boolean);
  if (words.length <= 1) return { line1: 'PAKET SPESIAL', line2: words[0] || 'NUSANTARA' };
  const half = Math.ceil(words.length / 2);
  return { line1: words.slice(0, half).join(' '), line2: words.slice(half).join(' ') };
}

export function normalizeDigits(value = '') {
  return String(value).replace(/\D/g, '');
}

export function phonesMatch(a, b) {
  const d1 = normalizeDigits(a);
  const d2 = normalizeDigits(b);
  if (!d1 || !d2 || d2.length < 4) return false;
  return d1 === d2 || d1.endsWith(d2) || d2.endsWith(d1) || d1.slice(-6) === d2.slice(-6);
}

export function hexToRgbTriplet(hex = '#064E3B') {
  const clean = String(hex).replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return '6 78 59';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export function copyTextSafe(text) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  } catch {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
  }
}
