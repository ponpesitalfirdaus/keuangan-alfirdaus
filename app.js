// ============================================================================
// SISTEM PENCATATAN & REKAPITULASI BIAYA PENDIDIKAN (CLOUD FIREBASE EDITION v2)
// INSTANSI : PONPES SIT AL FIRDAUS BANDARLAMPUNG (SMPIT / SMAIT AL FIRDAUS)
// BENDAHARA: RESTASARI, S.Sos
// ============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  setDoc,
  onSnapshot,
  writeBatch,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

// Konfigurasi Proyek Firebase: keuangan-alfirdaus
const firebaseConfig = {
  apiKey: "AIzaSyC4sTKd_Pp3W4ncXolZud5GhjK5O-GCgvE",
  authDomain: "keuangan-alfirdaus.firebaseapp.com",
  projectId: "keuangan-alfirdaus",
  storageBucket: "keuangan-alfirdaus.firebasestorage.app",
  messagingSenderId: "797090689943",
  appId: "1:797090689943:web:17852a2c6fc9960f5bcad2"
};

// Inisialisasi Firebase, Auth, dan Firestore dengan Cache Offline Multi-Tab
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Kunci penyimpanan lokal lama (untuk fitur migrasi 1-klik ke Cloud)
const LEGACY_STORAGE_STUDENTS = 'alfirdaus_students_v1';
const LEGACY_STORAGE_TX = 'alfirdaus_transactions_v1';

// Link resmi logo Google Drive Ponpes SIT Al Firdaus Bandarlampung
const DRIVE_FILE_ID = '1JCOo87mW-OXolzXoOPYp-V7z5Ya2IDD_';
const LOGO_URLS = [
  `https://lh3.googleusercontent.com/d/${DRIVE_FILE_ID}`,
  `https://drive.google.com/thumbnail?id=${DRIVE_FILE_ID}&sz=w500`,
  `https://drive.google.com/uc?export=view&id=${DRIVE_FILE_ID}`
];

const MONTH_ORDER = [
  'juli', 'agustus', 'september', 'oktober', 'november', 'desember',
  'januari', 'februari', 'maret', 'april', 'mei', 'juni'
];

let students = [];
let transactions = [];
let auditLogs = [];
let appSettings = {
  bendahara: 'Restasari, S.Sos',
  rekening: '',
  catatanSurat: 'Mohon menyertakan nama lengkap santri & kelas pada berita transfer.'
};

let unsubStudents = null;
let unsubTransactions = null;
let unsubAuditLogs = null;
let unsubSettings = null;
let uiListenersAttached = false;
let isSubmittingPayment = false;
const sentWATodaySet = new Set();

// Data contoh awal (opsional jika database masih kosong)
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
  }
];

// ============================================================================
// LOGO FALLBACK
// ============================================================================
function handleLogoFallback(imgEl) {
  const attempt = Number(imgEl.getAttribute('data-attempt') || '0') + 1;
  if (attempt < LOGO_URLS.length) {
    imgEl.setAttribute('data-attempt', String(attempt));
    imgEl.src = LOGO_URLS[attempt];
  }
}

// ============================================================================
// HELPER OPERASI CLOUD FIRESTORE (BATCH ATOMIK + LOG JEJAK AUDIT)
// ============================================================================
async function commitFirestoreOps(operations) {
  const CHUNK_SIZE = 400;
  for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
    const chunk = operations.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((op) => {
      const ref = doc(db, op.collection, op.id);
      if (op.type === 'delete') {
        batch.delete(ref);
      } else {
        batch.set(ref, {
          ...op.data,
          updatedAt: serverTimestamp()
        });
      }
    });
    await batch.commit();
  }
}

async function logAuditAction(action, summary) {
  try {
    const userEmail = auth.currentUser ? auth.currentUser.email : 'unknown';
    await addDoc(collection(db, 'audit_logs'), {
      action,
      summary,
      actorEmail: userEmail,
      actorName: appSettings.bendahara || 'Restasari, S.Sos',
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Audit log dilewati:', err);
  }
}

function generateNextKwitansiNumber() {
  const year = new Date().getFullYear();
  const prefix = `KWT/ALFIRDAUS/${year}/`;
  let maxSeq = 0;
  transactions.forEach((tx) => {
    const no = String(tx.noKwitansi || '');
    if (no.startsWith(prefix)) {
      const seqPart = parseInt(no.slice(prefix.length), 10);
      if (!isNaN(seqPart) && seqPart > maxSeq) {
        maxSeq = seqPart;
      }
    }
  });
  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
}

function updateCloudSyncBadge(isFromCache) {
  const badge = document.getElementById('cloud-sync-badge');
  if (!badge) return;
  if (isFromCache || !navigator.onLine) {
    badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-200 border border-amber-300/40';
    badge.innerHTML = '<i class="fa-solid fa-wifi text-amber-300"></i><span>Mode Offline • Tersimpan Lokal</span>';
  } else {
    badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-400/20 text-sky-200 border border-sky-300/30';
    badge.innerHTML = '<i class="fa-solid fa-cloud-check text-sky-300"></i><span>Cloud Terhubung • Real-Time</span>';
  }
}

function checkEmptyCloudBanner() {
  const banner = document.getElementById('cloud-empty-banner');
  const btnMigrate = document.getElementById('btn-migrate-local');
  const btnMigrateText = document.getElementById('btn-migrate-local-text');
  const descEl = document.getElementById('cloud-empty-desc');

  if (!banner) return;

  if (students.length > 0) {
    banner.classList.add('hidden');
    return;
  }

  banner.classList.remove('hidden');

  let legacyStudents = [];
  let legacyTx = [];
  try {
    legacyStudents = JSON.parse(localStorage.getItem(LEGACY_STORAGE_STUDENTS) || '[]');
    legacyTx = JSON.parse(localStorage.getItem(LEGACY_STORAGE_TX) || '[]');
  } catch (e) {
    legacyStudents = [];
  }

  if (Array.isArray(legacyStudents) && legacyStudents.length > 0) {
    btnMigrate.classList.remove('hidden');
    btnMigrateText.textContent = `Migrasi ${legacyStudents.length} Data Santri Lama ke Cloud`;
    descEl.innerHTML = `Ditemukan <b>${legacyStudents.length} data santri</b> dan <b>${legacyTx.length} riwayat transaksi</b> dari penyimpanan lokal browser Anda. Klik tombol biru muda di samping untuk memindahkan semuanya ke Cloud Firestore.`;
  } else {
    btnMigrate.classList.add('hidden');
    descEl.textContent = 'Silakan klik tombol "Import Excel (.xlsx)" di pojok kanan atas untuk mengunggah file rekap tagihan Anda, atau isi data contoh awal.';
  }
}

async function migrateLocalToFirestore() {
  let legacyStudents = [];
  let legacyTx = [];
  try {
    legacyStudents = JSON.parse(localStorage.getItem(LEGACY_STORAGE_STUDENTS) || '[]');
    legacyTx = JSON.parse(localStorage.getItem(LEGACY_STORAGE_TX) || '[]');
  } catch (e) {
    alert('Data lokal tidak terbaca.');
    return;
  }

  if (legacyStudents.length === 0) {
    alert('Tidak ada data lokal lama yang ditemukan di browser ini.');
    return;
  }

  const btn = document.getElementById('btn-migrate-local');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i><span>Memindahkan ke Cloud...</span>';

  try {
    const ops = [];
    legacyStudents.forEach((st) => {
      ops.push({ collection: 'students', id: st.id, data: st });
    });
    legacyTx.forEach((tx) => {
      ops.push({ collection: 'transactions', id: tx.id, data: tx });
    });

    await commitFirestoreOps(ops);
    await logAuditAction('MIGRATE_LOCAL', `Migrasi ${legacyStudents.length} santri & ${legacyTx.length} transaksi ke Cloud`);
    alert(`Berhasil memindahkan ${legacyStudents.length} data santri dan ${legacyTx.length} transaksi ke Cloud Firestore!`);
  } catch (err) {
    console.error(err);
    alert('Gagal memigrasi data ke Cloud: ' + err.message);
  } finally {
    btn.disabled = false;
  }
}

async function seedInitialSampleToFirestore() {
  if (!confirm('Isi database Cloud dengan 4 data contoh awal (untuk uji coba)?')) return;
  try {
    const ops = INITIAL_SAMPLE_DATA.map((st) => ({
      collection: 'students',
      id: st.id,
      data: st
    }));
    await commitFirestoreOps(ops);
    await logAuditAction('SEED_SAMPLE', 'Mengisi 4 data contoh awal ke Cloud');
  } catch (err) {
    alert('Gagal mengisi data contoh: ' + err.message);
  }
}

// ============================================================================
// FIREBASE AUTHENTICATION & SINKRONISASI REAL-TIME FIRESTORE
// ============================================================================
onAuthStateChanged(auth, (user) => {
  const loadingScreen = document.getElementById('auth-loading-screen');
  const loginScreen = document.getElementById('login-screen');
  const appContainer = document.getElementById('app-container');

  loadingScreen.classList.add('hidden');

  if (user) {
    loginScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');
    document.getElementById('navbar-user-email').textContent = user.email || 'Bendahara Aktif';
    attachUIEventListenersOnce();
    startFirestoreListeners();
  } else {
    stopFirestoreListeners();
    appContainer.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    document.getElementById('login-password').value = '';
  }
});

function attachUIEventListenersOnce() {
  if (uiListenersAttached) return;
  document.getElementById('excel-upload').addEventListener('change', handleExcelUpload);
  document.getElementById('json-restore').addEventListener('change', handleJSONRestore);
  document.getElementById('newclass-source').addEventListener('change', (e) => {
    const optBox = document.getElementById('newclass-migration-options');
    optBox.classList.toggle('hidden', !e.target.value);
  });
  window.addEventListener('online', () => updateCloudSyncBadge(false));
  window.addEventListener('offline', () => updateCloudSyncBadge(true));
  uiListenersAttached = true;
}

function startFirestoreListeners() {
  stopFirestoreListeners();

  // 1. Listener Real-Time Koleksi Santri
  unsubStudents = onSnapshot(
    collection(db, 'students'),
    { includeMetadataChanges: true },
    (snapshot) => {
      updateCloudSyncBadge(snapshot.metadata.fromCache);
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => {
        const rankDiff = getSheetChronologicalRank(a.sheet) - getSheetChronologicalRank(b.sheet);
        if (rankDiff !== 0) return rankDiff;
        return String(a.nama || '').localeCompare(String(b.nama || ''), 'id');
      });

      students = list;
      checkEmptyCloudBanner();
      populateSheetFilter();
      renderTable();

      const indukModal = document.getElementById('modal-induk');
      if (indukModal && !indukModal.classList.contains('hidden')) {
        refreshIndukDetailModal();
      }
      const bulkModal = document.getElementById('modal-bulk-wa');
      if (bulkModal && !bulkModal.classList.contains('hidden')) {
        renderBulkWAList();
      }
    },
    (error) => {
      console.error('Firestore students listener error:', error);
      alert('Gagal memuat data dari Cloud Firestore: ' + error.message);
    }
  );

  // 2. Listener Real-Time Koleksi Transaksi Pembayaran
  unsubTransactions = onSnapshot(
    collection(db, 'transactions'),
    (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => String(b.noKwitansi || '').localeCompare(String(a.noKwitansi || '')));
      transactions = list;
      updateCashSummaryStats();
      renderRiwayat();
    },
    (error) => {
      console.error('Firestore transactions listener error:', error);
    }
  );

  // 3. Listener Real-Time Jejak Audit (100 Aktivitas Terbaru)
  const auditQuery = query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc'), limit(100));
  unsubAuditLogs = onSnapshot(
    auditQuery,
    (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      auditLogs = list;
      document.getElementById('badge-audit').textContent = auditLogs.length;
      renderAuditLogs();
    },
    (error) => {
      console.warn('Audit logs listener info:', error.message);
    }
  );

  // 4. Listener Real-Time Pengaturan Rekening & Profil Instansi
  unsubSettings = onSnapshot(
    doc(db, 'settings', 'general'),
    (docSnap) => {
      if (docSnap.exists()) {
        appSettings = { ...appSettings, ...docSnap.data() };
      }
    },
    (error) => {
      console.warn('Settings listener info:', error.message);
    }
  );
}

