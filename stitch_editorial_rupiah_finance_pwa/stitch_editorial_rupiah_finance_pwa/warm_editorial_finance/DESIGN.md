---
name: Warm Editorial Finance
colors:
  surface: '#FFFFFF'
  surface-dim: '#e0d8d5'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#faf2ee'
  surface-container: '#f4ece8'
  surface-container-high: '#eee7e3'
  surface-container-highest: '#e9e1dd'
  on-surface: '#1e1b19'
  on-surface-variant: '#3e4947'
  inverse-surface: '#33302d'
  inverse-on-surface: '#f7efeb'
  outline: '#6e7977'
  outline-variant: '#bdc9c6'
  surface-tint: '#006a63'
  primary: '#005c55'
  on-primary: '#ffffff'
  primary-container: '#0f766e'
  on-primary-container: '#a3faef'
  inverse-primary: '#80d5cb'
  secondary: '#645d58'
  on-secondary: '#ffffff'
  secondary-container: '#eae1da'
  on-secondary-container: '#6a635e'
  tertiary: '#005f29'
  on-tertiary: '#ffffff'
  tertiary-container: '#087a38'
  on-tertiary-container: '#a3ffb2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9cf2e8'
  primary-fixed-dim: '#80d5cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#eae1da'
  secondary-fixed-dim: '#cec5bf'
  on-secondary-fixed: '#1f1b17'
  on-secondary-fixed-variant: '#4b4641'
  tertiary-fixed: '#95f8a7'
  tertiary-fixed-dim: '#79db8d'
  on-tertiary-fixed: '#00210a'
  on-tertiary-fixed-variant: '#005323'
  background: '#fff8f5'
  on-background: '#1e1b19'
  surface-variant: '#e9e1dd'
  canvas: '#F6F4EF'
  ink: '#1C1917'
  muted-ink: '#78716C'
  border-hairline: '#E7E5E4'
  accent-active: '#115E59'
  accent-surface: '#F0FDFA'
  income: '#15803D'
  expense: '#B91C1C'
  draft-amber: '#B45309'
  draft-surface: '#FEF3C7'
typography:
  headline-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 38px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 42px
    letterSpacing: -0.02em
  headline-page:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-section:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-default:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 22px
  body-muted:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-micro:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

# Sistem Desain: Dompet Tenang (Personal Finance PWA)

## North Star: "Tenang, Bersih, Editorial"
Aplikasi pencatatan keuangan pribadi berbasis PWA mobile-first (lebar 390px) dengan estetika hangat, tenang, dan terstruktur editorial. Bukan aplikasi crypto, dan tanpa gradien ungu AI. Beranda adalah layar analisis visual seperti di HTML Stitch. Layar Catat, Akun, Detail, dan Masuk tetap daftar dan form. Akses satu jempol.

---

## 1. Skema Warna (Color Palette & Tokens)

| Peran Token | Kode Hex | Deskripsi & Penggunaan |
| :--- | :--- | :--- |
| **Canvas / Background** | `#F6F4EF` | Warm stone hangat sebagai latar dasar seluruh aplikasi |
| **Surface / Card** | `#FFFFFF` | Putih bersih untuk kontainer kartu, sheet, modal, dan bar |
| **Ink (Utama)** | `#1C1917` | Stone-900 untuk teks judul, angka saldo utama, teks transaksi |
| **Muted Ink** | `#78716C` | Stone-500 untuk sublabel, timestamp, kategori, keterangan sekunder |
| **Hairline / Border** | `#E7E5E4` | Stone-200 untuk garis batas tipis (1px hairline) dan divider |
| **Accent / Primary** | `#0F766E` | Teal-700 untuk tombol utama, tab aktif, tautan, dan tombol bulat tambah di layar Catat |
| **Accent Hover/Active** | `#115E59` | Teal-800 untuk feedback interaksi tekan |
| **Accent Surface** | `#F0FDFA` | Teal-50 untuk latar chip aktif atau badge kontekstual |
| **Income (Pemasukan)** | `#15803D` | Green-700 dengan tanda plus `+Rp...` untuk aliran masuk |
| **Expense (Pengeluaran)** | `#B91C1C` | Red-700 dengan tanda minus `-Rp...` untuk aliran keluar |
| **Draft / Warning** | `#B45309` | Amber-700 untuk status draf / transaksi tertunda |
| **Draft Surface** | `#FEF3C7` | Amber-100 untuk background status pill Draf |

---

## 2. Tipografi (Typography)

* **Font Utama:** `Plus Jakarta Sans`, sans-serif
* **Ketentuan Angka Finansial:** Selalu gunakan angka tabular (`tabular-nums` / `font-variant-numeric: tabular-nums`) untuk nominal uang agar angka sejajar rapi.

