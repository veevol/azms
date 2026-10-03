import { asal, cors, json } from "./asal.js";
import { klienAnon, klienPengguna } from "./supabase-admin.js";

type Rpc = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> };

const alat = [
  {
    name: "catat_transaksi",
    description: "Mencatat pemasukan atau pengeluaran rupiah ke buku pengguna. Jumlah adalah bilangan bulat rupiah, tanpa desimal. Transaksi ambigu harus status draf.",
    inputSchema: {
      type: "object",
      properties: {
        jumlah: { type: "integer", minimum: 1, description: "Nominal rupiah, misal 25000" },
        arah: { type: "string", enum: ["masuk", "keluar"] },
        akun_id: { type: "string", description: "UUID akun. Kosongkan untuk akun pertama." },
        kategori_id: { type: "string" },
        tanggal: { type: "string", description: "YYYY-MM-DD, zona Asia/Jakarta" },
        catatan: { type: "string" },
        status: { type: "string", enum: ["draf", "posted"] },
        idempotency_key: { type: "string" },
      },
      required: ["jumlah", "arah"],
    },
  },
  {
    name: "ubah_transaksi",
    description: "Mengubah transaksi yang sudah ada.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        jumlah: { type: "integer" },
        arah: { type: "string", enum: ["masuk", "keluar"] },
        akun_id: { type: "string" },
        kategori_id: { type: "string" },
        tanggal: { type: "string" },
        catatan: { type: "string" },
        status: { type: "string", enum: ["draf", "posted"] },
      },
      required: ["id", "jumlah", "arah", "akun_id", "tanggal", "status"],
    },
  },
  {
    name: "hapus_transaksi",
    description: "Menghapus satu transaksi milik pengguna.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "cari_transaksi",
    description: "Mencari transaksi terbaru. Hasil dibatasi, tidak mengembalikan seluruh riwayat.",
    inputSchema: {
      type: "object",
      properties: {
        cari: { type: "string" },
        arah: { type: "string", enum: ["masuk", "keluar"] },
        status: { type: "string", enum: ["draf", "posted"] },
        limit: { type: "integer" },
      },
    },
  },
  {
    name: "ringkasan",
    description: "Saldo, masuk, keluar, dan komposisi bulan yang diminta. Dihitung di database.",
    inputSchema: {
      type: "object",
      properties: { bulan: { type: "string", description: "YYYY-MM-01" } },
    },
  },
  {
    name: "daftar_akun",
    description: "Daftar akun beserta saldo.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "daftar_kategori",
    description: "Daftar kategori. Saring dengan arah masuk atau keluar.",
    inputSchema: { type: "object", properties: { arah: { type: "string", enum: ["masuk", "keluar"] } } },
  },
];

function teksAlat(isi: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(isi) }] };
}

async function panggil(nama: string, arg: Record<string, unknown>, klien: Awaited<ReturnType<typeof klienPengguna>>) {
  if (!klien) return teksAlat({ error: "Sesi berakhir. Sambungkan ulang." });
  const db = klien.klien;
  const sumber = ["claude", "gemini", "cursor"].includes(klien.sumber) ? klien.sumber : "cursor";

  if (nama === "daftar_akun") {
    const { data, error } = await db.rpc("daftar_akun");
    if (error) return teksAlat({ error: error.message });
    return teksAlat(data);
  }
  if (nama === "daftar_kategori") {
    const { data, error } = await db.rpc("daftar_kategori", { p_arah: arg.arah ?? null });
    if (error) return teksAlat({ error: error.message });
    return teksAlat(data);
  }
  if (nama === "ringkasan") {
    const bulan = typeof arg.bulan === "string" ? arg.bulan : new Date().toISOString().slice(0, 7) + "-01";
    const { data, error } = await db.rpc("ringkasan_beranda", { p_bulan: bulan });
    if (error) return teksAlat({ error: error.message });
    return teksAlat(data);
  }
  if (nama === "cari_transaksi") {
    const { data, error } = await db.rpc("daftar_transaksi", {
      p_limit: arg.limit ?? 20,
      p_sebelum_tanggal: null,
      p_sebelum_id: null,
      p_arah: arg.arah ?? null,
      p_status: arg.status ?? null,
      p_cari: arg.cari ?? null,
    });
    if (error) return teksAlat({ error: error.message });
    return teksAlat(data);
  }
  if (nama === "catat_transaksi") {
    let akun = arg.akun_id as string | undefined;
    if (!akun) {
      const daftar = await db.rpc("daftar_akun");
      akun = daftar.data?.[0]?.id;
    }
    const { data, error } = await db.rpc("catat_transaksi", {
      p_jumlah: arg.jumlah,
      p_arah: arg.arah,
      p_akun: akun,
      p_kategori: arg.kategori_id ?? null,
      p_tanggal: arg.tanggal ?? null,
      p_catatan: arg.catatan ?? "",
      p_status: arg.status ?? "draf",
      p_sumber: sumber,
      p_idem: arg.idempotency_key ?? null,
    });
    if (error) return teksAlat({ error: error.message });
    return teksAlat({ id: data });
  }
  if (nama === "ubah_transaksi") {
    const { error } = await db.rpc("ubah_transaksi", {
      p_id: arg.id,
      p_jumlah: arg.jumlah,
      p_arah: arg.arah,
      p_akun: arg.akun_id,
      p_kategori: arg.kategori_id ?? null,
      p_tanggal: arg.tanggal,
      p_catatan: arg.catatan ?? "",
      p_status: arg.status,
    });
    if (error) return teksAlat({ error: error.message });
    return teksAlat({ ok: true });
  }
  if (nama === "hapus_transaksi") {
    const { error } = await db.rpc("hapus_transaksi", { p_id: arg.id });
    if (error) return teksAlat({ error: error.message });
    return teksAlat({ ok: true });
  }
  return teksAlat({ error: "Alat tidak dikenal" });
}

