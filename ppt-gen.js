/* ============================================================
   Generator PPT Wisudawan — mengisi template.pptx asli
   Bisa dipakai di browser (window.JSZip) maupun Node (require)
   ============================================================ */
(function (root) {
  'use strict';

  var NS_SLIDE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide';
  var CT_SLIDE = 'application/vnd.openxmlformats-officedocument.presentationml.slide+xml';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .replace(/\s+/g, ' ').trim();
  }

  // Perkecil huruf bila teks terlalu panjang untuk kotaknya.
  // cap = jumlah karakter yang muat pada ukuran dasar.
  function pas(teks, dasar, cap, min) {
    var n = String(teks || '').length, sz = dasar;
    while (sz > min && n > cap * dasar / sz) sz -= 100;
    return String(sz);
  }

  function isi(xml, peta) {
    return xml.replace(/\{\{(\w+)\}\}/g, function (m, k) {
      return Object.prototype.hasOwnProperty.call(peta, k) ? peta[k] : m;
    });
  }

  function fotoXml(rid) {
    return '<p:pic><p:nvPicPr><p:cNvPr id="31" name="Foto Wisudawan"/>' +
      '<p:cNvPicPr><a:picLocks noGrp="1" noChangeAspect="1"/></p:cNvPicPr>' +
      '<p:nvPr><p:ph type="pic" sz="quarter" idx="130"/></p:nvPr></p:nvPicPr>' +
      '<p:blipFill><a:blip r:embed="' + rid + '"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>' +
      '<p:spPr/></p:pic>';
  }
  var PLACEHOLDER_KOSONG =
    '<p:sp><p:nvSpPr><p:cNvPr id="31" name="Foto Wisudawan"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>' +
    '<p:nvPr><p:ph type="pic" sz="quarter" idx="130"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp>';

  /**
   * @param JSZip   konstruktor JSZip
   * @param tpl     ArrayBuffer/Uint8Array template.pptx
   * @param info    {jurusan, prodi, tahun}
   * @param daftar  [{nama, ttl, ipk, ayah, ibu, quote, foto(Uint8Array|null)}] — urutan sudah final
   * @param tipe    'blob' (browser) | 'nodebuffer'
   */
  async function buatPPT(JSZip, tpl, info, daftar, tipe) {
    var zip = await JSZip.loadAsync(tpl);
    var tplSlide = await zip.file('ppt/slides/slide2.xml').async('string');
    var tplRels = await zip.file('ppt/slides/_rels/slide2.xml.rels').async('string');
    var penutup = await zip.file('ppt/slides/slide3.xml').async('string');
    var penutupRels = await zip.file('ppt/slides/_rels/slide3.xml.rels').async('string');
    var tahun = esc(info.tahun);

    // Sampul
    var s1 = await zip.file('ppt/slides/slide1.xml').async('string');
    zip.file('ppt/slides/slide1.xml', isi(s1, {
      JURUSAN: esc('JURUSAN ' + String(info.jurusan || '').toUpperCase()),
      PRODI: esc('PROGRAM STUDI ' + String(info.prodi || '').toUpperCase()),
      TAHUN: tahun
    }));

    // Hapus slide 2 & 3 bawaan, nanti ditulis ulang
    ['ppt/slides/slide2.xml', 'ppt/slides/_rels/slide2.xml.rels',
     'ppt/slides/slide3.xml', 'ppt/slides/_rels/slide3.xml.rels'].forEach(function (f) { zip.remove(f); });

    var total = daftar.length + 2;
    var lebarNo = Math.max(2, String(daftar.length).length);

    daftar.forEach(function (m, i) {
      var no = i + 2;
      var rels = tplRels;
      var foto = PLACEHOLDER_KOSONG;
      if (m.foto && m.foto.length) {
        var media = 'foto_' + (i + 1) + '.jpg';
        zip.file('ppt/media/' + media, m.foto);
        rels = rels.replace('</Relationships>',
          '<Relationship Id="rIdFoto" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/' + media + '"/></Relationships>');
        foto = fotoXml('rIdFoto');
      }
      var nomor = String(i + 1); while (nomor.length < lebarNo) nomor = '0' + nomor;
      var xml = isi(tplSlide, {
        NAMA: esc(m.nama), SZ_NAMA: pas(m.nama, 2400, 50, 1800),
        TTL: esc(m.ttl), SZ_TTL: pas(m.ttl, 2400, 32, 1800),
        IPK: esc(m.ipk),
        AYAH: esc(m.ayah), SZ_AYAH: pas(m.ayah, 2400, 26, 1400),
        IBU: esc(m.ibu), SZ_IBU: pas(m.ibu, 2400, 26, 1400),
        QUOTE: esc(m.quote), SZ_QUOTE: pas(m.quote, 1800, 130, 1400),
        NO: nomor, FOTO: foto
      });
      zip.file('ppt/slides/slide' + no + '.xml', xml);
      zip.file('ppt/slides/_rels/slide' + no + '.xml.rels', rels);
    });

    zip.file('ppt/slides/slide' + total + '.xml', isi(penutup, { TAHUN: tahun }));
    zip.file('ppt/slides/_rels/slide' + total + '.xml.rels', penutupRels);

    // presentation.xml.rels
    var pr = await zip.file('ppt/_rels/presentation.xml.rels').async('string');
    pr = pr.replace(/<Relationship [^>]*relationships\/slide"[^>]*\/>/g, '');
    var tambahan = '', ids = '';
    for (var k = 1; k <= total; k++) {
      tambahan += '<Relationship Id="rIdS' + k + '" Type="' + NS_SLIDE + '" Target="slides/slide' + k + '.xml"/>';
      ids += '<p:sldId id="' + (255 + k) + '" r:id="rIdS' + k + '"/>';
    }
    zip.file('ppt/_rels/presentation.xml.rels', pr.replace('</Relationships>', tambahan + '</Relationships>'));

    var p = await zip.file('ppt/presentation.xml').async('string');
    zip.file('ppt/presentation.xml', p.replace(/<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/, '<p:sldIdLst>' + ids + '</p:sldIdLst>'));

    // [Content_Types].xml
    var ct = await zip.file('[Content_Types].xml').async('string');
    ct = ct.replace(/<Override PartName="\/ppt\/slides\/slide\d+\.xml"[^>]*\/>/g, '');
    var ov = '';
    for (var j = 1; j <= total; j++) ov += '<Override PartName="/ppt/slides/slide' + j + '.xml" ContentType="' + CT_SLIDE + '"/>';
    if (ct.indexOf('Extension="jpg"') < 0) ov = '<Default Extension="jpg" ContentType="image/jpeg"/>' + ov;
    zip.file('[Content_Types].xml', ct.replace('</Types>', ov + '</Types>'));

    var app = await zip.file('docProps/app.xml').async('string');
    zip.file('docProps/app.xml', app.replace(/<Slides>\d+<\/Slides>/, '<Slides>' + total + '</Slides>'));

    return zip.generateAsync({
      type: tipe || 'blob', compression: 'DEFLATE',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    });
  }

  /* ---------- Perapian teks (hanya untuk tampilan & PPT, database tidak diubah) ---------- */
  // Singkatan gelar/sebutan yang ditulis tanpa titik dan harus tetap huruf besar
  var TETAP = ['SE','SH','SP','ST','SKM','SST','SKG','SKEP','SPD','SAG','SPDI','SHI','SSI','SSIT','SGZ','SIP','SS','SM','SAK','SKOM','STP',
               'MM','MH','MT','MSI','MKES','MPH','MSC','MA','MPD','MAG','MGZ','DCN','AMD','AMG','AMKEB','AMKEP','AMK','BA','BSC','PHD','DR','IR','DRS','DRA',
               'II','III','IV','TNI','POLRI','ASN','PNS'];
  function kapitalAwal(kata) {
    if (!kata) return kata;
    var huruf = kata.replace(/[^A-Za-z]/g, '');
    if (huruf && TETAP.indexOf(huruf.toUpperCase()) >= 0 && kata.indexOf('.') < 0 && huruf === huruf.toUpperCase()) return kata;
    // gelar bertitik (S.Pd, M.Kes, A.Md.Gz) dibiarkan bila sudah campuran huruf besar-kecil
    if (/[A-Z]\.[A-Za-z]/.test(kata) && /[a-z]/.test(kata)) return kata;
    return kata.toLowerCase().replace(/(^|[.\-(\/"“])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); });
  }
  function rapikanNama(t) {
    t = String(t || '').replace(/\s+/g, ' ').trim();
    if (!t) return t;
    // bagian setelah koma pertama biasanya gelar: hanya dirapikan bila ditulis kapital semua
    var i = t.indexOf(','), inti = i >= 0 ? t.slice(0, i) : t, sisa = i >= 0 ? t.slice(i) : '';
    inti = inti.split(' ').map(kapitalAwal).join(' ');
    // gelar bertitik yang ditulis kapital semua (S.PD., M.KES) -> S.Pd., M.Kes
    sisa = sisa.replace(/[A-Z][A-Z.]*\.[A-Z.]*/g, function (g) {
      return /[a-z]/.test(g) ? g : g.split('.').map(function (x) { return x.length > 1 ? x.charAt(0) + x.slice(1).toLowerCase() : x; }).join('.');
    });
    return inti + sisa;
  }
  function rapikanKalimat(t) {
    t = String(t || '').replace(/\s+/g, ' ').trim();
    if (!t) return t;
    var huruf = t.replace(/[^A-Za-z]/g, '');
    if (huruf.length > 3 && huruf === huruf.toUpperCase()) t = t.toLowerCase();   // SEMUA KAPITAL -> kalimat biasa
    // huruf pertama tiap kalimat dijadikan kapital
    return t.replace(/(^|[.!?]\s+)([^A-Za-z]*)([a-z])/g, function (m, a, b, c) { return a + b + c.toUpperCase(); });
  }
  function denganGelar(nama, gelar) {
    nama = rapikanNama(nama); gelar = String(gelar || '').trim();
    if (!gelar) return nama;
    var norm = function (x) { return String(x).toLowerCase().replace(/[^a-z]/g, ''); };
    if (norm(nama).slice(-norm(gelar).length) === norm(gelar)) return nama;   // sudah bergelar
    return nama.replace(/[,\s]+$/, '') + ', ' + gelar;
  }

  var api = { buatPPT: buatPPT, pas: pas, rapikanNama: rapikanNama, rapikanKalimat: rapikanKalimat, denganGelar: denganGelar };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PPTWisuda = api;
})(this);
