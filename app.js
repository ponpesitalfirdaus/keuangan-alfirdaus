// ============================================================================
// SISTEM PENCATATAN & REKAPITULASI BIAYA PENDIDIKAN
// INSTANSI : PONPES SIT AL FIRDAUS (SMPIT / SMAIT AL FIRDAUS)
// BENDAHARA: RESTASARI, S.Sos
// ============================================================================

const STORAGE_KEY_STUDENTS = 'alfirdaus_students_v1';
const STORAGE_KEY_TX = 'alfirdaus_transactions_v1';

const MONTH_ORDER = [
  'juli', 'agustus', 'september', 'oktober', 'november', 'desember',
  'januari', 'februari', 'maret', 'april', 'mei', 'juni'
];

let students = [];
let transactions = [];

// Data awal contoh (diambil dari struktur sheet BIAYA PENDIDIKAN 2026-2027.xlsx)
// Bendahara dapat langsung mengimpor file .xlsx asli kapan saja melalui tombol Import Excel
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
// INISIALISASI & PENYIMPANAN LOKAL
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  populateSheetFilter();
  renderTable();
  renderRiwayat();

  document.getElementById('excel-upload').addEventListener('change', handleExcelUpload);
  document.getElementById('json-restore').addEventListener('change', handleJSONRestore);
});

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
// HELPER FORMAT RUPIAH & TERBILANG
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
  const s = sheetName.toLowerCase();
  if (s.includes('7') || s.includes('8') || s.includes('9') || s.includes('smp')) {
    return 'SMPIT Al Firdaus';
  }
  if (s.includes('10') || s.includes('11') || s.includes('12') || s.includes('sma')) {
    return 'SMAIT Al Firdaus';
  }
  return 'Ponpes SIT Al Firdaus';
}

// ============================================================================
// PARSER FILE EXCEL (BIAYA PENDIDIKAN 2026-2027.xlsx - SELURUH 14 SHEET)
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

        // Cari baris header (mengandung kolom 'No' dan 'Nama')
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

        // Ambil informasi tahun pelajaran jika ada
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

        // Kolom 0 = No, Kolom 1 = Nama, Kolom 2 = SPP dasar
        for (let c = 3; c < headers.length; c++) {
          let rawH = headers[c];
          if (rawH === '' || rawH === null || rawH === undefined) continue;

          // Konversi jika header berupa Date object (seperti pada sheet A. SMA 24-25)
          let label = '';
          if (rawH instanceof Date && !isNaN(rawH)) {
            const bulanIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            label = `${bulanIndo[rawH.getMonth()]} ${rawH.getFullYear()}`;
          } else {
            label = String(rawH).trim();
          }

          const lowerLabel = label.toLowerCase();
          // Lewati kolom total/rekap agar tidak terhitung ganda
          if (lowerLabel === 'total' || lowerLabel === 'tunggakan') continue;

          const monthKey = detectMonthKey(label);
          componentCols.push({
            colIndex: c,
            label: label,
            type: monthKey ? 'monthly' : 'fixed',
            monthKey: monthKey
          });
        }

        // Iterasi baris santri
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

      // Pertahankan nomor WA jika nama santri sudah pernah disimpan sebelumnya
      const oldWaMap = {};
      students.forEach((s) => {
        if (s.wa) oldWaMap[s.nama.toLowerCase()] = s.wa;
      });
      parsedStudents.forEach((s) => {
        if (oldWaMap[s.nama.toLowerCase()]) {
          s.wa = oldWaMap[s.nama.toLowerCase()];
        }
      });

      students = parsedStudents;
      saveData();
      populateSheetFilter();
      renderTable();
      alert(`Berhasil mengimpor ${students.length} data santri dari ${workbook.SheetNames.length} sheet!`);
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
      // Cek apakah sheet ini semester 1 (Juli-Des) atau semester 2 (Jan-Jun)
      const isSmt2Cutoff = cutoffIdx >= 6; // Januari..Juni
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
// RENDER UI TABEL, STATISTIK, & REKAPITULASI
// ============================================================================
function populateSheetFilter() {
  const select = document.getElementById('filter-sheet');
  const currentVal = select.value;
  const uniqueSheets = [...new Set(students.map((s) => s.sheet))];

  select.innerHTML = '<option value="ALL">-- Semua Kelas / Sheet --</option>';
  uniqueSheets.forEach((sh) => {
    const opt = document.createElement('option');
    opt.value = sh;
    opt.textContent = sh;
    select.appendChild(opt);
  });

  if (uniqueSheets.includes(currentVal)) {
    select.value = currentVal;
  }
}

