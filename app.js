// ============================================================================
// SISTEM PENCATATAN & REKAPITULASI BIAYA PENDIDIKAN (CLOUD FIREBASE EDITION)
// INSTANSI : PONPES SIT AL FIRDAUS BANDARLAMPUNG (SMPIT / SMAIT AL FIRDAUS)
// BENDAHARA: RESTASARI, S.Sos
// ============================================================================

window.__APP_JS_READY = true;

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import {
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    writeBatch,
    getDocs
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

// ==================== 1. FIREBASE CONFIGURATION ====================
const firebaseConfig = {
    apiKey: "AIzaSyC4sTKd_Pp3W4ncXolZud5GhjK5O-GCgvE",
    authDomain: "keuangan-alfirdaus.firebaseapp.com",
    projectId: "keuangan-alfirdaus",
    storageBucket: "keuangan-alfirdaus.firebasestorage.app",
    messagingSenderId: "797090689943",
    appId: "1:797090689943:web:17852a2c6fc9960f5bcad2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firestore with multi-tab offline persistence + safe fallback
let db;
try {
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
        })
    });
} catch (err) {
    console.warn("Persistent cache fallback:", err);
    db = getFirestore(app);
}

// ==================== 2. APPLICATION STATE & CONSTANTS ====================
const BULAN_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const BULAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const KATEGORI_MASUK = [
    'Pembayaran Syahriah',
    'Uang Pangkal / Pendaftaran',
    'Donasi / Infaq / Wakaf',
    'Bantuan Operasional (BOS)',
    'Unit Usaha Pesantren',
    'Pemasukan Lain-lain'
];

const KATEGORI_KELUAR = [
    'Konsumsi & Dapur Santri',
    'Gaji & Kafalah Ustadz/Karyawan',
    'Listrik, Air & Internet',
    'Sarana Prasarana & Maintenance',
    'Kesehatan Santri',
    'Kegiatan Belajar & Ekstrakurikuler',
    'Pengeluaran Lain-lain'
];

let currentUser = null;
let currentUserRole = 'bendahara';
let unsubSantri = null;
let unsubKas = null;
let unsubSyahriah = null;

let appData = {
    santri: [],
    kas: [],
    syahriah: {} // key: "santriId_tahun_bulanIndex", value: { paid: true, date, amount, kasId, recordedBy }
};

// ==================== 3. HELPER UTILITIES ====================
function formatRupiah(angka) {
    return 'Rp ' + Number(angka || 0).toLocaleString('id-ID');
}

function generateId(prefix = 'ID') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function getTodayDate() {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    return local.toISOString().split('T')[0];
}

