import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ikon, Layar } from "../components/Shell";
import { supabase } from "../lib/supabase";
import { rupiah } from "../lib/format";
import type { Akun, JenisAkun } from "../lib/types";

const jenisLabel: Record<JenisAkun, string> = { tunai: "Tunai", bank: "Bank", ewallet: "E-wallet" };
const jenisIkon: Record<JenisAkun, string> = { tunai: "payments", bank: "account_balance", ewallet: "account_balance_wallet" };

export function HalamanAkun() {
  const navigasi = useNavigate();
  const [daftar, setDaftar] = useState<Akun[]>([]);
  const [nama, setNama] = useState("");
  const [jenis, setJenis] = useState<JenisAkun>("bank");
  const [buka, setBuka] = useState(false);
  const alamatMcp = `${window.location.origin}/mcp`;

  function muat() {
    supabase.rpc("daftar_akun").then(({ data }) => setDaftar((data || []) as Akun[]));
  }

  useEffect(() => {
    muat();
  }, []);

  const total = daftar.reduce((n, a) => n + Number(a.saldo), 0);

  async function tambah() {
    const { error } = await supabase.rpc("tambah_akun", { p_nama: nama, p_jenis: jenis });
    if (!error) {
      setNama("");
      setBuka(false);
      muat();
    }
  }

  async function keluar() {
    await supabase.auth.signOut();
    navigasi("/masuk");
  }

  return (
    <Layar judul={<h1 className="text-[22px] font-semibold leading-7">Akun</h1>} anakJudul="Buku pribadi">
      <div className="flex flex-col gap-3 pt-4">
        <section className="rounded-xl bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted">Total saldo tersedia</span>
            <span className="rounded-full bg-accent-surface px-2.5 py-1 text-[11px] text-accent">{daftar.length} akun aktif</span>
          </div>
          <p className="tabular mt-2 text-[22px] font-semibold">{rupiah(total)}</p>
        </section>
        <h2 className="px-1 text-[16px] font-semibold">Daftar akun</h2>
        {daftar.map((akun) => (
          <div key={akun.id} className="flex min-h-[72px] items-center justify-between rounded-xl bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas">
                <Ikon nama={jenisIkon[akun.jenis]} />
              </span>
              <span>
                <span className="block text-[15px] font-semibold">{akun.nama}</span>
                <span className="text-[13px] text-muted">{jenisLabel[akun.jenis]}</span>
              </span>
            </div>
            <span className="tabular text-[15px] font-semibold">{rupiah(Number(akun.saldo))}</span>
          </div>
        ))}
        {buka ? (
          <div className="flex flex-col gap-2 rounded-xl bg-surface p-4">
            <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama akun" className="h-12 rounded-xl bg-canvas px-4 outline-none" />
            <select value={jenis} onChange={(e) => setJenis(e.target.value as JenisAkun)} className="h-12 rounded-xl bg-canvas px-4">
              <option value="tunai">Tunai</option>
              <option value="bank">Bank</option>
              <option value="ewallet">E-wallet</option>
            </select>
            <button className="h-12 rounded-xl bg-accent font-semibold text-white" onClick={tambah}>Simpan akun</button>
          </div>
        ) : (
          <button className="h-12 rounded-xl bg-surface font-semibold text-accent shadow-sm" onClick={() => setBuka(true)}>Tambah akun</button>
        )}
        <section className="rounded-xl bg-surface p-4 text-[13px] text-muted">
          <p className="text-[15px] font-semibold text-ink">Sambungan AI</p>
          <p className="mt-1">Claude, Gemini, dan Cursor memakai alamat yang sama. Setelah diizinkan, masing-masing hanya melihat bukumu.</p>
          <p className="mt-2 break-all font-medium text-ink">{alamatMcp}</p>
        </section>
        <button className="h-12 text-[15px] font-semibold text-expense" onClick={keluar}>Keluar</button>
      </div>
    </Layar>
  );
}