function renderTable() {
  const sheetFilter = document.getElementById('filter-sheet').value;
  const cutoffFilter = document.getElementById('filter-cutoff').value;
  const statusFilter = document.getElementById('filter-status').value;
  const searchFilter = document.getElementById('filter-search').value.toLowerCase().trim();

  const tbody = document.getElementById('table-body');
  tbody.innerHTML = '';

  let countSantri = 0;
  let countLunas = 0;
  let countMenunggak = 0;
  let grandTotalTunggakan = 0;

  const filtered = students.filter((st) => {
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

    const badgesHtml = activeItems.length > 0
      ? activeItems.map((it) => `<span class="inline-block bg-rose-50 text-rose-700 border border-rose-200 text-[11px] px-2 py-0.5 rounded mr-1 mb-1">${it.label}: <b>${formatRupiah(it.amount)}</b></span>`).join('')
      : '<span class="text-xs text-emerald-600 italic">Tidak ada tunggakan</span>';

    const statusBadge = total === 0
      ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">LUNAS</span>'
      : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">MENUNGGAK</span>';

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition';
    tr.innerHTML = `
      <td class="px-4 py-3 text-slate-500">${i + 1}</td>
      <td class="px-4 py-3">
        <div class="font-bold text-slate-800">${st.nama}</div>
        <div class="text-[11px] text-slate-400">${st.wa ? '<i class="fa-brands fa-whatsapp text-green-600"></i> ' + st.wa : 'No. WA belum diisi'}</div>
      </td>
      <td class="px-4 py-3">
        <span class="bg-slate-100 text-slate-700 font-semibold text-xs px-2 py-1 rounded">${st.sheet}</span>
      </td>
      <td class="px-4 py-3 text-right font-medium text-slate-600">${formatRupiah(st.sppDasar)}</td>
      <td class="px-4 py-3 max-w-xs">${badgesHtml}</td>
      <td class="px-4 py-3 text-right font-bold ${total > 0 ? 'text-rose-600' : 'text-emerald-700'}">${formatRupiah(total)}</td>
      <td class="px-4 py-3 text-center">${statusBadge}</td>
      <td class="px-4 py-3">
        <div class="flex items-center justify-center gap-1.5">
          <button onclick="openBayarModal('${st.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1.5 rounded-lg font-semibold" title="Catat Pembayaran">
            <i class="fa-solid fa-cash-register"></i> Bayar
          </button>
          <button onclick="openWAModal('${st.id}')" class="bg-green-600 hover:bg-green-700 text-white text-xs px-2.5 py-1.5 rounded-lg" title="Kirim Tagihan via WhatsApp">
            <i class="fa-brands fa-whatsapp"></i>
          </button>
          <button onclick="openPrintTagihan('${st.id}')" class="bg-slate-700 hover:bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg" title="Cetak Surat Tagihan PDF">
            <i class="fa-solid fa-print"></i>
          </button>
          <button onclick="openEditModal('${st.id}')" class="bg-amber-500 hover:bg-amber-600 text-white text-xs px-2.5 py-1.5 rounded-lg" title="Edit Data Santri">
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

  // Update Kartu Statistik
  document.getElementById('stat-total-santri').textContent = countSantri;
  document.getElementById('stat-kelas-aktif').textContent = sheetFilter === 'ALL' ? 'Semua Kelas / Unit' : `Kelas / Sheet: ${sheetFilter}`;
  document.getElementById('stat-lunas').textContent = countLunas;
  document.getElementById('stat-menunggak').textContent = countMenunggak;
  document.getElementById('stat-total-tunggakan').textContent = formatRupiah(grandTotalTunggakan);
  document.getElementById('stat-cutoff-label').textContent = cutoffFilter === 'ALL' ? 'Cut-off: Semua Bulan' : `Cut-off: s.d. ${cutoffFilter}`;

  renderRekap();
}

function renderRekap() {
  const cutoffFilter = document.getElementById('filter-cutoff').value;
  const tbody = document.getElementById('rekap-body');
  const tfoot = document.getElementById('rekap-foot');
  tbody.innerHTML = '';

  const grouped = {};
  students.forEach((st) => {
    if (!grouped[st.sheet]) {
      grouped[st.sheet] = { sheet: st.sheet, unit: st.unit, totalSantri: 0, lunas: 0, menunggak: 0, nominal: 0 };
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
    tr.className = 'hover:bg-slate-50';
    tr.innerHTML = `
      <td class="px-4 py-3 text-slate-500">${idx + 1}</td>
      <td class="px-4 py-3 font-bold text-slate-800">${g.sheet}</td>
      <td class="px-4 py-3 text-slate-600">${g.unit}</td>
      <td class="px-4 py-3 text-center">${g.totalSantri}</td>
      <td class="px-4 py-3 text-center text-emerald-700 font-semibold">${g.lunas}</td>
      <td class="px-4 py-3 text-center text-rose-600 font-semibold">${g.menunggak}</td>
      <td class="px-4 py-3 text-right font-bold text-slate-800">${formatRupiah(g.nominal)}</td>
    `;
    tbody.appendChild(tr);
  });

  tfoot.innerHTML = `
    <tr>
      <td colspan="3" class="px-4 py-3 text-right uppercase text-xs">Grand Total Seluruh Unit (${cutoffFilter === 'ALL' ? 'Semua Bulan' : 's.d. ' + cutoffFilter}):</td>
      <td class="px-4 py-3 text-center">${sumSantri}</td>
      <td class="px-4 py-3 text-center">${sumLunas}</td>
      <td class="px-4 py-3 text-center">${sumMenunggak}</td>
      <td class="px-4 py-3 text-right text-base">${formatRupiah(sumNominal)}</td>
    </tr>
  `;
}

// ============================================================================
// MODUL PEMBAYARAN & KWITANSI OTOMATIS
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
    listContainer.innerHTML = '<p class="text-xs text-emerald-700 font-semibold text-center py-3">Seluruh tagihan santri ini sudah LUNAS!</p>';
  } else {
    unpaidFees.forEach((f) => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-slate-200';
      row.innerHTML = `
        <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer flex-1">
          <input type="checkbox" class="bayar-check w-4 h-4 accent-emerald-600" data-idx="${f.idx}" data-max="${f.amount}" onchange="toggleBayarItem(this)" />
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
  let totalPaid = 0;

  document.querySelectorAll('.bayar-amount').forEach((inp) => {
    const idx = Number(inp.getAttribute('data-idx'));
    const payVal = Math.max(0, Math.round(Number(inp.value) || 0));
    if (payVal > 0 && st.fees[idx]) {
      const actualPay = Math.min(payVal, st.fees[idx].amount);
      st.fees[idx].amount -= actualPay;
      totalPaid += actualPay;
      paidDetails.push({
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
    details: paidDetails
  };

  transactions.unshift(txRecord);
  saveData();
  renderTable();
  renderRiwayat();
  closeModal('modal-bayar');
  openPrintKwitansi(txRecord.id);
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
      <td class="px-4 py-3 font-mono text-xs font-bold text-emerald-800">${tx.noKwitansi}</td>
      <td class="px-4 py-3 text-xs text-slate-600">${tx.tanggal}</td>
      <td class="px-4 py-3 font-bold text-slate-800">${tx.nama}</td>
      <td class="px-4 py-3 text-xs"><span class="bg-slate-100 px-2 py-0.5 rounded font-semibold">${tx.sheet}</span></td>
      <td class="px-4 py-3 text-xs text-slate-600">${detailStr}</td>
      <td class="px-4 py-3 text-right font-bold text-emerald-700">${formatRupiah(tx.totalPaid)}</td>
      <td class="px-4 py-3 text-center">
        <div class="flex items-center justify-center gap-1.5">
          <button onclick="openPrintKwitansi('${tx.id}')" class="bg-slate-700 hover:bg-slate-800 text-white text-xs px-2.5 py-1 rounded" title="Cetak Kwitansi">
            <i class="fa-solid fa-print"></i>
          </button>
          <button onclick="sendKwitansiWA('${tx.id}')" class="bg-green-600 hover:bg-green-700 text-white text-xs px-2.5 py-1 rounded" title="Kirim Bukti Bayar via WA">
            <i class="fa-brands fa-whatsapp"></i>
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
  const st = students.find((s) => s.id === tx.studentId);
  const { total: sisaTotal } = st ? getStudentArrears(st, 'ALL') : { total: 0 };

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
Sisa Tagihan Keseluruhan : ${formatRupiah(sisaTotal)}

Terima kasih atas pembayarannya. Jazakumullahu Khairan Katsiran.

Bendahara Ponpes SIT Al Firdaus,
*Restasari, S.Sos*`;

  document.getElementById('wa-phone').value = (st && st.wa) ? st.wa : '';
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
// CETAK / SAVE PDF SURAT TAGIHAN & KWITANSI RESMI
// ============================================================================
function getKopSuratHTML() {
  return `
    <div class="border-b-4 border-double border-slate-800 pb-3 mb-4 text-center">
      <p class="text-xs font-semibold tracking-widest uppercase text-emerald-800">Yayasan Pendidikan Islam Terpadu</p>
      <h2 class="text-xl font-extrabold tracking-wide text-slate-900">PONPES SIT AL FIRDAUS</h2>
      <p class="text-xs font-semibold text-slate-700">UNIT SMPIT AL FIRDAUS &bull; UNIT SMAIT AL FIRDAUS</p>
      <p class="text-[11px] text-slate-500 mt-0.5">Administrasi Keuangan &amp; Tata Usaha Bendahara</p>
    </div>
  `;
}

function getSignatureHTML(tanggalStr) {
  return `
    <div class="mt-8 flex justify-end">
      <div class="text-center text-xs w-56">
        <p>${tanggalStr}</p>
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
    : `<tr><td colspan="3" class="py-4 text-center text-emerald-700 font-semibold">Alhamdulillah, Tidak Ada Tunggakan (LUNAS)</td></tr>`;

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
        <span class="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded border border-emerald-300">SAH / DITERIMA</span>
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
      <tfoot class="bg-emerald-50 font-bold border-t-2 border-emerald-400">
        <tr>
          <td colspan="2" class="py-2 px-3 text-right uppercase">Total Diterima</td>
          <td class="py-2 px-3 text-right text-sm text-emerald-900">${formatRupiah(tx.totalPaid)}</td>
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
          <th class="px-3 py-2 text-left">Kelas / Kelompok</th>
          <th class="px-3 py-2 text-left">Unit</th>
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
// TAMBAH & EDIT SANTRI
// ============================================================================
function openAddStudentModal() {
  document.getElementById('edit-modal-title').textContent = 'Tambah Data Santri Baru';
  document.getElementById('edit-student-id').value = '';
  document.getElementById('edit-nama').value = '';
  document.getElementById('edit-wa').value = '';
  document.getElementById('edit-sheet').value = '7 smt 1';
  document.getElementById('edit-spp').value = 850000;

  const container = document.getElementById('edit-fees-container');
  container.innerHTML = '';
  ['U. Pangkal', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].forEach((lbl) => {
    addEditFeeRow(lbl, 0);
  });
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

  const container = document.getElementById('edit-fees-container');
  container.innerHTML = '';
  st.fees.forEach((f) => addEditFeeRow(f.label, f.amount));
  openModal('modal-edit');
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

  saveData();
  populateSheetFilter();
  renderTable();
  closeModal('modal-edit');
}

// ============================================================================
// EXPORT REKAP EXCEL & BACKUP JSON
// ============================================================================
function exportToExcel() {
  const cutoffFilter = document.getElementById('filter-cutoff').value;
  const wb = XLSX.utils.book_new();

  // Sheet 1: Rekapitulasi Keseluruhan
  const allRows = students.map((st, idx) => {
    const { total, activeItems } = getStudentArrears(st, cutoffFilter);
    return {
      No: idx + 1,
      'Nama Santri': st.nama,
      'Kelas / Sheet': st.sheet,
      Unit: st.unit,
      'No WA Wali': st.wa || '-',
      'SPP Dasar': st.sppDasar,
      'Rincian Tunggakan': activeItems.map((i) => `${i.label}: ${i.amount}`).join('; ') || 'LUNAS',
      [`Total Tunggakan (${cutoffFilter === 'ALL' ? 'Semua Bulan' : 's.d ' + cutoffFilter})`]: total,
      Status: total === 0 ? 'LUNAS' : 'MENUNGGAK'
    };
  });
  const wsAll = XLSX.utils.json_to_sheet(allRows);
  XLSX.utils.book_append_sheet(wb, wsAll, 'Rekap Semua Santri');

  // Sheet 2: Riwayat Pembayaran
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
    instansi: 'Ponpes SIT Al Firdaus',
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
  ['tagihan', 'rekap', 'riwayat'].forEach((name) => {
    document.getElementById(`view-${name}`).classList.toggle('hidden', name !== tabName);
    const btn = document.getElementById(`tab-${name}`);
    if (name === tabName) {
      btn.className = 'tab-btn bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition';
    } else {
      btn.className = 'tab-btn bg-white text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 transition';
    }
  });
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
