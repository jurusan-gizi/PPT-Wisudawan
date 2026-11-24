# Panduan Pasang — PPT Wisudawan (tersambung Gizi-Link)

## Prinsipnya
- **Master mahasiswa tetap satu, yaitu sheet `Mahasiswa` di Gizi-Link.** Nama, prodi, dan tanggal lahir dibaca dari sana. Aplikasi ini tidak menyalin dan tidak mengubah sheet Gizi-Link.
- **Login lewat Gizi-Link.** Tidak ada username/password baru. Token Gizi-Link diperiksa dengan `SSO_SECRET` yang sama.
- **Hak staf diambil dari sheet `Staf` Gizi-Link:**
  - Kolom **Jabatan** harus memuat `Kajur`, `Sekjur`, `Kaprodi`, atau `Wisuda`.
  - Kolom **Permohonan** menentukan prodi yang dipegang: `D3` / `D4` / `Prof` / `Semua`.
  - Hanya **Kajur** yang bisa membuka/menutup pengisian.
  - Admin prodi yang perlu ikut memeriksa cukup ditambahi jabatan `Wisuda` di sheet Staf.
- **Spreadsheet PPT Wisudawan** (terpisah, agar sheet Gizi-Link yang berisi PIN staf tetap bersih) hanya menyimpan sheet `Wisudawan`, `DataSlide`, `Pengaturan`, dan `Log`.

## Langkah 1: Spreadsheet + Apps Script
1. Buat Google Sheet baru, misalnya **"DB PPT Wisudawan Gizi 2026"**, dengan akun yang sama dengan pemilik Gizi-Link.
2. **Ekstensi → Apps Script**, lalu tempel `apps-script/Code.gs`. Simpan.
3. Jalankan **`siapkan`** dan izinkan akses (termasuk akses baca ke spreadsheet Gizi-Link).
4. **Setelan proyek → Properti skrip → Tambah:** `SSO_SECRET` = nilai yang sama dengan Gizi-Link.
   Cara melihatnya: di Apps Script Gizi-Link, jalankan `lihatRahasiaSSO`, lalu buka Log eksekusi.
5. Jalankan **`cekKoneksi`**. Hasilnya harus menyebut jumlah mahasiswa master (±1.214) dan `SSO_SECRET: ada`.
6. **Deploy → Aplikasi web** (Jalankan sebagai: Saya · Akses: Siapa saja), lalu salin URL `/exec`.

## Langkah 2: Isi sheet `Wisudawan`
Cukup calon wisudawan saja. **Ada di sheet ini = boleh mengisi.**

| NIM | Nama (otomatis) | Prodi (otomatis) | IPK | Tempat_Lahir | No_HP | Keterangan |
|---|---|---|---|---|---|---|
| PO713231251001 | | | 3.75 | Makassar | 0812… | |

- Kolom **Nama** dan **Prodi** tidak perlu diketik. Klik menu **PPT Wisudawan → Isi Nama & Prodi dari master Gizi-Link**. Sekalian ketahuan kalau ada NIM yang salah ketik.
- **Tanggal lahir** diambil dari Gizi-Link. **Tempat lahir** diisi dari SIAKAD (mahasiswa tetap bisa mengoreksi).
- **IPK** hanya diisi admin. Mahasiswa tidak bisa mengubahnya.

## Langkah 3: GitHub
1. Buat repo **`ppt-wisuda`** di akun jurusan-gizi, lalu unggah semua berkas kecuali folder `apps-script`.
2. Di `index.html`, isi `CONFIG.API` dengan URL `/exec`.
3. Aktifkan GitHub Pages. Alamatnya menjadi `https://jurusan-gizi.github.io/ppt-wisuda/`.

## Langkah 4: Tambahkan ke Gizi-Link (sheet `Aplikasi`)
| urutan | id | nama | deskripsi | url | ikon | warna | aktif | sso | prodi | staf |
|---|---|---|---|---|---|---|---|---|---|---|
| 17 | ppt-wisuda | PPT Wisudawan | Data slide wisuda: foto, orang tua & quote | https://jurusan-gizi.github.io/ppt-wisuda/ | 🎓 | #007A6E | YA | YA | | Kajur, Sekjur, Kaprodi, Wisuda |

Catatan: Gizi-Link hanya bisa menyaring ubin per prodi, jadi ubin ini **tampil untuk semua mahasiswa**. Mahasiswa yang tidak ada di sheet Wisudawan akan mendapat pesan *"Menu ini khusus calon wisudawan"*. Mereka tidak bisa melihat data siapa pun. Kalau ingin ubinnya benar-benar tersembunyi, perlu perubahan kecil di `aplikasi_()` Gizi-Link.

## Cara aplikasi menerima login Gizi-Link
Saat dibuka dari Gizi-Link, aplikasi mencari token Gizi-Link:
1. di alamat (`?token=…` atau `#token=…`), atau
2. di penyimpanan browser domain `jurusan-gizi.github.io`, yang dipakai bersama semua aplikasi Gizi-Link.

Token yang sudah kedaluwarsa diabaikan. Keaslian token tetap diperiksa di server.

## Alur pemakaian
1. **Wisudawan:** cek nama/IPK (terkunci) → koreksi TTL bila perlu → isi nama ayah, nama ibu, quote → unggah dan potong foto 4×6 → **Kirim**.
2. **Kaprodi/admin:** **Lihat** → **Setujui & kunci** atau **Minta revisi** (bisa langsung lewat WA).
3. **Buat PPT** per prodi (urutan NIM / abjad / IPK), atau **Unduh semua foto (ZIP)**.

Bila mengubah berkas aplikasi, naikkan `VERSI` di `sw.js` supaya HP pengguna mengambil versi baru.