function isAdminRole() {
    return currentUserRole === 'admin' || currentUserRole === 'bendahara';
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function setSyncBadge(state, label) {
    const badge = document.getElementById('sync-status-badge');
    if (!badge) return;
    if (state === 'online') {
        badge.className = 'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30';
        badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span><span class="hidden sm:inline">${label || 'Cloud Live'}</span>`;
    } else if (state === 'syncing') {
        badge.className = 'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30';
        badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span><span class="hidden sm:inline">${label || 'Menyimpan...'}</span>`;
    } else {
        badge.className = 'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-400/30';
        badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span><span class="hidden sm:inline">${label || 'Offline / Error'}</span>`;
    }
}

// ==================== 4. AUTHENTICATION & SESSION ====================
function showScreen(screenName) {
    const loadingEl = document.getElementById('auth-loading-screen');
    const loginEl = document.getElementById('login-screen');
    const appEl = document.getElementById('app-container');

    loadingEl.classList.add('hidden');
    loadingEl.classList.remove('flex');
    loginEl.classList.add('hidden');
    loginEl.classList.remove('flex');
    appEl.classList.add('hidden');
    appEl.classList.remove('flex');

    if (screenName === 'loading') {
        loadingEl.classList.remove('hidden');
        loadingEl.classList.add('flex');
    } else if (screenName === 'login') {
        loginEl.classList.remove('hidden');
        loginEl.classList.add('flex');
    } else if (screenName === 'app') {
        appEl.classList.remove('hidden');
        appEl.classList.add('flex');
    }
}

function applyRoleUI() {
    if (!currentUser) return;
    const email = currentUser.email || 'user@alfirdaus.sch.id';
    const displayName = currentUser.displayName || email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    if (email.toLowerCase().includes('pimpinan') || email.toLowerCase().includes('mudir') || email.toLowerCase().includes('yayasan')) {
        currentUserRole = 'pimpinan';
    } else if (email.toLowerCase().includes('admin')) {
        currentUserRole = 'admin';
    } else {
        currentUserRole = 'bendahara';
    }

    const roleLabelMap = {
        admin: 'Administrator',
        bendahara: 'Bendahara Pesantren',
        pimpinan: 'Pimpinan / Mudir (View Only)'
    };

    document.getElementById('header-user-name').textContent = displayName;
    document.getElementById('header-user-role').textContent = roleLabelMap[currentUserRole] || 'Bendahara';

    const adminEls = document.querySelectorAll('.role-admin-only');
    adminEls.forEach(el => {
        if (isAdminRole()) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });

    const backupGroup = document.getElementById('backup-restore-group');
    if (backupGroup) {
        if (currentUserRole === 'admin' || currentUserRole === 'bendahara') {
            backupGroup.classList.remove('hidden');
        } else {
            backupGroup.classList.add('hidden');
        }
    }
}

function translateFirebaseAuthError(code, rawMessage) {
    switch (code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
            return 'Email atau password salah. Pastikan akun sudah dibuat di Firebase Authentication.';
        case 'auth/invalid-email':
            return 'Format alamat email tidak valid.';
        case 'auth/too-many-requests':
            return 'Terlalu banyak percobaan login gagal. Silakan tunggu beberapa menit.';
        case 'auth/network-request-failed':
            return 'Gagal terhubung ke server Firebase. Periksa koneksi internet Anda.';
        case 'auth/user-disabled':
            return 'Akun ini telah dinonaktifkan oleh administrator.';
        case 'auth/unauthorized-domain':
            return 'Domain GitHub Pages belum diizinkan! Buka Firebase Console -> Authentication -> Settings -> Authorized domains -> tambahkan ponpesitalfirdaus.github.io';
        default:
            return `Gagal login (${code || 'error'}): ${rawMessage || 'Silakan coba lagi.'}`;
    }
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        applyRoleUI();
        showScreen('app');
        await startRealtimeListeners();
    } else {
        currentUser = null;
        stopRealtimeListeners();
        showScreen('login');
    }
}, (error) => {
    console.error("Auth state error:", error);
    showScreen('login');
    const errorBox = document.getElementById('login-error');
    const errorText = document.getElementById('login-error-text');
    if (errorBox && errorText) {
        errorText.textContent = translateFirebaseAuthError(error.code, error.message);
        errorBox.classList.remove('hidden');
    }
});

// Login Form Handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorBox = document.getElementById('login-error');
    const errorText = document.getElementById('login-error-text');
    const submitBtn = document.getElementById('login-submit-btn');

    errorBox.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>Memverifikasi ke Firebase...</span>`;

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error('Login error:', error);
        errorText.textContent = translateFirebaseAuthError(error.code, error.message);
        errorBox.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i><span>Masuk ke Sistem Cloud</span>`;
    }
});

// Toggle Password Visibility
document.getElementById('toggle-pass-btn').addEventListener('click', () => {
    const passInput = document.getElementById('login-password');
    const icon = document.getElementById('toggle-pass-icon');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passInput.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
});

// Logout Handler
document.getElementById('btn-logout').addEventListener('click', async () => {
    if (confirm('Yakin ingin keluar dari sistem keuangan?')) {
        try {
            await signOut(auth);
        } catch (err) {
            alert('Gagal logout: ' + err.message);
        }
    }
});

// ==================== 5. REAL-TIME FIRESTORE LISTENERS ====================
function stopRealtimeListeners() {
    if (unsubSantri) { unsubSantri(); unsubSantri = null; }
    if (unsubKas) { unsubKas(); unsubKas = null; }
    if (unsubSyahriah) { unsubSyahriah(); unsubSyahriah = null; }
}

async function seedInitialDataIfEmpty() {
    try {
        const santriSnap = await getDocs(collection(db, 'santri'));
        const kasSnap = await getDocs(collection(db, 'kas'));
        if (!santriSnap.empty || !kasSnap.empty) return;

        const batch = writeBatch(db);

        const initialSantri = [
            { id: 'S001', nis: 'AF-2026-001', nama: 'Ahmad Fauzan Al-Ghifari', kelas: 'SMA IT', tarif: 750000, wali: 'Bpk. Hendra Wijaya', hp: '081234567890', status: 'AKTIF' },
            { id: 'S002', nis: 'AF-2026-002', nama: 'Muhammad Zaki Mubarak', kelas: 'SMP IT', tarif: 650000, wali: 'Bpk. Ridwan Kamil', hp: '081298765432', status: 'AKTIF' },
            { id: 'S003', nis: 'AF-2026-003', nama: 'Aisyah Putri Ramadhani', kelas: 'Takhassus IT', tarif: 800000, wali: 'Ibu Siti Aminah', hp: '085611223344', status: 'AKTIF' },
            { id: 'S004', nis: 'AF-2026-004', nama: 'Bilal Bin Rabah', kelas: 'SMP IT', tarif: 650000, wali: 'Bpk. Umar Faruq', hp: '087855667788', status: 'AKTIF' }
        ];

        initialSantri.forEach(s => {
            batch.set(doc(db, 'santri', s.id), s);
        });

        const initialKas = [
            { id: 'K001', tanggal: '2026-01-05', jenis: 'MASUK', kategori: 'Donasi / Infaq / Wakaf', nominal: 15000000, keterangan: 'Saldo Awal & Donasi Yayasan Al Firdaus' },
            { id: 'K002', tanggal: '2026-01-10', jenis: 'MASUK', kategori: 'Pembayaran Syahriah', nominal: 750000, keterangan: 'Syahriah Januari 2026 - Ahmad Fauzan Al-Ghifari' },
            { id: 'K003', tanggal: '2026-01-12', jenis: 'MASUK', kategori: 'Pembayaran Syahriah', nominal: 650000, keterangan: 'Syahriah Januari 2026 - Muhammad Zaki Mubarak' },
            { id: 'K004', tanggal: '2026-01-15', jenis: 'KELUAR', kategori: 'Konsumsi & Dapur Santri', nominal: 3200000, keterangan: 'Belanja logistik beras & lauk dapur pesantren' },
            { id: 'K005', tanggal: '2026-01-20', jenis: 'KELUAR', kategori: 'Listrik, Air & Internet', nominal: 1450000, keterangan: 'Tagihan Listrik Asrama & Fiber Optic Lab IT' }
        ];

        initialKas.forEach(k => {
            batch.set(doc(db, 'kas', k.id), k);
        });

        batch.set(doc(db, 'syahriah', 'S001_2026_0'), { paid: true, date: '2026-01-10', amount: 750000, kasId: 'K002' });
        batch.set(doc(db, 'syahriah', 'S002_2026_0'), { paid: true, date: '2026-01-12', amount: 650000, kasId: 'K003' });

        await batch.commit();
        console.log('Data contoh awal berhasil disiapkan di Firestore.');
    } catch (err) {
        console.warn('Seed check dilewati:', err.message);
    }
}

async function startRealtimeListeners() {
    stopRealtimeListeners();
    setSyncBadge('syncing', 'Memuat Data...');

    await seedInitialDataIfEmpty();

    // 1. Santri Listener
    unsubSantri = onSnapshot(collection(db, 'santri'), (snapshot) => {
        appData.santri = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        appData.santri.sort((a, b) => (a.nis || '').localeCompare(b.nis || ''));
        setSyncBadge('online', 'Cloud Live');
        refreshAllViews();
    }, (error) => {
        console.error('Firestore santri error:', error);
        setSyncBadge('error', 'Error Akses');
        if (error.code === 'permission-denied') {
            alert('Akses ditolak oleh Firestore Rules! Pastikan akun Anda sudah login dan Rules Firestore sudah dipublish.');
        }
    });

    // 2. Kas Listener
    unsubKas = onSnapshot(collection(db, 'kas'), (snapshot) => {
        appData.kas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setSyncBadge('online', 'Cloud Live');
        refreshAllViews();
    }, (error) => {
        console.error('Firestore kas error:', error);
        setSyncBadge('error', 'Error Akses');
    });

    // 3. Syahriah Listener
    unsubSyahriah = onSnapshot(collection(db, 'syahriah'), (snapshot) => {
        const map = {};
        snapshot.docs.forEach(d => {
            map[d.id] = d.data();
        });
        appData.syahriah = map;
        setSyncBadge('online', 'Cloud Live');
        refreshAllViews();
    }, (error) => {
        console.error('Firestore syahriah error:', error);
        setSyncBadge('error', 'Error Akses');
    });
}

function refreshAllViews() {
    renderDashboard();
    renderSantriTable();
    renderSyahriahMatrix();
    renderKasTable();
    renderLaporan();
}

// ==================== 6. TAB NAVIGATION ====================
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(sec => sec.classList.add('hidden'));
    const targetSec = document.getElementById(`tab-${tabName}`);
    if (targetSec) targetSec.classList.remove('hidden');

    document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    refreshAllViews();
}

document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
    });
});

document.querySelectorAll('[data-nav-shortcut]').forEach(btn => {
    btn.addEventListener('click', () => {
        switchTab(btn.dataset.navShortcut);
    });
});

// ==================== 7. DASHBOARD RENDERING ====================
function renderDashboard() {
    const selectedYear = document.getElementById('dash-year-filter').value;
    document.querySelectorAll('.dash-year-label').forEach(el => el.textContent = selectedYear);

    let totalMasukAll = 0;
    let totalKeluarAll = 0;
    let masukYear = 0;
    let keluarYear = 0;

    appData.kas.forEach(tx => {
        const nom = Number(tx.nominal) || 0;
        if (tx.jenis === 'MASUK') {
            totalMasukAll += nom;
            if (tx.tanggal && tx.tanggal.startsWith(selectedYear)) masukYear += nom;
        } else {
            totalKeluarAll += nom;
            if (tx.tanggal && tx.tanggal.startsWith(selectedYear)) keluarYear += nom;
        }
    });

    const saldoTotal = totalMasukAll - totalKeluarAll;
    const santriAktif = appData.santri.filter(s => s.status === 'AKTIF');

    document.getElementById('stat-saldo').textContent = formatRupiah(saldoTotal);
    document.getElementById('stat-pemasukan').textContent = formatRupiah(masukYear);
    document.getElementById('stat-pengeluaran').textContent = formatRupiah(keluarYear);
    document.getElementById('stat-santri').textContent = `${santriAktif.length} Santri`;

    const now = new Date();
    const curMonthIdx = now.getMonth();
    const curYear = now.getFullYear().toString();
    document.getElementById('dash-bulan-name').textContent = `${BULAN_NAMES[curMonthIdx]} ${curYear}`;

    let lunasCount = 0;
    santriAktif.forEach(s => {
        const key = `${s.id}_${curYear}_${curMonthIdx}`;
        if (appData.syahriah[key] && appData.syahriah[key].paid) lunasCount++;
    });

    const persenLunas = santriAktif.length > 0 ? Math.round((lunasCount / santriAktif.length) * 100) : 0;
    document.getElementById('stat-syahriah-bulan-ini').textContent = `Lunas bulan ini: ${persenLunas}% (${lunasCount}/${santriAktif.length})`;

    document.getElementById('dash-syahriah-progress').innerHTML = `
        <div>
            <div class="flex justify-between text-xs font-semibold mb-1">
                <span class="text-slate-600">Sudah Lunas</span>
                <span class="text-emerald-600">${lunasCount} Santri (${persenLunas}%)</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div class="bg-emerald-500 h-2.5 rounded-full transition-all duration-300" style="width: ${persenLunas}%"></div>
            </div>
        </div>
        <div class="pt-2 border-t border-slate-100 flex justify-between text-xs">
            <span class="text-slate-500">Belum Bayar:</span>
            <span class="font-bold text-rose-600">${santriAktif.length - lunasCount} Santri</span>
        </div>
    `;

    const sortedKas = [...appData.kas].sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || '') || (b.id || '').localeCompare(a.id || '')).slice(0, 6);
    const recentTbody = document.getElementById('dash-recent-tx');
    if (sortedKas.length === 0) {
        recentTbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-400 text-xs">Belum ada data transaksi kas.</td></tr>`;
    } else {
        recentTbody.innerHTML = sortedKas.map(tx => `
            <tr class="hover:bg-slate-50">
                <td class="py-2.5 px-4 text-xs text-slate-500 whitespace-nowrap">${escapeHtml(tx.tanggal)}</td>
                <td class="py-2.5 px-4 font-medium text-slate-800">${escapeHtml(tx.keterangan)}</td>
                <td class="py-2.5 px-4 text-xs"><span class="px-2 py-0.5 rounded bg-slate-100 text-slate-600">${escapeHtml(tx.kategori)}</span></td>
                <td class="py-2.5 px-4 text-right font-bold whitespace-nowrap ${tx.jenis === 'MASUK' ? 'text-emerald-600' : 'text-rose-600'}">
                    ${tx.jenis === 'MASUK' ? '+' : '-'} ${formatRupiah(tx.nominal)}
                </td>
            </tr>
        `).join('');
    }
}

document.getElementById('dash-year-filter').addEventListener('change', renderDashboard);

// ==================== 8. MASTER SANTRI CRUD (FIRESTORE) ====================
function renderSantriTable() {
    const keyword = document.getElementById('santri-search').value.toLowerCase();
    const filterKelas = document.getElementById('santri-filter-kelas').value;
    const canEdit = isAdminRole();

    const filtered = appData.santri.filter(s => {
        const matchKey = (s.nama || '').toLowerCase().includes(keyword) ||
                         (s.nis || '').toLowerCase().includes(keyword) ||
                         (s.wali || '').toLowerCase().includes(keyword);
        const matchKelas = filterKelas === 'ALL' || s.kelas === filterKelas;
        return matchKey && matchKelas;
    });

    const tbody = document.getElementById('santri-table-body');
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-400">Tidak ada data santri ditemukan.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(s => {
        const statusBadge = s.status === 'AKTIF'
            ? `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Aktif</span>`
            : `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-600">${escapeHtml(s.status)}</span>`;

        const actionCell = canEdit ? `
            <td class="py-3 px-4 text-center whitespace-nowrap">
                <button data-action="edit-santri" data-id="${escapeHtml(s.id)}" class="text-teal-600 hover:text-teal-800 p-1.5" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                <button data-action="delete-santri" data-id="${escapeHtml(s.id)}" class="text-rose-500 hover:text-rose-700 p-1.5" title="Hapus"><i class="fa-solid fa-trash"></i></button>
            </td>` : '';

        return `
            <tr class="hover:bg-slate-50">
                <td class="py-3 px-4 font-mono text-xs text-slate-600 font-semibold">${escapeHtml(s.nis)}</td>
                <td class="py-3 px-4 font-bold text-slate-800">${escapeHtml(s.nama)}</td>
                <td class="py-3 px-4"><span class="px-2 py-1 rounded-md bg-teal-50 text-teal-700 text-xs font-semibold">${escapeHtml(s.kelas)}</span></td>
                <td class="py-3 px-4 text-xs">
                    <div class="font-semibold text-slate-700">${escapeHtml(s.wali)}</div>
                    <div class="text-slate-400">${escapeHtml(s.hp || '-')}</div>
                </td>
                <td class="py-3 px-4 text-right font-bold text-slate-700">${formatRupiah(s.tarif)}</td>
                <td class="py-3 px-4 text-center">${statusBadge}</td>
                ${actionCell}
            </tr>
        `;
    }).join('');
}

