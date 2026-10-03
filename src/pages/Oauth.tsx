import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function OauthIzinkan() {
  const [params] = useSearchParams();
  const [pesan, setPesan] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const redirect = params.get("redirect_uri") || "";
  const klien = params.get("client_id") || "";
  const tantangan = params.get("code_challenge") || "";
  const state = params.get("state") || "";

  async function izinkan() {
    setSibuk(true);
    const { data } = await supabase.auth.getSession();
    const refresh = data.session?.refresh_token;
    if (!refresh) {
      setPesan("Sesi tidak ditemukan.");
      setSibuk(false);
      return;
    }
    const { data: kode, error } = await supabase.rpc("simpan_kode_mcp", {
      p_klien: klien,
      p_redirect: redirect,
      p_tantangan: tantangan,
      p_refresh: refresh,
    });
    setSibuk(false);
    if (error || !kode) {
      setPesan(error?.message || "Gagal menyimpan izin");
      return;
    }
    const tujuan = new URL(redirect);
    tujuan.searchParams.set("code", kode);
    if (state) tujuan.searchParams.set("state", state);
    window.location.href = tujuan.toString();
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-canvas px-4 pt-16">
      <h1 className="text-[22px] font-semibold">Izinkan sambungan</h1>
      <p className="mt-2 text-[15px] text-muted">Aplikasi ini akan mencatat dan membaca transaksi di bukumu.</p>
      <p className="mt-4 break-all rounded-xl bg-surface p-3 text-[13px]">{redirect || "Redirect belum ada"}</p>
      {pesan && <p className="mt-3 text-[13px] text-expense">{pesan}</p>}
      <button disabled={sibuk} className="mt-6 h-12 rounded-xl bg-accent font-semibold text-white" onClick={izinkan}>
        {sibuk ? "Menyambungkan..." : "Izinkan"}
      </button>
    </div>
  );
}
