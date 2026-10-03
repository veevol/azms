import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Ikon } from "../components/Shell";

export function Masuk() {
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [lihat, setLihat] = useState(false);
  const [daftar, setDaftar] = useState(false);
  const [nama, setNama] = useState("");
  const [pesan, setPesan] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const navigasi = useNavigate();
  const [params] = useSearchParams();
  const lanjut = params.get("lanjut") || "/";

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setSibuk(true);
    setPesan("");
    const hasil = daftar
      ? await supabase.auth.signUp({ email, password: sandi, options: { data: { nama: nama || email.split("@")[0] } } })
      : await supabase.auth.signInWithPassword({ email, password: sandi });
    setSibuk(false);
    if (hasil.error) {
      setPesan(hasil.error.message);
      return;
    }
    if (daftar && !hasil.data.session) {
      setPesan("Akun dibuat. Cek email untuk mengaktifkannya, lalu masuk.");
      setDaftar(false);
      return;
    }
    navigasi(lanjut, { replace: true });
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-canvas px-4 pt-16 text-ink">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-semibold text-white">K</div>
        <div>
          <p className="text-[22px] font-semibold leading-7">Kas</p>
          <p className="text-[13px] text-muted">Catat uang dari HP, Claude, Gemini, atau Cursor.</p>
        </div>
      </div>
      <form className="flex flex-col gap-3" onSubmit={kirim}>
        {daftar && (
          <label className="text-[13px] text-muted">
            Nama
            <input className="mt-1 h-12 w-full rounded-xl bg-surface px-4 text-[15px] text-ink outline-none" value={nama} onChange={(e) => setNama(e.target.value)} />
          </label>
        )}
        <label className="text-[13px] text-muted">
          Email
          <input required type="email" autoComplete="email" placeholder="nama@email.com" className="mt-1 h-12 w-full rounded-xl bg-surface px-4 text-[15px] text-ink outline-none" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="text-[13px] text-muted">
          Kata sandi
          <span className="relative mt-1 block">
            <input required minLength={6} type={lihat ? "text" : "password"} autoComplete={daftar ? "new-password" : "current-password"} placeholder="••••••••" className="h-12 w-full rounded-xl bg-surface px-4 pr-12 text-[15px] text-ink outline-none" value={sandi} onChange={(e) => setSandi(e.target.value)} />
            <button type="button" aria-label="Tampilkan atau sembunyikan kata sandi" className="absolute top-0 right-0 flex h-12 w-12 items-center justify-center text-muted" onClick={() => setLihat((v) => !v)}>
              <Ikon nama={lihat ? "visibility_off" : "visibility"} />
            </button>
          </span>
        </label>
        {pesan && <p className="text-[13px] text-expense">{pesan}</p>}
        <button disabled={sibuk} className="h-12 rounded-xl bg-accent text-[16px] font-semibold text-white active:bg-accent-active" type="submit">
          {sibuk ? "Sebentar..." : daftar ? "Buat akun" : "Masuk"}
        </button>
        <button type="button" className="min-h-11 text-[15px] font-semibold text-accent" onClick={() => setDaftar((v) => !v)}>
          {daftar ? "Sudah punya akun" : "Buat akun"}
        </button>
      </form>
    </div>
  );
}
