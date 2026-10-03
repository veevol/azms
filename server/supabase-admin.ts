import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function klienAnon() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Kunci Supabase belum diisi");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function klienPengguna(akses: string) {
  const dasar = klienAnon();
  const { data, error } = await dasar.rpc("sesi_mcp", { p_akses: akses });
  if (error || !data?.refresh_token) return null;

  const pengguna = klienAnon();
  const segar = await pengguna.auth.refreshSession({ refresh_token: data.refresh_token as string });
  if (segar.error || !segar.data.session) return null;

  if (segar.data.session.refresh_token !== data.refresh_token) {
    await dasar.rpc("simpan_refresh_mcp", {
      p_akses: akses,
      p_refresh: segar.data.session.refresh_token,
    });
  }

  return { klien: pengguna as SupabaseClient, sumber: (data.sumber as string) || "cursor" };
}
