export function rupiah(n: number, sign = false) {
  const abs = Math.abs(Math.round(n));
  const body = "Rp" + abs.toLocaleString("id-ID");
  if (!sign || n === 0) return n < 0 ? "−" + body : body;
  return (n > 0 ? "+" : "−") + body;
}

export function singkat(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1_000_000) {
    const jt = abs / 1_000_000;
    const text = jt >= 10 ? jt.toFixed(0) : jt.toFixed(2).replace(".", ",");
    return sign + "Rp" + text.replace(",00", "") + "M";
  }
  if (abs >= 1000) return sign + Math.round(abs / 1000) + "k";
  return sign + "Rp" + abs.toLocaleString("id-ID");
}

export function tanggalPendek(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function hariIniISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

export function bulanAwal(iso = hariIniISO()) {
  return iso.slice(0, 7) + "-01";
}

export function judulBulan(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const nama = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  return nama.charAt(0).toUpperCase() + nama.slice(1);
}

export function geserBulan(iso: string, delta: number) {
  const d = new Date(iso + "T00:00:00");
  d.setMonth(d.getMonth() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}
