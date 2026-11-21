// ============================================================================
// SISTEM PENCATATAN & REKAPITULASI BIAYA PENDIDIKAN
// INSTANSI : PONPES SIT AL FIRDAUS BANDARLAMPUNG (SMPIT / SMAIT AL FIRDAUS)
// BENDAHARA: RESTASARI, S.Sos
// ============================================================================

const STORAGE_KEY_STUDENTS = 'alfirdaus_students_v1';
const STORAGE_KEY_TX = 'alfirdaus_transactions_v1';
const STORAGE_KEY_AUTH = 'alfirdaus_bendahara_auth_v1';
const STORAGE_KEY_SESSION = 'alfirdaus_bendahara_session_v1';
const STORAGE_KEY_THEME = 'alfirdaus_logo_theme_v1';

// Link resmi logo Google Drive Ponpes SIT Al Firdaus Bandarlampung
const DRIVE_FILE_ID = '1JCOo87mW-OXolzXoOPYp-V7z5Ya2IDD_';
const LOGO_URLS = [
  `https://lh3.googleusercontent.com/d/${DRIVE_FILE_ID}`,
  `https://drive.google.com/thumbnail?id=${DRIVE_FILE_ID}&sz=w500`,
  `https://drive.google.com/uc?export=view&id=${DRIVE_FILE_ID}`
];

// Kredensial Default Bendahara (Password disimpan terenkripsi SHA-256)
const DEFAULT_USERNAME = 'bendahara';
const DEFAULT_PASSWORD_PLAINTEXT = 'alfirdaus2026';
const INSTITUTION_RECOVERY_PIN = '1652026';

const MONTH_ORDER = [
  'juli', 'agustus', 'september', 'oktober', 'november', 'desember',
  'januari', 'februari', 'maret', 'april', 'mei', 'juni'
];

let students = [];
let transactions = [];

// Data awal contoh (mencakup santri lintas semester agar fitur Kartu Induk langsung terlihat)
const INITIAL_SAMPLE_DATA = [
  {
    id: 'st-1',
    sheet: '7 smt 1',
    unit: 'SMPIT Al Firdaus',
    tahunAjaran: '2026-2027',
    nama: 'Alya Mukbita',
    wa: '',
    sppDasar: 850000,
    fees: [
      { label: 'U. Pangkal', amount: 1950000, type: 'fixed', monthKey: null },
      { label: 'Juli', amount: 0, type: 'monthly', monthKey: 'juli' },
      { label: 'Agustus', amount: 0, type: 'monthly', monthKey: 'agustus' },
      { label: 'September', amount: 0, type: 'monthly', monthKey: 'september' },
      { label: 'Oktober', amount: 850000, type: 'monthly', monthKey: 'oktober' },
      { label: 'November', amount: 850000, type: 'monthly', monthKey: 'november' },
      { label: 'Desember', amount: 850000, type: 'monthly', monthKey: 'desember' }
    ]
  },
  {
    id: 'st-1b',
    sheet: '7 smt 2',
    unit: 'SMPIT Al Firdaus',
    tahunAjaran: '2026-2027',
    nama: 'Alya Mukbita',
    wa: '',
    sppDasar: 850000,
    fees: [
      { label: 'smt 1 + U. Pangkal', amount: 2800000, type: 'fixed', monthKey: null },
      { label: 'Januari', amount: 850000, type: 'monthly', monthKey: 'januari' },
      { label: 'Februari', amount: 850000, type: 'monthly', monthKey: 'februari' },
      { label: 'Maret', amount: 850000, type: 'monthly', monthKey: 'maret' },
      { label: 'April', amount: 850000, type: 'monthly', monthKey: 'april' },
      { label: 'Mei', amount: 850000, type: 'monthly', monthKey: 'mei' },
      { label: 'Juni', amount: 850000, type: 'monthly', monthKey: 'juni' }
    ]
  },
  {
    id: 'st-2',
    sheet: '7 smt 1',
    unit: 'SMPIT Al Firdaus',
    tahunAjaran: '2026-2027',
    nama: 'Alya Sahira',
    wa: '',
    sppDasar: 850000,
    fees: [
      { label: 'U. Pangkal', amount: 2750000, type: 'fixed', monthKey: null },
      { label: 'Juli', amount: 0, type: 'monthly', monthKey: 'juli' },
      { label: 'Agustus', amount: 0, type: 'monthly', monthKey: 'agustus' },
      { label: 'September', amount: 0, type: 'monthly', monthKey: 'september' },
      { label: 'Oktober', amount: 885000, type: 'monthly', monthKey: 'oktober' },
      { label: 'November', amount: 850000, type: 'monthly', monthKey: 'november' },
      { label: 'Desember', amount: 850000, type: 'monthly', monthKey: 'desember' }
    ]
  },
  {
    id: 'st-3',
    sheet: 'KELAS 10',
    unit: 'SMAIT Al Firdaus',
    tahunAjaran: '2026-2027',
    nama: 'Habiburrahman Pasha',
    wa: '',
    sppDasar: 680000,
    fees: [
      { label: 'U. Pangkal', amount: 3500000, type: 'fixed', monthKey: null },
      { label: 'Juli', amount: 680000, type: 'monthly', monthKey: 'juli' },
      { label: 'Agustus', amount: 750000, type: 'monthly', monthKey: 'agustus' },
      { label: 'September', amount: 750000, type: 'monthly', monthKey: 'september' },
      { label: 'Oktober', amount: 750000, type: 'monthly', monthKey: 'oktober' },
      { label: 'November', amount: 750000, type: 'monthly', monthKey: 'november' },
      { label: 'Desember', amount: 750000, type: 'monthly', monthKey: 'desember' }
    ]
  },
  {
    id: 'st-4',
    sheet: 'KELAS 10',
    unit: 'SMAIT Al Firdaus',
    tahunAjaran: '2026-2027',
    nama: 'Amalia Ayu Pertiwi',
    wa: '',
    sppDasar: 900000,
    fees: [
      { label: 'U. Pangkal', amount: 0, type: 'fixed', monthKey: null },
      { label: 'Juli', amount: 0, type: 'monthly', monthKey: 'juli' },
      { label: 'Agustus', amount: 0, type: 'monthly', monthKey: 'agustus' },
      { label: 'September', amount: 0, type: 'monthly', monthKey: 'september' },
      { label: 'Oktober', amount: 0, type: 'monthly', monthKey: 'oktober' },
      { label: 'November', amount: 0, type: 'monthly', monthKey: 'november' },
      { label: 'Desember', amount: 0, type: 'monthly', monthKey: 'desember' }
    ]
  },
  {
    id: 'st-5',
    sheet: '12 smt 1',
    unit: 'SMAIT Al Firdaus',
    tahunAjaran: '2026-2027',
    nama: 'Cahaya Aprilia',
    wa: '',
    sppDasar: 500000,
    fees: [
      { label: 'Uang Pangkal', amount: 4400000, type: 'fixed', monthKey: null },
      { label: 'SPP Kelas X', amount: 5100000, type: 'fixed', monthKey: null },
      { label: 'DU Kelas XI', amount: 900000, type: 'fixed', monthKey: null },
      { label: 'SPP Kelas XI', amount: 6000000, type: 'fixed', monthKey: null },
      { label: 'DU Kelas XII', amount: 1000000, type: 'fixed', monthKey: null },
      { label: 'Juli', amount: 500000, type: 'monthly', monthKey: 'juli' },
      { label: 'Agustus', amount: 600000, type: 'monthly', monthKey: 'agustus' },
      { label: 'September', amount: 600000, type: 'monthly', monthKey: 'september' },
      { label: 'Oktober', amount: 600000, type: 'monthly', monthKey: 'oktober' },
      { label: 'November', amount: 600000, type: 'monthly', monthKey: 'november' },
      { label: 'Desember', amount: 600000, type: 'monthly', monthKey: 'desember' }
    ]
  }
];

// ============================================================================
// LOGO FALLBACK & EKSTRAKSI PALET WARNA OTOMATIS DARI LOGO
// ============================================================================
function handleLogoFallback(imgEl) {
  const attempt = Number(imgEl.getAttribute('data-attempt') || '0') + 1;
  if (attempt < LOGO_URLS.length) {
    imgEl.setAttribute('data-attempt', String(attempt));
    imgEl.src = LOGO_URLS[attempt];
  }
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s, l };
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r1 = 0, g1 = 0, b1 = 0;
  if (h < 60) { r1 = c; g1 = x; }
  else if (h < 120) { r1 = x; g1 = c; }
  else if (h < 180) { g1 = c; b1 = x; }
  else if (h < 240) { g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; b1 = c; }
  else { r1 = c; b1 = x; }
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255)
  };
}

function extractAndApplyLogoTheme() {
  const probe = new Image();
  probe.crossOrigin = 'anonymous';
  let urlIndex = 0;

  probe.onload = function () {
    try {
      const canvas = document.createElement('canvas');
      const size = 80;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(probe, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      // Kelompokkan piksel berwarna ke dalam 12 sektor hue (30 derajat per sektor)
      const buckets = Array.from({ length: 12 }, () => ({
        weight: 0,
        rSum: 0,
        gSum: 0,
        bSum: 0
      }));

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 140) continue;
        // Abaikan latar putih & garis tepi hitam pekat
        if (r > 235 && g > 235 && b > 235) continue;
        if (r < 25 && g < 25 && b < 25) continue;

        const { h, s, l } = rgbToHsl(r, g, b);
        if (s < 0.22 || l < 0.08 || l > 0.92) continue;

        const idx = Math.floor(h / 30) % 12;
        const w = s * (1 - Math.abs(l - 0.45));
        buckets[idx].weight += w;
        buckets[idx].rSum += r * w;
        buckets[idx].gSum += g * w;
        buckets[idx].bSum += b * w;
      }

      const ranked = buckets
        .map((b, idx) => ({
          idx,
          weight: b.weight,
          r: b.weight > 0 ? b.rSum / b.weight : 0,
          g: b.weight > 0 ? b.gSum / b.weight : 0,
          b: b.weight > 0 ? b.bSum / b.weight : 0
        }))
        .filter((b) => b.weight > 0)
        .sort((a, b) => b.weight - a.weight);

      if (ranked.length === 0) return;

      const primaryRaw = ranked[0];
      const pHsl = rgbToHsl(primaryRaw.r, primaryRaw.g, primaryRaw.b);

      // Pastikan kontras teks putih di atas warna utama selalu tajam (lightness maks 0.34)
      const mainL = Math.min(0.34, Math.max(0.20, pHsl.l));
      const mainS = Math.min(0.85, Math.max(0.45, pHsl.s));

      const mainRgb = hslToRgb(pHsl.h, mainS, mainL);
      const darkRgb = hslToRgb(pHsl.h, mainS, Math.max(0.11, mainL - 0.11));
      const midRgb = hslToRgb(pHsl.h, mainS, Math.min(0.42, mainL + 0.07));
      const softRgb = hslToRgb(pHsl.h, Math.min(0.55, mainS * 0.7), 0.96);
      const borderRgb = hslToRgb(pHsl.h, Math.min(0.55, mainS * 0.75), 0.84);

      // Cari warna aksen kedua yang berbeda sektor hue minimal 2 langkah
      const secondaryRaw = ranked.find((b) => {
        const diff = Math.min(Math.abs(b.idx - primaryRaw.idx), 12 - Math.abs(b.idx - primaryRaw.idx));
        return diff >= 2;
      });

      let accentRgb, accentDarkRgb;
      if (secondaryRaw) {
        const sHsl = rgbToHsl(secondaryRaw.r, secondaryRaw.g, secondaryRaw.b);
        const accL = Math.min(0.55, Math.max(0.42, sHsl.l));
        const accS = Math.min(0.92, Math.max(0.60, sHsl.s));
        accentRgb = hslToRgb(sHsl.h, accS, accL);
        accentDarkRgb = hslToRgb(sHsl.h, accS, Math.max(0.32, accL - 0.09));
      } else {
        // Jika logo monokrom, gunakan aksen emas hangat yang harmonis
        accentRgb = { r: 234, g: 179, b: 8 };
        accentDarkRgb = { r: 202, g: 138, b: 4 };
      }

      const yiq = (accentRgb.r * 299 + accentRgb.g * 587 + accentRgb.b * 114) / 1000;
      const accentText = yiq >= 150 ? '#0f172a' : '#ffffff';

      const theme = {
        primary: rgbToHex(mainRgb.r, mainRgb.g, mainRgb.b),
        primaryDark: rgbToHex(darkRgb.r, darkRgb.g, darkRgb.b),
        primaryMid: rgbToHex(midRgb.r, midRgb.g, midRgb.b),
        primarySoft: rgbToHex(softRgb.r, softRgb.g, softRgb.b),
        primaryBorder: rgbToHex(borderRgb.r, borderRgb.g, borderRgb.b),
        accent: rgbToHex(accentRgb.r, accentRgb.g, accentRgb.b),
        accentDark: rgbToHex(accentDarkRgb.r, accentDarkRgb.g, accentDarkRgb.b),
        accentText
      };

      const rootStyle = document.documentElement.style;
      rootStyle.setProperty('--brand-primary', theme.primary);
      rootStyle.setProperty('--brand-primary-dark', theme.primaryDark);
      rootStyle.setProperty('--brand-primary-mid', theme.primaryMid);
      rootStyle.setProperty('--brand-primary-soft', theme.primarySoft);
      rootStyle.setProperty('--brand-primary-border', theme.primaryBorder);
      rootStyle.setProperty('--brand-accent', theme.accent);
      rootStyle.setProperty('--brand-accent-dark', theme.accentDark);
      rootStyle.setProperty('--brand-accent-text', theme.accentText);

      localStorage.setItem(STORAGE_KEY_THEME, JSON.stringify(theme));
    } catch (err) {
      // Tetap gunakan warna default apabila browser memblokir canvas CORS
    }
  };

  probe.onerror = function () {
    urlIndex++;
    if (urlIndex < LOGO_URLS.length) {
      probe.src = LOGO_URLS[urlIndex];
    }
  };

  probe.src = LOGO_URLS[0];
}

