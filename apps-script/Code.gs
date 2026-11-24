/* =====================================================================
   PPT WISUDAWAN — Jurusan Gizi Poltekkes Kemenkes Makassar
   Backend Google Apps Script, tersambung ke Gizi-Link

   • Data induk mahasiswa (Nama, Prodi, Tanggal Lahir) DIBACA dari sheet
     "Mahasiswa" milik Gizi-Link — tidak disalin, tidak diubah.
   • Login memakai token Gizi-Link (SSO_SECRET yang sama).
   • Hak staf diambil dari token Gizi-Link (sheet Staf):
       - Jabatan "Kajur" / "Sekjur" / "Kaprodi" / "Wisuda" = boleh masuk
       - Kolom "Permohonan" berisi D3 / D4 / Prof / Semua = prodi yang dipegang
       - Hanya Kajur yang boleh membuka/menutup pengisian
   • Spreadsheet ini hanya menyimpan: daftar Wisudawan (NIM, IPK, tempat lahir),
     DataSlide isian mahasiswa, Pengaturan, dan Log.

   Pasang:
   1. Google Sheet baru > Ekstensi > Apps Script > tempel file ini > Simpan.
   2. Jalankan  siapkan()  sekali (izinkan akses).
   3. Project Settings > Script Properties > tambah  SSO_SECRET  = rahasia
      yang sama dengan Gizi-Link (jalankan lihatRahasiaSSO() di Gizi-Link).
   4. Jalankan  cekKoneksi()  untuk memastikan master Gizi-Link terbaca.
   5. Deploy > Aplikasi web (Jalankan sebagai: Saya, Akses: Siapa saja).
   ===================================================================== */

var TZ = 'Asia/Makassar';
var GIZILINK_SHEET_ID = '1iYaqOG-6C0n0uSjMGSiUU1YZrqOn48wkOptZMBphYdQ';
var SH = { WIS: 'Wisudawan', DATA: 'DataSlide', SET: 'Pengaturan', LOG: 'Log' };
var KOLOM = {
  Wisudawan:  ['NIM', 'Nama (otomatis)', 'Prodi (otomatis)', 'IPK', 'Tempat_Lahir', 'No_HP', 'Keterangan'],
  DataSlide:  ['NIM', 'Tempat_Lahir', 'Tgl_Lahir', 'TTL_Dikoreksi', 'Ayah', 'Ibu', 'Quote',
               'Catatan_Mhs', 'Foto_ID', 'Status', 'Catatan_Admin', 'Diperbarui', 'Diperiksa_Oleh'],
  Pengaturan: ['Kunci', 'Nilai', 'Keterangan'],
  Log:        ['Waktu', 'Pengguna', 'Aksi', 'Detail']
};
var JABATAN_BOLEH = ['kajur', 'sekjur', 'kaprodi', 'wisuda'];
var BATAS = { NAMA_ORTU: 60, QUOTE: 150, TEMPAT: 40, CATATAN: 300, FOTO_BYTES: 1500000 };
var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
             'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/* ------------------------------------------------------------------ */
