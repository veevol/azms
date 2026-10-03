import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

const ikon = "material-symbols-outlined text-[24px]";

export function TabBar() {
  const kelas = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center min-h-11 h-full gap-1 ${isActive ? "text-accent font-semibold" : "text-muted"}`;
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_-2px_12px_rgba(28,25,23,0.04)] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid h-16 max-w-[390px] grid-cols-3 px-4">
        <NavLink to="/" end className={kelas}>
          <span className={ikon}>home</span>
          <span className="text-[11px] leading-none">Beranda</span>
        </NavLink>
        <NavLink to="/catat" className={kelas}>
          <span className={ikon}>receipt_long</span>
          <span className="text-[11px] leading-none">Catat</span>
        </NavLink>
        <NavLink to="/akun" className={kelas}>
          <span className={ikon}>person</span>
          <span className="text-[11px] leading-none">Akun</span>
        </NavLink>
      </div>
    </nav>
  );
}

export function Layar({
  judul,
  anakJudul,
  kanan,
  tab = true,
  children,
}: {
  judul?: ReactNode;
  anakJudul?: string;
  kanan?: ReactNode;
  tab?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-canvas text-ink">
      {judul && (
        <header className="fixed inset-x-0 top-0 z-40 bg-canvas/80 pt-[env(safe-area-inset-top)] shadow-[0_1px_8px_rgba(28,25,23,0.03)] backdrop-blur-xl">
          <div className="mx-auto flex h-14 w-full max-w-[390px] items-center justify-between px-4">
            <div className="min-w-0">
            {judul}
            {anakJudul && <p className="truncate text-[11px] text-muted">{anakJudul}</p>}
          </div>
            <div className="flex items-center gap-1">{kanan}</div>
          </div>
        </header>
      )}
      <main className={`flex-1 px-4 ${judul ? "pt-14" : "pt-6"} ${tab ? "pb-24" : "pb-8"}`}>{children}</main>
      {tab && <TabBar />}
    </div>
  );
}

export function Ikon({ nama, kelas = "" }: { nama: string; kelas?: string }) {
  return <span className={`material-symbols-outlined ${kelas}`}>{nama}</span>;
}
