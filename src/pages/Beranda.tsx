import { useEffect, useState } from "react";
import { Ikon, Layar } from "../components/Shell";
import { useAuth } from "../auth";
import { supabase } from "../lib/supabase";
import { bulanAwal, geserBulan, judulBulan, rupiah, singkat } from "../lib/format";
import type { Ringkasan } from "../lib/types";

const kosong: Ringkasan = { saldo: 0, masuk: 0, keluar: 0, draf: 0, minggu: [], kategori: [], kurva: [] };
const warna = ["#0F766E", "#D97706", "#14B8A6", "#78716C"];

export function Beranda() {
  const { profil } = useAuth();
  const [bulan, setBulan] = useState(bulanAwal());
  const [data, setData] = useState<Ringkasan>(kosong);
  const [saring, setSaring] = useState(false);

  useEffect(() => {
    supabase.rpc("ringkasan_beranda", { p_bulan: bulan }).then(({ data: hasil }) => {
      if (hasil) setData(hasil as Ringkasan);
    });
  }, [bulan]);

  const hemat = data.masuk > 0 ? Math.round(((data.masuk - data.keluar) / data.masuk) * 1000) / 10 : 0;
  const porsi = data.masuk > 0 ? Math.min(100, Math.round((data.keluar / data.masuk) * 100)) : 0;
  const maksMinggu = Math.max(1, ...data.minggu.map((m) => Number(m.jumlah)));
  const totalKategori = data.kategori.reduce((n, k) => n + Number(k.jumlah), 0) || 1;
  const kurva = data.kurva.map((t) => Number(t.saldo));
  const minK = Math.min(...kurva, 0);
  const maxK = Math.max(...kurva, 1);

  return (
    <Layar
      judul={
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
            {(profil?.nama || "K").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold leading-tight">Halo, {profil?.nama || "kamu"}</span>
            <span className="text-[11px] text-muted">{judulBulan(bulan)} · Analisis Kas</span>
          </div>
        </div>
      }
      kanan={
        <>
          <span className="relative flex h-9 w-9 items-center justify-center text-muted" aria-label="Draf">
            <Ikon nama="notifications" />
            {data.draf > 0 && <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-expense" />}
          </span>
          <button aria-label="Filter bulan" className="flex h-9 w-9 items-center justify-center text-muted" onClick={() => setSaring((v) => !v)}>
            <Ikon nama="tune" />
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pt-3">
        {saring && (
          <div className="flex items-center justify-between rounded-2xl bg-surface px-3 py-2 shadow-sm">
            <button className="h-11 px-3" onClick={() => setBulan((b) => geserBulan(b, -1))} aria-label="Bulan sebelumnya">
              <Ikon nama="chevron_left" />
            </button>
            <span className="text-[15px] font-semibold">{judulBulan(bulan)}</span>
            <button className="h-11 px-3" onClick={() => setBulan((b) => geserBulan(b, 1))} aria-label="Bulan berikutnya">
              <Ikon nama="chevron_right" />
            </button>
          </div>
        )}

        <section className="rounded-2xl border border-hairline bg-surface p-4 shadow-[0_1px_3px_rgba(28,25,23,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">Saldo aktif berjalan</span>
            <span className="rounded-full bg-income/10 px-2 py-0.5 text-[10px] font-semibold text-income">
              {hemat >= 0 ? "+" : ""}
              {hemat}% hemat
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <span className="tabular block text-[32px] leading-none font-bold">{rupiah(data.saldo)}</span>
              <span className="mt-1.5 block text-[11px] text-muted">Masuk {rupiah(data.masuk)} · Keluar {rupiah(data.keluar)}</span>
            </div>
            <div className="relative flex h-16 w-16 items-center justify-center">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="16" fill="none" stroke="#F4ECE8" strokeWidth="4.5" />
                <circle cx="21" cy="21" r="16" fill="none" stroke="#15803D" strokeWidth="4.5" />
                <circle cx="21" cy="21" r="16" fill="none" stroke="#B91C1C" strokeWidth="4.5" strokeDasharray={`${porsi} ${100 - porsi}`} strokeLinecap="round" />
              </svg>
              <span className="tabular absolute text-[10px] font-bold">{porsi}%</span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-hairline bg-surface p-4">
          <h2 className="text-[15px] font-semibold">Pengeluaran mingguan</h2>
          <div className="mt-3 flex h-28 items-end justify-between gap-2">
            {[1, 2, 3, 4].map((minggu) => {
              const ketemu = data.minggu.find((m) => Number(m.minggu) === minggu);
              const jumlah = Number(ketemu?.jumlah || 0);
              const tinggi = Math.max(8, Math.round((jumlah / maksMinggu) * 88));
              return (
                <div key={minggu} className="flex w-12 flex-col items-center gap-1">
                  <span className="tabular text-[9px] text-muted">{singkat(jumlah)}</span>
                  <div className="w-7 rounded-t-md bg-accent" style={{ height: tinggi }} />
                  <span className="text-[10px] text-muted">Mgg {minggu}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-hairline bg-surface p-4">
          <h2 className="text-[15px] font-semibold">Komposisi pengeluaran</h2>
          <p className="text-[11px] text-muted">Empat pos terbesar bulan ini</p>
          {data.kategori.length === 0 ? (
            <p className="py-6 text-[13px] text-muted">Belum ada pengeluaran di bulan ini.</p>
          ) : (
            <div className="flex items-center gap-4 py-2">
              <Donat irisan={data.kategori} total={totalKategori} />
              <div className="min-w-0 flex-1 space-y-2">
                {data.kategori.map((k, i) => (
                  <div key={k.nama} className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: warna[i % warna.length] }} />
                      {k.nama}
                    </span>
                    <span className="tabular font-bold">{Math.round((Number(k.jumlah) / totalKategori) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-hairline bg-surface p-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[15px] font-semibold">Kurva saldo</h2>
              <p className="text-[11px] text-muted">Saldo harian {judulBulan(bulan)}</p>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-muted">Akhir bulan</span>
              <span className="tabular text-[13px] font-bold text-accent">{rupiah(kurva.at(-1) || data.saldo)}</span>
            </div>
          </div>
          <Kurva nilai={kurva} min={minK} max={maxK} />
        </section>
      </div>
    </Layar>
  );
}

function Donat({ irisan, total }: { irisan: Ringkasan["kategori"]; total: number }) {
  let offset = 0;
  const keliling = 2 * Math.PI * 38;
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="38" fill="none" stroke="#F4ECE8" strokeWidth="12" />
        {irisan.map((k, i) => {
          const panjang = (Number(k.jumlah) / total) * keliling;
          const el = (
            <circle key={k.nama} cx="50" cy="50" r="38" fill="none" stroke={warna[i % warna.length]} strokeWidth="12" strokeDasharray={`${panjang} ${keliling - panjang}`} strokeDashoffset={-offset} />
          );
          offset += panjang;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[9px] tracking-wider text-muted uppercase">Total</span>
        <span className="tabular text-[13px] font-bold">{singkat(total)}</span>
      </div>
    </div>
  );
}

function Kurva({ nilai, min, max }: { nilai: number[]; min: number; max: number }) {
  if (nilai.length < 2) return <p className="py-6 text-[13px] text-muted">Kurva muncul setelah ada transaksi.</p>;
  const lebar = 320;
  const tinggi = 100;
  const langkah = lebar / (nilai.length - 1);
  const y = (n: number) => 90 - ((n - min) / (max - min || 1)) * 75;
  const titik = nilai.map((n, i) => `${i * langkah},${y(n)}`).join(" ");
  const area = `0,95 ${titik} ${lebar},95`;
  return (
    <svg className="mt-2 h-32 w-full" viewBox={`0 0 ${lebar} ${tinggi}`} preserveAspectRatio="none">
      <polyline fill="rgba(15,118,110,0.15)" stroke="none" points={area} />
      <polyline fill="none" stroke="#0F766E" strokeWidth="2" points={titik} />
    </svg>
  );
}