// ============================================================================
// SISTEM AUTENTIKASI & PROTEKSI AKSES BENDAHARA
// ============================================================================
async function sha256Hex(text) {
  if (window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback sederhana jika dijalankan di konteks HTTP non-localhost
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return 'fb_' + Math.abs(hash).toString(16);
}

async function ensureAuthInitialized() {
  const existing = localStorage.getItem(STORAGE_KEY_AUTH);
  if (!existing) {
    const defaultHash = await sha256Hex(DEFAULT_PASSWORD_PLAINTEXT);
    localStorage.setItem(
      STORAGE_KEY_AUTH,
      JSON.stringify({
        username: DEFAULT_USERNAME,
        passwordHash: defaultHash
      })
    );
  }
}

function getAuthCredentials() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_AUTH));
  } catch (e) {
    return null;
  }
}

function isAuthenticated() {
  const localToken = localStorage.getItem(STORAGE_KEY_SESSION);
  const sessionToken = sessionStorage.getItem(STORAGE_KEY_SESSION);
  return localToken === 'AUTHENTICATED' || sessionToken === 'AUTHENTICATED';
}

function showAuthenticatedApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-container').classList.remove('hidden');
  initializeAppData();
}

function showLoginScreen() {
  document.getElementById('app-container').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').classList.add('hidden');
}

async function handleLogin(event) {
  event.preventDefault();
  await ensureAuthInitialized();

  const inputUser = document.getElementById('login-username').value.trim().toLowerCase();
  const inputPass = document.getElementById('login-password').value;
  const remember = document.getElementById('login-remember').checked;
  const errBox = document.getElementById('login-error');
  const errText = document.getElementById('login-error-text');

  const stored = getAuthCredentials();
  const inputHash = await sha256Hex(inputPass);

  if (stored && inputUser === stored.username.toLowerCase() && inputHash === stored.passwordHash) {
    errBox.classList.add('hidden');
    if (remember) {
      localStorage.setItem(STORAGE_KEY_SESSION, 'AUTHENTICATED');
    } else {
      sessionStorage.setItem(STORAGE_KEY_SESSION, 'AUTHENTICATED');
    }
    showAuthenticatedApp();
  } else {
    errText.textContent = 'Username atau Password salah. Akses ditolak.';
    errBox.classList.remove('hidden');
  }
}

function logoutBendahara() {
  if (!confirm('Keluar dan kunci halaman keuangan sekarang?')) return;
  localStorage.removeItem(STORAGE_KEY_SESSION);
  sessionStorage.removeItem(STORAGE_KEY_SESSION);
  showLoginScreen();
}

function togglePasswordVisibility(inputId, btn) {
  const inp = document.getElementById(inputId);
  const icon = btn.querySelector('i');
  if (inp.type === 'password') {
    inp.type = 'text';
    icon.className = 'fa-solid fa-eye-slash';
  } else {
    inp.type = 'password';
    icon.className = 'fa-solid fa-eye';
  }
}

function openAccountModal() {
  const stored = getAuthCredentials();
  document.getElementById('acc-username').value = stored ? stored.username : DEFAULT_USERNAME;
  document.getElementById('acc-old-password').value = '';
  document.getElementById('acc-new-password').value = '';
  document.getElementById('acc-confirm-password').value = '';
  openModal('modal-account');
}

async function saveAccountCredentials(event) {
  event.preventDefault();
  await ensureAuthInitialized();

  const newUsername = document.getElementById('acc-username').value.trim();
  const oldPass = document.getElementById('acc-old-password').value;
  const newPass = document.getElementById('acc-new-password').value;
  const confirmPass = document.getElementById('acc-confirm-password').value;

  if (!newUsername) {
    alert('Username wajib diisi.');
    return;
  }
  if (newPass !== confirmPass) {
    alert('Konfirmasi password baru tidak cocok.');
    return;
  }

  const stored = getAuthCredentials();
  const oldHash = await sha256Hex(oldPass);
  if (!stored || oldHash !== stored.passwordHash) {
    alert('Password lama yang Anda masukkan salah.');
    return;
  }

  const newHash = await sha256Hex(newPass);
  localStorage.setItem(
    STORAGE_KEY_AUTH,
    JSON.stringify({
      username: newUsername,
      passwordHash: newHash
    })
  );

  closeModal('modal-account');
  alert(`Username & Password berhasil diperbarui!\nUsername aktif sekarang: ${newUsername}`);
}

async function openResetPasswordPrompt() {
  const pin = prompt('Masukkan Kode Pemulihan Instansi untuk mereset akun ke pengaturan awal:');
  if (pin === null) return;
  if (pin.trim() === INSTITUTION_RECOVERY_PIN) {
    const defaultHash = await sha256Hex(DEFAULT_PASSWORD_PLAINTEXT);
    localStorage.setItem(
      STORAGE_KEY_AUTH,
      JSON.stringify({
        username: DEFAULT_USERNAME,
        passwordHash: defaultHash
      })
    );
    alert(`Akun berhasil direset!\nUsername: ${DEFAULT_USERNAME}\nPassword: ${DEFAULT_PASSWORD_PLAINTEXT}`);
  } else {
    alert('Kode pemulihan salah.');
  }
}

// ============================================================================
// INISIALISASI HALAMAN & PENYIMPANAN LOKAL
// ============================================================================
let appInitialized = false;

document.addEventListener('DOMContentLoaded', async () => {
  extractAndApplyLogoTheme();
  await ensureAuthInitialized();

  if (isAuthenticated()) {
    showAuthenticatedApp();
  } else {
    showLoginScreen();
  }
});

function initializeAppData() {
  loadData();
  populateSheetFilter();
  renderTable();
  renderIndukTab();
  renderRiwayat();

  if (!appInitialized) {
    document.getElementById('excel-upload').addEventListener('change', handleExcelUpload);
    document.getElementById('json-restore').addEventListener('change', handleJSONRestore);
    document.getElementById('newclass-source').addEventListener('change', (e) => {
      const optBox = document.getElementById('newclass-migration-options');
      optBox.classList.toggle('hidden', !e.target.value);
    });
    appInitialized = true;
  }
}

function loadData() {
  const savedStudents = localStorage.getItem(STORAGE_KEY_STUDENTS);
  const savedTx = localStorage.getItem(STORAGE_KEY_TX);

  if (savedStudents) {
    students = JSON.parse(savedStudents);
  } else {
    students = JSON.parse(JSON.stringify(INITIAL_SAMPLE_DATA));
    saveData();
  }

  transactions = savedTx ? JSON.parse(savedTx) : [];
}

function saveData() {
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(transactions));
}

// ============================================================================
// HELPER FORMAT RUPIAH, TERBILANG, DETEKSI UNIT & SEMESTER
// ============================================================================
function formatRupiah(num) {
  const n = Number(num) || 0;
  return 'Rp ' + n.toLocaleString('id-ID');
}

function terbilang(angka) {
  angka = Math.abs(Math.floor(Number(angka) || 0));
  if (angka === 0) return 'Nol Rupiah';
  const huruf = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  function baca(n) {
    if (n < 12) return ' ' + huruf[n];
    if (n < 20) return baca(n - 10) + ' Belas';
    if (n < 100) return baca(Math.floor(n / 10)) + ' Puluh' + baca(n % 10);
    if (n < 200) return ' Seratus' + baca(n - 100);
    if (n < 1000) return baca(Math.floor(n / 100)) + ' Ratus' + baca(n % 100);
    if (n < 2000) return ' Seribu' + baca(n - 1000);
    if (n < 1000000) return baca(Math.floor(n / 1000)) + ' Ribu' + baca(n % 1000);
    if (n < 1000000000) return baca(Math.floor(n / 1000000)) + ' Juta' + baca(n % 1000000);
    return baca(Math.floor(n / 1000000000)) + ' Miliar' + baca(n % 1000000000);
  }
  return baca(angka).trim() + ' Rupiah';
}