function stopFirestoreListeners() {
  if (unsubStudents) { unsubStudents(); unsubStudents = null; }
  if (unsubTransactions) { unsubTransactions(); unsubTransactions = null; }
  if (unsubAuditLogs) { unsubAuditLogs(); unsubAuditLogs = null; }
  if (unsubSettings) { unsubSettings(); unsubSettings = null; }
  students = [];
  transactions = [];
  auditLogs = [];
}

function updateCashSummaryStats() {
  const todayStr = new Date().toISOString().split('T')[0];
  let totalAll = 0;
  let totalToday = 0;

  transactions.forEach((tx) => {
    const amt = Number(tx.totalPaid) || 0;
    totalAll += amt;
    if (tx.tanggal === todayStr) {
      totalToday += amt;
    }
  });

  const elTotal = document.getElementById('stat-kas-total');
  const elToday = document.getElementById('stat-kas-hari-ini');
  if (elTotal) elTotal.textContent = formatRupiah(totalAll);
  if (elToday) elToday.textContent = `Hari ini: ${formatRupiah(totalToday)}`;
}

function translateFirebaseAuthError(code) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email atau Password salah. Periksa kembali akun Bendahara Anda.';
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa menit lalu coba lagi.';
    case 'auth/network-request-failed':
      return 'Koneksi internet bermasalah. Pastikan perangkat terhubung ke internet untuk login pertama kali.';
    default:
      return 'Gagal masuk (' + code + ').';
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const remember = document.getElementById('login-remember').checked;

  const errBox = document.getElementById('login-error');
  const errText = document.getElementById('login-error-text');
  const infoBox = document.getElementById('login-info');
  const btn = document.getElementById('btn-login-submit');

  errBox.classList.add('hidden');
  infoBox.classList.add('hidden');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i><span>Memverifikasi Akun...</span>';

  try {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    errText.textContent = translateFirebaseAuthError(err.code);
    errBox.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i><span>Masuk ke Sistem Keuangan</span>';
  }
}

async function logoutBendahara() {
  if (!confirm('Keluar dan kunci halaman keuangan sekarang?')) return;
  try {
    await signOut(auth);
  } catch (err) {
    alert('Gagal keluar: ' + err.message);
  }
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

async function openResetPasswordPrompt() {
  const currentInput = document.getElementById('login-email').value.trim();
  const email = prompt('Masukkan alamat Email Bendahara untuk menerima tautan reset password:', currentInput);
  if (!email) return;

  try {
    await sendPasswordResetEmail(auth, email.trim());
    const infoBox = document.getElementById('login-info');
    const infoText = document.getElementById('login-info-text');
    infoText.textContent = `Tautan pengaturan ulang password telah dikirim ke ${email.trim()}. Silakan periksa kotak masuk / folder Spam.`;
    infoBox.classList.remove('hidden');
  } catch (err) {
    alert('Gagal mengirim email reset password: ' + translateFirebaseAuthError(err.code));
  }
}

function openAccountModal() {
  const user = auth.currentUser;
  document.getElementById('acc-email').value = user ? user.email : '';
  document.getElementById('acc-old-password').value = '';
  document.getElementById('acc-new-password').value = '';
  document.getElementById('acc-confirm-password').value = '';
  openModal('modal-account');
}

async function saveAccountCredentials(event) {
  event.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const oldPass = document.getElementById('acc-old-password').value;
  const newPass = document.getElementById('acc-new-password').value;
  const confirmPass = document.getElementById('acc-confirm-password').value;

  if (newPass !== confirmPass) {
    alert('Konfirmasi password baru tidak cocok.');
    return;
  }

  const btn = document.getElementById('btn-save-account');
  btn.disabled = true;

  try {
    const credential = EmailAuthProvider.credential(user.email, oldPass);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPass);
    closeModal('modal-account');
    alert('Password akun Bendahara berhasil diperbarui di Cloud!');
  } catch (err) {
    alert('Gagal memperbarui password: ' + translateFirebaseAuthError(err.code));
  } finally {
    btn.disabled = false;
  }
}

// ============================================================================
// PENGATURAN REKENING & CATATAN TAGIHAN (CLOUD SETTINGS)
// ============================================================================
function openSettingsModal() {
  document.getElementById('set-bendahara').value = appSettings.bendahara || 'Restasari, S.Sos';
  document.getElementById('set-rekening').value = appSettings.rekening || '';
  document.getElementById('set-catatan-surat').value = appSettings.catatanSurat || '';
  openModal('modal-settings');
}

async function saveAppSettings(event) {
  event.preventDefault();
  const btn = document.getElementById('btn-save-settings');
  btn.disabled = true;

  const payload = {
    bendahara: document.getElementById('set-bendahara').value.trim() || 'Restasari, S.Sos',
    rekening: document.getElementById('set-rekening').value.trim(),
    catatanSurat: document.getElementById('set-catatan-surat').value.trim(),
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, 'settings', 'general'), payload, { merge: true });
    await logAuditAction('UPDATE_SETTINGS', 'Memperbarui pengaturan rekening & info pembayaran Cloud');
    closeModal('modal-settings');
    alert('Pengaturan rekening & info pembayaran berhasil disimpan ke Cloud!');
  } catch (err) {
    alert('Gagal menyimpan pengaturan: ' + err.message);
  } finally {
    btn.disabled = false;
  }
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

      (rec.fees || []).forEach((fee, feeIdx) => {
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

function computeLinkedStudentSyncs(sourceStudent, paidFeeLabel, paidAmount, touchedStudentMap) {
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
    const clone = touchedStudentMap[sib.id] || JSON.parse(JSON.stringify(sib));
    const sibRank = getSheetChronologicalRank(clone.sheet);
    let modified = false;

    clone.fees.forEach((f, idx) => {
      if (f.amount <= 0 || f.type !== 'fixed') return;
      const sameFixed = normalizeFixedFeeKey(f.label) === paidNormKey;
      const isLaterCarryOver = sibRank > sourceRank && isCarryOverSummaryLabel(f.label);

      if (sameFixed || isLaterCarryOver) {
        const deduct = Math.min(f.amount, paidAmount);
        if (deduct > 0) {
          f.amount -= deduct;
          modified = true;
          adjustments.push({
            studentId: clone.id,
            feeIndex: idx,
            label: f.label,
            deducted: deduct
          });
        }
      }
    });

    if (modified) {
      touchedStudentMap[clone.id] = clone;
    }
  });

  return adjustments;
}

