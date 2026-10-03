import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ikon, Layar } from "../components/Shell";
import { supabase } from "../lib/supabase";
import { bulanAwal, hariIniISO, judulBulan, rupiah, tanggalPendek } from "../lib/format";
import type { Kategori, Transaksi } from "../lib/types";

type Saring = "semua" | "keluar" | "masuk" | "draf";

export function Catat() {
  const navigasi = useNavigate();
  const [baris, setBaris] = useState<Transaksi[]>([]);
  const [saring, setSaring] = useState<Saring>("semua");
  const [cari, setCari] = useState("");
  const [adaLagi, setAdaLagi] = useState(true);
  const [lembar, setLembar] = useState(false);
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [pilihan, setPilihan] = useState<string | null>(null);
  const [jumlah, setJumlah] = useState("25000");
  const [akunId, setAkunId] = useState<string | null>(null);

  const filter = useMemo(() => {
    if (saring === "draf") return { arah: null, status: "draf" };
    if (saring === "semua") return { arah: null, status: null };
    return { arah: saring, status: "posted" };
  }, [saring]);

  async function muat(sebelum?: Transaksi) {
    const { data } = await supabase.rpc("daftar_transaksi", {
      p_limit: 40,
      p_sebelum_tanggal: sebelum?.tanggal ?? null,
      p_sebelum_id: sebelum?.id ?? null,
      p_arah: filter.arah,
      p_status: filter.status,
      p_cari: cari || null,
    });
    const daftar = (data || []) as Transaksi[];
    setBaris((lama) => (sebelum ? [...lama, ...daftar] : daftar));
    setAdaLagi(daftar.length === 40);
  }

  useEffect(() => {
    void muat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saring, cari]);

  useEffect(() => {
    supabase.rpc("daftar_kategori", { p_arah: "keluar" }).then(({ data }) => {
      const daftar = (data || []) as Kategori[];
      setKategori(daftar);
      setPilihan(daftar[0]?.id ?? null);
    });
    supabase.rpc("daftar_akun").then(({ data }) => setAkunId(data?.[0]?.id ?? null));
  }, []);

  const kelompok = new Map<string, Transaksi[]>();
  for (const item of baris) {
    const kunci = item.tanggal;
    kelompok.set(kunci, [...(kelompok.get(kunci) || []), item]);
  }
  const draf = baris.filter((b) => b.status === "draf").length;
  const bulanIni = baris
    .filter((b) => b.tanggal.startsWith(bulanAwal().slice(0, 7)) && b.status === "posted")
    .reduce((n, b) => n + (b.arah === "keluar" ? -Number(b.jumlah) : Number(b.jumlah)), 0);

  async function simpanCepat() {
    if (!akunId || !pilihan) return;
    await supabase.rpc("catat_transaksi", {
      p_jumlah: Number(jumlah) || 0,
      p_arah: "keluar",
      p_akun: akunId,
      p_kategori: pilihan,
      p_tanggal: hariIniISO(),
      p_catatan: kategori.find((k) => k.id === pilihan)?.nama || "",
      p_status: "posted",
      p_sumber: "aplikasi",
      p_idem: null,
    });
    setLembar(false);
    await muat();
  }

  return (
    <Layar judul={<h1 className="text-[22px] font-semibold">Catat</h1>}>
      <div className="flex flex-col gap-3 pt-3">
        <div className="relative">
          <Ikon nama="search" kelas="absolute top-3.5 left-3 text-muted" />
          <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari catatan atau kategori" className="h-12 w-full rounded-xl bg-surface pr-4 pl-11 text-[15px] outline-none" />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {(
            [
              ["semua", "Semua"],
              ["keluar", "Keluar"],
              ["masuk", "Masuk"],
              ["draf", "Draf"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} onClick={() => setSaring(id)} className={`h-9 shrink-0 rounded-full px-4 text-[13px] ${saring === id ? "bg-accent text-white" : "bg-surface text-muted"}`}>
              {label}
              {id === "draf" && draf > 0 ? ` ${draf}` : ""}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-xl bg-surface p-3 shadow-sm">
          <div>
            <p className="text-[11px] tracking-wider text-muted uppercase">Bulan berjalan</p>
            <p className="text-[16px] font-semibold">{judulBulan(bulanAwal())}</p>
          </div>
          <p className={`tabular text-[15px] font-semibold ${bulanIni < 0 ? "text-expense" : "text-income"}`}>{rupiah(bulanIni, true)}</p>
        </div>
        {[...kelompok.entries()].map(([tanggal, isi]) => (
          <div key={tanggal} className="overflow-hidden rounded-xl bg-surface shadow-sm">
            <p className="px-3 pt-3 text-[13px] text-muted">{tanggalPendek(tanggal)}</p>
            {isi.map((item) => (
              <button key={item.id} className="flex w-full items-center gap-3 px-3 py-3 text-left" onClick={() => navigasi(`/catat/${item.id}`)}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas">
                  <Ikon nama={item.ikon} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-semibold">{item.catatan || item.kategori || "Tanpa catatan"}</span>
                    {item.status === "draf" && <span className="rounded-full bg-draft-surface px-2 py-0.5 text-[11px] font-semibold text-draft">Draf</span>}
                  </span>
                  <span className="block truncate text-[13px] text-muted">{[item.kategori, item.akun].filter(Boolean).join(" · ")}</span>
                </span>
                <span className={`tabular text-[15px] font-semibold ${item.arah === "masuk" ? "text-income" : "text-expense"}`}>
                  {rupiah(item.arah === "masuk" ? Number(item.jumlah) : -Number(item.jumlah), true)}
                </span>
              </button>
            ))}
          </div>
        ))}
        {baris.length === 0 && <p className="py-8 text-center text-[13px] text-muted">Belum ada catatan di saringan ini.</p>}
        {adaLagi && baris.length > 0 && (
          <button className="mx-auto h-11 rounded-full bg-surface px-5 text-[13px] text-muted" onClick={() => muat(baris.at(-1))}>
            Muat bulan sebelumnya
          </button>
        )}
      </div>
      <button aria-label="Tambah catatan transaksi baru" className="fixed right-4 bottom-24 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-xl" onClick={() => setLembar(true)}>
        <Ikon nama="add" kelas="text-[28px]" />
      </button>
      {lembar && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40" onClick={() => setLembar(false)}>
          <div className="w-full max-w-[390px] rounded-t-3xl bg-surface p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-hairline" />
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] tracking-wider text-muted uppercase">Pencatatan cepat</p>
                <h3 className="text-[22px] font-semibold">Catat Pengeluaran</h3>
              </div>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-canvas" onClick={() => setLembar(false)} aria-label="Tutup">
                <Ikon nama="close" />
              </button>
            </div>
            <input inputMode="numeric" value={jumlah} onChange={(e) => setJumlah(e.target.value.replace(/\D/g, "") || "0")} className="tabular mb-3 w-full bg-transparent text-center text-[32px] font-semibold outline-none" />
            <div className="mb-3 grid grid-cols-4 gap-2">
              {kategori.slice(0, 4).map((k) => (
                <button key={k.id} className={`rounded-xl p-2 text-[11px] ${pilihan === k.id ? "bg-accent-surface text-accent" : "bg-canvas text-muted"}`} onClick={() => setPilihan(k.id)}>
                  <Ikon nama={k.ikon} />
                  <span className="mt-1 block">{k.nama}</span>
                </button>
              ))}
            </div>
            <button className="h-12 w-full rounded-xl bg-accent font-semibold text-white" onClick={simpanCepat}>Simpan catatan</button>
            <button className="mt-2 h-11 w-full text-[13px] font-semibold text-accent" onClick={() => navigasi("/catat/baru")}>Keypad penuh</button>
          </div>
        </div>
      )}
    </Layar>
  );
}