function normalizeStudentName(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function detectMonthKey(headerText) {
  const lower = String(headerText || '').toLowerCase().trim();
  for (const m of MONTH_ORDER) {
    if (lower === m || lower.startsWith(m + ' ')) {
      return m;
    }
  }
  return null;
}

function inferUnitFromSheet(sheetName) {
  const s = String(sheetName || '').toLowerCase();
  const isAlumni = s.startsWith('a.') || s.includes('alumni');
  if (s.includes('7') || s.includes('8') || s.includes('9') || s.includes('smp')) {
    return isAlumni ? 'Alumni SMPIT Al Firdaus' : 'SMPIT Al Firdaus';
  }
  if (s.includes('10') || s.includes('11') || s.includes('12') || s.includes('sma')) {
    return isAlumni ? 'Alumni SMAIT Al Firdaus' : 'SMAIT Al Firdaus';
  }
  return 'Ponpes SIT Al Firdaus';
}

function detectSheetCategory(sheetName) {
  const s = String(sheetName || '').toLowerCase();
  if (s.startsWith('a.') || s.includes('alumni')) return 'ALUMNI';
  if (s.includes('7') || s.includes('8') || s.includes('9') || s.includes('smp')) return 'SMPIT';
  if (s.includes('10') || s.includes('11') || s.includes('12') || s.includes('sma')) return 'SMAIT';
  return 'OTHER';
}

function detectSheetSemester(sheetName) {
  const s = String(sheetName || '').toLowerCase();
  if (s.startsWith('a.') || s.includes('alumni')) return 'ALUMNI';
  if (s.includes('smt 2') || s.includes('smt2') || s.includes('semester 2')) return 'SMT2';
  if (s.includes('smt 1') || s.includes('smt1') || s.includes('semester 1') || s === 'kelas 10' || s === 'kelas 11') return 'SMT1';
  return 'SMT1';
}

function getSemesterLabel(smtCode) {
  if (smtCode === 'SMT1') return 'Semester 1';
  if (smtCode === 'SMT2') return 'Semester 2';
  if (smtCode === 'ALUMNI') return 'Arsip Alumni';
  return 'Umum';
}

function getSheetChronologicalRank(sheetName) {
  const s = String(sheetName || '').toLowerCase();
  const isAlumni = s.startsWith('a.') || s.includes('alumni');
  const isSmt2 = s.includes('smt 2') || s.includes('smt2') || s.includes('semester 2');

  if (isAlumni && s.includes('smp')) return 95;
  if (isAlumni && s.includes('sma')) return 135;
  if (isAlumni) return 140;

  if (s.includes('12')) return isSmt2 ? 122 : 121;
  if (s.includes('11')) return isSmt2 ? 112 : 111;
  if (s.includes('10')) return isSmt2 ? 102 : 101;
  if (s.includes('9')) return isSmt2 ? 92 : 91;
  if (s.includes('8')) return isSmt2 ? 82 : 81;
  if (s.includes('7')) return isSmt2 ? 72 : 71;
  return 500;
}

function normalizeFixedFeeKey(label) {
  const l = String(label || '').toLowerCase().trim().replace(/\s+/g, ' ');
  if (l === 'u. pangkal' || l === 'uang pangkal') return 'uang_pangkal';
  if (l === 'daftar ulang') return 'daftar_ulang_berjalan';
  if (l.startsWith('du ') || l.startsWith('daftar ulang ')) {
    return 'du_' + l.replace(/^daftar ulang\s+/, 'du ').replace(/^du\s+/, '');
  }
  return l;
}

function isCarryOverSummaryLabel(label) {
  const l = String(label || '').toLowerCase().trim();
  return (
    l.includes('smt 1 +') ||
    l.includes('smt1 +') ||
    l.startsWith('sisa ') ||
    l.includes('tunggakan smt')
  );
}

// ============================================================================
// KARTU INDUK SANTRI: PENGELOMPOKAN & DEDUPLIKASI CERDAS LINTAS SEMESTER
// ============================================================================
function buildUnifiedStudentProfiles(dedupMode = 'DEDUP') {
  const map = {};

  students.forEach((st) => {
    const norm = normalizeStudentName(st.nama);
    if (!norm) return;
    if (!map[norm]) {
      map[norm] = {
        normName: norm,
        displayName: st.nama,
        wa: st.wa || '',
        records: []
      };
    }
    if (st.wa && !map[norm].wa) {
      map[norm].wa = st.wa;
    }
    map[norm].records.push(st);
  });

  const profiles = Object.values(map).map((prof) => {
    prof.records.sort((a, b) => getSheetChronologicalRank(a.sheet) - getSheetChronologicalRank(b.sheet));

    const seenFixedKeys = {};
    const sheetSummaries = [];
    let cleanTotal = 0;
    let rawTotal = 0;
    let duplicatedAmount = 0;

    prof.records.forEach((rec, recIdx) => {
      const hasEarlierSheet = recIdx > 0;
      const items = [];
      let sheetCleanSum = 0;
      let sheetRawSum = 0;

      rec.fees.forEach((fee, feeIdx) => {
        const amt = Number(fee.amount) || 0;
        if (amt <= 0) return;

        sheetRawSum += amt;
        rawTotal += amt;

        let isDuplicate = false;
        let duplicateReason = '';

        if (dedupMode === 'DEDUP' && fee.type === 'fixed') {
          const fixedKey = normalizeFixedFeeKey(fee.label);

          if (hasEarlierSheet && isCarryOverSummaryLabel(fee.label)) {
            isDuplicate = true;
            duplicateReason = `Rekap bawaan dari ${prof.records[recIdx - 1].sheet}`;
          } else if (seenFixedKeys[fixedKey]) {
            const prev = seenFixedKeys[fixedKey];
            if (amt <= prev.amount) {
              isDuplicate = true;
              duplicateReason = `Sudah tercatat di ${prev.sheet}`;
            } else {
              prev.itemRef.isDuplicate = true;
              prev.itemRef.duplicateReason = `Diperbarui di ${rec.sheet}`;
              prev.sheetSummaryRef.cleanSum -= prev.amount;
              cleanTotal -= prev.amount;
              duplicatedAmount += prev.amount;
            }
          }

          const itemObj = {
            studentId: rec.id,
            sheet: rec.sheet,
            feeIndex: feeIdx,
            label: fee.label,
            amount: amt,
            type: fee.type,
            isDuplicate,
            duplicateReason
          };

          if (!isDuplicate) {
            sheetCleanSum += amt;
            cleanTotal += amt;
            seenFixedKeys[fixedKey] = {
              sheet: rec.sheet,
              amount: amt,
              itemRef: itemObj,
              sheetSummaryRef: null
            };
          } else {
            duplicatedAmount += amt;
          }

          items.push(itemObj);
        } else {
          sheetCleanSum += amt;
          cleanTotal += amt;
          items.push({
            studentId: rec.id,
            sheet: rec.sheet,
            feeIndex: feeIdx,
            label: fee.label,
            amount: amt,
            type: fee.type,
            isDuplicate: false,
            duplicateReason: ''
          });
        }
      });

      const summaryObj = {
        studentId: rec.id,
        sheet: rec.sheet,
        unit: rec.unit,
        semester: getSemesterLabel(detectSheetSemester(rec.sheet)),
        sppDasar: rec.sppDasar,
        items,
        cleanSum: sheetCleanSum,
        rawSum: sheetRawSum
      };

      Object.values(seenFixedKeys).forEach((entry) => {
        if (entry.sheet === rec.sheet && !entry.sheetSummaryRef) {
          entry.sheetSummaryRef = summaryObj;
        }
      });

      sheetSummaries.push(summaryObj);
    });

    const latestRec = prof.records[prof.records.length - 1];
    const categories = [...new Set(prof.records.map((r) => detectSheetCategory(r.sheet)))];

    return {
      normName: prof.normName,
      displayName: prof.displayName,
      wa: prof.wa,
      latestUnit: latestRec ? latestRec.unit : 'Ponpes SIT Al Firdaus',
      categories,
      sheetCount: prof.records.length,
      sheetSummaries,
      cleanTotal,
      rawTotal,
      duplicatedAmount
    };
  });

  return profiles.sort((a, b) => a.displayName.localeCompare(b.displayName, 'id'));
}

function syncLinkedStudentFees(sourceStudent, paidFeeLabel, paidAmount) {
  if (paidAmount <= 0) return [];
  const normName = normalizeStudentName(sourceStudent.nama);
  const siblingRecords = students.filter(
    (s) => s.id !== sourceStudent.id && normalizeStudentName(s.nama) === normName
  );
  if (siblingRecords.length === 0) return [];

  const paidNormKey = normalizeFixedFeeKey(paidFeeLabel);
  const sourceRank = getSheetChronologicalRank(sourceStudent.sheet);
  const adjustments = [];

  siblingRecords.forEach((sib) => {
    const sibRank = getSheetChronologicalRank(sib.sheet);
    sib.fees.forEach((f, idx) => {
      if (f.amount <= 0 || f.type !== 'fixed') return;

      const sameFixed = normalizeFixedFeeKey(f.label) === paidNormKey;
      const isLaterCarryOver = sibRank > sourceRank && isCarryOverSummaryLabel(f.label);

      if (sameFixed || isLaterCarryOver) {
        const deduct = Math.min(f.amount, paidAmount);
        if (deduct > 0) {
          f.amount -= deduct;
          adjustments.push({
            studentId: sib.id,
            feeIndex: idx,
            label: f.label,
            deducted: deduct
          });
        }
      }
    });
  });

  return adjustments;
}

// ============================================================================
// PARSER FILE EXCEL (BIAYA PENDIDIKAN 2026-2027.xlsx - SELURUH SHEET)
// ============================================================================
function handleExcelUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const parsedStudents = [];

      workbook.SheetNames.forEach((sheetName) => {
        const ws = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        let headerRowIdx = -1;
        for (let r = 0; r < Math.min(12, rows.length); r++) {
          const c0 = String(rows[r][0] || '').trim().toLowerCase();
          const c1 = String(rows[r][1] || '').trim().toLowerCase();
          if (c0 === 'no' && c1 === 'nama') {
            headerRowIdx = r;
            break;
          }
        }

        if (headerRowIdx === -1) return;

        let tahunAjaran = '2026-2027';
        for (let r = 0; r < headerRowIdx; r++) {
          const rowStr = rows[r].join(' ');
          const match = rowStr.match(/20\d{2}\s*-\s*20\d{2}/);
          if (match) {
            tahunAjaran = match[0].replace(/\s+/g, '');
            break;
          }
        }

        const headers = rows[headerRowIdx];
        const componentCols = [];

        for (let c = 3; c < headers.length; c++) {
          let rawH = headers[c];
          if (rawH === '' || rawH === null || rawH === undefined) continue;

          let label = '';
          if (rawH instanceof Date && !isNaN(rawH)) {
            const bulanIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            label = `${bulanIndo[rawH.getMonth()]} ${rawH.getFullYear()}`;
          } else {
            label = String(rawH).trim();
          }

          const lowerLabel = label.toLowerCase();
          if (lowerLabel === 'total' || lowerLabel === 'tunggakan') continue;

          const monthKey = detectMonthKey(label);
          componentCols.push({
            colIndex: c,
            label: label,
            type: monthKey ? 'monthly' : 'fixed',
            monthKey: monthKey
          });
        }

        for (let r = headerRowIdx + 1; r < rows.length; r++) {
          const row = rows[r];
          const noVal = String(row[0] || '').trim();
          const namaVal = String(row[1] || '').trim();

          if (!namaVal) continue;
          if (namaVal.toLowerCase().startsWith('total')) break;
          if (noVal === '' && isNaN(Number(noVal))) continue;

          const sppDasar = parseNumericCell(row[2]);
          const fees = componentCols.map((col) => ({
            label: col.label,
            amount: parseNumericCell(row[col.colIndex]),
            type: col.type,
            monthKey: col.monthKey
          }));

          parsedStudents.push({
            id: `st-${sheetName.replace(/\s+/g, '_')}-${r}`,
            sheet: sheetName,
            unit: inferUnitFromSheet(sheetName),
            tahunAjaran: tahunAjaran,
            nama: namaVal,
            wa: '',
            sppDasar: sppDasar,
            fees: fees
          });
        }
      });

      if (parsedStudents.length === 0) {
        alert('Format header No / Nama tidak ditemukan pada file Excel tersebut.');
        return;
      }

      const oldWaMap = {};
      students.forEach((s) => {
        if (s.wa) oldWaMap[normalizeStudentName(s.nama)] = s.wa;
      });
      parsedStudents.forEach((s) => {
        const norm = normalizeStudentName(s.nama);
        if (oldWaMap[norm]) s.wa = oldWaMap[norm];
      });

      students = parsedStudents;
      saveData();
      populateSheetFilter();
      renderTable();
      renderIndukTab();
      alert(`Berhasil mengimpor ${students.length} data baris dari ${workbook.SheetNames.length} sheet!`);
    } catch (err) {
      console.error(err);
      alert('Gagal membaca file Excel. Pastikan file berformat .xlsx atau .xls yang valid.');
    }
    event.target.value = '';
  };
  reader.readAsArrayBuffer(file);
}

function parseNumericCell(val) {
  if (typeof val === 'number') return Math.max(0, Math.round(val));
  if (!val) return 0;
  const cleaned = String(val).replace(/[^\d.-]/g, '');
  const parsed = Number(cleaned);
  return isNaN(parsed) ? 0 : Math.max(0, Math.round(parsed));
}

// ============================================================================
// PERHITUNGAN TUNGGAKAN AKURAT BERDASARKAN CUT-OFF BULAN
// ============================================================================
function getStudentArrears(student, cutoffMonth) {
  const cutoffLower = (cutoffMonth || 'ALL').toLowerCase();
  const cutoffIdx = MONTH_ORDER.indexOf(cutoffLower);

  const activeItems = [];
  let total = 0;

  student.fees.forEach((fee, idx) => {
    const amt = Number(fee.amount) || 0;
    if (amt <= 0) return;

    let included = true;
    if (cutoffLower !== 'all' && fee.type === 'monthly' && fee.monthKey) {
      const mIdx = MONTH_ORDER.indexOf(fee.monthKey);
      const isSmt2Cutoff = cutoffIdx >= 6;
      const isSmt2Item = mIdx >= 6;
      if (!isSmt2Cutoff && isSmt2Item) {
        included = false;
      } else if (mIdx > cutoffIdx) {
        included = false;
      }
    }

    if (included) {
      total += amt;
      activeItems.push({ index: idx, label: fee.label, amount: amt });
    }
  });

  return { total, activeItems };
}

// ============================================================================
// FILTER & RENDER UI TABEL UTAMA, KARTU INDUK, & REKAPITULASI
// ============================================================================
function onUnitOrSemesterChange(isSemesterChanged = false) {
  const smtFilter = document.getElementById('filter-semester').value;
  const cutoffSelect = document.getElementById('filter-cutoff');

  if (isSemesterChanged) {
    const currentCutoffIdx = MONTH_ORDER.indexOf(cutoffSelect.value.toLowerCase());
    if (smtFilter === 'SMT2' && currentCutoffIdx >= 0 && currentCutoffIdx < 6) {
      cutoffSelect.value = 'ALL';
    } else if (smtFilter === 'SMT1' && currentCutoffIdx >= 6) {
      cutoffSelect.value = 'Oktober';
    }
  }

  populateSheetFilter();
  renderTable();
}

function resetFilters() {
  document.getElementById('filter-unit').value = 'ALL';
  document.getElementById('filter-semester').value = 'ALL';
  document.getElementById('filter-cutoff').value = 'Oktober';
  document.getElementById('filter-status').value = 'ALL';
  document.getElementById('filter-search').value = '';
  populateSheetFilter();
  renderTable();
}

function populateSheetFilter() {
  const unitFilter = document.getElementById('filter-unit').value;
  const smtFilter = document.getElementById('filter-semester').value;
  const select = document.getElementById('filter-sheet');
  const currentVal = select.value;

  const matchingSheets = [...new Set(
    students
      .filter((s) => {
        if (unitFilter !== 'ALL' && detectSheetCategory(s.sheet) !== unitFilter) return false;
        if (smtFilter !== 'ALL' && detectSheetSemester(s.sheet) !== smtFilter) return false;
        return true;
      })
      .map((s) => s.sheet)
  )];

  select.innerHTML = '<option value="ALL">-- Semua Kelas yang Cocok --</option>';
  matchingSheets.forEach((sh) => {
    const opt = document.createElement('option');
    opt.value = sh;
    opt.textContent = sh;
    select.appendChild(opt);
  });

  select.value = matchingSheets.includes(currentVal) ? currentVal : 'ALL';

  const allSheets = [...new Set(students.map((s) => s.sheet))];
  const datalist = document.getElementById('existing-sheets-list');
  if (datalist) {
    datalist.innerHTML = allSheets.map((sh) => `<option value="${sh}"></option>`).join('');
  }
}