/*  SETUP                                                              */
/* ------------------------------------------------------------------ */
function siapkan() {
  var ss = SpreadsheetApp.getActive();
  Object.keys(KOLOM).forEach(function (nama) {
    var sh = ss.getSheetByName(nama) || ss.insertSheet(nama);
    if (sh.getLastRow() === 0) {
      sh.appendRow(KOLOM[nama]);
      sh.getRange(1, 1, 1, KOLOM[nama].length).setFontWeight('bold').setBackground('#D4EEEA');
      sh.setFrozenRows(1);
    }
  });
  ss.getSheetByName(SH.WIS).getRange('A:A').setNumberFormat('@');
  ss.getSheetByName(SH.DATA).getRange('A:A').setNumberFormat('@');
  // Kolom Nama & Prodi di sheet Wisudawan hanya bantuan tampilan, diisi lewat menu
  ss.getSheetByName(SH.WIS).getRange('B1:C1').setBackground('#EEEEEE');

  var set = ss.getSheetByName(SH.SET);
  if (set.getLastRow() < 2) {
    set.getRange(2, 1, 8, 3).setValues([
      ['TAHUN', '2026', 'Tahun wisuda (tampil di sampul & penutup)'],
      ['JURUSAN', 'Gizi', 'Nama jurusan di sampul'],
      ['PRODI_D3', 'D3 Gizi', 'Nama prodi di sampul PPT D3'],
      ['PRODI_D4', 'Sarjana Terapan Gizi dan Dietetika', 'Nama prodi di sampul PPT D4'],
      ['PRODI_PROF', 'Pendidikan Profesi Dietisien', 'Nama prodi di sampul PPT Profesi'],
      ['DIBUKA', 'Ya', 'Ya = mahasiswa boleh mengisi; Tidak = ditutup'],
      ['BATAS_PENGISIAN', '', 'Tanggal batas (yyyy-mm-dd), kosongkan bila tidak ada'],
      ['URUTAN', 'NIM', 'Urutan bawaan slide: NIM / ABJAD / IPK']
    ]);
  }
  var p = PropertiesService.getScriptProperties();
  if (!p.getProperty('RAHASIA')) p.setProperty('RAHASIA', Utilities.getUuid() + Utilities.getUuid());
  if (!p.getProperty('FOLDER_FOTO')) {
    var f = DriveApp.createFolder('Foto Wisudawan Gizi (PPT Wisuda) — JANGAN DIBAGIKAN');
    p.setProperty('FOLDER_FOTO', f.getId());
  }
  if (!p.getProperty('SSO_SECRET')) Logger.log('PERHATIAN: tambahkan Script Property SSO_SECRET (sama dengan Gizi-Link).');
  toast_('Siap. Isi sheet Wisudawan, lalu tambahkan SSO_SECRET.');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('PPT Wisudawan')
    .addItem('Siapkan sheet & folder', 'siapkan')
    .addItem('Cek koneksi ke Gizi-Link', 'cekKoneksi')
    .addItem('Isi Nama & Prodi dari master Gizi-Link', 'isiNamaProdi')
    .addToUi();
}

/** Uji: master Gizi-Link terbaca & berapa wisudawan yang cocok. */
function cekKoneksi() {
  var m = master_(), w = baris_(SH.WIS), cocok = 0, tidak = [];
  w.forEach(function (r) { if (m[normNim_(r.NIM)]) cocok++; else if (r.NIM) tidak.push(String(r.NIM)); });
  var sso = PropertiesService.getScriptProperties().getProperty('SSO_SECRET') ? 'ada' : 'BELUM ADA';
  var pesan = 'Master Gizi-Link: ' + Object.keys(m).length + ' mahasiswa. Wisudawan cocok: ' + cocok + '/' + w.length +
    (tidak.length ? '. NIM tidak ditemukan: ' + tidak.slice(0, 10).join(', ') : '') + '. SSO_SECRET: ' + sso + '.';
  Logger.log(pesan); toast_(pesan);
  return pesan;
}

/** Mengisi kolom Nama & Prodi (bantuan) di sheet Wisudawan dari master Gizi-Link. */
function isiNamaProdi() {
  var m = master_(), sh = sheet_(SH.WIS), w = baris_(SH.WIS);
  w.forEach(function (r) {
    var x = m[normNim_(r.NIM)];
    sh.getRange(r._row, 2, 1, 2).setValues([[x ? x.nama : '(NIM tidak ada di Gizi-Link)', x ? x.prodiTeks : '']]);
  });
  toast_('Nama & Prodi diperbarui untuk ' + w.length + ' baris.');
}

function toast_(m) { try { SpreadsheetApp.getActive().toast(m, 'PPT Wisudawan', 8); } catch (e) {} }

/* ------------------------------------------------------------------ */
/*  ROUTER                                                             */
/* ------------------------------------------------------------------ */
function doGet() { return json_({ ok: true, app: 'PPT Wisudawan Gizi' }); }

