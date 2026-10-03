import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Ikon } from "../components/Shell";
import { supabase } from "../lib/supabase";
import { rupiah } from "../lib/format";
import type { Akun, Kategori, Transaksi } from "../lib/types";

export function Detail() {
  const { id } = useParams();
  const navigasi = useNavigate();
  const [item, setItem] = useState<Transaksi | null>(null);
  const [akun, setAkun] = useState<Akun[]>([]);
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [pesan, setPesan] = useState("");

  useEffect(() => {
    supabase.rpc("daftar_transaksi", { p_limit: 80, p_cari: null }).then(({ data }) => {
      const ketemu = ((data || []) as Transaksi[]).find((t) => t.id === id) || null;
      setItem(ketemu);
    });
    supabase.rpc("daftar_akun").then(({ data }) => setAkun((data || []) as Akun[]));
    supabase.rpc("daftar_kategori", { p_arah: null }).then(({ data }) => setKategori((data || []) as Kategori[]));
  }, [id]);

  if (!item) {
    return <p className="mx-auto max-w-[390px] px-4 pt-20 text-[13px] text-muted">Membuka catatan...</p>;
  }

  const aktif = item;
  const kategoriArah = kategori.filter((k) => k.arah === aktif.arah);

  async function simpan() {
    const { error } = await supabase.rpc("ubah_transaksi", {
      p_id: aktif.id,
      p_jumlah: Number(aktif.jumlah),
      p_arah: aktif.arah,
      p_akun: aktif.akun_id,
      p_kategori: aktif.kategori_id,
      p_tanggal: aktif.tanggal,
      p_catatan: aktif.catatan,
      p_status: "posted",
    });
    if (error) setPesan(error.message);
    else navigasi("/catat");
  }

  async function hapus() {
    await supabase.rpc("hapus_transaksi", { p_id: aktif.id });
    navigasi("/catat");
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[390px] bg-canvas px-4 pt-16 pb-8">
      <header className="fixed inset-x-0 top-0 z-40 bg-canvas/80 backdrop-blur-xl">
        <div className="relative mx-auto flex h-14 max-w-[390px] items-center px-2">
          <button aria-label="Kembali" className="flex h-11 w-11 items-center justify-center" onClick={() => navigasi(-1)}>
            <Ikon nama="arrow_back_ios_new" />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-[16px] font-semibold">Detail</h1>
        </div>
      </header>
      <p className={`tabular pt-4 text-center text-[36px] font-semibold ${item.arah === "masuk" ? "text-income" : "text-expense"}`}>
        {item.arah === "masuk" ? "+" : "−"}
        {rupiah(Number(item.jumlah))}
      </p>
      <div className="mt-2 flex items-center justify-center gap-2 text-[13px] text-muted">
        {item.status === "draf" && <span className="rounded-full bg-draft-surface px-2.5 py-0.5 text-[11px] font-semibold text-draft">Draf</span>}
        <span>Diinput dari {item.sumber === "aplikasi" ? "aplikasi" : item.sumber}</span>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl bg-surface">
        <label className="flex items-center justify-between border-b border-hairline px-4 py-3 text-[15px]">
          <span className="text-muted">Kategori</span>
          <select className="bg-transparent text-right" value={item.kategori_id || ""} onChange={(e) => setItem({ ...item, kategori_id: e.target.value })}>
            {kategoriArah.map((k) => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center justify-between border-b border-hairline px-4 py-3 text-[15px]">
          <span className="text-muted">Akun</span>
          <select className="bg-transparent text-right" value={item.akun_id} onChange={(e) => setItem({ ...item, akun_id: e.target.value })}>
            {akun.map((a) => (
              <option key={a.id} value={a.id}>{a.nama}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center justify-between border-b border-hairline px-4 py-3 text-[15px]">
          <span className="text-muted">Tanggal</span>
          <input type="date" className="bg-transparent" value={item.tanggal} onChange={(e) => setItem({ ...item, tanggal: e.target.value })} />
        </label>
        <label className="flex items-center justify-between px-4 py-3 text-[15px]">
          <span className="text-muted">Catatan</span>
          <input className="w-40 bg-transparent text-right" value={item.catatan} onChange={(e) => setItem({ ...item, catatan: e.target.value })} />
        </label>
      </div>
      {pesan && <p className="mt-3 text-[13px] text-expense">{pesan}</p>}
      <button className="mt-4 h-12 w-full rounded-xl bg-accent font-semibold text-white" onClick={simpan}>Simpan</button>
      <button className="mt-2 h-12 w-full font-semibold text-expense" onClick={hapus}>Hapus</button>
    </div>
  );
}