| Tingkat (Role) | Ukuran | Bobot (Weight) | Penerapan |
| :--- | :--- | :--- | :--- |
| **Display / Hero Nominal** | 36px | Semibold (600) | Nominal di layar Catat (keypad) dan Detail |
| **Saldo Beranda** | 32px | Bold (700) | Angka saldo di kartu hero Beranda |
| **Page Title** | 22px | Semibold (600) | Judul top bar Catat dan Akun |
| **Section Header** | 16px | Semibold (600) | Judul bagian, termasuk judul "Detail" yang ditengah |
| **Body / Merchant** | 15px | Medium (500) | Nama transaksi, label form, teks tombol |
| **Muted Caption** | 13px | Regular (400) | Kategori, sumber akun, tanggal |
| **Micro / Tab / Pill** | 11px | Medium (500) | Label tab bawah, status draf, sapaan sekunder |

---

## 3. Tata Letak, Grid & Elevasi (Layout & Geometry)

* **Frame Device:** Mobile viewport 390px (responsive mobile-first layout terpusat pada layar desktop).
* **Padding Layar:** `16px` horizontal padding (`px-4`).
* **Stack Spacing:** Jarak vertikal mengikuti HTML tiap layar. Beranda memakai `16px` (`gap-4`). Layar lain sering memakai `12px` (`space-md` / `0.75rem`) atau `16px` (`margin`).
* **Corner Radius:**
  * Kartu (Cards & Containers): `16px` (`rounded-2xl`)
  * Input Form & Tombol CTA: `12px` (`rounded-xl`)
  * Category Chips & Status Badges: Full pill (`rounded-full`)
* **Borders & Shadows:**
  * Border halus 1px (`border border-[#E7E5E4]`) pada permukaan putih.
  * Shadow sangat lembut dan natural: `box-shadow: 0 1px 3px 0 rgba(28, 25, 23, 0.04), 0 1px 2px -1px rgba(28, 25, 23, 0.04)`.
* **Area Sentuh (Touch Targets):** Minimal tinggi/lebar `44px` untuk semua tombol, tab, dan chip interaktif.

---

## 4. Format Konten & Bahasa (Localization & Copy)

* **Bahasa:** 100% Bahasa Indonesia yang ringkas, hangat, dan natural.
* **Format Mata Uang:** Di daftar dan form, `Rp` tanpa spasi dan tanpa desimal (contoh: `Rp125.000`, `+Rp2.500.000`, `−Rp25.000`). Di grafik Beranda, HTML memakai singkatan seperti `640k`, `Rp555k/mgg`, dan `Rp2,22M`.
* **Visualisasi Grafis:** Beranda memakai grafik yang ada di HTML Stitch (gauge saldo, batang mingguan, donat kategori, kurva saldo). Layar lain tetap daftar dan angka, tanpa grafik tambahan.

---

## 5. Komponen Inti Baku (Core Components)

### A. Top Bar
* Tinggi `56px` (`h-14`), latar kanvas dengan blur.
* **Beranda:** sapaan ("Halo, Bima") plus dua ikon di kanan (notifikasi dan filter). Bukan judul halaman 22px.
* **Catat dan Akun:** judul 22px di kiri. Akun punya subjudul "Buku pribadi".
* **Detail:** judul "Detail" di tengah, tombol kembali di kiri. Tanpa tab bawah.
* **Masuk:** tanpa top bar dan tanpa tab bawah.

### B. Fixed Bottom Tab Bar
* Ketinggian `64px` (`h-16`) menempel di dasar viewport. Tiga item sejajar, tanpa tombol bulat di tengah:
  1. **Beranda**
  2. **Catat**
  3. **Akun**
* Item aktif memakai warna aksen `#0F766E`, item non-aktif memakai `#78716C`.
* Daftar transaksi ada di dalam tab Catat, bukan tab terpisah.
* Di layar daftar Catat ada tombol bulat tambah (`56px`, kanan bawah, di atas tab) yang membuka sheet "Catat Pengeluaran". Layar keypad penuh tetap ada sebagai halaman sendiri. Tombol tambah ini bukan item navbar.

### C. Baris Transaksi (Transaction Row)
* Tata letak flex horizontal dalam kartu atau daftar:
  * Kiri: Avatar icon kategori bundar (38px–40px, latar `#F6F4EF`, icon minimalis).
  * Tengah: Nama merchant/transaksi (15px semibold `#1C1917`) di baris atas, kategori dan akun (misal: "Makanan & Minuman • BCA", 13px `#78716C`) di baris kedua.
  * Kanan: Nominal angka tabular (`tabular-nums font-semibold`).
    * Pemasukan: `+Rp250.000` (`#15803D`)
    * Pengeluaran: `-Rp42.000` (`#B91C1C`)

### D. Category Chips
* Deretan chip horizontal dapat digeser (horizontal scrollable row dengan `gap-2`).
* Tinggi `36px`–`40px`, padding horizontal `14px`, border `1px solid #E7E5E4`, radius pill `rounded-full`.
* Keadaan aktif: Latar `#0F766E`, teks `#FFFFFF`, border transparan.

### E. Tombol Utama (Primary Button)
* Tinggi presisi `48px`, lebar penuh (`w-full`), radius `12px` (`rounded-xl`).
* Latar `#0F766E` dengan teks putih 15px semibold.

### F. Status Pill (Draf)
* Badge pill kompak radius `rounded-full`, padding `4px 10px`.
* Latar amber muda `#FEF3C7`, teks `#B45309`, label "Draf" (11px-12px semibold).
