import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseTersedia } from "./lib/supabase";
import type { Profil } from "./lib/types";

type Auth = {
  siap: boolean;
  sesi: Session | null;
  profil: Profil | null;
  muatUlang: () => Promise<void>;
};

const Konteks = createContext<Auth>({ siap: false, sesi: null, profil: null, muatUlang: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [siap, setSiap] = useState(false);
  const [sesi, setSesi] = useState<Session | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);

  async function muatProfil(userId: string) {
    const { data } = await supabase.from("profil").select("id, nama").eq("id", userId).maybeSingle();
    setProfil(data);
  }

  async function muatUlang() {
    if (!sesi) return;
    await muatProfil(sesi.user.id);
  }

  useEffect(() => {
    if (!supabaseTersedia) {
      setSiap(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSesi(data.session);
      if (data.session) void muatProfil(data.session.user.id);
      setSiap(true);
    });
    const { data: langganan } = supabase.auth.onAuthStateChange((_event, berikutnya) => {
      setSesi(berikutnya);
      if (berikutnya) void muatProfil(berikutnya.user.id);
      else setProfil(null);
    });
    return () => langganan.subscription.unsubscribe();
  }, []);

  return <Konteks.Provider value={{ siap, sesi, profil, muatUlang }}>{children}</Konteks.Provider>;
}

export function useAuth() {
  return useContext(Konteks);
}
