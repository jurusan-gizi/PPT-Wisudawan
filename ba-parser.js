/* ============================================================
   Pembaca PDF Berita Acara Yudisium → daftar wisudawan
   Dipakai di browser (window.pdfjsLib) maupun Node (uji).
   Kolom dikenali dari ISI, bukan posisi kaku, karena format BA
   tiap prodi/gelombang berbeda (ada/tidak ada JK, agama, tempat lahir;
   nama bisa terbelah dua baris; tanggal "17 Agustus 2005" atau "2005-02-21").
   ============================================================ */
(function (root) {
  'use strict';
  var RE_NIM = /^P[O0]71\d{9,}$/i;
  var RE_IPK = /^[0-4][.,]\d{2}$/;
  var BULAN = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
  var ABAIKAN = /^(p|l|perempuan|laki-laki|laki - laki|lk|pr|islam|kristen|protestan|katolik|katholik|hindu|budha|buddha|konghucu|khonghucu|\d{1,3}|k)$/i;

  function isoTgl(s) {
    s = String(s || '').trim();
    var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
    m = s.match(/^(\d{1,2})\s*([A-Za-z]+)\s*(\d{4})?$/);
    if (m) {
      var b = BULAN.indexOf(m[2].toLowerCase());
      if (b < 0) b = BULAN.map(function (x) { return x.slice(0, 3); }).indexOf(m[2].toLowerCase().slice(0, 3));
      if (b >= 0) return m[3] ? m[3] + '-' + ('0' + (b + 1)).slice(-2) + '-' + ('0' + m[1]).slice(-2) : '?';
    }
    m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
    return '';
  }
  function normNim(n) { return String(n || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/O/g, '0'); }
  function prodiDariNim(n) { var k = normNim(n).slice(2, 5); return { '713': 'D3', '714': 'D4', '715': 'PROF' }[k] || ''; }

  /**
   * @param pdfjsLib  library pdf.js
   * @param data      Uint8Array / ArrayBuffer isi PDF
   * @returns {nomorBA, tanggalBA, baris:[{nim,nama,tempat,tgl,ipk,prodi,catatan}]}
   */
  async function bacaBA(pdfjsLib, data) {
    var doc = await pdfjsLib.getDocument({ data: data, verbosity: 0 }).promise;
    var hasil = [], sudah = {}, batasTempat = null, teksAwal = '';
    for (var p = 1; p <= doc.numPages; p++) {
      var tc = await (await doc.getPage(p)).getTextContent();
      var it = tc.items.filter(function (i) { return String(i.str).trim(); }).map(function (i) {
        return { s: String(i.str).replace(/\s+/g, ' ').trim(), x: i.transform[4], y: i.transform[5] };
      });
      if (p <= 2) teksAwal += ' ' + it.map(function (i) { return i.s; }).join(' ');

      // judul kolom pada halaman ini (bila ada)
      var hTempat = it.filter(function (i) { return /^tempat( lahir)?$/i.test(i.s); })[0];
      var hNama = it.filter(function (i) { return /^nama$/i.test(i.s); })[0];
      if (hNama) batasTempat = hTempat ? hTempat.x - 12 : Infinity;     // BA tanpa kolom tempat lahir
      var yJudul = hNama ? hNama.y : null;

      // baris = setiap NIM; item lain dikelompokkan ke NIM terdekat secara vertikal
      var nims = it.filter(function (i) { return RE_NIM.test(i.s.replace(/\s/g, '')); }).sort(function (a, b) { return b.y - a.y; });
      nims.forEach(function (n, k) {
        var atas = k > 0 ? (nims[k - 1].y - n.y) / 2 : 14, bawah = k < nims.length - 1 ? (n.y - nims[k + 1].y) / 2 : 14;
        atas = Math.min(atas, 14); bawah = Math.min(bawah, 14);
        var sel = it.filter(function (i) {
          return i !== n && i.y <= n.y + atas && i.y > n.y - bawah && (yJudul === null || Math.abs(i.y - yJudul) > 3) && i.x > n.x - 5;
        }).sort(function (a, b) { return b.y - a.y || a.x - b.x; });
        var r = { nim: n.s.replace(/\s/g, '').toUpperCase(), nama: [], tempat: [], tgl: '', ipk: '', catatan: '' };
        sel.forEach(function (i) {
          if (RE_IPK.test(i.s)) { r.ipk = i.s.replace(',', '.'); return; }
          // tahun lahir yang terbelah ke baris kedua sel: "24 September" + "2002"
          if (/^(19|20)\d{2}$/.test(i.s)) { if (r._sebagian) { r.tgl = isoTgl(r._sebagian + ' ' + i.s); r._sebagian = ''; } return; }
          var t = isoTgl(i.s);
          if (t) { if (t === '?') r._sebagian = i.s; else r.tgl = t; return; }
          if (ABAIKAN.test(i.s)) return;
          if (i.x >= (batasTempat === null ? Infinity : batasTempat)) r.tempat.push(i.s); else r.nama.push(i.s);
        });
        if (r._sebagian) r.catatan = 'Tanggal lahir di BA tidak lengkap ("' + r._sebagian + '")';
        delete r._sebagian;
        r.nama = r.nama.join(' ').replace(/\s+/g, ' ').trim();
        r.tempat = r.tempat.join(' ').replace(/\s+/g, ' ').trim();
        r.prodi = prodiDariNim(r.nim);
        var kunci = normNim(r.nim);
        if (!sudah[kunci]) { sudah[kunci] = 1; hasil.push(r); }      // tabel "lulusan terbaik" = duplikat → diabaikan
      });
    }
    var t = teksAwal.replace(/\s+/g, ' ');
    var nomor = (t.match(/F\.\s?XII\.\s?11\.\s?8\s?\/\s?(\d+)\s?\/\s?(\d{4})/) || [])[1] || '';
    var tgl = (t.match(/(?:Pada hari ini[^,]*,?\s*(?:tanggal\s*)?)?(\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4})/i) || [])[1] || '';
    return { nomorBA: nomor, tanggalBA: tgl, baris: hasil };
  }

  var api = { bacaBA: bacaBA, normNim: normNim, prodiDariNim: prodiDariNim };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BAParser = api;
})(this);