function doPost(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, pesan: 'Permintaan tidak valid.' }); }
  var aksi = String(req.aksi || '');
  var mhs = { dataSaya: dataSaya_, simpan: simpan_, unggahFoto: unggahFoto_, fotoSaya: fotoSaya_ };
  var adm = { daftar: daftar_, setStatus: setStatus_, foto: fotoAdmin_, pengaturan: pengaturan_ };
  try {
    if (aksi === 'loginMhs') return json_(loginMhs_(req));
    var s = sesi_(req.token);
    if (!s) return json_({ ok: false, pesan: 'Sesi berakhir. Silakan masuk lagi lewat Gizi-Link.', login: true });
    if (s.tolak) return json_({ ok: false, pesan: s.tolak, login: true });
    if (aksi === 'sesi') return json_({ ok: true, peran: s.r, nama: s.n, prodi: s.p });
    if (mhs[aksi] && s.r === 'mhs') return json_(mhs[aksi](req, s));
    if (adm[aksi] && s.r !== 'mhs') return json_(adm[aksi](req, s));
    return json_({ ok: false, pesan: 'Aksi tidak dikenal atau tidak diizinkan.' });
  } catch (err) {
    log_('sistem', 'galat', aksi + ': ' + err);
    return json_({ ok: false, pesan: 'Terjadi galat: ' + err.message });
  }
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ------------------------------------------------------------------ */
/*  SESI: token Gizi-Link (mahasiswa/staf) atau token cadangan        */
/* ------------------------------------------------------------------ */
function sesi_(token) {
  var p = verifikasiSSO_(token);
  if (p && p.jenis !== 'staf') return sesiMhs_(p.nim);
  p = verifikasiStafSSO_(token);
  if (p) return sesiStaf_(p);
  p = cekTokenLokal_(token);
  if (p) return sesiMhs_(p.nim);
  return null;
}

function sesiMhs_(nim) {
  var n = normNim_(nim);
  if (!wisudawan_()[n]) return { tolak: 'Menu ini khusus calon wisudawan ' + (setting_().TAHUN || '') + '. Hubungi admin prodi bila Anda terdaftar wisuda.' };
  return { r: 'mhs', u: n };
}

function sesiStaf_(p) {
  var jab = String(p.jabatan || '').split(/[,;]/).map(function (x) { return x.trim().toLowerCase(); });
  var boleh = jab.some(function (j) { return JABATAN_BOLEH.indexOf(j) >= 0; });
  var kode = String(p.permohonan || '').split(/[,;]/).map(function (x) { return x.trim().toUpperCase(); });
  var prodi = kode.indexOf('SEMUA') >= 0 ? ['D3', 'D4', 'PROF'] : kode.filter(function (k) { return ['D3', 'D4', 'PROF'].indexOf(k) >= 0; });
  if (!boleh || !prodi.length) return { tolak: 'Akun Anda belum diberi akses PPT Wisudawan. Hubungi Ketua Jurusan.' };
  return {
    r: jab.indexOf('kajur') >= 0 ? 'kajur' : 'admin', u: String(p.id), n: String(p.nama || p.id),
    p: prodi.length === 3 ? 'SEMUA' : prodi.join(','), daftarProdi: prodi
  };
}
function bolehProdi_(s, kode) { return s.daftarProdi.indexOf(kode) >= 0; }

/* === Disalin apa adanya dari Gizi-Link (jangan diubah) === */
function verifikasiSSO_(token) {
  try {
    var rahasia = PropertiesService.getScriptProperties().getProperty('SSO_SECRET');
    var bagian = String(token || '').split('.');
    if (!rahasia || bagian.length !== 2) return null;
    var sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(bagian[0], rahasia));
    if (sig !== bagian[1]) return null;
    var p = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(bagian[0])).getDataAsString('UTF-8'));
    if (!p || !p.nim || !p.exp || Date.now() > Number(p.exp)) return null;
    return p;
  } catch (e) { return null; }
}
function verifikasiStafSSO_(token) {
  try {
    var rahasia = PropertiesService.getScriptProperties().getProperty('SSO_SECRET');
    var bagian = String(token || '').split('.');
    if (!rahasia || bagian.length !== 2) return null;
    var sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(bagian[0], rahasia));
    if (sig !== bagian[1]) return null;
    var p = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(bagian[0])).getDataAsString('UTF-8'));
    if (!p || p.jenis !== 'staf' || !p.id || !p.exp || Date.now() > Number(p.exp)) return null;
    return p;
  } catch (e) { return null; }
}
function normNim_(v) { return String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/O/g, '0'); }
function isoTanggal_(v, tz) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v)) return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  var s = String(v || '').trim();
  var pad = function (n) { return ('0' + Number(n)).slice(-2); };
  var m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if (m) return m[1] + '-' + pad(m[2]) + '-' + pad(m[3]);
  m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/);
  if (m) return m[3] + '-' + pad(m[2]) + '-' + pad(m[1]);
  var BLN = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
  var EN = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  m = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (m) {
    var b = m[2].slice(0, 3).toLowerCase();
    var k = BLN.indexOf(b); if (k < 0) k = EN.indexOf(b);
    if (b === 'ags') k = 7;
    if (k >= 0) return m[3] + '-' + pad(k + 1) + '-' + pad(m[1]);
  }
  return '';
}
/* === akhir salinan Gizi-Link === */