document.getElementById('santri-search').addEventListener('input', renderSantriTable);
document.getElementById('santri-filter-kelas').addEventListener('change', renderSantriTable);

function openSantriModal(editId = null) {
    if (!isAdminRole()) return;
    const modal = document.getElementById('modal-santri');
    const title = document.getElementById('modal-santri-title');
    document.getElementById('form-santri').reset();

    if (editId) {
        const s = appData.santri.find(item => item.id === editId);
        if (!s) return;
        title.textContent = 'Edit Data Santri';
        document.getElementById('santri-id').value = s.id;
        document.getElementById('santri-nis').value = s.nis;
        document.getElementById('santri-nama').value = s.nama;
        document.getElementById('santri-kelas').value = s.kelas;
        document.getElementById('santri-tarif').value = s.tarif;
        document.getElementById('santri-wali').value = s.wali;
        document.getElementById('santri-hp').value = s.hp || '';
        document.getElementById('santri-status').value = s.status;
    } else {
        title.textContent = 'Tambah Data Santri Baru';
        document.getElementById('santri-id').value = '';
    }
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeSantriModal() {
    const modal = document.getElementById('modal-santri');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

document.getElementById('btn-open-santri-modal').addEventListener('click', () => openSantriModal());
document.getElementById('btn-close-santri-modal').addEventListener('click', closeSantriModal);
document.getElementById('btn-cancel-santri-modal').addEventListener('click', closeSantriModal);

document.getElementById('santri-table-body').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === 'edit-santri') {
        openSantriModal(id);
    } else if (action === 'delete-santri') {
        if (!isAdminRole()) return;
        if (confirm('Hapus data santri ini secara permanen dari Cloud?')) {
            try {
                setSyncBadge('syncing', 'Menghapus...');
                await deleteDoc(doc(db, 'santri', id));
                setSyncBadge('online', 'Cloud Live');
            } catch (err) {
                alert('Gagal menghapus santri: ' + err.message);
                setSyncBadge('error', 'Error');
            }
        }
    }
});

