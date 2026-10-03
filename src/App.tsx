import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth";
import { supabaseTersedia } from "./lib/supabase";
import { Masuk } from "./pages/Masuk";
import { Beranda } from "./pages/Beranda";
import { Catat } from "./pages/Catat";
import { CatatBaru } from "./pages/CatatBaru";
import { Detail } from "./pages/Detail";
import { HalamanAkun } from "./pages/Akun";
import { OauthIzinkan } from "./pages/Oauth";

function Jaga({ children }: { children: ReactNode }) {
  const { siap, sesi } = useAuth();
  const lokasi = useLocation();
  if (!siap) return <p className="px-4 pt-16 text-[13px] text-muted">Membuka Kas...</p>;
  if (!sesi) return <Navigate to={`/masuk?lanjut=${encodeURIComponent(lokasi.pathname + lokasi.search)}`} replace />;
  return children;
}

export function App() {
  if (!supabaseTersedia) {
    return <p className="mx-auto max-w-[390px] px-4 pt-16 text-[15px]">Kunci Supabase belum diisi di environment.</p>;
  }
  return (
    <Routes>
      <Route path="/masuk" element={<Masuk />} />
      <Route path="/oauth/izinkan" element={<Jaga><OauthIzinkan /></Jaga>} />
      <Route path="/" element={<Jaga><Beranda /></Jaga>} />
      <Route path="/catat" element={<Jaga><Catat /></Jaga>} />
      <Route path="/catat/baru" element={<Jaga><CatatBaru /></Jaga>} />
      <Route path="/catat/:id" element={<Jaga><Detail /></Jaga>} />
      <Route path="/akun" element={<Jaga><HalamanAkun /></Jaga>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