/* Token cadangan (bila mahasiswa membuka aplikasi tanpa lewat Gizi-Link) */
function buatTokenLokal_(nim) {
  var b = Utilities.base64EncodeWebSafe(JSON.stringify({ l: 1, nim: nim, e: Date.now() + 1000 * 60 * 60 * 12 }));
  return 'L.' + b + '.' + ttdLokal_(b);
}
function cekTokenLokal_(t) {
  var bag = String(t || '').split('.');
  if (bag.length !== 3 || bag[0] !== 'L' || ttdLokal_(bag[1]) !== bag[2]) return null;
  var p = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(bag[1])).getDataAsString());
  return p.e > Date.now() ? p : null;
}
function ttdLokal_(b) {
  var k = PropertiesService.getScriptProperties().getProperty('RAHASIA');
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(b, k)).replace(/=+$/, '');
}

function loginMhs_(req) {
  var n = normNim_(req.nim), cache = CacheService.getScriptCache();
  if (cache.get('kunci_' + n)) return { ok: false, pesan: 'Terlalu banyak percobaan. Coba lagi 15 menit lagi.' };
  var m = master_()[n];
  if (!m || m.tgl !== String(req.tgl || '').trim()) {
    var g = Number(cache.get('gagal_' + n) || 0) + 1;
    if (g >= 5) { cache.put('kunci_' + n, '1', 900); cache.remove('gagal_' + n); } else cache.put('gagal_' + n, String(g), 900);
    return { ok: false, pesan: 'NIM atau tanggal lahir tidak cocok.' };
  }
  cache.remove('gagal_' + n);
  var s = sesiMhs_(n);
  if (s.tolak) return { ok: false, pesan: s.tolak };
  return { ok: true, token: buatTokenLokal_(n), peran: 'mhs' };
}

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */
function sheet_(n) { return SpreadsheetApp.getActive().getSheetByName(n); }
function baris_(namaSheet) {
  var v = sheet_(namaSheet).getDataRange().getValues();
  var h = v.shift().map(function (x) { return String(x).trim(); });
  return v.map(function (r, i) { var o = { _row: i + 2 }; h.forEach(function (k, j) { o[k] = r[j]; }); return o; })
          .filter(function (o) { return String(o[h[0]] || '').trim() !== ''; });
}