export async function tangani(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const dasar = asal(request);
  const kepala = cors(dasar);
  const path = url.pathname.replace(/\/$/, "") || "/";

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: kepala });

  if (path.endsWith("/.well-known/oauth-protected-resource") || path.endsWith("/oauth-protected")) {
    return json(
      {
        resource: `${dasar}/mcp`,
        authorization_servers: [dasar],
        bearer_methods_supported: ["header"],
      },
      200,
      kepala,
    );
  }

  if (path.endsWith("/.well-known/oauth-authorization-server") || path.endsWith("/oauth-metadata")) {
    return json(
      {
        issuer: dasar,
        authorization_endpoint: `${dasar}/oauth/izinkan`,
        token_endpoint: `${dasar}/api/oauth/token`,
        registration_endpoint: `${dasar}/api/oauth/register`,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code", "refresh_token"],
        code_challenge_methods_supported: ["S256"],
        token_endpoint_auth_methods_supported: ["none"],
      },
      200,
      kepala,
    );
  }

  if (path.endsWith("/oauth/register")) {
    if (request.method !== "POST") return json({ error: "method" }, 405, kepala);
    const body = (await request.json()) as { client_name?: string; redirect_uris?: string[] };
    const db = klienAnon();
    const { data, error } = await db.rpc("daftar_klien_mcp", {
      p_nama: body.client_name ?? "",
      p_redirect: body.redirect_uris ?? [],
    });
    if (error) return json({ error: error.message }, 400, kepala);
    return json(
      {
        client_id: data,
        client_name: body.client_name ?? "azms",
        redirect_uris: body.redirect_uris ?? [],
        token_endpoint_auth_method: "none",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
      },
      201,
      kepala,
    );
  }

  if (path.endsWith("/oauth/token")) {
    if (request.method !== "POST") return json({ error: "method" }, 405, kepala);
    const tipe = request.headers.get("content-type") || "";
    const mentah = await request.text();
    const form = tipe.includes("json")
      ? (JSON.parse(mentah) as Record<string, string>)
      : Object.fromEntries(new URLSearchParams(mentah));
    const db = klienAnon();
    if (form.grant_type === "refresh_token") {
      const { data, error } = await db.rpc("segarkan_mcp", { p_segar: form.refresh_token });
      if (error) return json({ error: "invalid_grant" }, 400, kepala);
      return json(data, 200, kepala);
    }
    const { data, error } = await db.rpc("tukar_kode_mcp", {
      p_kode: form.code,
      p_klien: form.client_id,
      p_verifier: form.code_verifier,
      p_redirect: form.redirect_uri,
    });
    if (error) return json({ error: "invalid_grant", error_description: error.message }, 400, kepala);
    return json(data, 200, kepala);
  }

  if (!(path.endsWith("/mcp") || path === "/api/mcp")) {
    return json({ error: "Tidak ditemukan" }, 404, kepala);
  }

  if (request.method === "GET" || request.method === "DELETE") {
    return new Response(null, { status: 405, headers: { allow: "POST", ...kepala } });
  }
  if (request.method !== "POST") return json({ error: "method" }, 405, kepala);

  const auth = request.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  let pesan: Rpc;
  try {
    pesan = (await request.json()) as Rpc;
  } catch {
    return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON rusak" } }, 400, kepala);
  }

  const butuhMasuk = pesan.method !== "initialize" && pesan.method !== "ping";
  if (butuhMasuk && !token) {
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: pesan.id ?? null, error: { code: -32001, message: "Perlu masuk" } }), {
      status: 401,
      headers: {
        ...kepala,
        "content-type": "application/json",
        "www-authenticate": `Bearer resource_metadata="${dasar}/.well-known/oauth-protected-resource"`,
      },
    });
  }

  if (pesan.id === undefined || pesan.id === null) {
    return new Response(null, { status: 202, headers: kepala });
  }

  if (pesan.method === "initialize") {
    return json(
      {
        jsonrpc: "2.0",
        id: pesan.id,
        result: {
          protocolVersion: "2025-03-26",
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "azms", version: "1.0.0" },
        },
      },
      200,
      kepala,
    );
  }
  if (pesan.method === "ping") {
    return json({ jsonrpc: "2.0", id: pesan.id, result: {} }, 200, kepala);
  }
  if (pesan.method === "tools/list") {
    const sesi = await klienPengguna(token);
    if (!sesi) {
      return new Response(JSON.stringify({ jsonrpc: "2.0", id: pesan.id, error: { code: -32001, message: "Sesi berakhir" } }), {
        status: 401,
        headers: {
          ...kepala,
          "content-type": "application/json",
          "www-authenticate": `Bearer resource_metadata="${dasar}/.well-known/oauth-protected-resource"`,
        },
      });
    }
    return json({ jsonrpc: "2.0", id: pesan.id, result: { tools: alat } }, 200, kepala);
  }
  if (pesan.method === "tools/call") {
    const params = pesan.params || {};
    const nama = String(params.name || "");
    const arg = (params.arguments || {}) as Record<string, unknown>;
    const sesi = await klienPengguna(token);
    if (!sesi) {
      return new Response(JSON.stringify({ jsonrpc: "2.0", id: pesan.id, error: { code: -32001, message: "Sesi berakhir" } }), {
        status: 401,
        headers: { ...kepala, "content-type": "application/json" },
      });
    }
    const result = await panggil(nama, arg, sesi);
    return json({ jsonrpc: "2.0", id: pesan.id, result }, 200, kepala);
  }

  return json({ jsonrpc: "2.0", id: pesan.id, error: { code: -32601, message: "Metode tidak dikenal" } }, 200, kepala);
}
