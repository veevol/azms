import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ikon } from "../components/Shell";
import { TabBar } from "../components/Shell";
import { supabase } from "../lib/supabase";
import { hariIniISO, rupiah } from "../lib/format";
import type { Akun, Kategori } from "../lib/types";

export function CatatBaru() {
  const navigasi = useNavigate();
  const [arah, setArah] = useState<"keluar" | "masuk">("keluar");
  const [mentah, setMentah] = useState("0");
  const [catatan, setCatatan] = useState("");
  const [akun, setAkun] = useState<Akun[]>([]);
  const [akunId, setAkunId] = useState("");
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [kategoriId, setKategoriId] = useState("");
  const [pesan, setPesan] = useState("");

  useEffect(() => {
    supabase.rpc("daftar_akun").then(({ data }) => {
      const daftar = (data || []) as Akun[];
      setAkun(daftar);
      setAkunId(daftar[0]?.id || "");
    });
  }, []);

  useEffect(() => {
    supabase.rpc("daftar_kategori", { p_arah: arah }).then(({ data }) => {
      const daftar = (data || []) as Kategori[];
      setKategori(daftar);
      setKategoriId(daftar[0]?.id || "");
    });
  }, [arah]);

  function tekan(tombol: string) {
    setMentah((lama) => {
      if (tombol === "hapus") return lama.length <= 1 ? "0" : lama.slice(0, -1);
      if (lama.length >= 12) return lama;
      if (tombol === "000") return lama === "0" ? lama : lama + "000";
      return lama === "0" ? tombol : lama + tombol;
    });
  }

  async function simpan() {
    setPesan("");
    const { error } = await supabase.rpc("catat_transaksi", {
      p_jumlah: Number(mentah),
      p_arah: arah,
      p_akun: akunId,
      p_kategori: kategoriId || null,
      p_tanggal: hariIniISO(),
      p_catatan: catatan,
      p_status: "posted",
      p_sumber: "aplikasi",
      p_idem: null,
    });
    if (error) {
      setPesan(error.message);
      return;
    }
    navigasi("/catat");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-canvas">
      <header className="fixed inset-x-0 top-0 z-40 bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[390px] items-center gap-1 px-2">
          <button aria-label="Tutup" className="flex h-11 w-11 items-center justify-center" onClick={() => navigasi("/catat")}>
            <Ikon nama="close" />
          </button>
          <h1 className="text-[22px] font-semibold">Catat</h1>
        </div>
      </header>
      <main className="flex flex-1 flex-col px-4 pt-16 pb-24">
        <div className="mx-auto flex w-full max-w-[280px] rounded-full bg-[#eee7e3] p-1">
          {(["keluar", "masuk"] as const).map((item) => (
            <button key={item} className={`h-9 flex-1 rounded-full text-[15px] font-semibold capitalize ${arah === item ? "bg-[#005c55] text-white" : "text-muted"}`} onClick={() => setArah(item)}>
              {item === "keluar" ? "Keluar" : "Masuk"}
            </button>
          ))}
        </div>
        <p className="tabular py-4 text-center text-[36px] font-semibold tracking-tight">{rupiah(Number(mentah) || 0)}</p>
        <p className="mb-2 text-center text-[11px] text-muted">{arah === "keluar" ? "Pengeluaran harian" : "Pemasukan"}</p>
        <button className="mb-2 flex h-11 items-center justify-between rounded-xl bg-surface px-4" onClick={() => setAkunId(akun[(akun.findIndex((a) => a.id === akunId) + 1) % Math.max(akun.length, 1)]?.id || akunId)}>
          <span className="text-[15px]">{akun.find((a) => a.id === akunId)?.nama || "Pilih akun"}</span>
          <Ikon nama="chevron_right" kelas="text-muted" />
        </button>
        <input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan, opsional" className="mb-3 h-11 rounded-xl bg-surface px-4 text-[15px] outline-none" />
        <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
          {kategori.map((k) => (
            <button key={k.id} className={`flex h-9 shrink-0 items-center gap-1 rounded-full px-3.5 text-[13px] ${kategoriId === k.id ? "bg-accent text-white" : "bg-surface text-muted"}`} onClick={() => setKategoriId(k.id)}>
              <Ikon nama={k.ikon} kelas="text-[16px]" />
              {k.nama}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "hapus"].map((tombol) => (
            <button key={tombol} className="flex h-12 items-center justify-center rounded-xl bg-surface text-[16px] font-semibold shadow-sm" onClick={() => tekan(tombol)}>
              {tombol === "hapus" ? <Ikon nama="backspace" /> : tombol}
            </button>
          ))}
        </div>
        {pesan && <p className="mt-2 text-[13px] text-expense">{pesan}</p>}
        <button className="mt-3 flex h-12 items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-white" onClick={simpan}>
          <Ikon nama="check" /> Simpan
        </button>
      </main>
      <TabBar />
    </div>
  );
}