document.getElementById('form-santri').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isAdminRole()) return;

    const saveBtn = document.getElementById('btn-save-santri');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Menyimpan...';

    const existingId = document.getElementById('santri-id').value;
    const docId = existingId || generateId('S');
    const payload = {
        id: docId,
        nis: document.getElementById('santri-nis').value.trim(),
        nama: document.getElementById('santri-nama').value.trim(),
        kelas: document.getElementById('santri-kelas').value,
        tarif: Number(document.getElementById('santri-tarif').value),
        wali: document.getElementById('santri-wali').value.trim(),
        hp: document.getElementById('santri-hp').value.trim(),
        status: document.getElementById('santri-status').value,
        updatedBy: currentUser.email,
        updatedAt: new Date().toISOString()
    };

    try {
        setSyncBadge('syncing', 'Menyimpan...');
        if (existingId) {
            await updateDoc(doc(db, 'santri', docId), payload);
        } else {
            await setDoc(doc(db, 'santri', docId), payload);
        }
        closeSantriModal();
        setSyncBadge('online', 'Cloud Live');
    } catch (err) {
        alert('Gagal menyimpan data santri: ' + err.message);
        setSyncBadge('error', 'Error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Simpan Data';
    }
});

// ==================== 9. MATRIKS PEMBAYARAN SYAHRIAH (FIRESTORE) ====================
function renderSyahriahMatrix() {
    const year = document.getElementById('syahriah-year-select').value;
    const keyword = document.getElementById('syahriah-search').value.toLowerCase();
    const santriList = appData.santri.filter(s => s.status === 'AKTIF' && (s.nama || '').toLowerCase().includes(keyword));

    const tbody = document.getElementById('syahriah-matrix-body');
    if (santriList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="13" class="py-8 text-center text-slate-400">Tidak ada santri aktif.</td></tr>`;
        return;
    }

    tbody.innerHTML = santriList.map(s => {
        let cells = '';
        for (let m = 0; m < 12; m++) {
            const key = `${s.id}_${year}_${m}`;
            const record = appData.syahriah[key];
            if (record && record.paid) {
                cells += `
                    <td class="p-1.5 text-center border-l border-slate-100">
                        <button data-action="open-syahriah" data-santri-id="${escapeHtml(s.id)}" data-year="${year}" data-month="${m}"
                            class="w-full py-1.5 px-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] shadow-2xs transition" title="Lunas tgl ${escapeHtml(record.date)}">
                            <i class="fa-solid fa-check"></i>
                        </button>
                    </td>`;
            } else {
                cells += `
                    <td class="p-1.5 text-center border-l border-slate-100">
                        <button data-action="open-syahriah" data-santri-id="${escapeHtml(s.id)}" data-year="${year}" data-month="${m}"
                            class="w-full py-1.5 px-1 rounded bg-slate-100 hover:bg-amber-100 text-slate-400 hover:text-amber-700 font-medium text-[11px] transition" title="Belum Bayar">
                            -
                        </button>
                    </td>`;
            }
        }

        return `
            <tr class="hover:bg-slate-50">
                <td class="py-2.5 px-3 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-200 z-10">
                    <div>${escapeHtml(s.nama)}</div>
                    <div class="text-[10px] font-normal text-slate-400">${escapeHtml(s.kelas)} • ${formatRupiah(s.tarif)}</div>
                </td>
                ${cells}
            </tr>
        `;
    }).join('');
}

document.getElementById('syahriah-year-select').addEventListener('change', renderSyahriahMatrix);
document.getElementById('syahriah-search').addEventListener('input', renderSyahriahMatrix);

document.getElementById('syahriah-matrix-body').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action="open-syahriah"]');
    if (!btn) return;
    openSyahriahModal(btn.dataset.santriId, btn.dataset.year, Number(btn.dataset.month));
});

function closeSyahriahModal() {
    const modal = document.getElementById('modal-syahriah');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}
document.getElementById('btn-close-syahriah-modal').addEventListener('click', closeSyahriahModal);

function openSyahriahModal(santriId, year, monthIdx) {
    const santri = appData.santri.find(s => s.id === santriId);
    if (!santri) return;
    const key = `${santriId}_${year}_${monthIdx}`;
    const record = appData.syahriah[key];
    const bulanNama = BULAN_NAMES[monthIdx];
    const body = document.getElementById('syahriah-modal-body');
    const canEdit = isAdminRole();

    if (record && record.paid) {
        const cancelBtnHtml = canEdit ? `
            <button id="btn-cancel-syahriah" class="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-lg border border-rose-200 transition text-xs">
                Batalkan
            </button>` : '';

        body.innerHTML = `
            <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-1">
                <div class="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-2 text-lg">
                    <i class="fa-solid fa-check"></i>
                </div>
                <p class="font-extrabold text-emerald-800 text-base">SUDAH LUNAS</p>
                <p class="text-xs text-emerald-700">Syahriah Bulan <b>${bulanNama} ${year}</b></p>
            </div>
            <div class="space-y-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div class="flex justify-between"><span class="text-slate-500">Nama Santri:</span><span class="font-bold text-slate-800">${escapeHtml(santri.nama)}</span></div>
                <div class="flex justify-between"><span class="text-slate-500">NIS / Kelas:</span><span class="font-semibold">${escapeHtml(santri.nis)} (${escapeHtml(santri.kelas)})</span></div>
                <div class="flex justify-between"><span class="text-slate-500">Tanggal Bayar:</span><span class="font-semibold">${escapeHtml(record.date)}</span></div>
                <div class="flex justify-between"><span class="text-slate-500">Nominal Dibayar:</span><span class="font-extrabold text-emerald-700">${formatRupiah(record.amount)}</span></div>
            </div>
            <div class="flex gap-2 pt-2">
                <button id="btn-print-receipt" class="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                    <i class="fa-solid fa-print"></i> Cetak Kuitansi
                </button>
                ${cancelBtnHtml}
            </div>
        `;

        document.getElementById('btn-print-receipt').addEventListener('click', () => {
            printReceipt(santri, bulanNama, year, record.amount, record.date);
        });

        if (canEdit) {
            document.getElementById('btn-cancel-syahriah').addEventListener('click', async () => {
                if (confirm(`Batalkan status lunas syahriah ${santri.nama} bulan ${bulanNama} ${year}? Catatan kas terkait juga akan dihapus.`)) {
                    try {
                        setSyncBadge('syncing', 'Membatalkan...');
                        const batch = writeBatch(db);
                        if (record.kasId) {
                            batch.delete(doc(db, 'kas', record.kasId));
                        }
                        batch.delete(doc(db, 'syahriah', key));
                        await batch.commit();
                        closeSyahriahModal();
                        setSyncBadge('online', 'Cloud Live');
                    } catch (err) {
                        alert('Gagal membatalkan pembayaran: ' + err.message);
                        setSyncBadge('error', 'Error');
                    }
                }
            });
        }
    } else {
        if (!canEdit) {
            body.innerHTML = `
                <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center space-y-1">
                    <p class="font-bold text-amber-800">BELUM LUNAS</p>
                    <p class="text-xs text-amber-700">Syahriah ${escapeHtml(santri.nama)} bulan <b>${bulanNama} ${year}</b> belum dibayarkan.</p>
                </div>
                <p class="text-xs text-slate-500 text-center">Akun Pimpinan memiliki akses lihat saja (View Only).</p>
            `;
        } else {
            body.innerHTML = `
                <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <p class="text-xs text-slate-500">Santri:</p>
                    <p class="font-bold text-slate-800 text-base">${escapeHtml(santri.nama)} <span class="text-xs font-normal text-slate-500">(${escapeHtml(santri.kelas)})</span></p>
                    <p class="text-xs text-teal-700 font-semibold">Tagihan Bulan: ${bulanNama} ${year}</p>
                </div>
                <form id="form-bayar-syahriah" class="space-y-3">
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Tanggal Pembayaran</label>
                        <input type="date" id="bayar-tanggal" required value="${getTodayDate()}" class="w-full border border-slate-300 rounded-lg px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Nominal Bayar (Rp)</label>
                        <input type="number" id="bayar-nominal" required value="${santri.tarif}" min="0" class="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-800">
                    </div>
                    <p class="text-[11px] text-slate-500"><i class="fa-solid fa-circle-info text-teal-600"></i> Pembayaran ini otomatis tercatat sebagai <b>Kas Masuk</b> di Buku Kas Pesantren.</p>
                    <div class="pt-2 flex justify-end gap-2">
                        <button type="button" id="btn-cancel-bayar-modal" class="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold">Batal</button>
                        <button type="submit" id="btn-submit-bayar" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">Konfirmasi Lunas</button>
                    </div>
                </form>
            `;

            document.getElementById('btn-cancel-bayar-modal').addEventListener('click', closeSyahriahModal);
            document.getElementById('form-bayar-syahriah').addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = document.getElementById('btn-submit-bayar');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Memproses...';

                const tgl = document.getElementById('bayar-tanggal').value;
                const nom = Number(document.getElementById('bayar-nominal').value);
                const kasId = generateId('KAS');

                try {
                    setSyncBadge('syncing', 'Menyimpan...');
                    const batch = writeBatch(db);

                    batch.set(doc(db, 'kas', kasId), {
                        id: kasId,
                        tanggal: tgl,
                        jenis: 'MASUK',
                        kategori: 'Pembayaran Syahriah',
                        nominal: nom,
                        keterangan: `Syahriah ${bulanNama} ${year} - ${santri.nama} (${santri.nis})`,
                        recordedBy: currentUser.email,
                        createdAt: new Date().toISOString()
                    });

                    batch.set(doc(db, 'syahriah', key), {
                        paid: true,
                        date: tgl,
                        amount: nom,
                        kasId: kasId,
                        recordedBy: currentUser.email,
                        updatedAt: new Date().toISOString()
                    });

                    await batch.commit();
                    closeSyahriahModal();
                    setSyncBadge('online', 'Cloud Live');
                } catch (err) {
                    alert('Gagal menyimpan pembayaran syahriah: ' + err.message);
                    setSyncBadge('error', 'Error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Konfirmasi Lunas';
                }
            });
        }
    }

    const modal = document.getElementById('modal-syahriah');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function printReceipt(santri, bulanNama, year, amount, date) {
    const win = window.open('', '_blank', 'width=700,height=520');
    win.document.write(`
        <html>
        <head>
            <title>Kuitansi Syahriah - ${escapeHtml(santri.nama)}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 30px; color: #1e293b; }
                .box { border: 2px solid #0f766e; padding: 24px; border-radius: 10px; max-width: 600px; margin: auto; }
                .header { border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; }
                .title { font-size: 18px; font-weight: bold; color: #0f766e; margin: 0; }
                .sub { font-size: 12px; color: #64748b; margin: 2px 0 0; }
                .badge { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 12px; }
                table { width: 100%; font-size: 13px; border-collapse: collapse; }
                td { padding: 6px 0; }
                .amount { font-size: 18px; font-weight: bold; color: #0f766e; background: #f0fdfa; padding: 10px; border-radius: 6px; text-align: right; margin-top: 12px; }
                .footer { margin-top: 30px; text-align: right; font-size: 12px; }
            </style>
        </head>
        <body onload="window.print()">
            <div class="box">
                <div class="header">
                    <div>
                        <p class="title">PONPES IT AL FIRDAUS</p>
                        <p class="sub">Kuitansi Resmi Pembayaran Syahriah Santri</p>
                    </div>
                    <span class="badge">LUNAS</span>
                </div>
                <table>
                    <tr><td width="160">Tanggal Pembayaran</td><td>: <b>${escapeHtml(date)}</b></td></tr>
                    <tr><td>Nomor Induk Santri</td><td>: ${escapeHtml(santri.nis)}</td></tr>
                    <tr><td>Nama Santri</td><td>: <b>${escapeHtml(santri.nama)}</b></td></tr>
                    <tr><td>Program / Kelas</td><td>: ${escapeHtml(santri.kelas)}</td></tr>
                    <tr><td>Pembayaran Bulan</td><td>: <b>${escapeHtml(bulanNama)} ${escapeHtml(year)}</b></td></tr>
                </table>
                <div class="amount">Total Diterima: ${formatRupiah(amount)}</div>
                <div class="footer">
                    <p>Bendahara Ponpes IT Al Firdaus</p>
                    <br><br>
                    <p><b>( Bagian Keuangan )</b></p>
                </div>
            </div>
        </body>
        </html>
    `);
    win.document.close();
}

// ==================== 10. BUKU KAS MASUK & KELUAR (FIRESTORE) ====================
function renderKasTable() {
    const keyword = document.getElementById('kas-search').value.toLowerCase();
    const filterJenis = document.getElementById('kas-filter-jenis').value;
    const filterBulan = document.getElementById('kas-filter-bulan').value;
    const canEdit = isAdminRole();

    const filtered = appData.kas
        .filter(tx => {
            const matchKey = (tx.keterangan || '').toLowerCase().includes(keyword) || (tx.kategori || '').toLowerCase().includes(keyword);
            const matchJenis = filterJenis === 'ALL' || tx.jenis === filterJenis;
            const matchBulan = filterBulan === 'ALL' || (tx.tanggal && tx.tanggal.split('-')[1] === filterBulan);
            return matchKey && matchJenis && matchBulan;
        })
        .sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || '') || (b.id || '').localeCompare(a.id || ''));

    const tbody = document.getElementById('kas-table-body');
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-slate-400">Tidak ada catatan transaksi sesuai filter.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(tx => {
        const actionCell = canEdit ? `
            <td class="py-3 px-4 text-center">
                <button data-action="delete-kas" data-id="${escapeHtml(tx.id)}" class="text-rose-500 hover:text-rose-700 p-1" title="Hapus Transaksi"><i class="fa-solid fa-trash"></i></button>
            </td>` : '';

        return `
            <tr class="hover:bg-slate-50">
                <td class="py-3 px-4 text-xs text-slate-600 font-medium whitespace-nowrap">${escapeHtml(tx.tanggal)}</td>
                <td class="py-3 px-4 whitespace-nowrap">
                    ${tx.jenis === 'MASUK'
                        ? '<span class="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700"><i class="fa-solid fa-arrow-down mr-1"></i>Masuk</span>'
                        : '<span class="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700"><i class="fa-solid fa-arrow-up mr-1"></i>Keluar</span>'}
                </td>
                <td class="py-3 px-4 text-xs font-semibold text-slate-700">${escapeHtml(tx.kategori)}</td>
                <td class="py-3 px-4 text-slate-700">${escapeHtml(tx.keterangan)}</td>
                <td class="py-3 px-4 text-right font-extrabold whitespace-nowrap ${tx.jenis === 'MASUK' ? 'text-emerald-600' : 'text-rose-600'}">
                    ${tx.jenis === 'MASUK' ? '+' : '-'} ${formatRupiah(tx.nominal)}
                </td>
                ${actionCell}
            </tr>
        `;
    }).join('');
}

document.getElementById('kas-search').addEventListener('input', renderKasTable);
document.getElementById('kas-filter-jenis').addEventListener('change', renderKasTable);
document.getElementById('kas-filter-bulan').addEventListener('change', renderKasTable);

function openKasModal(jenis) {
    if (!isAdminRole()) return;
    document.getElementById('form-kas').reset();
    document.getElementById('kas-jenis').value = jenis;
    document.getElementById('kas-tanggal').value = getTodayDate();

    const header = document.getElementById('modal-kas-header');
    const title = document.getElementById('modal-kas-title');
    const katSelect = document.getElementById('kas-kategori');

    if (jenis === 'MASUK') {
        header.className = 'bg-emerald-700 text-white px-5 py-3.5 flex items-center justify-between';
        title.textContent = 'Catat Pemasukan Kas';
        katSelect.innerHTML = KATEGORI_MASUK.map(k => `<option value="${k}">${k}</option>`).join('');
    } else {
        header.className = 'bg-rose-700 text-white px-5 py-3.5 flex items-center justify-between';
        title.textContent = 'Catat Pengeluaran Kas';
        katSelect.innerHTML = KATEGORI_KELUAR.map(k => `<option value="${k}">${k}</option>`).join('');
    }

    const modal = document.getElementById('modal-kas');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeKasModal() {
    const modal = document.getElementById('modal-kas');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

document.querySelectorAll('.btn-open-kas-modal').forEach(btn => {
    btn.addEventListener('click', () => openKasModal(btn.dataset.kasType));
});
document.getElementById('btn-close-kas-modal').addEventListener('click', closeKasModal);
document.getElementById('btn-cancel-kas-modal').addEventListener('click', closeKasModal);

document.getElementById('kas-table-body').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action="delete-kas"]');
    if (!btn || !isAdminRole()) return;

    const id = btn.dataset.id;
    if (confirm('Hapus transaksi kas ini secara permanen dari Cloud?')) {
        try {
            setSyncBadge('syncing', 'Menghapus...');
            await deleteDoc(doc(db, 'kas', id));
            setSyncBadge('online', 'Cloud Live');
        } catch (err) {
            alert('Gagal menghapus transaksi kas: ' + err.message);
            setSyncBadge('error', 'Error');
        }
    }
});

document.getElementById('form-kas').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isAdminRole()) return;

    const saveBtn = document.getElementById('btn-save-kas');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Menyimpan...';

    const kasId = generateId('KAS');
    const payload = {
        id: kasId,
        tanggal: document.getElementById('kas-tanggal').value,
        jenis: document.getElementById('kas-jenis').value,
        kategori: document.getElementById('kas-kategori').value,
        nominal: Number(document.getElementById('kas-nominal').value),
        keterangan: document.getElementById('kas-keterangan').value.trim(),
        recordedBy: currentUser.email,
        createdAt: new Date().toISOString()
    };

    try {
        setSyncBadge('syncing', 'Menyimpan...');
        await setDoc(doc(db, 'kas', kasId), payload);
        closeKasModal();
        setSyncBadge('online', 'Cloud Live');
    } catch (err) {
        alert('Gagal menyimpan transaksi kas: ' + err.message);
        setSyncBadge('error', 'Error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Simpan Transaksi';
    }
});

// ==================== 11. LAPORAN & TUNGGAKAN ====================
function renderLaporan() {
    const bulan = document.getElementById('laporan-bulan').value;
    const tahun = document.getElementById('laporan-tahun').value;
    const bulanIdx = parseInt(bulan, 10) - 1;
    const prefixDate = `${tahun}-${bulan}`;

    document.getElementById('laporan-periode-label').textContent = `Periode: ${BULAN_NAMES[bulanIdx]} ${tahun}`;

    let masuk = 0;
    let keluar = 0;
    appData.kas.forEach(tx => {
        if (tx.tanggal && tx.tanggal.startsWith(prefixDate)) {
            if (tx.jenis === 'MASUK') masuk += Number(tx.nominal);
            else keluar += Number(tx.nominal);
        }
    });

    const surplus = masuk - keluar;
    document.getElementById('lap-pemasukan').textContent = formatRupiah(masuk);
    document.getElementById('lap-pengeluaran').textContent = formatRupiah(keluar);
    document.getElementById('lap-surplus').textContent = (surplus >= 0 ? '+ ' : '- ') + formatRupiah(Math.abs(surplus));

    const santriAktif = appData.santri.filter(s => s.status === 'AKTIF');
    const menunggak = santriAktif.filter(s => {
        const key = `${s.id}_${tahun}_${bulanIdx}`;
        return !(appData.syahriah[key] && appData.syahriah[key].paid);
    });

    const tbody = document.getElementById('laporan-tunggakan-body');
    if (menunggak.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-emerald-700 font-bold border border-slate-200">Alhamdulillah, seluruh santri aktif telah melunasi syahriah periode ini!</td></tr>`;
    } else {
        let totalTunggakan = 0;
        const rows = menunggak.map((s, idx) => {
            totalTunggakan += Number(s.tarif);
            return `
                <tr>
                    <td class="py-2 px-3 border border-slate-200">${idx + 1}</td>
                    <td class="py-2 px-3 border border-slate-200 font-mono">${escapeHtml(s.nis)}</td>
                    <td class="py-2 px-3 border border-slate-200 font-bold">${escapeHtml(s.nama)}</td>
                    <td class="py-2 px-3 border border-slate-200">${escapeHtml(s.kelas)}</td>
                    <td class="py-2 px-3 border border-slate-200">${escapeHtml(s.wali)} (${escapeHtml(s.hp || '-')})</td>
                    <td class="py-2 px-3 border border-slate-200 text-right font-bold text-rose-600">${formatRupiah(s.tarif)}</td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows + `
            <tr class="bg-slate-50 font-extrabold">
                <td colspan="5" class="py-2 px-3 border border-slate-200 text-right">Total Potensi Tunggakan:</td>
                <td class="py-2 px-3 border border-slate-200 text-right text-rose-700">${formatRupiah(totalTunggakan)}</td>
            </tr>
        `;
    }
}

document.getElementById('laporan-bulan').addEventListener('change', renderLaporan);
document.getElementById('laporan-tahun').addEventListener('change', renderLaporan);
document.getElementById('btn-print-laporan').addEventListener('click', () => window.print());

// ==================== 12. EXPORT EXCEL & CLOUD JSON BACKUP / RESTORE ====================
document.getElementById('btn-export-excel').addEventListener('click', () => {
    if (typeof XLSX === 'undefined') {
        alert('Library Excel belum termuat. Periksa koneksi internet Anda.');
        return;
    }
    const wb = XLSX.utils.book_new();

    const wsSantri = XLSX.utils.json_to_sheet(appData.santri.map(s => ({
        NIS: s.nis,
        Nama_Santri: s.nama,
        Program_Kelas: s.kelas,
        Tarif_Syahriah: s.tarif,
        Wali_Santri: s.wali,
        No_HP: s.hp,
        Status: s.status
    })));
    XLSX.utils.book_append_sheet(wb, wsSantri, 'Data Santri');

    const wsKas = XLSX.utils.json_to_sheet(appData.kas.map(k => ({
        Tanggal: k.tanggal,
        Jenis: k.jenis,
        Kategori: k.kategori,
        Keterangan: k.keterangan,
        Nominal: k.nominal
    })));
    XLSX.utils.book_append_sheet(wb, wsKas, 'Buku Kas Umum');

    const year = document.getElementById('syahriah-year-select').value;
    const syahriahRows = appData.santri.filter(s => s.status === 'AKTIF').map(s => {
        const row = { NIS: s.nis, Nama_Santri: s.nama, Kelas: s.kelas };
        BULAN_SHORT.forEach((b, idx) => {
            const key = `${s.id}_${year}_${idx}`;
            row[b] = (appData.syahriah[key] && appData.syahriah[key].paid) ? 'LUNAS' : 'BELUM';
        });
        return row;
    });
    const wsSyahriah = XLSX.utils.json_to_sheet(syahriahRows);
    XLSX.utils.book_append_sheet(wb, wsSyahriah, `Syahriah_${year}`);

    XLSX.writeFile(wb, `Keuangan_Ponpes_AlFirdaus_${getTodayDate()}.xlsx`);
});

document.getElementById('btn-backup-json').addEventListener('click', () => {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Cloud_Keuangan_AlFirdaus_${getTodayDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('input-restore-json').addEventListener('change', (e) => {
    if (!isAdminRole()) return;
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(evt) {
        try {
            const parsed = JSON.parse(evt.target.result);
            if (!parsed.santri || !parsed.kas) {
                alert('Format file JSON tidak valid! Pastikan file memiliki struktur santri dan kas.');
                return;
            }
            if (!confirm(`Unggah ${parsed.santri.length} data santri dan ${parsed.kas.length} transaksi kas ke Cloud Firestore sekarang?`)) {
                return;
            }

            setSyncBadge('syncing', 'Mengunggah Backup...');
            const batch = writeBatch(db);

            parsed.santri.forEach(s => {
                const sId = s.id || generateId('S');
                batch.set(doc(db, 'santri', sId), { ...s, id: sId });
            });

            parsed.kas.forEach(k => {
                const kId = k.id || generateId('KAS');
                batch.set(doc(db, 'kas', kId), { ...k, id: kId });
            });

            if (parsed.syahriah && typeof parsed.syahriah === 'object') {
                Object.entries(parsed.syahriah).forEach(([key, val]) => {
                    batch.set(doc(db, 'syahriah', key), val);
                });
            }

            await batch.commit();
            setSyncBadge('online', 'Cloud Live');
            alert('Alhamdulillah! Seluruh data backup JSON berhasil disinkronisasi ke Cloud Firestore!');
        } catch (err) {
            console.error('Restore JSON error:', err);
            setSyncBadge('error', 'Gagal Upload');
            alert('Gagal memproses file JSON: ' + err.message);
        } finally {
            e.target.value = '';
        }
    };
    reader.readAsText(file);
});