// ============================================================================
// PARSER FILE EXCEL & UNGGAH MASSAL KE CLOUD FIRESTORE
// ============================================================================
function handleExcelUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
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

          const safeSheetId = sheetName.replace(/[^a-zA-Z0-9_-]/g, '_');
          parsedStudents.push({
            id: `st-${safeSheetId}-${r}`,
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

      if (!confirm(`Ditemukan ${parsedStudents.length} data baris dari ${workbook.SheetNames.length} sheet.\n\nData di Cloud Firestore akan diperbarui sesuai file Excel ini (Nomor WA yang sudah tersimpan tetap dipertahankan). Lanjutkan?`)) {
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

      const newIdSet = new Set(parsedStudents.map((s) => s.id));
      const ops = [];

      students.forEach((oldSt) => {
        if (!newIdSet.has(oldSt.id)) {
          ops.push({ type: 'delete', collection: 'students', id: oldSt.id });
        }
      });

      parsedStudents.forEach((st) => {
        ops.push({ type: 'set', collection: 'students', id: st.id, data: st });
      });

      await commitFirestoreOps(ops);
      await logAuditAction('IMPORT_EXCEL', `Import ${parsedStudents.length} baris dari file ${file.name}`);
      alert(`Berhasil mengimpor & menyinkronkan ${parsedStudents.length} data santri ke Cloud Firestore!`);
    } catch (err) {
      console.error(err);
      alert('Gagal memproses file Excel: ' + err.message);
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

  (student.fees || []).forEach((fee, idx) => {
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
      ? 'bg-sky-100 text-sky-900 border-sky-300'
      : smtCode === 'ALUMNI'
        ? 'bg-slate-100 text-slate-700 border-slate-300'
        : 'bg-blue-100 text-blue-950 border-blue-300';

    const linkedBadge = linkedCount > 1
      ? `<button onclick="openIndukDetailModal('${escapedNorm}')" class="ml-1.5 inline-flex items-center gap-1 bg-sky-100 hover:bg-sky-200 text-blue-950 border border-sky-300 text-[10px] font-bold px-1.5 py-0.5 rounded" title="Klik untuk buka Kartu Induk Gabungan Lintas Semester"><i class="fa-solid fa-link text-sky-700"></i> ${linkedCount} Smt</button>`
      : '';

    const badgesHtml = activeItems.length > 0
      ? activeItems.map((it) => `<span class="inline-block bg-rose-50 text-rose-700 border border-rose-200 text-[11px] px-2 py-0.5 rounded mr-1 mb-1">${it.label}: <b>${formatRupiah(it.amount)}</b></span>`).join('')
      : '<span class="text-xs text-sky-700 italic">Tidak ada tunggakan</span>';

    const statusBadge = total === 0
      ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-blue-950 border border-sky-300">LUNAS</span>'
      : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">MENUNGGAK</span>';

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-sky-50/60 transition';
    tr.innerHTML = `
      <td class="px-4 py-3 text-slate-500">${i + 1}</td>
      <td class="px-4 py-3">
        <div class="font-bold text-blue-950 flex items-center flex-wrap">
          <span>${st.nama}</span>
          ${linkedBadge}
        </div>
        <div class="text-[11px] text-slate-400 mt-0.5">${st.wa ? '<i class="fa-brands fa-whatsapp text-green-600"></i> ' + st.wa : 'No. WA belum diisi'}</div>
      </td>
      <td class="px-4 py-3">
        <div class="flex flex-wrap items-center gap-1">
          <span class="bg-blue-950 text-white font-bold text-xs px-2 py-0.5 rounded">${st.sheet}</span>
          <span class="border text-[10px] font-semibold px-1.5 py-0.5 rounded ${smtBadgeColor}">${getSemesterLabel(smtCode)}</span>
        </div>
        <div class="text-[11px] text-slate-500 mt-0.5">${st.unit}</div>
      </td>
      <td class="px-4 py-3 text-right font-medium text-slate-600">${formatRupiah(st.sppDasar)}</td>
      <td class="px-4 py-3 max-w-xs">${badgesHtml}</td>
      <td class="px-4 py-3 text-right font-bold ${total > 0 ? 'text-rose-600' : 'text-blue-900'}">${formatRupiah(total)}</td>
      <td class="px-4 py-3 text-center">${statusBadge}</td>
      <td class="px-4 py-3">
        <div class="flex items-center justify-center gap-1">
          <button onclick="openBayarModal('${st.id}')" class="btn-brand-primary text-xs px-2 py-1.5 rounded-lg font-semibold" title="Catat Pembayaran Kelas Ini">
            <i class="fa-solid fa-cash-register"></i> Bayar
          </button>
          <button onclick="openIndukDetailModal('${escapedNorm}')" class="bg-sky-600 hover:bg-sky-700 text-white text-xs px-2 py-1.5 rounded-lg font-semibold" title="Buka Kartu Induk Gabungan Lintas Semester">
            <i class="fa-solid fa-id-card"></i>
          </button>
          <button onclick="openWAModal('${st.id}')" class="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1.5 rounded-lg" title="Kirim Tagihan via WhatsApp">
            <i class="fa-brands fa-whatsapp"></i>
          </button>
          <button onclick="openPrintTagihan('${st.id}')" class="bg-slate-800 hover:bg-slate-900 text-white text-xs px-2 py-1.5 rounded-lg" title="Cetak Surat Tagihan PDF">
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
    tr.className = 'hover:bg-sky-50/60 cursor-pointer';
    tr.title = 'Klik untuk melihat detail santri kelas ini';
    tr.onclick = () => {
      document.getElementById('filter-sheet').value = g.sheet;
      switchTab('tagihan');
      renderTable();
    };
    tr.innerHTML = `
      <td class="px-4 py-3 text-slate-500">${idx + 1}</td>
      <td class="px-4 py-3 font-bold text-blue-900 underline">${g.sheet}</td>
      <td class="px-4 py-3 text-slate-600">${g.unit}</td>
      <td class="px-4 py-3 text-xs font-semibold text-sky-800">${g.semester}</td>
      <td class="px-4 py-3 text-center">${g.totalSantri}</td>
      <td class="px-4 py-3 text-center text-blue-900 font-semibold">${g.lunas}</td>
      <td class="px-4 py-3 text-center text-rose-600 font-semibold">${g.menunggak}</td>
      <td class="px-4 py-3 text-right font-bold text-blue-950">${formatRupiah(g.nominal)}</td>
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
      .map((s) => `<span class="inline-block bg-sky-100 text-blue-950 border border-sky-300 text-[11px] font-bold px-2 py-0.5 rounded">${s.sheet}</span>`)
      .join(' <i class="fa-solid fa-arrow-right text-[9px] text-sky-500 mx-0.5"></i> ');

    const breakdownHtml = p.sheetSummaries
      .map((s) => {
        const subVal = dedupMode === 'DEDUP' ? s.cleanSum : s.rawSum;
        return `<div class="text-xs flex items-center justify-between gap-3 py-0.5 border-b border-blue-50 last:border-0">
          <span class="text-slate-600 font-medium">${s.sheet}:</span>
          <span class="font-bold ${subVal > 0 ? 'text-rose-600' : 'text-blue-900'}">${formatRupiah(subVal)}</span>
        </div>`;
      })
      .join('');

    const statusBadge = totalVal === 0
      ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-blue-950 border border-sky-300">LUNAS</span>'
      : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">MENUNGGAK</span>';

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-sky-50/60 transition';
    tr.innerHTML = `
      <td class="px-4 py-3 text-slate-500">${idx + 1}</td>
      <td class="px-4 py-3">
        <div class="font-bold text-blue-950">${p.displayName}</div>
        <div class="text-[11px] text-slate-500">${p.latestUnit}</div>
        <div class="text-[11px] text-slate-400">${p.wa ? '<i class="fa-brands fa-whatsapp text-green-600"></i> ' + p.wa : 'No. WA belum diisi'}</div>
      </td>
      <td class="px-4 py-3">
        <div class="flex flex-wrap items-center gap-y-1">${chainHtml}</div>
        ${p.duplicatedAmount > 0 && dedupMode === 'DEDUP'
          ? `<div class="text-[10px] text-sky-700 mt-1"><i class="fa-solid fa-shield-halved mr-1"></i>Anti-ganda: ${formatRupiah(p.duplicatedAmount)} pos bawaan disesuaikan</div>`
          : ''}
      </td>
      <td class="px-4 py-3 min-w-[190px]">${breakdownHtml}</td>
      <td class="px-4 py-3 text-right font-extrabold text-sm ${totalVal > 0 ? 'text-rose-600' : 'text-blue-900'}">${formatRupiah(totalVal)}</td>
      <td class="px-4 py-3 text-center">${statusBadge}</td>
      <td class="px-4 py-3 text-center">
        <button onclick="openIndukDetailModal('${escapedNorm}')" class="btn-brand-primary text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm">
          <i class="fa-solid fa-id-card text-sky-300 mr-1"></i>Buka Kartu Induk
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
    noteEl.innerHTML = `<i class="fa-solid fa-circle-info text-sky-700 mr-1"></i>Pos bawaan/duplikat lintas semester sebesar <b>${formatRupiah(prof.duplicatedAmount)}</b> otomatis dikecualikan agar tidak tertagih ganda.`;
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
    card.className = 'border border-blue-200 rounded-xl overflow-hidden bg-white shadow-sm';

    const itemsRows = sh.items.length > 0
      ? sh.items.map((it) => `
          <tr class="border-b border-blue-50 last:border-0 ${it.isDuplicate ? 'bg-amber-50/60 text-slate-400' : ''}">
            <td class="px-3 py-2 text-xs font-medium">
              <span class="${it.isDuplicate ? 'line-through' : 'text-slate-700'}">${it.label}</span>
              ${it.isDuplicate ? `<span class="ml-1.5 inline-block bg-amber-100 text-amber-800 text-[10px] font-semibold px-1.5 py-0.5 rounded">${it.duplicateReason}</span>` : ''}
            </td>
            <td class="px-3 py-2 text-xs text-right font-semibold ${it.isDuplicate ? 'line-through text-slate-400' : 'text-rose-700'}">
              ${formatRupiah(it.amount)}
            </td>
          </tr>`).join('')
      : `<tr><td colspan="2" class="px-3 py-3 text-center text-xs text-blue-900 font-semibold">Alhamdulillah, seluruh pos di kelas ini sudah LUNAS</td></tr>`;

    card.innerHTML = `
      <div class="bg-sky-50 px-3.5 py-2.5 flex items-center justify-between border-b border-blue-100">
        <div>
          <span class="font-bold text-xs text-blue-950">${sh.sheet}</span>
          <span class="text-[11px] text-slate-500 ml-1.5">(${sh.unit} &bull; SPP: ${formatRupiah(sh.sppDasar)})</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold ${subTotal > 0 ? 'text-rose-700' : 'text-blue-900'}">Subtotal: ${formatRupiah(subTotal)}</span>
          <button onclick="openEditModal('${sh.studentId}'); closeModal('modal-induk');" class="text-[11px] bg-white hover:bg-sky-100 text-blue-950 px-2 py-0.5 rounded border border-sky-300" title="Edit Pos Kelas Ini">
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

async function saveIndukWA() {
  const normName = document.getElementById('induk-modal-norm-name').value;
  const newWa = document.getElementById('induk-modal-wa').value.trim();

  const matching = students.filter((s) => normalizeStudentName(s.nama) === normName);
  if (matching.length === 0) return;

  try {
    const ops = matching.map((s) => ({
      type: 'set',
      collection: 'students',
      id: s.id,
      data: { ...s, wa: newWa }
    }));
    await commitFirestoreOps(ops);
    alert('Nomor WhatsApp wali santri berhasil disimpan ke Cloud & disinkronkan ke seluruh kelas/semester santri ini!');
  } catch (err) {
    alert('Gagal menyimpan nomor WA: ' + err.message);
  }
}

function getPaymentFooterWABlock() {
  if (!appSettings.rekening) return '';
  return `\n\n*Informasi Rekening Pembayaran:*\n${appSettings.rekening}`;
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

*TOTAL TAGIHAN GABUNGAN : ${formatRupiah(grandTotal)}*${getPaymentFooterWABlock()}

Mohon konfirmasi bukti transfer apabila Bapak/Ibu telah melakukan pembayaran. Atas perhatian dan kerja samanya kami ucapkan Jazakumullahu Khairan Katsiran.

Hormat kami,
*Bendahara Ponpes SIT Al Firdaus*
*${appSettings.bendahara || 'Restasari, S.Sos'}*`;

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
          <td class="py-2 px-3 font-semibold text-blue-950">${sh.sheet}</td>
          <td class="py-2 px-3">${it.label}</td>
          <td class="py-2 px-3 text-right font-semibold">${formatRupiah(it.amount)}</td>
        </tr>`;
    });
  });

  if (!rowsHtml) {
    rowsHtml = `<tr><td colspan="4" class="py-4 text-center text-blue-900 font-semibold">Alhamdulillah, Seluruh Tagihan Lintas Semester Sudah LUNAS</td></tr>`;
  }

  document.getElementById('print-area').innerHTML = `
    ${getKopSuratHTML()}
    <div class="text-center mb-4">
      <h3 class="font-bold text-base underline uppercase text-blue-950">KARTU INDUK REKAPITULASI BIAYA PENDIDIKAN</h3>
      <p class="text-xs text-slate-600">Rekap Gabungan Lintas Semester &amp; Jenjang</p>
    </div>
    <table class="w-full text-xs mb-4">
      <tr><td class="py-1 w-40 font-semibold">Nama Santri</td><td>: <strong>${prof.displayName}</strong></td></tr>
      <tr><td class="py-1 font-semibold">Unit Pendidikan</td><td>: ${prof.latestUnit}</td></tr>
      <tr><td class="py-1 font-semibold">Riwayat Kelas / Smt</td><td>: ${prof.sheetSummaries.map((s) => s.sheet).join(' → ')}</td></tr>
    </table>
    <table class="w-full text-xs border border-blue-200 mb-3">
      <thead class="bg-blue-950 text-white border-b border-blue-900">
        <tr>
          <th class="py-2 px-3 w-12">No</th>
          <th class="py-2 px-3 text-left">Kelas / Semester</th>
          <th class="py-2 px-3 text-left">Komponen Biaya / Bulan</th>
          <th class="py-2 px-3 text-right">Nominal Tagihan</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot class="bg-sky-100 font-bold border-t-2 border-blue-900 text-blue-950">
        <tr>
          <td colspan="3" class="py-2 px-3 text-right uppercase">Total Tagihan Gabungan</td>
          <td class="py-2 px-3 text-right text-sm">${formatRupiah(grandTotal)}</td>
        </tr>
      </tfoot>
    </table>
    <div class="bg-sky-50 p-2.5 rounded text-xs italic border border-sky-200">
      <strong>Terbilang:</strong> ${terbilang(grandTotal)}
    </div>
    ${getRekeningBoxHTML()}
    ${getSignatureHTML(today)}
  `;
  openModal('modal-print');
}

// ============================================================================
// MODUL PEMBAYARAN GABUNGAN LINTAS SEMESTER (SIMPAN KE CLOUD)
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
    groupDiv.className = 'bg-white border border-blue-100 rounded-xl p-2.5 space-y-1.5';
    groupDiv.innerHTML = `<div class="text-xs font-bold text-blue-950 border-b border-sky-100 pb-1">${sh.sheet} (${sh.unit})</div>`;

    sh.items.forEach((it) => {
      const row = document.createElement('div');
      row.className = `flex items-center justify-between gap-2 p-1.5 rounded ${it.isDuplicate ? 'bg-amber-50/70' : ''}`;
      row.innerHTML = `
        <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer flex-1">
          <input type="checkbox" class="bayar-gab-check w-4 h-4 accent-blue-900"
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
    container.innerHTML = '<p class="text-xs text-blue-900 font-semibold text-center py-4">Seluruh tagihan lintas semester santri ini sudah LUNAS!</p>';
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

async function submitPembayaranGabungan() {
  if (isSubmittingPayment) return;
  const normName = document.getElementById('bayar-gab-norm-name').value;
  const prof = buildUnifiedStudentProfiles('DEDUP').find((p) => p.normName === normName);
  if (!prof) return;

  const tanggal = document.getElementById('bayar-gab-tanggal').value || new Date().toISOString().split('T')[0];
  const metode = document.getElementById('bayar-gab-metode').value;
  const catatan = document.getElementById('bayar-gab-catatan').value.trim();

  const touchedStudentMap = {};
  const paidDetails = [];
  const allSyncedAdjustments = [];
  let totalPaid = 0;
  const touchedSheets = new Set();

  document.querySelectorAll('.bayar-gab-amount').forEach((inp) => {
    const sid = inp.getAttribute('data-student-id');
    const fidx = Number(inp.getAttribute('data-fee-idx'));
    const payVal = Math.max(0, Math.round(Number(inp.value) || 0));

    if (payVal > 0) {
      const origSt = students.find((s) => s.id === sid);
      if (origSt && origSt.fees[fidx]) {
        const clone = touchedStudentMap[sid] || JSON.parse(JSON.stringify(origSt));
        const actualPay = Math.min(payVal, clone.fees[fidx].amount);
        if (actualPay > 0) {
          clone.fees[fidx].amount -= actualPay;
          touchedStudentMap[sid] = clone;
          totalPaid += actualPay;
          touchedSheets.add(clone.sheet);

          const syncs = computeLinkedStudentSyncs(clone, clone.fees[fidx].label, actualPay, touchedStudentMap);
          allSyncedAdjustments.push(...syncs);

          paidDetails.push({
            studentId: clone.id,
            feeIndex: fidx,
            label: `[${clone.sheet}] ${clone.fees[fidx].label}`,
            paid: actualPay,
            remaining: clone.fees[fidx].amount
          });
        }
      }
    }
  });

  if (totalPaid <= 0) {
    alert('Pilih atau masukkan nominal pembayaran minimal Rp 1.');
    return;
  }

  const btn = document.getElementById('btn-submit-bayar-gab');
  isSubmittingPayment = true;
  if (btn) btn.disabled = true;

  const noKwitansi = generateNextKwitansiNumber();
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

  try {
    const ops = Object.values(touchedStudentMap).map((stObj) => ({
      type: 'set',
      collection: 'students',
      id: stObj.id,
      data: stObj
    }));
    ops.push({ type: 'set', collection: 'transactions', id: txRecord.id, data: txRecord });

    await commitFirestoreOps(ops);
    await logAuditAction('PAYMENT_COMBINED', `Kwitansi ${noKwitansi} (${prof.displayName}): ${formatRupiah(totalPaid)}`);

    transactions.unshift(txRecord);
    closeModal('modal-bayar-gabungan');
    openPrintKwitansi(txRecord.id);
  } catch (err) {
    alert('Gagal menyimpan pembayaran gabungan: ' + err.message);
  } finally {
    isSubmittingPayment = false;
    if (btn) btn.disabled = false;
  }
}

// ============================================================================
// MODUL PEMBAYARAN SATU SHEET & KWITANSI OTOMATIS (SIMPAN KE CLOUD)
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

  const unpaidFees = (st.fees || []).map((f, idx) => ({ ...f, idx })).filter((f) => f.amount > 0);

  if (unpaidFees.length === 0) {
    listContainer.innerHTML = '<p class="text-xs text-blue-900 font-semibold text-center py-3">Seluruh tagihan santri ini sudah LUNAS!</p>';
  } else {
    unpaidFees.forEach((f) => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-blue-100';
      row.innerHTML = `
        <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer flex-1">
          <input type="checkbox" class="bayar-check w-4 h-4 accent-blue-900" data-idx="${f.idx}" data-max="${f.amount}" onchange="toggleBayarItem(this)" />
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

async function submitPembayaran() {
  if (isSubmittingPayment) return;
  const studentId = document.getElementById('bayar-student-id').value;
  const origSt = students.find((s) => s.id === studentId);
  if (!origSt) return;

  const tanggal = document.getElementById('bayar-tanggal').value || new Date().toISOString().split('T')[0];
  const metode = document.getElementById('bayar-metode').value;
  const catatan = document.getElementById('bayar-catatan').value.trim();

  const touchedStudentMap = {};
  const cloneSt = JSON.parse(JSON.stringify(origSt));
  touchedStudentMap[cloneSt.id] = cloneSt;

  const paidDetails = [];
  const allSyncedAdjustments = [];
  let totalPaid = 0;

  document.querySelectorAll('.bayar-amount').forEach((inp) => {
    const idx = Number(inp.getAttribute('data-idx'));
    const payVal = Math.max(0, Math.round(Number(inp.value) || 0));
    if (payVal > 0 && cloneSt.fees[idx]) {
      const actualPay = Math.min(payVal, cloneSt.fees[idx].amount);
      cloneSt.fees[idx].amount -= actualPay;
      totalPaid += actualPay;

      const syncs = computeLinkedStudentSyncs(cloneSt, cloneSt.fees[idx].label, actualPay, touchedStudentMap);
      allSyncedAdjustments.push(...syncs);

      paidDetails.push({
        studentId: cloneSt.id,
        feeIndex: idx,
        label: cloneSt.fees[idx].label,
        paid: actualPay,
        remaining: cloneSt.fees[idx].amount
      });
    }
  });

  if (totalPaid <= 0) {
    alert('Pilih atau masukkan nominal pembayaran minimal Rp 1.');
    return;
  }

  const btn = document.getElementById('btn-submit-bayar');
  isSubmittingPayment = true;
  if (btn) btn.disabled = true;

  const noKwitansi = generateNextKwitansiNumber();
  const txRecord = {
    id: 'tx-' + Date.now(),
    noKwitansi,
    tanggal,
    studentId: cloneSt.id,
    nama: cloneSt.nama,
    sheet: cloneSt.sheet,
    unit: cloneSt.unit,
    metode,
    catatan,
    totalPaid,
    details: paidDetails,
    syncedAdjustments: allSyncedAdjustments
  };

  try {
    const ops = Object.values(touchedStudentMap).map((stObj) => ({
      type: 'set',
      collection: 'students',
      id: stObj.id,
      data: stObj
    }));
    ops.push({ type: 'set', collection: 'transactions', id: txRecord.id, data: txRecord });

    await commitFirestoreOps(ops);
    await logAuditAction('PAYMENT', `Kwitansi ${noKwitansi} (${cloneSt.nama} - ${cloneSt.sheet}): ${formatRupiah(totalPaid)}`);

    transactions.unshift(txRecord);
    closeModal('modal-bayar');
    openPrintKwitansi(txRecord.id);
  } catch (err) {
    alert('Gagal menyimpan pembayaran: ' + err.message);
  } finally {
    isSubmittingPayment = false;
    if (btn) btn.disabled = false;
  }
}

async function cancelTransaction(txId) {
  const tx = transactions.find((t) => t.id === txId);
  if (!tx) return;

  if (!confirm(`Batalkan transaksi ${tx.noKwitansi} (${tx.nama} - ${formatRupiah(tx.totalPaid)})?\n\nSaldo tunggakan santri (termasuk sinkronisasi lintas semester) di Cloud akan dikembalikan seperti semula.`)) {
    return;
  }

  const touchedStudentMap = {};

  tx.details.forEach((d) => {
    const targetSid = d.studentId || tx.studentId;
    const origSt = students.find((s) => s.id === targetSid);
    if (origSt) {
      const clone = touchedStudentMap[targetSid] || JSON.parse(JSON.stringify(origSt));
      const feeObj = (typeof d.feeIndex === 'number' && clone.fees[d.feeIndex])
        ? clone.fees[d.feeIndex]
        : clone.fees.find((f) => f.label === d.label);
      if (feeObj) {
        feeObj.amount += Number(d.paid) || 0;
        touchedStudentMap[targetSid] = clone;
      }
    }
  });

  if (Array.isArray(tx.syncedAdjustments)) {
    tx.syncedAdjustments.forEach((adj) => {
      const origSt = students.find((s) => s.id === adj.studentId);
      if (origSt) {
        const clone = touchedStudentMap[adj.studentId] || JSON.parse(JSON.stringify(origSt));
        if (clone.fees[adj.feeIndex]) {
          clone.fees[adj.feeIndex].amount += Number(adj.deducted) || 0;
          touchedStudentMap[adj.studentId] = clone;
        }
      }
    });
  }

  try {
    const ops = Object.values(touchedStudentMap).map((stObj) => ({
      type: 'set',
      collection: 'students',
      id: stObj.id,
      data: stObj
    }));
    ops.push({ type: 'delete', collection: 'transactions', id: tx.id });

    await commitFirestoreOps(ops);
    await logAuditAction('CANCEL_TX', `Membatalkan transaksi ${tx.noKwitansi} (${tx.nama} - ${formatRupiah(tx.totalPaid)})`);
  } catch (err) {
    alert('Gagal membatalkan transaksi: ' + err.message);
  }
}

// ============================================================================
// RIWAYAT KAS & LAPORAN TUTUP KAS HARIAN / BULANAN
// ============================================================================
function getFilteredTransactions() {
  const start = document.getElementById('riwayat-date-start')?.value || '';
  const end = document.getElementById('riwayat-date-end')?.value || '';
  const metode = document.getElementById('riwayat-metode')?.value || 'ALL';
  const search = (document.getElementById('riwayat-search')?.value || '').toLowerCase().trim();

  return transactions.filter((tx) => {
    if (start && tx.tanggal < start) return false;
    if (end && tx.tanggal > end) return false;
    if (metode !== 'ALL' && tx.metode !== metode) return false;
    if (search) {
      const matchNama = String(tx.nama || '').toLowerCase().includes(search);
      const matchKwt = String(tx.noKwitansi || '').toLowerCase().includes(search);
      if (!matchNama && !matchKwt) return false;
    }
    return true;
  });
}

function resetRiwayatFilter() {
  document.getElementById('riwayat-date-start').value = '';
  document.getElementById('riwayat-date-end').value = '';
  document.getElementById('riwayat-metode').value = 'ALL';
  document.getElementById('riwayat-search').value = '';
  renderRiwayat();
}

function renderRiwayat() {
  document.getElementById('badge-transaksi').textContent = transactions.length;
  const tbody = document.getElementById('riwayat-body');
  tbody.innerHTML = '';

  const filteredTx = getFilteredTransactions();
  let sumTotal = 0;
  let sumTunai = 0;
  let sumTransfer = 0;

  filteredTx.forEach((tx) => {
    const amt = Number(tx.totalPaid) || 0;
    sumTotal += amt;
    if (String(tx.metode || '').toLowerCase().includes('tunai')) sumTunai += amt;
    else sumTransfer += amt;
  });

  document.getElementById('riwayat-sum-total').textContent = formatRupiah(sumTotal);
  document.getElementById('riwayat-sum-tunai').textContent = formatRupiah(sumTunai);
  document.getElementById('riwayat-sum-transfer').textContent = formatRupiah(sumTransfer);

  if (filteredTx.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-slate-400">Tidak ada transaksi pembayaran yang sesuai filter.</td></tr>';
    return;
  }

  filteredTx.forEach((tx) => {
    const detailStr = (tx.details || []).map((d) => `${d.label} (${formatRupiah(d.paid)})`).join(', ');
    const isTunai = String(tx.metode || '').toLowerCase().includes('tunai');
    const metodeBadge = isTunai
      ? '<span class="inline-block bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold px-1.5 py-0.5 rounded mt-1">Tunai</span>'
      : '<span class="inline-block bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-semibold px-1.5 py-0.5 rounded mt-1">Transfer</span>';

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-sky-50/60';
    tr.innerHTML = `
      <td class="px-4 py-3 font-mono text-xs font-bold text-blue-900">${tx.noKwitansi}</td>
      <td class="px-4 py-3 text-xs text-slate-600">${tx.tanggal}</td>
      <td class="px-4 py-3 font-bold text-blue-950">${tx.nama}</td>
      <td class="px-4 py-3 text-xs">
        <div><span class="bg-sky-100 text-blue-950 border border-sky-200 px-2 py-0.5 rounded font-semibold">${tx.sheet}</span></div>
        <div>${metodeBadge}</div>
      </td>
      <td class="px-4 py-3 text-xs text-slate-600">${detailStr}</td>
      <td class="px-4 py-3 text-right font-bold text-blue-900">${formatRupiah(tx.totalPaid)}</td>
      <td class="px-4 py-3 text-center">
        <div class="flex items-center justify-center gap-1.5">
          <button onclick="openPrintKwitansi('${tx.id}')" class="bg-slate-800 hover:bg-slate-900 text-white text-xs px-2.5 py-1 rounded" title="Cetak Kwitansi">
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

function printLaporanKas() {
  const filteredTx = getFilteredTransactions();
  const start = document.getElementById('riwayat-date-start').value;
  const end = document.getElementById('riwayat-date-end').value;
  const metode = document.getElementById('riwayat-metode').value;
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  let periodeLabel = 'Semua Tanggal Transaksi';
  if (start && end) periodeLabel = `Periode ${start} s.d. ${end}`;
  else if (start) periodeLabel = `Mulai Tanggal ${start}`;
  else if (end) periodeLabel = `Sampai Tanggal ${end}`;
  if (metode !== 'ALL') periodeLabel += ` (${metode})`;

  let sumTotal = 0;
  let sumTunai = 0;
  let sumTransfer = 0;

  const rowsHtml = filteredTx.length > 0
    ? filteredTx.map((tx, idx) => {
        const amt = Number(tx.totalPaid) || 0;
        sumTotal += amt;
        if (String(tx.metode || '').toLowerCase().includes('tunai')) sumTunai += amt;
        else sumTransfer += amt;
        const detailStr = (tx.details || []).map((d) => `${d.label}: ${formatRupiah(d.paid)}`).join('; ');
        return `
          <tr class="border-b border-slate-200">
            <td class="py-1.5 px-2 text-center">${idx + 1}</td>
            <td class="py-1.5 px-2 font-mono text-[10px]">${tx.noKwitansi}</td>
            <td class="py-1.5 px-2">${tx.tanggal}</td>
            <td class="py-1.5 px-2 font-semibold">${tx.nama} (${tx.sheet})</td>
            <td class="py-1.5 px-2">${tx.metode}</td>
            <td class="py-1.5 px-2">${detailStr}</td>
            <td class="py-1.5 px-2 text-right font-semibold">${formatRupiah(amt)}</td>
          </tr>`;
      }).join('')
    : `<tr><td colspan="7" class="py-4 text-center text-slate-400">Tidak ada transaksi pada periode ini.</td></tr>`;

  document.getElementById('print-area').innerHTML = `
    ${getKopSuratHTML()}
    <div class="text-center mb-4">
      <h3 class="font-bold text-base underline uppercase text-blue-950">LAPORAN PENERIMAAN KAS BIAYA PENDIDIKAN</h3>
      <p class="text-xs text-slate-600">${periodeLabel}</p>
    </div>
    <table class="w-full text-[11px] border border-blue-200 mb-3">
      <thead class="bg-blue-950 text-white">
        <tr>
          <th class="py-2 px-2">No</th>
          <th class="py-2 px-2 text-left">No. Kwitansi</th>
          <th class="py-2 px-2 text-left">Tanggal</th>
          <th class="py-2 px-2 text-left">Santri &amp; Kelas</th>
          <th class="py-2 px-2 text-left">Metode</th>
          <th class="py-2 px-2 text-left">Uraian Pembayaran</th>
          <th class="py-2 px-2 text-right">Nominal</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot class="bg-sky-100 font-bold border-t-2 border-blue-900 text-blue-950">
        <tr>
          <td colspan="6" class="py-2 px-2 text-right uppercase">Total Kas Masuk (${filteredTx.length} Transaksi)</td>
          <td class="py-2 px-2 text-right text-xs">${formatRupiah(sumTotal)}</td>
        </tr>
      </tfoot>
    </table>
    <div class="grid grid-cols-2 gap-3 text-xs bg-sky-50 p-3 rounded border border-sky-200 mb-2">
      <div><strong>Rincian Tunai (Kas):</strong> ${formatRupiah(sumTunai)}</div>
      <div><strong>Rincian Transfer Bank:</strong> ${formatRupiah(sumTransfer)}</div>
      <div class="col-span-2 italic"><strong>Terbilang:</strong> ${terbilang(sumTotal)}</div>
    </div>
    ${getSignatureHTML(today)}
  `;
  openModal('modal-print');
}

// ============================================================================
// RENDER TAB JEJAK AUDIT AKTIVITAS CLOUD
// ============================================================================
function renderAuditLogs() {
  const filterAct = document.getElementById('audit-filter-action')?.value || 'ALL';
  const tbody = document.getElementById('audit-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const filtered = auditLogs.filter((log) => {
    const act = String(log.action || '');
    if (filterAct === 'ALL') return true;
    if (filterAct === 'PAYMENT') return act.startsWith('PAYMENT');
    if (filterAct === 'CANCEL_TX') return act === 'CANCEL_TX';
    if (filterAct === 'STUDENT') return act.includes('STUDENT') || act === 'CREATE_CLASS';
    if (filterAct === 'IMPORT') return act.includes('IMPORT') || act.includes('MIGRATE') || act.includes('RESTORE') || act.includes('SEED');
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-slate-400">Belum ada catatan aktivitas Cloud yang tercatat.</td></tr>';
    return;
  }

  filtered.forEach((log) => {
    let timeStr = 'Baru saja (Sinkron Lokal)';
    if (log.createdAt && typeof log.createdAt.toDate === 'function') {
      timeStr = log.createdAt.toDate().toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    }

    const act = String(log.action || 'INFO');
    let badgeClass = 'bg-slate-100 text-slate-700 border-slate-300';
    if (act.startsWith('PAYMENT')) badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    else if (act === 'CANCEL_TX' || act === 'DELETE_STUDENT') badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
    else if (act.includes('IMPORT') || act.includes('RESTORE') || act.includes('MIGRATE')) badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
    else badgeClass = 'bg-sky-50 text-blue-950 border-sky-200';

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-sky-50/40';
    tr.innerHTML = `
      <td class="px-4 py-3 text-xs text-slate-500 font-mono">${timeStr}</td>
      <td class="px-4 py-3"><span class="inline-block border text-[10px] font-bold px-2 py-0.5 rounded ${badgeClass}">${act}</span></td>
      <td class="px-4 py-3 text-xs text-slate-700 font-medium">${log.summary || '-'}</td>
      <td class="px-4 py-3 text-xs text-slate-500">${log.actorEmail || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ============================================================================
// KIRIM WHATSAPP KE ORANG TUA / WALI SANTRI & ANTREAN WA MASSAL
// ============================================================================
function buildSingleStudentWAMessage(st) {
  const cutoffFilter = document.getElementById('filter-cutoff').value;
  const { total, activeItems } = getStudentArrears(st, cutoffFilter);
  const periodeText = cutoffFilter === 'ALL' ? 'Tahun Pelajaran ' + st.tahunAjaran : `s.d. Bulan ${cutoffFilter} (${st.tahunAjaran})`;

  let rincianText = activeItems.length > 0
    ? activeItems.map((it, idx) => `${idx + 1}. ${it.label}: ${formatRupiah(it.amount)}`).join('\n')
    : '- Alhamdulillah, tidak ada tunggakan (LUNAS)';

  return `Assalamu'alaikum Warahmatullahi Wabarakatuh.
Yth. Bapak/Ibu Orang Tua/Wali Santri dari:

*Nama Santri* : ${st.nama}
*Kelas / Unit* : ${st.sheet} (${st.unit})
*Periode* : ${periodeText}

Berikut kami sampaikan informasi administrasi biaya pendidikan Ponpes SIT Al Firdaus:

*Rincian Tagihan:*
${rincianText}

*TOTAL TAGIHAN : ${formatRupiah(total)}*${getPaymentFooterWABlock()}

Mohon konfirmasi bukti transfer apabila Bapak/Ibu telah melakukan pembayaran. Atas perhatian dan kerja samanya kami ucapkan Jazakumullahu Khairan Katsiran.

Hormat kami,
*Bendahara Ponpes SIT Al Firdaus*
*${appSettings.bendahara || 'Restasari, S.Sos'}*`;
}

function openWAModal(studentId) {
  const st = students.find((s) => s.id === studentId);
  if (!st) return;

  document.getElementById('wa-phone').value = st.wa || '';
  document.getElementById('wa-message').value = buildSingleStudentWAMessage(st);
  openModal('modal-wa');
}

function openBulkWAModal() {
  const sheetSelect = document.getElementById('bulk-wa-sheet-filter');
  const currentSheet = document.getElementById('filter-sheet').value;
  const allSheets = [...new Set(students.map((s) => s.sheet))];

  sheetSelect.innerHTML = '<option value="ALL">Semua Kelas Menunggak</option>';
  allSheets.forEach((sh) => {
    const opt = document.createElement('option');
    opt.value = sh;
    opt.textContent = sh;
    sheetSelect.appendChild(opt);
  });
  sheetSelect.value = allSheets.includes(currentSheet) ? currentSheet : 'ALL';

  renderBulkWAList();
  openModal('modal-bulk-wa');
}

function renderBulkWAList() {
  const cutoffFilter = document.getElementById('filter-cutoff').value;
  const sheetFilter = document.getElementById('bulk-wa-sheet-filter').value;
  const onlyWithPhone = document.getElementById('bulk-wa-only-phone').checked;

  const targets = students.filter((st) => {
    if (sheetFilter !== 'ALL' && st.sheet !== sheetFilter) return false;
    const { total } = getStudentArrears(st, cutoffFilter);
    if (total <= 0) return false;
    if (onlyWithPhone && !String(st.wa || '').trim()) return false;
    return true;
  });

  document.getElementById('bulk-wa-count').textContent = targets.length;
  const tbody = document.getElementById('bulk-wa-body');
  tbody.innerHTML = '';

  if (targets.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-slate-400">Tidak ada santri menunggak pada filter antrean ini.</td></tr>';
    return;
  }

  targets.forEach((st, idx) => {
    const { total } = getStudentArrears(st, cutoffFilter);
    const isSent = sentWATodaySet.has(st.id);
    const tr = document.createElement('tr');
    tr.className = isSent ? 'bg-emerald-50/50' : 'hover:bg-sky-50/50';
    tr.innerHTML = `
      <td class="px-3 py-2 text-slate-500">${idx + 1}</td>
      <td class="px-3 py-2">
        <div class="font-bold text-blue-950">${st.nama}</div>
        <div class="text-[11px] text-slate-500">${st.sheet} &bull; ${st.unit}</div>
      </td>
      <td class="px-3 py-2">
        <div class="flex items-center gap-1">
          <input type="text" id="bulk-wa-inp-${st.id}" value="${st.wa || ''}" placeholder="62812..." class="w-36 border border-slate-300 rounded px-2 py-1 text-xs" />
          <button onclick="quickSaveBulkWA('${st.id}')" class="bg-slate-200 hover:bg-slate-300 text-slate-800 px-2 py-1 rounded text-[11px] font-semibold" title="Simpan No. WA ke Cloud">
            Simpan
          </button>
        </div>
      </td>
      <td class="px-3 py-2 text-right font-bold text-rose-700">${formatRupiah(total)}</td>
      <td class="px-3 py-2 text-center">
        <button onclick="sendBulkWAItem('${st.id}')" class="${isSent ? 'bg-emerald-700' : 'bg-green-600 hover:bg-green-700'} text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow-xs">
          <i class="fa-brands fa-whatsapp mr-1"></i>${isSent ? 'Terkirim (Kirim Ulang)' : 'Kirim WA'}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function quickSaveBulkWA(studentId) {
  const st = students.find((s) => s.id === studentId);
  const inp = document.getElementById(`bulk-wa-inp-${studentId}`);
  if (!st || !inp) return;

  const newWa = inp.value.trim();
  const norm = normalizeStudentName(st.nama);
  const matching = students.filter((s) => normalizeStudentName(s.nama) === norm);

  try {
    const ops = matching.map((s) => ({
      type: 'set',
      collection: 'students',
      id: s.id,
      data: { ...s, wa: newWa }
    }));
    await commitFirestoreOps(ops);
  } catch (err) {
    alert('Gagal menyimpan nomor WA: ' + err.message);
  }
}

function sendBulkWAItem(studentId) {
  const st = students.find((s) => s.id === studentId);
  if (!st) return;

  const inp = document.getElementById(`bulk-wa-inp-${studentId}`);
  let phoneRaw = (inp ? inp.value : st.wa || '').replace(/[^\d]/g, '');
  if (!phoneRaw) {
    alert(`Isi terlebih dahulu nomor WhatsApp wali santri untuk ${st.nama}.`);
    if (inp) inp.focus();
    return;
  }
  if (phoneRaw.startsWith('0')) phoneRaw = '62' + phoneRaw.slice(1);

  const msg = encodeURIComponent(buildSingleStudentWAMessage(st));
  sentWATodaySet.add(st.id);
  renderBulkWAList();
  window.open(`https://wa.me/${phoneRaw}?text=${msg}`, '_blank');
}

function sendKwitansiWA(txId) {
  const tx = transactions.find((t) => t.id === txId);
  if (!tx) return;
  const normName = normalizeStudentName(tx.nama);
  const prof = buildUnifiedStudentProfiles('DEDUP').find((p) => p.normName === normName);
  const sisaGabungan = prof ? prof.cleanTotal : 0;

  const rincian = (tx.details || []).map((d, i) => `${i + 1}. ${d.label}: ${formatRupiah(d.paid)}`).join('\n');
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
*${appSettings.bendahara || 'Restasari, S.Sos'}*`;

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
    <div class="border-b-4 border-double border-blue-950 pb-3 mb-4 flex items-center justify-center gap-4">
      <img
        src="https://lh3.googleusercontent.com/d/1JCOo87mW-OXolzXoOPYp-V7z5Ya2IDD_"
        onerror="handleLogoFallback(this)"
        alt="Logo Ponpes SIT Al Firdaus"
        class="w-16 h-16 object-contain shrink-0"
      />
      <div class="text-center">
        <p class="text-[11px] font-semibold tracking-widest uppercase text-sky-700">Yayasan Pendidikan Islam Terpadu</p>
        <h2 class="text-xl font-extrabold tracking-wide text-blue-950">PONPES SIT AL FIRDAUS BANDARLAMPUNG</h2>
        <p class="text-xs font-semibold text-slate-700">UNIT SMPIT AL FIRDAUS &bull; UNIT SMAIT AL FIRDAUS</p>
        <p class="text-[11px] text-slate-500 mt-0.5">Administrasi Keuangan &amp; Tata Usaha Bendahara</p>
      </div>
    </div>
  `;
}

function getRekeningBoxHTML() {
  if (!appSettings.rekening) return '';
  return `
    <div class="mt-3 bg-blue-50/70 p-2.5 rounded text-xs border border-blue-200">
      <strong class="text-blue-950">Rekening Resmi Pembayaran:</strong> ${appSettings.rekening}
      ${appSettings.catatanSurat ? `<div class="text-[11px] text-slate-600 mt-0.5">${appSettings.catatanSurat}</div>` : ''}
    </div>
  `;
}

function getSignatureHTML(tanggalStr) {
  return `
    <div class="mt-8 flex justify-end">
      <div class="text-center text-xs w-56">
        <p>Bandarlampung, ${tanggalStr}</p>
        <p class="font-semibold mt-0.5 text-blue-950">Bendahara Ponpes SIT Al Firdaus,</p>
        <div class="h-16 flex items-center justify-center text-slate-300 italic text-[10px]">
          (Cap &amp; Tanda Tangan Resmi)
        </div>
        <p class="font-bold underline text-blue-950 text-sm">${appSettings.bendahara || 'Restasari, S.Sos'}</p>
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
    : `<tr><td colspan="3" class="py-4 text-center text-blue-900 font-semibold">Alhamdulillah, Tidak Ada Tunggakan (LUNAS)</td></tr>`;

  document.getElementById('print-area').innerHTML = `
    ${getKopSuratHTML()}
    <div class="text-center mb-4">
      <h3 class="font-bold text-base underline uppercase text-blue-950">SURAT PEMBERITAHUAN RINCIAN BIAYA PENDIDIKAN</h3>
      <p class="text-xs text-slate-600">Periode: ${cutoffFilter === 'ALL' ? 'Tahun Pelajaran ' + st.tahunAjaran : 's.d. Bulan ' + cutoffFilter + ' (' + st.tahunAjaran + ')'}</p>
    </div>
    <table class="w-full text-xs mb-4">
      <tr><td class="py-1 w-36 font-semibold">Nama Santri</td><td>: <strong>${st.nama}</strong></td></tr>
      <tr><td class="py-1 font-semibold">Kelas / Unit</td><td>: ${st.sheet} (${st.unit})</td></tr>
      <tr><td class="py-1 font-semibold">Tarif SPP Dasar</td><td>: ${formatRupiah(st.sppDasar)} / bulan</td></tr>
    </table>
    <table class="w-full text-xs border border-blue-200 mb-3">
      <thead class="bg-blue-950 text-white border-b border-blue-900">
        <tr>
          <th class="py-2 px-3 w-12">No</th>
          <th class="py-2 px-3 text-left">Komponen Biaya / Bulan</th>
          <th class="py-2 px-3 text-right">Nominal Tagihan</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot class="bg-sky-100 font-bold border-t-2 border-blue-900 text-blue-950">
        <tr>
          <td colspan="2" class="py-2 px-3 text-right uppercase">Total Tagihan</td>
          <td class="py-2 px-3 text-right text-sm">${formatRupiah(total)}</td>
        </tr>
      </tfoot>
    </table>
    <div class="bg-sky-50 p-2.5 rounded text-xs italic border border-sky-200">
      <strong>Terbilang:</strong> ${terbilang(total)}
    </div>
    ${getRekeningBoxHTML()}
    ${getSignatureHTML(today)}
  `;
  openModal('modal-print');
}

function openPrintKwitansi(txId) {
  const tx = transactions.find((t) => t.id === txId);
  if (!tx) return;

  const rowsHtml = (tx.details || []).map((d, i) => `
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
        <h3 class="font-bold text-base underline uppercase text-blue-950">KWITANSI PEMBAYARAN RESMI</h3>
        <p class="text-xs font-mono text-slate-600">No: ${tx.noKwitansi}</p>
      </div>
      <div class="text-right text-xs">
        <span class="bg-sky-100 text-blue-950 font-bold px-3 py-1 rounded border border-sky-300">SAH / DITERIMA</span>
      </div>
    </div>
    <table class="w-full text-xs mb-4">
      <tr><td class="py-1 w-36 font-semibold">Telah Terima Dari</td><td>: Orang Tua / Wali Santri <strong>${tx.nama}</strong></td></tr>
      <tr><td class="py-1 font-semibold">Kelas / Unit</td><td>: ${tx.sheet} (${tx.unit})</td></tr>
      <tr><td class="py-1 font-semibold">Metode Bayar</td><td>: ${tx.metode} ${tx.catatan ? '(' + tx.catatan + ')' : ''}</td></tr>
    </table>
    <table class="w-full text-xs border border-blue-200 mb-3">
      <thead class="bg-blue-950 text-white border-b border-blue-900">
        <tr>
          <th class="py-2 px-3 w-12">No</th>
          <th class="py-2 px-3 text-left">Uraian Pembayaran</th>
          <th class="py-2 px-3 text-right">Jumlah Dibayar</th>
          <th class="py-2 px-3 text-right">Sisa Pos</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot class="bg-sky-100 font-bold border-t-2 border-blue-900 text-blue-950">
        <tr>
          <td colspan="2" class="py-2 px-3 text-right uppercase">Total Diterima</td>
          <td class="py-2 px-3 text-right text-sm text-blue-950">${formatRupiah(tx.totalPaid)}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
    <div class="bg-sky-50 p-2.5 rounded text-xs italic border border-sky-200">
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
      <h3 class="font-bold text-base underline uppercase text-blue-950">LAPORAN REKAPITULASI TUNGGAKAN BIAYA PENDIDIKAN</h3>
      <p class="text-xs text-slate-600">Periode Cut-off: ${cutoffFilter === 'ALL' ? 'Semua Bulan' : 's.d. Bulan ' + cutoffFilter}</p>
    </div>
    <table class="w-full text-xs border border-blue-200">
      <thead class="bg-blue-950 text-white border-b border-blue-900">
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
// TAMBAH, EDIT, HAPUS SANTRI & BUAT KELAS / SEMESTER BARU (CLOUD FIRESTORE)
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
  (st.fees || []).forEach((f) => addEditFeeRow(f.label, f.amount));
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

async function saveStudentEdit() {
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

  const targetId = id || 'st-' + Date.now();
  const existing = id ? students.find((s) => s.id === id) : null;
  const updatedStudent = {
    id: targetId,
    sheet,
    unit: inferUnitFromSheet(sheet),
    tahunAjaran: existing ? (existing.tahunAjaran || '2026-2027') : '2026-2027',
    nama,
    wa,
    sppDasar,
    fees
  };

  const ops = [{ type: 'set', collection: 'students', id: targetId, data: updatedStudent }];

  if (wa) {
    const norm = normalizeStudentName(nama);
    students.forEach((s) => {
      if (s.id !== targetId && normalizeStudentName(s.nama) === norm && s.wa !== wa) {
        ops.push({ type: 'set', collection: 'students', id: s.id, data: { ...s, wa } });
      }
    });
  }

  try {
    await commitFirestoreOps(ops);
    await logAuditAction(id ? 'EDIT_STUDENT' : 'ADD_STUDENT', `${id ? 'Mengubah' : 'Menambah'} data ${nama} (${sheet})`);
    closeModal('modal-edit');
  } catch (err) {
    alert('Gagal menyimpan data santri ke Cloud: ' + err.message);
  }
}

async function deleteCurrentStudent() {
  const id = document.getElementById('edit-student-id').value;
  const st = students.find((s) => s.id === id);
  if (!st) return;

  if (!confirm(`Yakin ingin menghapus data santri "${st.nama}" (${st.sheet}) dari Cloud Firestore secara permanen?`)) return;

  try {
    await commitFirestoreOps([{ type: 'delete', collection: 'students', id: st.id }]);
    await logAuditAction('DELETE_STUDENT', `Menghapus data ${st.nama} (${st.sheet})`);
    closeModal('modal-edit');
  } catch (err) {
    alert('Gagal menghapus data santri: ' + err.message);
  }
}

// ============================================================================
// BUAT KELAS / SEMESTER BARU (MIGRASI MASSAL ANTAR SEMESTER DI CLOUD)
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

async function createNewClass() {
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

  const newDocs = [];

  if (!sourceSheet) {
    const isSmt2 = detectSheetSemester(newSheetName) === 'SMT2';
    const months = isSmt2
      ? ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni']
      : ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    newDocs.push({
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

      newDocs.push({
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

  try {
    const ops = newDocs.map((d) => ({ type: 'set', collection: 'students', id: d.id, data: d }));
    await commitFirestoreOps(ops);
    await logAuditAction('CREATE_CLASS', `Membuat kelas ${newSheetName} (${newDocs.length} santri)`);

    document.getElementById('filter-unit').value = 'ALL';
    document.getElementById('filter-semester').value = 'ALL';
    document.getElementById('filter-cutoff').value = 'ALL';
    closeModal('modal-new-class');
    alert(`Kelas / Semester "${newSheetName}" berhasil dibuat di Cloud dan terhubung ke Kartu Induk Santri!`);
  } catch (err) {
    alert('Gagal membuat kelas baru: ' + err.message);
  }
}

// ============================================================================
// EXPORT REKAP EXCEL, UNDUH JSON & RESTORE JSON KE CLOUD
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

  if (transactions.length > 0) {
    const txRows = transactions.map((t) => ({
      'No Kwitansi': t.noKwitansi,
      Tanggal: t.tanggal,
      'Nama Santri': t.nama,
      Kelas: t.sheet,
      Metode: t.metode,
      Rincian: (t.details || []).map((d) => `${d.label}: ${d.paid}`).join('; '),
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
    bendahara: appSettings.bendahara || 'Restasari, S.Sos',
    exportedAt: new Date().toISOString(),
    settings: appSettings,
    students,
    transactions
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Backup_Cloud_AlFirdaus_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleJSONRestore(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function (e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (Array.isArray(parsed.students)) {
        const restoredTx = Array.isArray(parsed.transactions) ? parsed.transactions : [];
        if (!confirm(`Pulihkan ${parsed.students.length} data santri dan ${restoredTx.length} transaksi dari file JSON ke Cloud Firestore?`)) {
          return;
        }

        const ops = [];
        const newStIds = new Set(parsed.students.map((s) => s.id));
        students.forEach((oldSt) => {
          if (!newStIds.has(oldSt.id)) {
            ops.push({ type: 'delete', collection: 'students', id: oldSt.id });
          }
        });
        parsed.students.forEach((st) => {
          ops.push({ type: 'set', collection: 'students', id: st.id, data: st });
        });
        restoredTx.forEach((tx) => {
          ops.push({ type: 'set', collection: 'transactions', id: tx.id, data: tx });
        });

        await commitFirestoreOps(ops);
        await logAuditAction('RESTORE_JSON', `Restore ${parsed.students.length} santri & ${restoredTx.length} transaksi dari file JSON`);
        alert('Data berhasil dipulihkan & disinkronkan ke Cloud Firestore!');
      } else {
        alert('Format file JSON tidak valid.');
      }
    } catch (err) {
      alert('Gagal memulihkan file JSON: ' + err.message);
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

// ============================================================================
// NAVIGASI TAB & MODAL
// ============================================================================
function switchTab(tabName) {
  ['tagihan', 'induk', 'rekap', 'riwayat', 'audit'].forEach((name) => {
    document.getElementById(`view-${name}`).classList.toggle('hidden', name !== tabName);
    const btn = document.getElementById(`tab-${name}`);
    if (name === tabName) {
      btn.className = 'tab-btn btn-brand-primary px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition';
    } else {
      btn.className = 'tab-btn bg-white text-slate-700 hover:bg-sky-50 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-blue-200 transition';
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

// ============================================================================
// DAFTARKAN FUNGSI KE GLOBAL WINDOW AGAR TERPANGGIL DARI ATRIBUT HTML
// ============================================================================
Object.assign(window, {
  handleLogoFallback,
  handleLogin,
  logoutBendahara,
  togglePasswordVisibility,
  openResetPasswordPrompt,
  openAccountModal,
  saveAccountCredentials,
  openSettingsModal,
  saveAppSettings,
  migrateLocalToFirestore,
  seedInitialSampleToFirestore,
  switchTab,
  onUnitOrSemesterChange,
  resetFilters,
  renderTable,
  renderIndukTab,
  openIndukDetailModal,
  refreshIndukDetailModal,
  saveIndukWA,
  openWAInduk,
  openPrintInduk,
  openBayarGabunganModal,
  toggleBayarGabItem,
  checkAllBayarGabItems,
  recalcBayarGabTotal,
  submitPembayaranGabungan,
  openBayarModal,
  toggleBayarItem,
  checkAllBayarItems,
  recalcBayarTotal,
  submitPembayaran,
  cancelTransaction,
  resetRiwayatFilter,
  renderRiwayat,
  printLaporanKas,
  renderAuditLogs,
  openWAModal,
  openBulkWAModal,
  renderBulkWAList,
  quickSaveBulkWA,
  sendBulkWAItem,
  sendKwitansiWA,
  copyWAMessage,
  sendWANow,
  openPrintTagihan,
  openPrintKwitansi,
  printRekapSummary,
  openAddStudentModal,
  openEditModal,
  applyFeeTemplate,
  addEditFeeRow,
  saveStudentEdit,
  deleteCurrentStudent,
  openNewClassModal,
  createNewClass,
  exportToExcel,
  backupJSON,
  openModal,
  closeModal
});