function renderTable() {
  const unitFilter = document.getElementById('filter-unit').value;
  const smtFilter = document.getElementById('filter-semester').value;
  const sheetFilter = document.getElementById('filter-sheet').value;
  const cutoffFilter = document.getElementById('filter-cutoff').value;
  const statusFilter = document.getElementById('filter-status').value;
  const searchFilter = document.getElementById('filter-search').value.toLowerCase().trim();

  const nameSheetCounts = {};
  students.forEach((s) => {
    const norm = normalizeStudentName(s.nama);
    nameSheetCounts[norm] = (nameSheetCounts[norm] || 0) + 1;
  });

  const tbody = document.getElementById('table-body');
  tbody.innerHTML = '';

  let countSantri = 0;
  let countLunas = 0;
  let countMenunggak = 0;
  let grandTotalTunggakan = 0;

  const filtered = students.filter((st) => {
    if (unitFilter !== 'ALL' && detectSheetCategory(st.sheet) !== unitFilter) return false;
    if (smtFilter !== 'ALL' && detectSheetSemester(st.sheet) !== smtFilter) return false;
    if (sheetFilter !== 'ALL' && st.sheet !== sheetFilter) return false;
    if (searchFilter && !st.nama.toLowerCase().includes(searchFilter)) return false;

    const { total } = getStudentArrears(st, cutoffFilter);
    if (statusFilter === 'TUNGGAKAN' && total <= 0) return false;
    if (statusFilter === 'LUNAS' && total > 0) return false;
    return true;
  });

  filtered.forEach((st, i) => {
    const { total, activeItems } = getStudentArrears(st, cutoffFilter);
    countSantri++;
    if (total === 0) countLunas++;
    else countMenunggak++;
    grandTotalTunggakan += total;

    const norm = normalizeStudentName(st.nama);
    const linkedCount = nameSheetCounts[norm] || 1;
    const escapedNorm = norm.replace(/'/g, "\\'");

    const smtCode = detectSheetSemester(st.sheet);
    const smtBadgeColor = smtCode === 'SMT2'
      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
      : smtCode === 'ALUMNI'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-teal-50 text-teal-700 border-teal-200';

    const linkedBadge = linkedCount > 1
      ? `<button onclick="openIndukDetailModal('${escapedNorm}')" class="ml-1.5 inline-flex items-center gap-1 bg-purple-100 hover:bg-purple-200 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded" title="Klik untuk buka Kartu Induk Gabungan Lintas Semester"><i class="fa-solid fa-link"></i> ${linkedCount} Smt</button>`
      : '';

    const badgesHtml = activeItems.length > 0
      ? activeItems.map((it) => `<span class="inline-block bg-rose-50 text-rose-700 border border-rose-200 text-[11px] px-2 py-0.5 rounded mr-1 mb-1">${it.label}: <b>${formatRupiah(it.amount)}</b></span>`).join('')
      : '<span class="text-xs text-brand-primary italic">Tidak ada tunggakan</span>';

    const statusBadge = total === 0
      ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-primary-soft text-brand-primary border border-brand-soft">LUNAS</span>'
      : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">MENUNGGAK</span>';

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition';
    tr.innerHTML = `
      <td class="px-4 py-3 text-slate-500">${i + 1}</td>
      <td class="px-4 py-3">
        <div class="font-bold text-slate-800 flex items-center flex-wrap">
          <span>${st.nama}</span>
          ${linkedBadge}
        </div>
        <div class="text-[11px] text-slate-400 mt-0.5">${st.wa ? '<i class="fa-brands fa-whatsapp text-green-600"></i> ' + st.wa : 'No. WA belum diisi'}</div>
      </td>
      <td class="px-4 py-3">
        <div class="flex flex-wrap items-center gap-1">
          <span class="bg-slate-100 text-slate-800 font-bold text-xs px-2 py-0.5 rounded">${st.sheet}</span>
          <span class="border text-[10px] font-semibold px-1.5 py-0.5 rounded ${smtBadgeColor}">${getSemesterLabel(smtCode)}</span>
        </div>
        <div class="text-[11px] text-slate-500 mt-0.5">${st.unit}</div>
      </td>
      <td class="px-4 py-3 text-right font-medium text-slate-600">${formatRupiah(st.sppDasar)}</td>
      <td class="px-4 py-3 max-w-xs">${badgesHtml}</td>
      <td class="px-4 py-3 text-right font-bold ${total > 0 ? 'text-rose-600' : 'text-brand-primary'}">${formatRupiah(total)}</td>
      <td class="px-4 py-3 text-center">${statusBadge}</td>
      <td class="px-4 py-3">
        <div class="flex items-center justify-center gap-1">
          <button onclick="openBayarModal('${st.id}')" class="btn-brand-primary text-xs px-2 py-1.5 rounded-lg font-semibold" title="Catat Pembayaran Kelas Ini">
            <i class="fa-solid fa-cash-register"></i> Bayar
          </button>
          <button onclick="openIndukDetailModal('${escapedNorm}')" class="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1.5 rounded-lg font-semibold" title="Buka Kartu Induk Gabungan Lintas Semester">
            <i class="fa-solid fa-id-card"></i>
          </button>
          <button onclick="openWAModal('${st.id}')" class="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1.5 rounded-lg" title="Kirim Tagihan via WhatsApp">
            <i class="fa-brands fa-whatsapp"></i>
          </button>
          <button onclick="openPrintTagihan('${st.id}')" class="bg-slate-700 hover:bg-slate-800 text-white text-xs px-2 py-1.5 rounded-lg" title="Cetak Surat Tagihan PDF">
            <i class="fa-solid fa-print"></i>
          </button>
          <button onclick="openEditModal('${st.id}')" class="bg-amber-500 hover:bg-amber-600 text-white text-xs px-2 py-1.5 rounded-lg" title="Edit Data Santri">
            <i class="fa-solid fa-pen"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-slate-400">Tidak ada data santri yang sesuai filter.</td></tr>';
  }

  let contextLabel = 'Semua Kelas / Unit';
  if (sheetFilter !== 'ALL') contextLabel = `Kelas: ${sheetFilter}`;
  else if (unitFilter !== 'ALL' || smtFilter !== 'ALL') {
    const parts = [];
    if (unitFilter !== 'ALL') parts.push(unitFilter);
    if (smtFilter !== 'ALL') parts.push(getSemesterLabel(smtFilter));
    contextLabel = parts.join(' - ');
  }

  document.getElementById('stat-total-santri').textContent = countSantri;
  document.getElementById('stat-kelas-aktif').textContent = contextLabel;
  document.getElementById('stat-lunas').textContent = countLunas;
  document.getElementById('stat-menunggak').textContent = countMenunggak;
  document.getElementById('stat-total-tunggakan').textContent = formatRupiah(grandTotalTunggakan);
  document.getElementById('stat-cutoff-label').textContent = cutoffFilter === 'ALL' ? 'Cut-off: Semua Bulan' : `Cut-off: s.d. ${cutoffFilter}`;

  renderRekap();
  renderIndukTab();
}

function renderRekap() {
  const unitFilter = document.getElementById('filter-unit').value;
  const smtFilter = document.getElementById('filter-semester').value;
  const sheetFilter = document.getElementById('filter-sheet').value;
  const cutoffFilter = document.getElementById('filter-cutoff').value;

  const tbody = document.getElementById('rekap-body');
  const tfoot = document.getElementById('rekap-foot');
  tbody.innerHTML = '';

  const grouped = {};
  students.forEach((st) => {
    if (unitFilter !== 'ALL' && detectSheetCategory(st.sheet) !== unitFilter) return;
    if (smtFilter !== 'ALL' && detectSheetSemester(st.sheet) !== smtFilter) return;
    if (sheetFilter !== 'ALL' && st.sheet !== sheetFilter) return;

    if (!grouped[st.sheet]) {
      grouped[st.sheet] = {
        sheet: st.sheet,
        unit: st.unit,
        semester: getSemesterLabel(detectSheetSemester(st.sheet)),
        totalSantri: 0,
        lunas: 0,
        menunggak: 0,
        nominal: 0
      };
    }
    const { total } = getStudentArrears(st, cutoffFilter);
    grouped[st.sheet].totalSantri++;
    if (total === 0) grouped[st.sheet].lunas++;
    else grouped[st.sheet].menunggak++;
    grouped[st.sheet].nominal += total;
  });

  let sumSantri = 0, sumLunas = 0, sumMenunggak = 0, sumNominal = 0;
  Object.values(grouped).forEach((g, idx) => {
    sumSantri += g.totalSantri;
    sumLunas += g.lunas;
    sumMenunggak += g.menunggak;
    sumNominal += g.nominal;

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 cursor-pointer';
    tr.title = 'Klik untuk melihat detail santri kelas ini';
    tr.onclick = () => {
      document.getElementById('filter-sheet').value = g.sheet;
      switchTab('tagihan');
      renderTable();
    };
    tr.innerHTML = `
      <td class="px-4 py-3 text-slate-500">${idx + 1}</td>
      <td class="px-4 py-3 font-bold text-brand-primary underline">${g.sheet}</td>
      <td class="px-4 py-3 text-slate-600">${g.unit}</td>
      <td class="px-4 py-3 text-xs font-semibold text-slate-600">${g.semester}</td>
      <td class="px-4 py-3 text-center">${g.totalSantri}</td>
      <td class="px-4 py-3 text-center text-brand-primary font-semibold">${g.lunas}</td>
      <td class="px-4 py-3 text-center text-rose-600 font-semibold">${g.menunggak}</td>
      <td class="px-4 py-3 text-right font-bold text-slate-800">${formatRupiah(g.nominal)}</td>
    `;
    tbody.appendChild(tr);
  });

  if (Object.keys(grouped).length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-slate-400">Tidak ada data kelas pada filter ini.</td></tr>';
  }

  tfoot.innerHTML = `
    <tr>
      <td colspan="4" class="px-4 py-3 text-right uppercase text-xs">Grand Total (${cutoffFilter === 'ALL' ? 'Semua Bulan' : 's.d. ' + cutoffFilter}):</td>
      <td class="px-4 py-3 text-center">${sumSantri}</td>
      <td class="px-4 py-3 text-center">${sumLunas}</td>
      <td class="px-4 py-3 text-center">${sumMenunggak}</td>
      <td class="px-4 py-3 text-right text-base">${formatRupiah(sumNominal)}</td>
    </tr>
  `;
}

// ============================================================================
// RENDER TAB & MODAL KARTU INDUK SANTRI (LINTAS SEMESTER)
// ============================================================================
function renderIndukTab() {
  const dedupMode = document.getElementById('induk-dedup-mode').value;
  const search = document.getElementById('induk-search').value.toLowerCase().trim();
  const unitFilter = document.getElementById('induk-filter-unit').value;
  const multiFilter = document.getElementById('induk-filter-multi').value;
  const statusFilter = document.getElementById('induk-filter-status').value;

  const allProfiles = buildUnifiedStudentProfiles(dedupMode);
  document.getElementById('badge-induk').textContent = allProfiles.length;

  const filtered = allProfiles.filter((p) => {
    if (search && !p.displayName.toLowerCase().includes(search)) return false;
    if (unitFilter !== 'ALL' && !p.categories.includes(unitFilter)) return false;
    if (multiFilter === 'MULTI' && p.sheetCount <= 1) return false;
    if (multiFilter === 'SINGLE' && p.sheetCount > 1) return false;

    const totalVal = dedupMode === 'DEDUP' ? p.cleanTotal : p.rawTotal;
    if (statusFilter === 'TUNGGAKAN' && totalVal <= 0) return false;
    if (statusFilter === 'LUNAS' && totalVal > 0) return false;
    return true;
  });

  let multiCount = 0;
  let sumCombined = 0;
  const tbody = document.getElementById('induk-body');
  tbody.innerHTML = '';

  filtered.forEach((p, idx) => {
    const totalVal = dedupMode === 'DEDUP' ? p.cleanTotal : p.rawTotal;
    if (p.sheetCount > 1) multiCount++;
    sumCombined += totalVal;

    const escapedNorm = p.normName.replace(/'/g, "\\'");

    const chainHtml = p.sheetSummaries
      .map((s) => `<span class="inline-block bg-brand-primary-soft text-brand-primary border border-brand-soft text-[11px] font-bold px-2 py-0.5 rounded">${s.sheet}</span>`)
      .join(' <i class="fa-solid fa-arrow-right text-[9px] text-slate-400 mx-0.5"></i> ');

    const breakdownHtml = p.sheetSummaries
      .map((s) => {
        const subVal = dedupMode === 'DEDUP' ? s.cleanSum : s.rawSum;
        return `<div class="text-xs flex items-center justify-between gap-3 py-0.5 border-b border-slate-100 last:border-0">
          <span class="text-slate-600 font-medium">${s.sheet}:</span>
          <span class="font-bold ${subVal > 0 ? 'text-rose-600' : 'text-brand-primary'}">${formatRupiah(subVal)}</span>
        </div>`;
      })
      .join('');

    const statusBadge = totalVal === 0
      ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-primary-soft text-brand-primary border border-brand-soft">LUNAS</span>'
      : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">MENUNGGAK</span>';

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition';
    tr.innerHTML = `
      <td class="px-4 py-3 text-slate-500">${idx + 1}</td>
      <td class="px-4 py-3">
        <div class="font-bold text-slate-800">${p.displayName}</div>
        <div class="text-[11px] text-slate-500">${p.latestUnit}</div>
        <div class="text-[11px] text-slate-400">${p.wa ? '<i class="fa-brands fa-whatsapp text-green-600"></i> ' + p.wa : 'No. WA belum diisi'}</div>
      </td>
      <td class="px-4 py-3">
        <div class="flex flex-wrap items-center gap-y-1">${chainHtml}</div>
        ${p.duplicatedAmount > 0 && dedupMode === 'DEDUP'
          ? `<div class="text-[10px] text-brand-primary mt-1"><i class="fa-solid fa-shield-halved mr-1"></i>Anti-ganda: ${formatRupiah(p.duplicatedAmount)} pos bawaan disesuaikan</div>`
          : ''}
      </td>
      <td class="px-4 py-3 min-w-[190px]">${breakdownHtml}</td>
      <td class="px-4 py-3 text-right font-extrabold text-sm ${totalVal > 0 ? 'text-rose-600' : 'text-brand-primary'}">${formatRupiah(totalVal)}</td>
      <td class="px-4 py-3 text-center">${statusBadge}</td>
      <td class="px-4 py-3 text-center">
        <button onclick="openIndukDetailModal('${escapedNorm}')" class="btn-brand-primary text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm">
          <i class="fa-solid fa-id-card mr-1"></i>Buka Kartu Induk
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-slate-400">Tidak ada profil santri yang sesuai filter.</td></tr>';
  }

  document.getElementById('induk-stat-unique').textContent = filtered.length;
  document.getElementById('induk-stat-multi').textContent = multiCount;
  document.getElementById('induk-stat-total').textContent = formatRupiah(sumCombined);
}

function openIndukDetailModal(normName) {
  document.getElementById('induk-modal-norm-name').value = normName;
  document.getElementById('induk-modal-mode').value = document.getElementById('induk-dedup-mode').value || 'DEDUP';
  refreshIndukDetailModal();
  openModal('modal-induk');
}

function refreshIndukDetailModal() {
  const normName = document.getElementById('induk-modal-norm-name').value;
  const mode = document.getElementById('induk-modal-mode').value;
  const profiles = buildUnifiedStudentProfiles(mode);
  const prof = profiles.find((p) => p.normName === normName);
  if (!prof) return;

  const grandTotal = mode === 'DEDUP' ? prof.cleanTotal : prof.rawTotal;
  document.getElementById('induk-modal-nama').textContent = `Kartu Induk: ${prof.displayName}`;
  document.getElementById('induk-modal-subtitle').textContent = `${prof.latestUnit} • Terhubung di ${prof.sheetCount} Kelas/Semester (${prof.sheetSummaries.map((s) => s.sheet).join(' → ')})`;
  document.getElementById('induk-modal-wa').value = prof.wa || '';
  document.getElementById('induk-modal-grand-total').textContent = formatRupiah(grandTotal);

  const noteEl = document.getElementById('induk-modal-dedup-note');
  if (mode === 'DEDUP' && prof.duplicatedAmount > 0) {
    noteEl.innerHTML = `<i class="fa-solid fa-circle-info text-brand-primary mr-1"></i>Pos bawaan/duplikat lintas semester sebesar <b>${formatRupiah(prof.duplicatedAmount)}</b> otomatis dikecualikan agar tidak tertagih ganda.`;
  } else if (prof.sheetCount > 1) {
    noteEl.textContent = 'Seluruh pos dari semua semester telah digabungkan secara kronologis.';
  } else {
    noteEl.textContent = 'Santri ini memiliki 1 catatan kelas/semester aktif.';
  }

  const container = document.getElementById('induk-modal-sheets-container');
  container.innerHTML = '';

  prof.sheetSummaries.forEach((sh) => {
    const subTotal = mode === 'DEDUP' ? sh.cleanSum : sh.rawSum;
    const card = document.createElement('div');
    card.className = 'border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm';

    const itemsRows = sh.items.length > 0
      ? sh.items.map((it) => `
          <tr class="border-b border-slate-100 last:border-0 ${it.isDuplicate ? 'bg-amber-50/60 text-slate-400' : ''}">
            <td class="px-3 py-2 text-xs font-medium">
              <span class="${it.isDuplicate ? 'line-through' : 'text-slate-700'}">${it.label}</span>
              ${it.isDuplicate ? `<span class="ml-1.5 inline-block bg-amber-100 text-amber-800 text-[10px] font-semibold px-1.5 py-0.5 rounded">${it.duplicateReason}</span>` : ''}
            </td>
            <td class="px-3 py-2 text-xs text-right font-semibold ${it.isDuplicate ? 'line-through text-slate-400' : 'text-rose-700'}">
              ${formatRupiah(it.amount)}
            </td>
          </tr>`).join('')
      : `<tr><td colspan="2" class="px-3 py-3 text-center text-xs text-brand-primary font-semibold">Alhamdulillah, seluruh pos di kelas ini sudah LUNAS</td></tr>`;

    card.innerHTML = `
      <div class="bg-slate-100 px-3.5 py-2.5 flex items-center justify-between border-b border-slate-200">
        <div>
          <span class="font-bold text-xs text-slate-800">${sh.sheet}</span>
          <span class="text-[11px] text-slate-500 ml-1.5">(${sh.unit} &bull; SPP: ${formatRupiah(sh.sppDasar)})</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold ${subTotal > 0 ? 'text-rose-700' : 'text-brand-primary'}">Subtotal: ${formatRupiah(subTotal)}</span>
          <button onclick="openEditModal('${sh.studentId}'); closeModal('modal-induk');" class="text-[11px] bg-white hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-300" title="Edit Pos Kelas Ini">
            <i class="fa-solid fa-pen"></i>
          </button>
        </div>
      </div>
      <table class="w-full text-left">
        <tbody>${itemsRows}</tbody>
      </table>
    `;
    container.appendChild(card);
  });
}

function saveIndukWA() {
  const normName = document.getElementById('induk-modal-norm-name').value;
  const newWa = document.getElementById('induk-modal-wa').value.trim();

  students.forEach((s) => {
    if (normalizeStudentName(s.nama) === normName) {
      s.wa = newWa;
    }
  });

  saveData();
  renderTable();
  alert('Nomor WhatsApp wali santri berhasil disimpan & disinkronkan ke seluruh kelas/semester santri ini!');
}

function openWAInduk() {
  const normName = document.getElementById('induk-modal-norm-name').value;
  const mode = document.getElementById('induk-modal-mode').value;
  const prof = buildUnifiedStudentProfiles(mode).find((p) => p.normName === normName);
  if (!prof) return;

  const grandTotal = mode === 'DEDUP' ? prof.cleanTotal : prof.rawTotal;
  const sectionsText = prof.sheetSummaries.map((sh) => {
    const validItems = sh.items.filter((it) => !it.isDuplicate);
    if (validItems.length === 0) return `*[${sh.sheet}]* : LUNAS`;
    const lines = validItems.map((it) => `  - ${it.label}: ${formatRupiah(it.amount)}`).join('\n');
    return `*[${sh.sheet}]*\n${lines}`;
  }).join('\n\n');

  const msg = `Assalamu'alaikum Warahmatullahi Wabarakatuh.
Yth. Bapak/Ibu Orang Tua/Wali Santri dari:

*Nama Santri* : ${prof.displayName}
*Unit* : ${prof.latestUnit}
*Riwayat Kelas* : ${prof.sheetSummaries.map((s) => s.sheet).join(' → ')}

Berikut kami sampaikan rekapitulasi gabungan biaya pendidikan Ponpes SIT Al Firdaus:

${sectionsText}

*TOTAL TAGIHAN GABUNGAN : ${formatRupiah(grandTotal)}*

Mohon konfirmasi bukti transfer apabila Bapak/Ibu telah melakukan pembayaran. Atas perhatian dan kerja samanya kami ucapkan Jazakumullahu Khairan Katsiran.

Hormat kami,
*Bendahara Ponpes SIT Al Firdaus*
*Restasari, S.Sos*`;

  document.getElementById('wa-phone').value = prof.wa || '';
  document.getElementById('wa-message').value = msg;
  openModal('modal-wa');
}

function openPrintInduk() {
  const normName = document.getElementById('induk-modal-norm-name').value;
  const mode = document.getElementById('induk-modal-mode').value;
  const prof = buildUnifiedStudentProfiles(mode).find((p) => p.normName === normName);
  if (!prof) return;

  const grandTotal = mode === 'DEDUP' ? prof.cleanTotal : prof.rawTotal;
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  let rowNum = 1;
  let rowsHtml = '';
  prof.sheetSummaries.forEach((sh) => {
    const validItems = sh.items.filter((it) => !it.isDuplicate);
    validItems.forEach((it) => {
      rowsHtml += `
        <tr class="border-b border-slate-200">
          <td class="py-2 px-3 text-center">${rowNum++}</td>
          <td class="py-2 px-3 font-semibold text-slate-700">${sh.sheet}</td>
          <td class="py-2 px-3">${it.label}</td>
          <td class="py-2 px-3 text-right font-semibold">${formatRupiah(it.amount)}</td>
        </tr>`;
    });
  });

  if (!rowsHtml) {
    rowsHtml = `<tr><td colspan="4" class="py-4 text-center text-emerald-700 font-semibold">Alhamdulillah, Seluruh Tagihan Lintas Semester Sudah LUNAS</td></tr>`;
  }

  document.getElementById('print-area').innerHTML = `
    ${getKopSuratHTML()}
    <div class="text-center mb-4">
      <h3 class="font-bold text-base underline uppercase">KARTU INDUK REKAPITULASI BIAYA PENDIDIKAN</h3>
      <p class="text-xs text-slate-600">Rekap Gabungan Lintas Semester &amp; Jenjang</p>
    </div>
    <table class="w-full text-xs mb-4">
      <tr><td class="py-1 w-40 font-semibold">Nama Santri</td><td>: <strong>${prof.displayName}</strong></td></tr>
      <tr><td class="py-1 font-semibold">Unit Pendidikan</td><td>: ${prof.latestUnit}</td></tr>
      <tr><td class="py-1 font-semibold">Riwayat Kelas / Smt</td><td>: ${prof.sheetSummaries.map((s) => s.sheet).join(' → ')}</td></tr>
    </table>
    <table class="w-full text-xs border border-slate-300 mb-3">
      <thead class="bg-slate-100 border-b border-slate-300">
        <tr>
          <th class="py-2 px-3 w-12">No</th>
          <th class="py-2 px-3 text-left">Kelas / Semester</th>
          <th class="py-2 px-3 text-left">Komponen Biaya / Bulan</th>
          <th class="py-2 px-3 text-right">Nominal Tagihan</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot class="bg-slate-50 font-bold border-t-2 border-slate-400">
        <tr>
          <td colspan="3" class="py-2 px-3 text-right uppercase">Total Tagihan Gabungan</td>
          <td class="py-2 px-3 text-right text-sm">${formatRupiah(grandTotal)}</td>
        </tr>
      </tfoot>
    </table>
    <div class="bg-slate-100 p-2.5 rounded text-xs italic border border-slate-200">
      <strong>Terbilang:</strong> ${terbilang(grandTotal)}
    </div>
    ${getSignatureHTML(today)}
  `;
  openModal('modal-print');
}

// ============================================================================
// MODUL PEMBAYARAN GABUNGAN LINTAS SEMESTER
// ============================================================================
function openBayarGabunganModal() {
  const normName = document.getElementById('induk-modal-norm-name').value;
  const prof = buildUnifiedStudentProfiles('DEDUP').find((p) => p.normName === normName);
  if (!prof) return;

  document.getElementById('bayar-gab-norm-name').value = normName;
  document.getElementById('bayar-gab-subtitle').textContent = `${prof.displayName} (${prof.sheetSummaries.map((s) => s.sheet).join(' → ')})`;
  document.getElementById('bayar-gab-tanggal').value = new Date().toISOString().split('T')[0];
  document.getElementById('bayar-gab-catatan').value = '';

  const container = document.getElementById('bayar-gab-items-list');
  container.innerHTML = '';

  let hasUnpaid = false;
  prof.sheetSummaries.forEach((sh) => {
    if (sh.items.length === 0) return;
    hasUnpaid = true;

    const groupDiv = document.createElement('div');
    groupDiv.className = 'bg-white border border-slate-200 rounded-xl p-2.5 space-y-1.5';
    groupDiv.innerHTML = `<div class="text-xs font-bold text-brand-primary border-b border-slate-100 pb-1">${sh.sheet} (${sh.unit})</div>`;

    sh.items.forEach((it) => {
      const row = document.createElement('div');
      row.className = `flex items-center justify-between gap-2 p-1.5 rounded ${it.isDuplicate ? 'bg-amber-50/70' : ''}`;
      row.innerHTML = `
        <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer flex-1">
          <input type="checkbox" class="bayar-gab-check w-4 h-4"
            data-student-id="${it.studentId}"
            data-fee-idx="${it.feeIndex}"
            data-max="${it.amount}"
            data-dup="${it.isDuplicate ? '1' : '0'}"
            onchange="toggleBayarGabItem(this)" />
          <span>
            ${it.label}
            <span class="text-slate-400 font-normal">(Sisa: ${formatRupiah(it.amount)})</span>
            ${it.isDuplicate ? `<span class="ml-1 bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded">${it.duplicateReason}</span>` : ''}
          </span>
        </label>
        <input type="number" class="bayar-gab-amount w-32 border border-slate-300 rounded px-2 py-1 text-xs text-right font-semibold"
          data-student-id="${it.studentId}"
          data-fee-idx="${it.feeIndex}"
          max="${it.amount}" min="0" value="0"
          oninput="recalcBayarGabTotal()" />
      `;
      groupDiv.appendChild(row);
    });

    container.appendChild(groupDiv);
  });

  if (!hasUnpaid) {
    container.innerHTML = '<p class="text-xs text-brand-primary font-semibold text-center py-4">Seluruh tagihan lintas semester santri ini sudah LUNAS!</p>';
  }

  recalcBayarGabTotal();
  openModal('modal-bayar-gabungan');
}

function toggleBayarGabItem(chk) {
  const sid = chk.getAttribute('data-student-id');
  const fidx = chk.getAttribute('data-fee-idx');
  const maxVal = Number(chk.getAttribute('data-max'));
  const inp = document.querySelector(`.bayar-gab-amount[data-student-id="${sid}"][data-fee-idx="${fidx}"]`);
  inp.value = chk.checked ? maxVal : 0;
  recalcBayarGabTotal();
}

function checkAllBayarGabItems() {
  document.querySelectorAll('.bayar-gab-check').forEach((chk) => {
    if (chk.getAttribute('data-dup') === '0') {
      chk.checked = true;
      toggleBayarGabItem(chk);
    }
  });
}

function recalcBayarGabTotal() {
  let sum = 0;
  document.querySelectorAll('.bayar-gab-amount').forEach((inp) => {
    sum += Math.max(0, Number(inp.value) || 0);
  });
  document.getElementById('bayar-gab-total-preview').textContent = formatRupiah(sum);
}

function submitPembayaranGabungan() {
  const normName = document.getElementById('bayar-gab-norm-name').value;
  const prof = buildUnifiedStudentProfiles('DEDUP').find((p) => p.normName === normName);
  if (!prof) return;

  const tanggal = document.getElementById('bayar-gab-tanggal').value || new Date().toISOString().split('T')[0];
  const metode = document.getElementById('bayar-gab-metode').value;
  const catatan = document.getElementById('bayar-gab-catatan').value.trim();

  const paidDetails = [];
  const allSyncedAdjustments = [];
  let totalPaid = 0;
  const touchedSheets = new Set();

  document.querySelectorAll('.bayar-gab-amount').forEach((inp) => {
    const sid = inp.getAttribute('data-student-id');
    const fidx = Number(inp.getAttribute('data-fee-idx'));
    const payVal = Math.max(0, Math.round(Number(inp.value) || 0));

    if (payVal > 0) {
      const st = students.find((s) => s.id === sid);
      if (st && st.fees[fidx]) {
        const actualPay = Math.min(payVal, st.fees[fidx].amount);
        if (actualPay > 0) {
          st.fees[fidx].amount -= actualPay;
          totalPaid += actualPay;
          touchedSheets.add(st.sheet);

          const syncs = syncLinkedStudentFees(st, st.fees[fidx].label, actualPay);
          allSyncedAdjustments.push(...syncs);

          paidDetails.push({
            studentId: st.id,
            feeIndex: fidx,
            label: `[${st.sheet}] ${st.fees[fidx].label}`,
            paid: actualPay,
            remaining: st.fees[fidx].amount
          });
        }
      }
    }
  });

  if (totalPaid <= 0) {
    alert('Pilih atau masukkan nominal pembayaran minimal Rp 1.');
    return;
  }

  const noKwitansi = `KWT/ALFIRDAUS/${new Date().getFullYear()}/${String(transactions.length + 1).padStart(4, '0')}`;
  const txRecord = {
    id: 'tx-' + Date.now(),
    noKwitansi,
    tanggal,
    studentId: prof.sheetSummaries[prof.sheetSummaries.length - 1].studentId,
    nama: prof.displayName,
    sheet: [...touchedSheets].join(' + '),
    unit: prof.latestUnit,
    metode,
    catatan,
    totalPaid,
    details: paidDetails,
    syncedAdjustments: allSyncedAdjustments
  };

  transactions.unshift(txRecord);
  saveData();
  renderTable();
  renderRiwayat();
  refreshIndukDetailModal();
  closeModal('modal-bayar-gabungan');
  openPrintKwitansi(txRecord.id);
}

// ============================================================================
// MODUL PEMBAYARAN SATU SHEET & KWITANSI OTOMATIS
// ============================================================================
function openBayarModal(studentId) {
  const st = students.find((s) => s.id === studentId);
  if (!st) return;

  document.getElementById('bayar-student-id').value = st.id;
  document.getElementById('bayar-subtitle').textContent = `${st.nama} (${st.sheet} - ${st.unit})`;
  document.getElementById('bayar-tanggal').value = new Date().toISOString().split('T')[0];
  document.getElementById('bayar-catatan').value = '';

  const listContainer = document.getElementById('bayar-items-list');
  listContainer.innerHTML = '';

  const unpaidFees = st.fees.map((f, idx) => ({ ...f, idx })).filter((f) => f.amount > 0);

  if (unpaidFees.length === 0) {
    listContainer.innerHTML = '<p class="text-xs text-brand-primary font-semibold text-center py-3">Seluruh tagihan santri ini sudah LUNAS!</p>';
  } else {
    unpaidFees.forEach((f) => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-slate-200';
      row.innerHTML = `
        <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer flex-1">
          <input type="checkbox" class="bayar-check w-4 h-4" data-idx="${f.idx}" data-max="${f.amount}" onchange="toggleBayarItem(this)" />
          <span>${f.label} <span class="text-slate-400 font-normal">(Sisa: ${formatRupiah(f.amount)})</span></span>
        </label>
        <input type="number" class="bayar-amount w-32 border border-slate-300 rounded px-2 py-1 text-xs text-right font-semibold" data-idx="${f.idx}" max="${f.amount}" min="0" value="0" oninput="recalcBayarTotal()" />
      `;
      listContainer.appendChild(row);
    });
  }

  recalcBayarTotal();
  openModal('modal-bayar');
}

function toggleBayarItem(checkbox) {
  const idx = checkbox.getAttribute('data-idx');
  const maxVal = Number(checkbox.getAttribute('data-max'));
  const input = document.querySelector(`.bayar-amount[data-idx="${idx}"]`);
  input.value = checkbox.checked ? maxVal : 0;
  recalcBayarTotal();
}

function checkAllBayarItems() {
  document.querySelectorAll('.bayar-check').forEach((chk) => {
    chk.checked = true;
    toggleBayarItem(chk);
  });
}

function recalcBayarTotal() {
  let sum = 0;
  document.querySelectorAll('.bayar-amount').forEach((inp) => {
    sum += Math.max(0, Number(inp.value) || 0);
  });
  document.getElementById('bayar-total-preview').textContent = formatRupiah(sum);
}

function submitPembayaran() {
  const studentId = document.getElementById('bayar-student-id').value;
  const st = students.find((s) => s.id === studentId);
  if (!st) return;

  const tanggal = document.getElementById('bayar-tanggal').value || new Date().toISOString().split('T')[0];
  const metode = document.getElementById('bayar-metode').value;
  const catatan = document.getElementById('bayar-catatan').value.trim();

  const paidDetails = [];
  const allSyncedAdjustments = [];
  let totalPaid = 0;

  document.querySelectorAll('.bayar-amount').forEach((inp) => {
    const idx = Number(inp.getAttribute('data-idx'));
    const payVal = Math.max(0, Math.round(Number(inp.value) || 0));
    if (payVal > 0 && st.fees[idx]) {
      const actualPay = Math.min(payVal, st.fees[idx].amount);
      st.fees[idx].amount -= actualPay;
      totalPaid += actualPay;

      const syncs = syncLinkedStudentFees(st, st.fees[idx].label, actualPay);
      allSyncedAdjustments.push(...syncs);

      paidDetails.push({
        studentId: st.id,
        feeIndex: idx,
        label: st.fees[idx].label,
        paid: actualPay,
        remaining: st.fees[idx].amount
      });
    }
  });

  if (totalPaid <= 0) {
    alert('Pilih atau masukkan nominal pembayaran minimal Rp 1.');
    return;
  }

  const noKwitansi = `KWT/ALFIRDAUS/${new Date().getFullYear()}/${String(transactions.length + 1).padStart(4, '0')}`;
  const txRecord = {
    id: 'tx-' + Date.now(),
    noKwitansi,
    tanggal,
    studentId: st.id,
    nama: st.nama,
    sheet: st.sheet,
    unit: st.unit,
    metode,
    catatan,
    totalPaid,
    details: paidDetails,
    syncedAdjustments: allSyncedAdjustments
  };

  transactions.unshift(txRecord);
  saveData();
  renderTable();
  renderRiwayat();
  closeModal('modal-bayar');
  openPrintKwitansi(txRecord.id);
}

function cancelTransaction(txId) {
  const txIdx = transactions.findIndex((t) => t.id === txId);
  if (txIdx === -1) return;
  const tx = transactions[txIdx];

  if (!confirm(`Batalkan transaksi ${tx.noKwitansi} (${tx.nama} - ${formatRupiah(tx.totalPaid)})?\n\nSaldo tunggakan santri (termasuk sinkronisasi lintas semester) akan dikembalikan seperti semula.`)) {
    return;
  }

  tx.details.forEach((d) => {
    const targetSid = d.studentId || tx.studentId;
    const st = students.find((s) => s.id === targetSid);
    if (st) {
      const feeObj = (typeof d.feeIndex === 'number' && st.fees[d.feeIndex])
        ? st.fees[d.feeIndex]
        : st.fees.find((f) => f.label === d.label);
      if (feeObj) {
        feeObj.amount += Number(d.paid) || 0;
      }
    }
  });

  if (Array.isArray(tx.syncedAdjustments)) {
    tx.syncedAdjustments.forEach((adj) => {
      const st = students.find((s) => s.id === adj.studentId);
      if (st && st.fees[adj.feeIndex]) {
        st.fees[adj.feeIndex].amount += Number(adj.deducted) || 0;
      }
    });
  }

  transactions.splice(txIdx, 1);
  saveData();
  renderTable();
  renderRiwayat();
}

function renderRiwayat() {
  document.getElementById('badge-transaksi').textContent = transactions.length;
  const tbody = document.getElementById('riwayat-body');
  tbody.innerHTML = '';

  if (transactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-slate-400">Belum ada transaksi pembayaran yang dicatat.</td></tr>';
    return;
  }

  transactions.forEach((tx) => {
    const detailStr = tx.details.map((d) => `${d.label} (${formatRupiah(d.paid)})`).join(', ');
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50';
    tr.innerHTML = `
      <td class="px-4 py-3 font-mono text-xs font-bold text-brand-primary">${tx.noKwitansi}</td>
      <td class="px-4 py-3 text-xs text-slate-600">${tx.tanggal}</td>
      <td class="px-4 py-3 font-bold text-slate-800">${tx.nama}</td>
      <td class="px-4 py-3 text-xs"><span class="bg-slate-100 px-2 py-0.5 rounded font-semibold">${tx.sheet}</span></td>
      <td class="px-4 py-3 text-xs text-slate-600">${detailStr}</td>
      <td class="px-4 py-3 text-right font-bold text-brand-primary">${formatRupiah(tx.totalPaid)}</td>
      <td class="px-4 py-3 text-center">
        <div class="flex items-center justify-center gap-1.5">
          <button onclick="openPrintKwitansi('${tx.id}')" class="bg-slate-700 hover:bg-slate-800 text-white text-xs px-2.5 py-1 rounded" title="Cetak Kwitansi">
            <i class="fa-solid fa-print"></i>
          </button>
          <button onclick="sendKwitansiWA('${tx.id}')" class="bg-green-600 hover:bg-green-700 text-white text-xs px-2.5 py-1 rounded" title="Kirim Bukti Bayar via WA">
            <i class="fa-brands fa-whatsapp"></i>
          </button>
          <button onclick="cancelTransaction('${tx.id}')" class="bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs px-2 py-1 rounded" title="Batalkan / Koreksi Transaksi">
            <i class="fa-solid fa-rotate-left"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ============================================================================
// KIRIM WHATSAPP KE ORANG TUA / WALI SANTRI
// ============================================================================
function openWAModal(studentId) {
  const st = students.find((s) => s.id === studentId);
  if (!st) return;

  const cutoffFilter = document.getElementById('filter-cutoff').value;
  const { total, activeItems } = getStudentArrears(st, cutoffFilter);
  const periodeText = cutoffFilter === 'ALL' ? 'Tahun Pelajaran ' + st.tahunAjaran : `s.d. Bulan ${cutoffFilter} (${st.tahunAjaran})`;

  let rincianText = activeItems.length > 0
    ? activeItems.map((it, idx) => `${idx + 1}. ${it.label}: ${formatRupiah(it.amount)}`).join('\n')
    : '- Alhamdulillah, tidak ada tunggakan (LUNAS)';

  const msg = `Assalamu'alaikum Warahmatullahi Wabarakatuh.
Yth. Bapak/Ibu Orang Tua/Wali Santri dari:

*Nama Santri* : ${st.nama}
*Kelas / Unit* : ${st.sheet} (${st.unit})
*Periode* : ${periodeText}

Berikut kami sampaikan informasi administrasi biaya pendidikan Ponpes SIT Al Firdaus:

*Rincian Tagihan:*
${rincianText}

*TOTAL TAGIHAN : ${formatRupiah(total)}*

Mohon konfirmasi bukti transfer apabila Bapak/Ibu telah melakukan pembayaran. Atas perhatian dan kerja samanya kami ucapkan Jazakumullahu Khairan Katsiran.

Hormat kami,
*Bendahara Ponpes SIT Al Firdaus*
*Restasari, S.Sos*`;

  document.getElementById('wa-phone').value = st.wa || '';
  document.getElementById('wa-message').value = msg;
  openModal('modal-wa');
}

function sendKwitansiWA(txId) {
  const tx = transactions.find((t) => t.id === txId);
  if (!tx) return;
  const normName = normalizeStudentName(tx.nama);
  const prof = buildUnifiedStudentProfiles('DEDUP').find((p) => p.normName === normName);
  const sisaGabungan = prof ? prof.cleanTotal : 0;

  const rincian = tx.details.map((d, i) => `${i + 1}. ${d.label}: ${formatRupiah(d.paid)}`).join('\n');
  const msg = `Assalamu'alaikum Warahmatullahi Wabarakatuh.
*BUKTI PEMBAYARAN BIAYA PENDIDIKAN*
*PONPES SIT AL FIRDAUS*

No. Kwitansi : ${tx.noKwitansi}
Tanggal : ${tx.tanggal}
Nama Santri : *${tx.nama}*
Kelas / Unit : ${tx.sheet} (${tx.unit})
Metode : ${tx.metode}

*Rincian Pembayaran:*
${rincian}

*TOTAL DIBAYAR : ${formatRupiah(tx.totalPaid)}*
Sisa Tagihan Keseluruhan : ${formatRupiah(sisaGabungan)}

Terima kasih atas pembayarannya. Jazakumullahu Khairan Katsiran.

Bendahara Ponpes SIT Al Firdaus,
*Restasari, S.Sos*`;

  document.getElementById('wa-phone').value = prof ? prof.wa : '';
  document.getElementById('wa-message').value = msg;
  openModal('modal-wa');
}

function copyWAMessage() {
  const text = document.getElementById('wa-message').value;
  navigator.clipboard.writeText(text);
  alert('Teks pesan WhatsApp berhasil disalin!');
}

function sendWANow() {
  let phone = document.getElementById('wa-phone').value.replace(/[^\d]/g, '');
  if (phone.startsWith('0')) phone = '62' + phone.slice(1);
  const text = encodeURIComponent(document.getElementById('wa-message').value);
  const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
  window.open(url, '_blank');
}

// ============================================================================
// CETAK / SAVE PDF SURAT TAGIHAN & KWITANSI RESMI (DENGAN LOGO RESMI)
// ============================================================================
function getKopSuratHTML() {
  return `
    <div class="border-b-4 border-double border-slate-800 pb-3 mb-4 flex items-center justify-center gap-4">
      <img
        src="https://lh3.googleusercontent.com/d/1JCOo87mW-OXolzXoOPYp-V7z5Ya2IDD_"
        onerror="handleLogoFallback(this)"
        alt="Logo Ponpes SIT Al Firdaus"
        class="w-16 h-16 object-contain shrink-0"
      />
      <div class="text-center">
        <p class="text-[11px] font-semibold tracking-widest uppercase text-brand-primary">Yayasan Pendidikan Islam Terpadu</p>
        <h2 class="text-xl font-extrabold tracking-wide text-slate-900">PONPES SIT AL FIRDAUS BANDARLAMPUNG</h2>
        <p class="text-xs font-semibold text-slate-700">UNIT SMPIT AL FIRDAUS &bull; UNIT SMAIT AL FIRDAUS</p>
        <p class="text-[11px] text-slate-500 mt-0.5">Administrasi Keuangan &amp; Tata Usaha Bendahara</p>
      </div>
    </div>
  `;
}

function getSignatureHTML(tanggalStr) {
  return `
    <div class="mt-8 flex justify-end">
      <div class="text-center text-xs w-56">
        <p>Bandarlampung, ${tanggalStr}</p>
        <p class="font-semibold mt-0.5">Bendahara Ponpes SIT Al Firdaus,</p>
        <div class="h-16 flex items-center justify-center text-slate-300 italic text-[10px]">
          (Cap &amp; Tanda Tangan Resmi)
        </div>
        <p class="font-bold underline text-slate-900 text-sm">Restasari, S.Sos</p>
      </div>
    </div>
  `;
}

function openPrintTagihan(studentId) {
  const st = students.find((s) => s.id === studentId);
  if (!st) return;

  const cutoffFilter = document.getElementById('filter-cutoff').value;
  const { total, activeItems } = getStudentArrears(st, cutoffFilter);
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const rowsHtml = activeItems.length > 0
    ? activeItems.map((it, i) => `
        <tr class="border-b border-slate-200">
          <td class="py-2 px-3 text-center">${i + 1}</td>
          <td class="py-2 px-3">${it.label}</td>
          <td class="py-2 px-3 text-right font-semibold">${formatRupiah(it.amount)}</td>
        </tr>`).join('')
    : `<tr><td colspan="3" class="py-4 text-center text-brand-primary font-semibold">Alhamdulillah, Tidak Ada Tunggakan (LUNAS)</td></tr>`;

  document.getElementById('print-area').innerHTML = `
    ${getKopSuratHTML()}
    <div class="text-center mb-4">
      <h3 class="font-bold text-base underline uppercase">SURAT PEMBERITAHUAN RINCIAN BIAYA PENDIDIKAN</h3>
      <p class="text-xs text-slate-600">Periode: ${cutoffFilter === 'ALL' ? 'Tahun Pelajaran ' + st.tahunAjaran : 's.d. Bulan ' + cutoffFilter + ' (' + st.tahunAjaran + ')'}</p>
    </div>
    <table class="w-full text-xs mb-4">
      <tr><td class="py-1 w-36 font-semibold">Nama Santri</td><td>: <strong>${st.nama}</strong></td></tr>
      <tr><td class="py-1 font-semibold">Kelas / Unit</td><td>: ${st.sheet} (${st.unit})</td></tr>
      <tr><td class="py-1 font-semibold">Tarif SPP Dasar</td><td>: ${formatRupiah(st.sppDasar)} / bulan</td></tr>
    </table>
    <table class="w-full text-xs border border-slate-300 mb-3">
      <thead class="bg-slate-100 border-b border-slate-300">
        <tr>
          <th class="py-2 px-3 w-12">No</th>
          <th class="py-2 px-3 text-left">Komponen Biaya / Bulan</th>
          <th class="py-2 px-3 text-right">Nominal Tagihan</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot class="bg-slate-50 font-bold border-t-2 border-slate-400">
        <tr>
          <td colspan="2" class="py-2 px-3 text-right uppercase">Total Tagihan</td>
          <td class="py-2 px-3 text-right text-sm">${formatRupiah(total)}</td>
        </tr>
      </tfoot>
    </table>
    <div class="bg-slate-100 p-2.5 rounded text-xs italic border border-slate-200">
      <strong>Terbilang:</strong> ${terbilang(total)}
    </div>
    ${getSignatureHTML(today)}
  `;
  openModal('modal-print');
}

function openPrintKwitansi(txId) {
  const tx = transactions.find((t) => t.id === txId);
  if (!tx) return;

  const rowsHtml = tx.details.map((d, i) => `
    <tr class="border-b border-slate-200">
      <td class="py-2 px-3 text-center">${i + 1}</td>
      <td class="py-2 px-3">${d.label}</td>
      <td class="py-2 px-3 text-right font-semibold">${formatRupiah(d.paid)}</td>
      <td class="py-2 px-3 text-right text-slate-500">${formatRupiah(d.remaining)}</td>
    </tr>`).join('');

  document.getElementById('print-area').innerHTML = `
    ${getKopSuratHTML()}
    <div class="flex justify-between items-center mb-4">
      <div>
        <h3 class="font-bold text-base underline uppercase">KWITANSI PEMBAYARAN RESMI</h3>
        <p class="text-xs font-mono text-slate-600">No: ${tx.noKwitansi}</p>
      </div>
      <div class="text-right text-xs">
        <span class="bg-brand-primary-soft text-brand-primary font-bold px-3 py-1 rounded border border-brand-soft">SAH / DITERIMA</span>
      </div>
    </div>
    <table class="w-full text-xs mb-4">
      <tr><td class="py-1 w-36 font-semibold">Telah Terima Dari</td><td>: Orang Tua / Wali Santri <strong>${tx.nama}</strong></td></tr>
      <tr><td class="py-1 font-semibold">Kelas / Unit</td><td>: ${tx.sheet} (${tx.unit})</td></tr>
      <tr><td class="py-1 font-semibold">Metode Bayar</td><td>: ${tx.metode} ${tx.catatan ? '(' + tx.catatan + ')' : ''}</td></tr>
    </table>
    <table class="w-full text-xs border border-slate-300 mb-3">
      <thead class="bg-slate-100 border-b border-slate-300">
        <tr>
          <th class="py-2 px-3 w-12">No</th>
          <th class="py-2 px-3 text-left">Uraian Pembayaran</th>
          <th class="py-2 px-3 text-right">Jumlah Dibayar</th>
          <th class="py-2 px-3 text-right">Sisa Pos</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot class="bg-brand-primary-soft font-bold border-t-2 border-brand-soft">
        <tr>
          <td colspan="2" class="py-2 px-3 text-right uppercase">Total Diterima</td>
          <td class="py-2 px-3 text-right text-sm text-brand-primary">${formatRupiah(tx.totalPaid)}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
    <div class="bg-slate-100 p-2.5 rounded text-xs italic border border-slate-200">
      <strong>Terbilang:</strong> ${terbilang(tx.totalPaid)}
    </div>
    ${getSignatureHTML(tx.tanggal)}
  `;
  openModal('modal-print');
}

function printRekapSummary() {
  const cutoffFilter = document.getElementById('filter-cutoff').value;
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const rekapRowsHtml = document.getElementById('rekap-body').innerHTML;
  const rekapFootHtml = document.getElementById('rekap-foot').innerHTML;

  document.getElementById('print-area').innerHTML = `
    ${getKopSuratHTML()}
    <div class="text-center mb-4">
      <h3 class="font-bold text-base underline uppercase">LAPORAN REKAPITULASI TUNGGAKAN BIAYA PENDIDIKAN</h3>
      <p class="text-xs text-slate-600">Periode Cut-off: ${cutoffFilter === 'ALL' ? 'Semua Bulan' : 's.d. Bulan ' + cutoffFilter}</p>
    </div>
    <table class="w-full text-xs border border-slate-300">
      <thead class="bg-slate-100 border-b border-slate-300">
        <tr>
          <th class="px-3 py-2">No</th>
          <th class="px-3 py-2 text-left">Kelas / Sheet</th>
          <th class="px-3 py-2 text-left">Unit</th>
          <th class="px-3 py-2 text-left">Semester</th>
          <th class="px-3 py-2">Jml Santri</th>
          <th class="px-3 py-2">Lunas</th>
          <th class="px-3 py-2">Menunggak</th>
          <th class="px-3 py-2 text-right">Total Tunggakan</th>
        </tr>
      </thead>
      <tbody>${rekapRowsHtml}</tbody>
      <tfoot>${rekapFootHtml}</tfoot>
    </table>
    ${getSignatureHTML(today)}
  `;
  openModal('modal-print');
}

// ============================================================================
// TAMBAH, EDIT, HAPUS SANTRI & BUAT KELAS / SEMESTER BARU
// ============================================================================
function openAddStudentModal() {
  const currentSheetFilter = document.getElementById('filter-sheet').value;
  document.getElementById('edit-modal-title').textContent = 'Tambah Data Santri Baru';
  document.getElementById('edit-student-id').value = '';
  document.getElementById('edit-nama').value = '';
  document.getElementById('edit-wa').value = '';
  document.getElementById('edit-sheet').value = currentSheetFilter !== 'ALL' ? currentSheetFilter : '7 smt 1';
  document.getElementById('edit-spp').value = 850000;
  document.getElementById('btn-delete-student').classList.add('hidden');

  const isSmt2 = detectSheetSemester(document.getElementById('edit-sheet').value) === 'SMT2';
  applyFeeTemplate(isSmt2 ? 'SMT2' : 'SMT1');
  openModal('modal-edit');
}

function openEditModal(studentId) {
  const st = students.find((s) => s.id === studentId);
  if (!st) return;

  document.getElementById('edit-modal-title').textContent = `Edit Data: ${st.nama}`;
  document.getElementById('edit-student-id').value = st.id;
  document.getElementById('edit-nama').value = st.nama;
  document.getElementById('edit-wa').value = st.wa || '';
  document.getElementById('edit-sheet').value = st.sheet;
  document.getElementById('edit-spp').value = st.sppDasar;
  document.getElementById('btn-delete-student').classList.remove('hidden');

  const container = document.getElementById('edit-fees-container');
  container.innerHTML = '';
  st.fees.forEach((f) => addEditFeeRow(f.label, f.amount));
  openModal('modal-edit');
}

function applyFeeTemplate(type) {
  const sppVal = parseNumericCell(document.getElementById('edit-spp').value);
  const container = document.getElementById('edit-fees-container');
  container.innerHTML = '';

  if (type === 'SMT1') {
    addEditFeeRow('U. Pangkal', 0);
    ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].forEach((m) => {
      addEditFeeRow(m, sppVal);
    });
  } else if (type === 'SMT2') {
    addEditFeeRow('smt 1 + U. Pangkal', 0);
    ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'].forEach((m) => {
      addEditFeeRow(m, sppVal);
    });
  }
}

function addEditFeeRow(label = '', amount = 0) {
  const container = document.getElementById('edit-fees-container');
  const div = document.createElement('div');
  div.className = 'flex items-center gap-2 edit-fee-row';
  div.innerHTML = `
    <input type="text" placeholder="Nama Pos (misal: Oktober / Daftar Ulang)" value="${label}" class="fee-label flex-1 border border-slate-300 rounded px-2.5 py-1.5 text-xs" />
    <input type="number" placeholder="Nominal (Rp)" value="${amount}" class="fee-val w-36 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-right" />
    <button type="button" onclick="this.parentElement.remove()" class="text-rose-500 hover:text-rose-700 px-2"><i class="fa-solid fa-trash"></i></button>
  `;
  container.appendChild(div);
}

function saveStudentEdit() {
  const id = document.getElementById('edit-student-id').value;
  const nama = document.getElementById('edit-nama').value.trim();
  const wa = document.getElementById('edit-wa').value.trim();
  const sheet = document.getElementById('edit-sheet').value.trim() || 'Umum';
  const sppDasar = parseNumericCell(document.getElementById('edit-spp').value);

  if (!nama) {
    alert('Nama santri wajib diisi.');
    return;
  }

  const fees = [];
  document.querySelectorAll('.edit-fee-row').forEach((row) => {
    const lbl = row.querySelector('.fee-label').value.trim();
    const val = parseNumericCell(row.querySelector('.fee-val').value);
    if (lbl) {
      const mKey = detectMonthKey(lbl);
      fees.push({ label: lbl, amount: val, type: mKey ? 'monthly' : 'fixed', monthKey: mKey });
    }
  });

  if (id) {
    const idx = students.findIndex((s) => s.id === id);
    if (idx !== -1) {
      students[idx] = { ...students[idx], nama, wa, sheet, unit: inferUnitFromSheet(sheet), sppDasar, fees };
    }
  } else {
    students.push({
      id: 'st-' + Date.now(),
      sheet,
      unit: inferUnitFromSheet(sheet),
      tahunAjaran: '2026-2027',
      nama,
      wa,
      sppDasar,
      fees
    });
  }

  if (wa) {
    const norm = normalizeStudentName(nama);
    students.forEach((s) => {
      if (normalizeStudentName(s.nama) === norm) s.wa = wa;
    });
  }

  saveData();
  populateSheetFilter();
  renderTable();
  closeModal('modal-edit');
}

function deleteCurrentStudent() {
  const id = document.getElementById('edit-student-id').value;
  const st = students.find((s) => s.id === id);
  if (!st) return;

  if (!confirm(`Yakin ingin menghapus data santri "${st.nama}" (${st.sheet}) secara permanen?`)) return;

  students = students.filter((s) => s.id !== id);
  saveData();
  populateSheetFilter();
  renderTable();
  closeModal('modal-edit');
}

// ============================================================================
// BUAT KELAS / SEMESTER BARU (MIGRASI MASSAL ANTAR SEMESTER)
// ============================================================================
function openNewClassModal() {
  document.getElementById('newclass-name').value = '';
  const sourceSelect = document.getElementById('newclass-source');
  const uniqueSheets = [...new Set(students.map((s) => s.sheet))];

  sourceSelect.innerHTML = '<option value="">-- Buat Kelas Kosong (Tambah Santri Manual Nanti) --</option>';
  uniqueSheets.forEach((sh) => {
    const count = students.filter((s) => s.sheet === sh).length;
    const opt = document.createElement('option');
    opt.value = sh;
    opt.textContent = `Salin dari: ${sh} (${count} santri)`;
    sourceSelect.appendChild(opt);
  });

  document.getElementById('newclass-migration-options').classList.add('hidden');
  openModal('modal-new-class');
}

function createNewClass() {
  const newSheetName = document.getElementById('newclass-name').value.trim();
  const sourceSheet = document.getElementById('newclass-source').value;

  if (!newSheetName) {
    alert('Nama Kelas / Sheet baru wajib diisi (contoh: 10 smt 2).');
    return;
  }

  const alreadyExists = students.some((s) => s.sheet.toLowerCase() === newSheetName.toLowerCase());
  if (alreadyExists) {
    alert(`Kelas / Sheet "${newSheetName}" sudah ada. Gunakan nama lain.`);
    return;
  }

  if (!sourceSheet) {
    const isSmt2 = detectSheetSemester(newSheetName) === 'SMT2';
    const months = isSmt2
      ? ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni']
      : ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    students.push({
      id: 'st-' + Date.now(),
      sheet: newSheetName,
      unit: inferUnitFromSheet(newSheetName),
      tahunAjaran: '2026-2027',
      nama: 'Santri Baru (' + newSheetName + ')',
      wa: '',
      sppDasar: 850000,
      fees: [
        { label: isSmt2 ? 'smt 1 + U. Pangkal' : 'U. Pangkal', amount: 0, type: 'fixed', monthKey: null },
        ...months.map((m) => ({ label: m, amount: 0, type: 'monthly', monthKey: m.toLowerCase() }))
      ]
    });
  } else {
    const carryArrears = document.getElementById('newclass-carry-arrears').checked;
    const monthsMode = document.getElementById('newclass-months').value;
    const sourceStudents = students.filter((s) => s.sheet === sourceSheet);

    sourceStudents.forEach((src, i) => {
      const { total: prevArrears } = getStudentArrears(src, 'ALL');
      const newFees = [];

      if (carryArrears) {
        newFees.push({
          label: `Sisa ${sourceSheet}`,
          amount: prevArrears,
          type: 'fixed',
          monthKey: null
        });
      }

      if (monthsMode === 'SMT2') {
        ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'].forEach((m) => {
          newFees.push({ label: m, amount: src.sppDasar, type: 'monthly', monthKey: m.toLowerCase() });
        });
      } else if (monthsMode === 'SMT1') {
        ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].forEach((m) => {
          newFees.push({ label: m, amount: src.sppDasar, type: 'monthly', monthKey: m.toLowerCase() });
        });
      }

      students.push({
        id: `st-${Date.now()}-${i}`,
        sheet: newSheetName,
        unit: inferUnitFromSheet(newSheetName),
        tahunAjaran: src.tahunAjaran || '2026-2027',
        nama: src.nama,
        wa: src.wa || '',
        sppDasar: src.sppDasar,
        fees: newFees
      });
    });
  }

  saveData();
  populateSheetFilter();
  document.getElementById('filter-unit').value = 'ALL';
  document.getElementById('filter-semester').value = 'ALL';
  document.getElementById('filter-sheet').value = newSheetName;
  document.getElementById('filter-cutoff').value = 'ALL';
  renderTable();
  closeModal('modal-new-class');
  alert(`Kelas / Semester "${newSheetName}" berhasil dibuat dan terhubung ke Kartu Induk Santri!`);
}

// ============================================================================
// EXPORT REKAP EXCEL & BACKUP JSON
// ============================================================================
function exportToExcel() {
  const unitFilter = document.getElementById('filter-unit').value;
  const smtFilter = document.getElementById('filter-semester').value;
  const sheetFilter = document.getElementById('filter-sheet').value;
  const cutoffFilter = document.getElementById('filter-cutoff').value;

  const wb = XLSX.utils.book_new();

  const targetStudents = students.filter((st) => {
    if (unitFilter !== 'ALL' && detectSheetCategory(st.sheet) !== unitFilter) return false;
    if (smtFilter !== 'ALL' && detectSheetSemester(st.sheet) !== smtFilter) return false;
    if (sheetFilter !== 'ALL' && st.sheet !== sheetFilter) return false;
    return true;
  });

  // Sheet 1: Ringkasan per Kelas / Semester
  const grouped = {};
  targetStudents.forEach((st) => {
    if (!grouped[st.sheet]) {
      grouped[st.sheet] = {
        'Kelas / Sheet': st.sheet,
        Unit: st.unit,
        Semester: getSemesterLabel(detectSheetSemester(st.sheet)),
        'Jumlah Santri': 0,
        'Santri Lunas': 0,
        'Santri Menunggak': 0,
        'Total Nominal Tunggakan': 0
      };
    }
    const { total } = getStudentArrears(st, cutoffFilter);
    grouped[st.sheet]['Jumlah Santri']++;
    if (total === 0) grouped[st.sheet]['Santri Lunas']++;
    else grouped[st.sheet]['Santri Menunggak']++;
    grouped[st.sheet]['Total Nominal Tunggakan'] += total;
  });
  const wsSummary = XLSX.utils.json_to_sheet(Object.values(grouped));
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan per Kelas');

  // Sheet 2: Kartu Induk Gabungan Lintas Semester (Anti-Ganda)
  const unifiedProfiles = buildUnifiedStudentProfiles('DEDUP');
  const indukRows = unifiedProfiles.map((p, idx) => ({
    No: idx + 1,
    'Nama Santri': p.displayName,
    'Unit Terakhir': p.latestUnit,
    'No WA Wali': p.wa || '-',
    'Riwayat Kelas / Semester': p.sheetSummaries.map((s) => s.sheet).join(' -> '),
    'Rincian per Semester': p.sheetSummaries.map((s) => `${s.sheet}: ${s.cleanSum}`).join('; '),
    'Total Tunggakan Bersih Gabungan': p.cleanTotal,
    Status: p.cleanTotal === 0 ? 'LUNAS' : 'MENUNGGAK'
  }));
  const wsInduk = XLSX.utils.json_to_sheet(indukRows);
  XLSX.utils.book_append_sheet(wb, wsInduk, 'Kartu Induk Lintas Smt');

  // Sheet 3: Rincian per Santri (Per Baris Sheet)
  const allRows = targetStudents.map((st, idx) => {
    const { total, activeItems } = getStudentArrears(st, cutoffFilter);
    return {
      No: idx + 1,
      'Nama Santri': st.nama,
      'Kelas / Sheet': st.sheet,
      Unit: st.unit,
      Semester: getSemesterLabel(detectSheetSemester(st.sheet)),
      'No WA Wali': st.wa || '-',
      'SPP Dasar': st.sppDasar,
      'Rincian Tunggakan': activeItems.map((i) => `${i.label}: ${i.amount}`).join('; ') || 'LUNAS',
      [`Total Tunggakan (${cutoffFilter === 'ALL' ? 'Semua Bulan' : 's.d ' + cutoffFilter})`]: total,
      Status: total === 0 ? 'LUNAS' : 'MENUNGGAK'
    };
  });
  const wsAll = XLSX.utils.json_to_sheet(allRows);
  XLSX.utils.book_append_sheet(wb, wsAll, 'Rincian per Sheet');

  // Sheet 4: Riwayat Pembayaran
  if (transactions.length > 0) {
    const txRows = transactions.map((t) => ({
      'No Kwitansi': t.noKwitansi,
      Tanggal: t.tanggal,
      'Nama Santri': t.nama,
      Kelas: t.sheet,
      Metode: t.metode,
      Rincian: t.details.map((d) => `${d.label}: ${d.paid}`).join('; '),
      'Total Dibayar': t.totalPaid
    }));
    const wsTx = XLSX.utils.json_to_sheet(txRows);
    XLSX.utils.book_append_sheet(wb, wsTx, 'Riwayat Pembayaran');
  }

  const fileName = `Rekap_Keuangan_AlFirdaus_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

function backupJSON() {
  const payload = {
    instansi: 'Ponpes SIT Al Firdaus Bandarlampung',
    bendahara: 'Restasari, S.Sos',
    exportedAt: new Date().toISOString(),
    students,
    transactions
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Backup_Keuangan_AlFirdaus_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleJSONRestore(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (Array.isArray(parsed.students)) {
        students = parsed.students;
        transactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
        saveData();
        populateSheetFilter();
        renderTable();
        renderRiwayat();
        alert('Data berhasil dipulihkan dari file backup!');
      } else {
        alert('Format file JSON tidak valid.');
      }
    } catch (err) {
      alert('Gagal membaca file backup JSON.');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

// ============================================================================
// NAVIGASI TAB & MODAL
// ============================================================================
function switchTab(tabName) {
  ['tagihan', 'induk', 'rekap', 'riwayat'].forEach((name) => {
    document.getElementById(`view-${name}`).classList.toggle('hidden', name !== tabName);
    const btn = document.getElementById(`tab-${name}`);
    if (name === tabName) {
      btn.className = 'tab-btn btn-brand-primary px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition';
    } else {
      btn.className = 'tab-btn bg-white text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 transition';
    }
  });

  const showGlobalFilter = tabName === 'tagihan' || tabName === 'rekap';
  document.getElementById('global-filter-bar').classList.toggle('hidden', !showGlobalFilter);
}

function openModal(id) {
  const el = document.getElementById(id);
  el.classList.remove('hidden');
  el.classList.add('flex');
}

function closeModal(id) {
  const el = document.getElementById(id);
  el.classList.add('hidden');
  el.classList.remove('flex');
}