/** Master mahasiswa dari Gizi-Link → { NIMnorm: {nim, nama, prodiTeks, kode, tgl} } */
var _MASTER = null;
function master_() {
  if (_MASTER) return _MASTER;
  var sh = SpreadsheetApp.openById(GIZILINK_SHEET_ID).getSheetByName('Mahasiswa');
  var data = sh.getDataRange().getValues();
  var head = data[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var kol = function (f) { for (var j = 0; j < head.length; j++) if (f(head[j])) return j; return -1; };
  var iNim = kol(function (h) { return h.indexOf('nim') === 0; }), iNama = kol(function (h) { return h.indexOf('nama') === 0; });
  var iProdi = kol(function (h) { return h.indexOf('prodi') >= 0 || h.indexOf('program studi') >= 0; });
  var iTgl = kol(function (h) { return h.indexOf('lahir') >= 0; });
  var tz = SpreadsheetApp.openById(GIZILINK_SHEET_ID).getSpreadsheetTimeZone();
  var o = {};
  for (var i = 1; i < data.length; i++) {
    var r = data[i], n = normNim_(r[iNim]);
    if (!n) continue;
    var pt = String(r[iProdi] || '').trim();
    o[n] = { nim: String(r[iNim]).trim().replace(/^'/, '').toUpperCase(), nama: String(r[iNama] || '').trim(),
             prodiTeks: pt, kode: kodeProdi_(pt), tgl: isoTanggal_(r[iTgl], tz) };
  }
  _MASTER = o;
  return o;
}
function kodeProdi_(t) {
  t = String(t).toUpperCase();
  if (t.indexOf('D3') === 0) return 'D3';
  if (t.indexOf('D4') === 0) return 'D4';
  if (t.indexOf('PROF') === 0) return 'PROF';
  return '';
}

/** Sheet Wisudawan → { NIMnorm: baris } */
var _WIS = null;
function wisudawan_() {
  if (_WIS) return _WIS;
  var o = {};
  baris_(SH.WIS).forEach(function (r) { o[normNim_(r.NIM)] = r; });
  return (_WIS = o);
}
function dataSlide_(nim) {
  var n = normNim_(nim), all = baris_(SH.DATA);
  for (var i = 0; i < all.length; i++) if (normNim_(all[i].NIM) === n) return all[i];
  return null;
}

function setting_() {
  var o = {};
  baris_(SH.SET).forEach(function (r) {
    var v = r.Nilai;
    if (v instanceof Date) v = Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
    o[String(r.Kunci).trim()] = String(v).trim();
  });
  return o;
}
function tglIndo_(iso) {
  var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? (+m[3]) + ' ' + BULAN[+m[2] - 1] + ' ' + m[1] : '';
}
function ipk_(v) {
  if (v === '' || v == null) return '';
  var n = Number(String(v).replace(',', '.'));
  return isNaN(n) ? String(v) : n.toFixed(2).replace('.', ',');
}
function bersih_(s, maks) { return String(s == null ? '' : s).replace(/[\u0000-\u001F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maks); }
function log_(u, a, d) { try { sheet_(SH.LOG).appendRow([new Date(), u, a, String(d || '').slice(0, 500)]); } catch (e) {} }
function bolehUbah_(set) {
  if (String(set.DIBUKA).toLowerCase() !== 'ya') return 'Pengisian sudah ditutup.';
  if (set.BATAS_PENGISIAN && Date.now() > new Date(set.BATAS_PENGISIAN + 'T23:59:59+08:00').getTime()) return 'Batas pengisian sudah lewat.';
  return '';
}

/* Gabungan master Gizi-Link + sheet Wisudawan + DataSlide */
function profil_(m, w, d) {
  d = d || {}; w = w || {};
  var tempatAsli = String(w.Tempat_Lahir || '').trim(), tglAsli = m.tgl;
  var tempat = d.Tempat_Lahir ? String(d.Tempat_Lahir) : tempatAsli;
  var tgl = d.Tgl_Lahir ? isoTanggal_(d.Tgl_Lahir, TZ) : tglAsli;
  return {
    nim: m.nim, nama: m.nama, prodi: m.kode, ipk: ipk_(w.IPK), noHp: String(w.No_HP || ''),
    tempat: tempat, tgl: tgl, ttl: tempat + (tgl ? ', ' + tglIndo_(tgl) : ''),
    ttlDikoreksi: String(d.TTL_Dikoreksi || '') === 'Ya',
    ttlAsli: (tempatAsli || '(tempat kosong)') + ', ' + tglIndo_(tglAsli),
    ayah: String(d.Ayah || ''), ibu: String(d.Ibu || ''), quote: String(d.Quote || ''),
    catatanMhs: String(d.Catatan_Mhs || ''), adaFoto: !!d.Foto_ID,
    status: String(d.Status || 'Belum Mengisi'), catatanAdmin: String(d.Catatan_Admin || ''),
    diperbarui: d.Diperbarui ? Utilities.formatDate(new Date(d.Diperbarui), TZ, 'dd/MM/yyyy HH:mm') : '',
    diperiksa: String(d.Diperiksa_Oleh || '')
  };
}

/* ------------------------------------------------------------------ */
/*  MAHASISWA                                                          */
/* ------------------------------------------------------------------ */
function dataSaya_(req, s) {
  var m = master_()[s.u];
  if (!m) return { ok: false, pesan: 'NIM Anda tidak ditemukan di master Gizi-Link.' };
  var set = setting_();
  return {
    ok: true, profil: profil_(m, wisudawan_()[s.u], dataSlide_(s.u)),
    info: { tahun: set.TAHUN, batas: set.BATAS_PENGISIAN, tutup: bolehUbah_(set) }
  };
}

function simpan_(req, s) {
  var set = setting_(), alasan = bolehUbah_(set);
  if (alasan) return { ok: false, pesan: alasan };
  var kunci = LockService.getScriptLock(); kunci.waitLock(20000);
  try {
    var m = master_()[s.u], w = wisudawan_()[s.u], d = dataSlide_(s.u);
    if (d && String(d.Status) === 'Disetujui') return { ok: false, pesan: 'Data sudah disetujui dan dikunci. Hubungi admin prodi bila perlu perubahan.' };
    var tempat = bersih_(req.tempat, BATAS.TEMPAT), tgl = isoTanggal_(req.tgl, TZ);
    if (!tempat || !/^\d{4}-\d{2}-\d{2}$/.test(tgl)) return { ok: false, pesan: 'Tempat dan tanggal lahir wajib diisi.' };
    var ayah = bersih_(req.ayah, BATAS.NAMA_ORTU), ibu = bersih_(req.ibu, BATAS.NAMA_ORTU);
    var quote = bersih_(req.quote, BATAS.QUOTE), cat = bersih_(req.catatan, BATAS.CATATAN);
    var kirim = !!req.kirim;
    if (kirim && (!ayah || !ibu || !quote)) return { ok: false, pesan: 'Nama ayah, nama ibu, dan quote wajib diisi sebelum dikirim.' };
    if (kirim && !(d && d.Foto_ID)) return { ok: false, pesan: 'Unggah foto dulu sebelum mengirim.' };
    var dikoreksi = (tempat !== String(w.Tempat_Lahir || '').trim() || tgl !== m.tgl) ? 'Ya' : '';
    var status = kirim ? 'Dikirim' : (d && String(d.Status) === 'Perlu Revisi' ? 'Perlu Revisi' : 'Draf');
    var nilai = [m.nim, tempat, tgl, dikoreksi, ayah, ibu, quote, cat,
                 d ? d.Foto_ID : '', status, d ? d.Catatan_Admin : '', new Date(), d ? d.Diperiksa_Oleh : ''];
    var sh = sheet_(SH.DATA), row = d ? d._row : sh.getLastRow() + 1;
    sh.getRange(row, 1, 1, nilai.length).setValues([nilai]);
    sh.getRange(row, 3).setNumberFormat('@').setValue(tgl);
    log_(m.nim, kirim ? 'kirim' : 'simpan draf', dikoreksi ? 'TTL dikoreksi' : '');
    return { ok: true, status: status, pesan: kirim ? 'Data terkirim ke admin prodi. Terima kasih!' : 'Draf tersimpan.' };
  } finally { kunci.releaseLock(); }
}

function unggahFoto_(req, s) {
  var alasan = bolehUbah_(setting_());
  if (alasan) return { ok: false, pesan: alasan };
  var bytes = Utilities.base64Decode(String(req.foto || '').replace(/^data:image\/\w+;base64,/, ''));
  if (bytes.length > BATAS.FOTO_BYTES) return { ok: false, pesan: 'Ukuran foto terlalu besar.' };
  if (!(bytes[0] === -1 && bytes[1] === -40)) return { ok: false, pesan: 'Format foto harus JPG.' };
  var kunci = LockService.getScriptLock(); kunci.waitLock(20000);
  try {
    var m = master_()[s.u], d = dataSlide_(s.u);
    if (d && String(d.Status) === 'Disetujui') return { ok: false, pesan: 'Data sudah disetujui dan dikunci.' };
    var folder = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('FOLDER_FOTO'));
    var nama = m.nim + '_' + m.nama.replace(/[^\w\s.-]/g, '').replace(/\s+/g, '_') + '.jpg';
    var file = folder.createFile(Utilities.newBlob(bytes, 'image/jpeg', nama));
    if (d && d.Foto_ID) { try { DriveApp.getFileById(d.Foto_ID).setTrashed(true); } catch (e) {} }
    var sh = sheet_(SH.DATA);
    if (d) { sh.getRange(d._row, 9).setValue(file.getId()); sh.getRange(d._row, 12).setValue(new Date()); }
    else {
      var w = wisudawan_()[s.u] || {}, row = sh.getLastRow() + 1;
      sh.getRange(row, 1, 1, 13).setValues([[m.nim, String(w.Tempat_Lahir || ''), m.tgl, '', '', '', '', '', file.getId(), 'Draf', '', new Date(), '']]);
      sh.getRange(row, 3).setNumberFormat('@').setValue(m.tgl);
    }
    log_(m.nim, 'unggah foto', nama);
    return { ok: true, pesan: 'Foto tersimpan.' };
  } finally { kunci.releaseLock(); }
}

function fotoSaya_(req, s) { return fotoNim_(s.u); }
function fotoNim_(nim) {
  var d = dataSlide_(nim);
  if (!d || !d.Foto_ID) return { ok: true, foto: '' };
  try { return { ok: true, foto: Utilities.base64Encode(DriveApp.getFileById(d.Foto_ID).getBlob().getBytes()) }; }
  catch (e) { return { ok: true, foto: '' }; }
}

/* ------------------------------------------------------------------ */
/*  ADMIN / KAPRODI / KAJUR                                            */
/* ------------------------------------------------------------------ */
function daftar_(req, s) {
  var mst = master_(), data = {};
  baris_(SH.DATA).forEach(function (d) { data[normNim_(d.NIM)] = d; });
  var list = [], hilang = [];
  baris_(SH.WIS).forEach(function (w) {
    var n = normNim_(w.NIM), m = mst[n];
    if (!m) { hilang.push(String(w.NIM)); return; }
    if (bolehProdi_(s, m.kode)) list.push(profil_(m, w, data[n]));
  });
  var set = setting_();
  return {
    ok: true, daftar: list, saya: { nama: s.n, peran: s.r, prodi: s.p }, nimHilang: hilang,
    info: { tahun: set.TAHUN, jurusan: set.JURUSAN, urutan: set.URUTAN || 'NIM', batas: set.BATAS_PENGISIAN,
            dibuka: set.DIBUKA, prodi: { D3: set.PRODI_D3, D4: set.PRODI_D4, PROF: set.PRODI_PROF }, prodiSaya: s.daftarProdi }
  };
}

function setStatus_(req, s) {
  var n = normNim_(req.nim), m = master_()[n];
  if (!m || !bolehProdi_(s, m.kode)) return { ok: false, pesan: 'Tidak berwenang untuk mahasiswa ini.' };
  var status = String(req.status);
  if (['Disetujui', 'Perlu Revisi', 'Dikirim'].indexOf(status) < 0) return { ok: false, pesan: 'Status tidak valid.' };
  var d = dataSlide_(n);
  if (!d) return { ok: false, pesan: 'Mahasiswa belum mengisi data.' };
  var sh = sheet_(SH.DATA);
  sh.getRange(d._row, 10, 1, 2).setValues([[status, bersih_(req.catatan, BATAS.CATATAN)]]);
  sh.getRange(d._row, 13).setValue(s.n);
  log_(s.n, 'status ' + status, m.nim);
  return { ok: true, pesan: 'Status diubah menjadi ' + status + '.' };
}

function fotoAdmin_(req, s) {
  var m = master_()[normNim_(req.nim)];
  if (!m || !bolehProdi_(s, m.kode)) return { ok: false, pesan: 'Tidak berwenang.' };
  return fotoNim_(req.nim);
}

function pengaturan_(req, s) {
  if (s.r !== 'kajur') return { ok: false, pesan: 'Hanya Ketua Jurusan.' };
  var izin = ['DIBUKA', 'BATAS_PENGISIAN', 'URUTAN', 'TAHUN'], sh = sheet_(SH.SET), rows = baris_(SH.SET);
  Object.keys(req.ubah || {}).forEach(function (k) {
    if (izin.indexOf(k) < 0) return;
    var r = rows.filter(function (x) { return String(x.Kunci) === k; })[0];
    if (r) sh.getRange(r._row, 2).setNumberFormat('@').setValue(String(req.ubah[k]));
  });
  log_(s.n, 'pengaturan', JSON.stringify(req.ubah));
  return { ok: true, pesan: 'Pengaturan disimpan.' };
}
