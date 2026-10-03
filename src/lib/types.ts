export type Arah = "masuk" | "keluar";
export type StatusTx = "draf" | "posted";
export type Sumber = "aplikasi" | "claude" | "gemini" | "cursor";
export type JenisAkun = "tunai" | "bank" | "ewallet";

export type Transaksi = {
  id: string;
  jumlah: number;
  arah: Arah;
  catatan: string;
  tanggal: string;
  status: StatusTx;
  sumber: Sumber;
  akun: string;
  akun_id: string;
  kategori: string | null;
  kategori_id: string | null;
  ikon: string;
};

export type Akun = {
  id: string;
  nama: string;
  jenis: JenisAkun;
  urutan: number;
  saldo: number;
};

export type Kategori = {
  id: string;
  nama: string;
  arah: Arah;
  ikon: string;
};

export type Minggu = { minggu: number; jumlah: number };
export type Irisan = { nama: string; jumlah: number; ikon: string };
export type Titik = { hari: string; saldo: number };

export type Ringkasan = {
  saldo: number;
  masuk: number;
  keluar: number;
  draf: number;
  minggu: Minggu[];
  kategori: Irisan[];
  kurva: Titik[];
};

export type Profil = { id: string; nama: string };
