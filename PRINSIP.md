# Prinsip pengembangan

Tiga aturan ini berlaku untuk seluruh aplikasi. Bahasa visual ada di `stitch_editorial_rupiah_finance_pwa/stitch_editorial_rupiah_finance_pwa/warm_editorial_finance/DESIGN.md`.

## 1. Tetap ringan saat data banyak

Layar hanya memuat sepotong data. Daftar di tab Catat menampilkan satu jendela waktu, lalu "muat lagi". Angka di Beranda (saldo, komposisi, kurva) dihitung di database, bukan dengan mengunduh semua transaksi ke browser. Daftar panjang hanya merender baris yang terlihat.

## 2. Supabase dan Vercel sekarang, pindah ke VPS tanpa tulis ulang

Schema, migrasi SQL, dan Row Level Security tinggal di repo. URL dan kunci hanya lewat environment variable. Tidak memakai fitur yang hanya ada di Vercel (Blob, KV, Edge Config). Klien `supabase-js` dipakai apa adanya, supaya jalan di Supabase Cloud maupun Supabase self-hosted di VPS.

## 3. Satu bahasa visual, dan HTML Stitch yang menang

Warna, huruf, jarak, dan komponen mengikuti design system. Struktur layar, navigasi, dan isi mengikuti file HTML di `stitch_editorial_rupiah_finance_pwa/stitch_editorial_rupiah_finance_pwa/`. Kalau `DESIGN.md` dan HTML berbeda, HTML yang dipakai.

Navbar bawah punya tiga item yang sama di setiap layar tab: **Beranda**, **Catat**, **Akun**. Tidak ada tab Riwayat dan tidak ada tombol bulat di tengah. Riwayat transaksi hidup di dalam tab Catat.

| Folder HTML | Route | Navbar |
|---|---|---|
| `beranda_infografis_analisis_visual` | `/` | Beranda aktif |
| `catat` | `/catat` | Catat aktif. Daftar, cari, filter, muat lagi |
| `catat_transaksi` | `/catat/baru` | Catat aktif. Keypad Keluar/Masuk |
| `detail_transaksi` | `/catat/[id]` | Tanpa tab. Halaman yang didorong dari daftar |
| `akun` | `/akun` | Akun aktif |
| `masuk` | `/masuk` | Tanpa tab |
