# Panduan PPT Wisudawan — Jurusan Gizi Poltekkes Kemenkes Makassar

Aplikasi: https://jurusan-gizi.github.io/PPT-Wisudawan/ (dibuka lewat Gizi-Link)
Database: Google Sheet **DB PPT Wisudawan Gizi** (sheet Wisudawan, DataSlide, Pengaturan, Log)

---

## A. SIKLUS TAHUNAN (mulai wisuda 2027)

### 1. Setelah wisuda selesai: Mulai Tahun Baru
Di spreadsheet DB, buka menu **PPT Wisudawan → Mulai Tahun Baru (arsipkan & kosongkan)…**, ketik tahun baru (misalnya 2027), lalu konfirmasi. Otomatis:
- seluruh spreadsheet disalin menjadi **"Arsip DB PPT Wisudawan 2026"** (data, foto, dan log tetap utuh di arsip);
- folder foto 2026 diberi nama arsip, folder foto 2027 dibuat baru;
- isi sheet Wisudawan, DataSlide, dan Log dikosongkan (judul kolom tetap);
- TAHUN = 2027, pengisian dibuka, batas umum dikosongkan.

Kode, GitHub, dan Gizi-Link tidak perlu diubah.

### 2. Setiap BA Yudisium terbit: impor per gelombang
Panel admin → **📥 Impor wisudawan (per gelombang yudisium)**:
1. Unggah PDF BA. Boleh lebih dari satu, dan semua format BA 2026 (D3, D4, Profesi) sudah teruji.
2. Isi **batas pengisian untuk gelombang ini** (misalnya 14 hari setelah yudisium), atau kosongkan untuk memakai batas umum.
3. Periksa pratinjaunya:
   - ✅ **Baru**: akan ditambahkan.
   - ⏭️ **Sudah terdaftar**: dilewati, tidak ditimpa.
   - ⚠️ **Tidak ada di Gizi-Link**: tambahkan dulu ke sheet *Mahasiswa* Gizi-Link, lalu impor ulang.
   - Peringatan oranye menandai tanggal lahir BA ≠ Gizi-Link, tanggal di BA tidak lengkap, atau IPK tidak terbaca.
4. Klik **Tambahkan … wisudawan baru**. Mereka langsung bisa mengisi. Menu di Gizi-Link muncul paling lambat ±10 menit; untuk langsung, jalankan `segarkanDaftarWisudawan` di Apps Script Gizi-Link.

Alternatif tanpa PDF: **tempel dari Excel** dengan format `NIM [Tab] IPK [Tab] Tempat lahir`.

Kaprodi dan admin prodi hanya bisa mengimpor mahasiswa prodinya sendiri. Kajur bisa semua prodi.

### 3. Data alumni (tracer study)
Di sheet **Pengaturan**, ubah `TRACER_AKTIF` menjadi **Ya**. Wisudawan lalu wajib mengisi email, nomor WhatsApp, dan rencana setelah lulus (instansi dan domisili opsional) sebelum bisa menekan Kirim. Unduh hasilnya lewat **📊 Data alumni (CSV)**, yang bisa dibuka di Excel. Nomor WA dari sini juga otomatis dipakai untuk tombol pengingat WA.

### 3b. Berkas wisuda: toga, data ijazah, dan surat pernyataan
Ubah `BERKAS_AKTIF` di sheet Pengaturan menjadi **Ya**. Menu wisudawan lalu berisi empat langkah: **① Data slide → ② Ukuran toga → ③ Data ijazah, NIK & bukti → ④ Surat pernyataan**.

**Mahasiswa**
- ② Memilih ukuran toga (S–XXXL) dengan gambar referensi ukuran.
- ③ Memeriksa nama dan TTL yang akan ditulis di ijazah, mengisi **NIK** (dicek otomatis dengan tanggal lahir) dan **No. HP**, lalu mengunggah **ijazah terakhir** (SMA/SMK untuk D3 dan D4; **S1/D4 untuk Profesi**) serta **KTP** (atau KK). Format PDF atau foto.
- ④ Setelah data diverifikasi admin, mengunduh **surat pernyataan (.docx)** yang sudah terisi, mencetak, menempel **meterai tempel Rp10.000** (e-meterai tidak diterima), menandatangani mengenai meterai, lalu mengunggah hasil scan atau fotonya.

**Admin (Kaprodi, admin prodi, Kemahasiswaan)**, di jendela detail bagian *Berkas wisuda*:
1. 👁️ Buka ijazah dan KTP/KK, lalu cocokkan dengan nama, TTL, dan NIK.
2. Kalau ada beda, perbaiki lewat **✏️ Edit data** (nama di ijazah dan TTL).
3. Klik **✓ Data ijazah terverifikasi**, atau **Data perlu perbaikan** dengan catatan. Setelah terverifikasi, mahasiswa bisa mengunduh surat yang memakai data hasil revisi.
4. Kalau nama atau tanggal lahir dikoreksi, klik **⤴️ Terapkan ke master Gizi-Link**. Bila tanggal lahir berubah, beri tahu mahasiswa bahwa login Gizi-Link sekarang memakai tanggal lahir baru.
5. Periksa surat bermeterai, lalu klik **✓ Terima surat** atau **Tolak surat** dengan alasan.
6. **Setujui & kunci** baru aktif setelah ukuran toga dipilih dan surat **Diterima**.

Rekap (panel *Buat PPT*, per prodi):
- **👕 Rekap toga (CSV)**: jumlah per ukuran dan daftar nama, untuk pemesanan toga.
- **🏛️ Rekap Direktorat (CSV)**: nama sesuai ijazah, TTL, **NIK lengkap**, koreksi data (lama → baru), status verifikasi dan surat, serta tautan bukti. File ini berisi data pribadi, jadi kirim hanya ke bagian akademik Direktorat.

Berkas tersimpan di folder Drive privat **"Berkas Wisudawan Gizi … — RAHASIA"**, terpisah dari folder foto. NIK di layar admin ditampilkan tersamar.

Pemeriksa: Kaprodi dan admin prodi (jabatan `Wisuda` + kode prodi di kolom Permohonan). Jabatan **`Kemahasiswaan`** otomatis mendapat akses **semua prodi** di aplikasi ini tanpa membuka Layanan Permohonan.

### 4. Menjelang hari-H
Di panel **Buat PPT** (pilih prodi, urutan, dan siapa yang dimasukkan):
- **Buat & unduh PPT**: satu file per prodi, dengan desain template asli, gelar otomatis, dan huruf awal kapital.
- **🎤 Unduh Naskah MC**: urutan sama dengan slide; ada cara baca nama, tanda almarhum/almarhumah, mode tablet, dan cetak.
- **📖 Buku kenangan**: buka filenya, lalu Cetak → Simpan sebagai PDF.
- **Unduh semua foto (ZIP)** bila diminta Direktorat.

### 5. Setelah disetujui
Wisudawan berstatus *Disetujui* mendapat tombol **🎉 Unduh kartu ucapan**, yaitu slide masing-masing sebagai gambar untuk media sosial. Admin juga bisa mengunduh gambar ini dari jendela detail (**🖼️ Unduh gambar**).

---

## B. PENGATURAN (sheet Pengaturan)
| Kunci | Contoh | Fungsi |
|---|---|---|
| TAHUN | 2027 | Tampil di sampul, penutup, naskah MC, dan buku kenangan |
| PRODI_D3 / D4 / PROF | D3 Gizi | Nama prodi di sampul PPT |
| GELAR_D3 / D4 / PROF | A.Md.Gz. / S.Tr.Gz. / Dietisien | Gelar di belakang nama |
| DIBUKA | Ya / Tidak | Buka/tutup pengisian (juga dari panel Kajur) |
| BATAS_PENGISIAN | 2027-11-27 | Batas umum; kolom *Batas_Isi* per wisudawan (sheet Wisudawan) lebih diutamakan |
| URUTAN | NIM | Urutan bawaan slide |
| TRACER_AKTIF | Ya / Tidak | Wajib isi data alumni |
| BERKAS_AKTIF | Ya / Tidak | Wajib toga, data ijazah (NIK + bukti), dan surat pernyataan |

## C. HAK AKSES (dari sheet Staf Gizi-Link)
- Kolom **Jabatan** memuat `Kajur`, `Sekjur`, `Kaprodi`, `Wisuda`, atau `Kemahasiswaan` (semua prodi).
- Kolom **Permohonan** berisi `D3` / `D4` / `Prof` / `Semua` sebagai prodi yang dipegang.
- Setelah sheet Staf diubah, staf yang bersangkutan perlu **keluar lalu login ulang** di Gizi-Link.

## D. MEMPERBARUI APLIKASI
- **GitHub (repo PPT-Wisudawan):** unggah isi zip untuk menimpa yang lama. `VERSI` di `sw.js` sudah dinaikkan, jadi HP pengguna otomatis mengambil versi baru.
- **Apps Script DB:** tempel `Code.gs`, lalu **Terapkan → Kelola deployment → ✏️ Edit → Versi baru → Terapkan**. Jangan memakai "Deployment baru", karena URL-nya akan berubah.

## E. KOLOM DATABASE
- **Wisudawan:** NIM · Nama/Prodi (otomatis) · IPK · Tempat_Lahir · No_HP · Keterangan · Batas_Isi
- **DataSlide:** NIM · Tempat_Lahir · Tgl_Lahir · TTL_Dikoreksi · Ayah · Ibu · Quote · Catatan_Mhs · Foto_ID · Status · Catatan_Admin · Diperbarui · Diperiksa_Oleh · Nama · Prodi · Nama_Slide · Baca_Nama · Baca_Ayah · Baca_Ibu · Email · No_WA · Rencana · Instansi · Domisili · Toga · NIK · Bukti_Ijazah_ID · Bukti_KTP_ID · Verif_Data · Verif_Oleh · Catatan_Verif · Surat_ID · Status_Surat · Catatan_Surat · Ke_Master (kolom berkas dibuat otomatis saat pertama dipakai)

Nama, prodi, dan tanggal lahir selalu diambil dari master Gizi-Link. Koreksi nama khusus untuk slide disimpan di *Nama_Slide*, tanpa mengubah master.
