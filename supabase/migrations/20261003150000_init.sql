-- Kas / azms. Portabel ke Supabase self-hosted: SQL biasa, tanpa ekstensi khusus cloud.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create table public.profil (
  id uuid primary key references auth.users (id) on delete cascade,
  nama text not null
);

create table public.buku (
  id uuid primary key default gen_random_uuid(),
  nama text not null default 'Buku pribadi',
  owner_id uuid not null references auth.users (id) on delete cascade,
  dibuat timestamptz not null default now()
);

create table public.buku_anggota (
  buku_id uuid not null references public.buku (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  peran text not null check (peran in ('pemilik', 'anggota')),
  primary key (buku_id, user_id)
);

create table public.akun (
  id uuid primary key default gen_random_uuid(),
  buku_id uuid not null references public.buku (id) on delete cascade,
  nama text not null,
  jenis text not null check (jenis in ('tunai', 'bank', 'ewallet')),
  urutan int not null default 0
);

create table public.kategori (
  id uuid primary key default gen_random_uuid(),
  buku_id uuid not null references public.buku (id) on delete cascade,
  nama text not null,
  arah text not null check (arah in ('masuk', 'keluar')),
  ikon text not null default 'category'
);

create table public.transaksi (
  id uuid primary key default gen_random_uuid(),
  buku_id uuid not null references public.buku (id) on delete cascade,
  akun_id uuid not null references public.akun (id),
  kategori_id uuid references public.kategori (id),
  jumlah bigint not null check (jumlah > 0 and jumlah <= 1000000000000),
  arah text not null check (arah in ('masuk', 'keluar')),
  catatan text not null default '',
  tanggal date not null default (timezone('Asia/Jakarta', now()))::date,
  status text not null default 'posted' check (status in ('draf', 'posted')),
  sumber text not null default 'aplikasi' check (sumber in ('aplikasi', 'claude', 'gemini', 'cursor')),
  idempotency_key text,
  dibuat_oleh uuid not null references auth.users (id) on delete cascade,
  dibuat timestamptz not null default now()
);

create unique index transaksi_idem_idx
  on public.transaksi (buku_id, idempotency_key)
  where idempotency_key is not null;

create index transaksi_buku_tanggal_idx
  on public.transaksi (buku_id, tanggal desc, id desc);

create or replace function private.adalah_anggota(p_buku uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.buku_anggota
    where buku_id = p_buku and user_id = auth.uid()
  );
$$;

revoke all on function private.adalah_anggota(uuid) from public;
grant execute on function private.adalah_anggota(uuid) to anon, authenticated;

create table public.mcp_klien (
  id text primary key,
  nama text not null default '',
  redirect_uris text[] not null,
  dibuat timestamptz not null default now()
);

create table public.mcp_kode (
  kode text primary key,
  klien_id text not null references public.mcp_klien (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  redirect_uri text not null,
  tantangan text not null,
  refresh_token text not null,
  kedaluwarsa timestamptz not null
);

create table public.mcp_token (
  akses_hash text primary key,
  segar text not null unique,
  user_id uuid not null references auth.users (id) on delete cascade,
  refresh_token text not null,
  sumber text not null default 'cursor',
  kedaluwarsa timestamptz not null
);

alter table public.profil enable row level security;
alter table public.buku enable row level security;
alter table public.buku_anggota enable row level security;
alter table public.akun enable row level security;
alter table public.kategori enable row level security;
alter table public.transaksi enable row level security;
alter table public.mcp_klien enable row level security;
alter table public.mcp_kode enable row level security;
alter table public.mcp_token enable row level security;

revoke all on public.mcp_klien from anon, authenticated;
revoke all on public.mcp_kode from anon, authenticated;
revoke all on public.mcp_token from anon, authenticated;

create policy profil_milik on public.profil
  for select to authenticated using (id = auth.uid());
create policy profil_ubah on public.profil
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy buku_baca on public.buku
  for select to authenticated using (private.adalah_anggota(id));

create policy anggota_baca on public.buku_anggota
  for select to authenticated using (private.adalah_anggota(buku_id));

create policy akun_baca on public.akun
  for select to authenticated using (private.adalah_anggota(buku_id));
create policy akun_tulis on public.akun
  for insert to authenticated with check (private.adalah_anggota(buku_id));
create policy akun_ubah on public.akun
  for update to authenticated
  using (private.adalah_anggota(buku_id)) with check (private.adalah_anggota(buku_id));
create policy akun_hapus on public.akun
  for delete to authenticated using (private.adalah_anggota(buku_id));

create policy kategori_baca on public.kategori
  for select to authenticated using (private.adalah_anggota(buku_id));
create policy kategori_tulis on public.kategori
  for insert to authenticated with check (private.adalah_anggota(buku_id));

create policy transaksi_baca on public.transaksi
  for select to authenticated using (private.adalah_anggota(buku_id));
create policy transaksi_tulis on public.transaksi
  for insert to authenticated with check (
    private.adalah_anggota(buku_id) and dibuat_oleh = auth.uid()
  );
create policy transaksi_ubah on public.transaksi
  for update to authenticated
  using (private.adalah_anggota(buku_id))
  with check (private.adalah_anggota(buku_id) and dibuat_oleh = auth.uid());
create policy transaksi_hapus on public.transaksi
  for delete to authenticated using (private.adalah_anggota(buku_id));

create or replace function public.buku_saya()
returns uuid
language sql
stable
security invoker
set search_path = public
as $$
  select buku_id from public.buku_anggota
  where user_id = auth.uid()
  order by case when peran = 'pemilik' then 0 else 1 end
  limit 1;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buku uuid;
  v_nama text;
begin
  v_nama := nullif(trim(coalesce(new.raw_user_meta_data->>'nama', '')), '');
  if v_nama is null then
    v_nama := split_part(new.email, '@', 1);
  end if;

  insert into public.profil (id, nama) values (new.id, v_nama);
  insert into public.buku (nama, owner_id) values ('Buku pribadi', new.id) returning id into v_buku;
  insert into public.buku_anggota (buku_id, user_id, peran) values (v_buku, new.id, 'pemilik');
  insert into public.akun (buku_id, nama, jenis, urutan) values
    (v_buku, 'Dompet', 'tunai', 1),
    (v_buku, 'BCA', 'bank', 2),
    (v_buku, 'GoPay', 'ewallet', 3);
  insert into public.kategori (buku_id, nama, arah, ikon) values
    (v_buku, 'Makan', 'keluar', 'restaurant'),
    (v_buku, 'Transport', 'keluar', 'directions_car'),
    (v_buku, 'Belanja', 'keluar', 'shopping_bag'),
    (v_buku, 'Tagihan', 'keluar', 'receipt_long'),
    (v_buku, 'Gaji', 'masuk', 'payments'),
    (v_buku, 'Lainnya', 'keluar', 'category'),
    (v_buku, 'Lainnya', 'masuk', 'savings');
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.ringkasan_beranda(p_bulan date)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_buku uuid := public.buku_saya();
  v_awal date := date_trunc('month', p_bulan)::date;
  v_akhir date := (date_trunc('month', p_bulan) + interval '1 month - 1 day')::date;
  v_saldo bigint;
  v_masuk bigint;
  v_keluar bigint;
  v_buka bigint;
  v_draf int;
begin
  if v_buku is null then
    return jsonb_build_object(
      'saldo', 0, 'masuk', 0, 'keluar', 0, 'draf', 0,
      'minggu', '[]'::jsonb, 'kategori', '[]'::jsonb, 'kurva', '[]'::jsonb
    );
  end if;

  select
    coalesce(sum(case when arah = 'masuk' then jumlah else -jumlah end), 0),
    coalesce(sum(case when arah = 'masuk' and tanggal >= v_awal and tanggal <= v_akhir then jumlah else 0 end), 0),
    coalesce(sum(case when arah = 'keluar' and tanggal >= v_awal and tanggal <= v_akhir then jumlah else 0 end), 0),
    coalesce(sum(case when tanggal < v_awal then case when arah = 'masuk' then jumlah else -jumlah end else 0 end), 0)
  into v_saldo, v_masuk, v_keluar, v_buka
  from public.transaksi
  where buku_id = v_buku and status = 'posted';

  select count(*) into v_draf
  from public.transaksi
  where buku_id = v_buku and status = 'draf';

  return jsonb_build_object(
    'saldo', v_saldo,
    'masuk', v_masuk,
    'keluar', v_keluar,
    'draf', v_draf,
    'minggu', (
      select coalesce(jsonb_agg(jsonb_build_object('minggu', m.minggu, 'jumlah', m.jumlah) order by m.minggu), '[]'::jsonb)
      from (
        select
          least(4, greatest(1, ceil(extract(day from tanggal) / 7.0)::int)) as minggu,
          coalesce(sum(jumlah), 0) as jumlah
        from public.transaksi
        where buku_id = v_buku and status = 'posted' and arah = 'keluar'
          and tanggal >= v_awal and tanggal <= v_akhir
        group by 1
      ) m
    ),
    'kategori', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'nama', k.nama, 'jumlah', k.jumlah, 'ikon', k.ikon
      ) order by k.jumlah desc), '[]'::jsonb)
      from (
        select coalesce(c.nama, 'Lainnya') as nama, coalesce(c.ikon, 'category') as ikon, sum(t.jumlah) as jumlah
        from public.transaksi t
        left join public.kategori c on c.id = t.kategori_id
        where t.buku_id = v_buku and t.status = 'posted' and t.arah = 'keluar'
          and t.tanggal >= v_awal and t.tanggal <= v_akhir
        group by 1, 2
        order by sum(t.jumlah) desc
        limit 4
      ) k
    ),
    'kurva', (
      select coalesce(jsonb_agg(jsonb_build_object('hari', d.hari, 'saldo', d.saldo) order by d.hari), '[]'::jsonb)
      from (
        select g.hari::date as hari,
          v_buka + sum(coalesce(h.delta, 0)) over (order by g.hari) as saldo
        from generate_series(v_awal, v_akhir, interval '1 day') as g(hari)
        left join (
          select tanggal, sum(case when arah = 'masuk' then jumlah else -jumlah end) as delta
          from public.transaksi
          where buku_id = v_buku and status = 'posted'
            and tanggal >= v_awal and tanggal <= v_akhir
          group by tanggal
        ) h on h.tanggal = g.hari::date
      ) d
    )
  );
end;
$$;

create or replace function public.daftar_transaksi(
  p_limit int default 40,
  p_sebelum_tanggal date default null,
  p_sebelum_id uuid default null,
  p_arah text default null,
  p_status text default null,
  p_cari text default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
  from (
    select
      t.id, t.jumlah, t.arah, t.catatan, t.tanggal, t.status, t.sumber,
      a.nama as akun, a.id as akun_id,
      c.nama as kategori, c.id as kategori_id, coalesce(c.ikon, 'category') as ikon
    from public.transaksi t
    join public.akun a on a.id = t.akun_id
    left join public.kategori c on c.id = t.kategori_id
    where t.buku_id = public.buku_saya()
      and (p_arah is null or t.arah = p_arah)
      and (p_status is null or t.status = p_status)
      and (
        p_cari is null or length(trim(p_cari)) = 0
        or t.catatan ilike '%' || p_cari || '%'
        or c.nama ilike '%' || p_cari || '%'
      )
      and (
        p_sebelum_tanggal is null
        or (t.tanggal, t.id) < (p_sebelum_tanggal, p_sebelum_id)
      )
    order by t.tanggal desc, t.id desc
    limit least(greatest(coalesce(p_limit, 40), 1), 80)
  ) x;
$$;

create or replace function public.daftar_akun()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(to_jsonb(x) order by x.urutan, x.nama), '[]'::jsonb)
  from (
    select
      a.id, a.nama, a.jenis, a.urutan,
      coalesce(sum(case
        when t.status = 'posted' and t.arah = 'masuk' then t.jumlah
        when t.status = 'posted' and t.arah = 'keluar' then -t.jumlah
        else 0
      end), 0) as saldo
    from public.akun a
    left join public.transaksi t on t.akun_id = a.id
    where a.buku_id = public.buku_saya()
    group by a.id
  ) x;
$$;

create or replace function public.daftar_kategori(p_arah text default null)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'nama', nama, 'arah', arah, 'ikon', ikon
  ) order by nama), '[]'::jsonb)
  from public.kategori
  where buku_id = public.buku_saya()
    and (p_arah is null or arah = p_arah);
$$;

create or replace function public.catat_transaksi(
  p_jumlah bigint,
  p_arah text,
  p_akun uuid,
  p_kategori uuid,
  p_tanggal date,
  p_catatan text,
  p_status text default 'posted',
  p_sumber text default 'aplikasi',
  p_idem text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_buku uuid := public.buku_saya();
  v_id uuid;
  v_arah_kategori text;
begin
  if v_buku is null then
    raise exception 'Buku tidak ditemukan';
  end if;
  if p_jumlah is null or p_jumlah <= 0 then
    raise exception 'Jumlah harus lebih dari 0';
  end if;
  if p_arah not in ('masuk', 'keluar') then
    raise exception 'Arah tidak dikenal';
  end if;
  if p_status not in ('draf', 'posted') then
    raise exception 'Status tidak dikenal';
  end if;
  if p_sumber not in ('aplikasi', 'claude', 'gemini', 'cursor') then
    raise exception 'Sumber tidak dikenal';
  end if;
  if not exists (select 1 from public.akun where id = p_akun and buku_id = v_buku) then
    raise exception 'Akun tidak ada di buku ini';
  end if;
  if p_kategori is not null then
    select arah into v_arah_kategori from public.kategori where id = p_kategori and buku_id = v_buku;
    if v_arah_kategori is null then
      raise exception 'Kategori tidak ada di buku ini';
    end if;
    if v_arah_kategori <> p_arah then
      raise exception 'Kategori tidak sesuai arah transaksi';
    end if;
  end if;
  if p_idem is not null then
    select id into v_id from public.transaksi
    where buku_id = v_buku and idempotency_key = p_idem;
    if v_id is not null then
      return v_id;
    end if;
  end if;

  insert into public.transaksi (
    buku_id, akun_id, kategori_id, jumlah, arah, catatan, tanggal, status, sumber, idempotency_key, dibuat_oleh
  ) values (
    v_buku, p_akun, p_kategori, p_jumlah, p_arah, coalesce(p_catatan, ''),
    coalesce(p_tanggal, (timezone('Asia/Jakarta', now()))::date),
    p_status, p_sumber, p_idem, auth.uid()
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.ubah_transaksi(
  p_id uuid,
  p_jumlah bigint,
  p_arah text,
  p_akun uuid,
  p_kategori uuid,
  p_tanggal date,
  p_catatan text,
  p_status text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_buku uuid := public.buku_saya();
begin
  if p_jumlah is null or p_jumlah <= 0 then
    raise exception 'Jumlah harus lebih dari 0';
  end if;
  update public.transaksi set
    jumlah = p_jumlah,
    arah = p_arah,
    akun_id = p_akun,
    kategori_id = p_kategori,
    tanggal = p_tanggal,
    catatan = coalesce(p_catatan, ''),
    status = p_status
  where id = p_id and buku_id = v_buku;
  if not found then
    raise exception 'Transaksi tidak ditemukan';
  end if;
end;
$$;

create or replace function public.hapus_transaksi(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.transaksi where id = p_id and buku_id = public.buku_saya();
  if not found then
    raise exception 'Transaksi tidak ditemukan';
  end if;
end;
$$;

create or replace function public.tambah_akun(p_nama text, p_jenis text)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
  v_buku uuid := public.buku_saya();
begin
  if p_jenis not in ('tunai', 'bank', 'ewallet') then
    raise exception 'Jenis akun tidak dikenal';
  end if;
  if nullif(trim(p_nama), '') is null then
    raise exception 'Nama akun kosong';
  end if;
  insert into public.akun (buku_id, nama, jenis, urutan)
  values (v_buku, trim(p_nama), p_jenis, 99)
  returning id into v_id;
  return v_id;
end;
$$;

-- MCP OAuth. Fungsi security definer ini sengaja di schema public karena
-- dipanggil lewat Data API. Rahasianya ada di kode/token acak, sekali pakai.

create or replace function public.daftar_klien_mcp(p_nama text, p_redirect text[])
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := encode(extensions.gen_random_bytes(16), 'hex');
begin
  if p_redirect is null or cardinality(p_redirect) = 0 then
    raise exception 'Redirect URI wajib';
  end if;
  insert into public.mcp_klien (id, nama, redirect_uris)
  values (v_id, coalesce(p_nama, ''), p_redirect);
  return v_id;
end;
$$;

create or replace function public.simpan_kode_mcp(
  p_klien text,
  p_redirect text,
  p_tantangan text,
  p_refresh text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kode text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  if auth.uid() is null then
    raise exception 'Belum masuk';
  end if;
  if p_refresh is null or length(p_refresh) < 20 then
    raise exception 'Sesi tidak lengkap';
  end if;
  if not exists (
    select 1 from public.mcp_klien
    where id = p_klien and p_redirect = any (redirect_uris)
  ) then
    raise exception 'Klien atau redirect tidak dikenal';
  end if;
  insert into public.mcp_kode (kode, klien_id, user_id, redirect_uri, tantangan, refresh_token, kedaluwarsa)
  values (v_kode, p_klien, auth.uid(), p_redirect, p_tantangan, p_refresh, now() + interval '10 minutes');
  return v_kode;
end;
$$;

create or replace function public.tukar_kode_mcp(
  p_kode text,
  p_klien text,
  p_verifier text,
  p_redirect text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.mcp_kode%rowtype;
  v_cek text;
  v_akses text := encode(extensions.gen_random_bytes(32), 'hex');
  v_segar text := encode(extensions.gen_random_bytes(32), 'hex');
  v_sumber text := 'cursor';
  v_nama text;
begin
  select * into v_row from public.mcp_kode where kode = p_kode for update;
  if not found or v_row.kedaluwarsa < now() then
    raise exception 'Kode tidak berlaku';
  end if;
  if v_row.klien_id <> p_klien or v_row.redirect_uri <> p_redirect then
    raise exception 'Klien tidak cocok';
  end if;
  v_cek := rtrim(translate(encode(extensions.digest(p_verifier, 'sha256'), 'base64'), '+/', '-_'), '=');
  if v_cek is distinct from v_row.tantangan then
    raise exception 'PKCE tidak cocok';
  end if;
  select nama into v_nama from public.mcp_klien where id = p_klien;
  if v_nama ilike '%claude%' then v_sumber := 'claude';
  elsif v_nama ilike '%gemini%' then v_sumber := 'gemini';
  elsif v_nama ilike '%cursor%' then v_sumber := 'cursor';
  end if;
  insert into public.mcp_token (akses_hash, segar, user_id, refresh_token, sumber, kedaluwarsa)
  values (
    encode(extensions.digest(v_akses, 'sha256'), 'hex'),
    v_segar,
    v_row.user_id,
    v_row.refresh_token,
    v_sumber,
    now() + interval '30 days'
  );
  delete from public.mcp_kode where kode = p_kode;
  return jsonb_build_object(
    'access_token', v_akses,
    'refresh_token', v_segar,
    'expires_in', 2592000,
    'token_type', 'Bearer'
  );
end;
$$;

create or replace function public.segarkan_mcp(p_segar text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.mcp_token%rowtype;
  v_akses text := encode(extensions.gen_random_bytes(32), 'hex');
  v_segar text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  select * into v_row from public.mcp_token where segar = p_segar for update;
  if not found or v_row.kedaluwarsa < now() then
    raise exception 'Token tidak berlaku';
  end if;
  update public.mcp_token set
    akses_hash = encode(extensions.digest(v_akses, 'sha256'), 'hex'),
    segar = v_segar,
    kedaluwarsa = now() + interval '30 days'
  where akses_hash = v_row.akses_hash;
  return jsonb_build_object(
    'access_token', v_akses,
    'refresh_token', v_segar,
    'expires_in', 2592000,
    'token_type', 'Bearer'
  );
end;
$$;

create or replace function public.sesi_mcp(p_akses text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.mcp_token%rowtype;
begin
  select * into v_row
  from public.mcp_token
  where akses_hash = encode(extensions.digest(p_akses, 'sha256'), 'hex');
  if not found or v_row.kedaluwarsa < now() then
    return null;
  end if;
  return jsonb_build_object(
    'user_id', v_row.user_id,
    'refresh_token', v_row.refresh_token,
    'sumber', v_row.sumber
  );
end;
$$;

create or replace function public.simpan_refresh_mcp(p_akses text, p_refresh text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.mcp_token
  set refresh_token = p_refresh
  where akses_hash = encode(extensions.digest(p_akses, 'sha256'), 'hex');
end;
$$;

revoke all on function public.daftar_klien_mcp(text, text[]) from public;
revoke all on function public.simpan_kode_mcp(text, text, text, text) from public;
revoke all on function public.tukar_kode_mcp(text, text, text, text) from public;
revoke all on function public.segarkan_mcp(text) from public;
revoke all on function public.sesi_mcp(text) from public;
revoke all on function public.simpan_refresh_mcp(text, text) from public;

grant execute on function public.daftar_klien_mcp(text, text[]) to anon, authenticated;
grant execute on function public.simpan_kode_mcp(text, text, text, text) to authenticated;
grant execute on function public.tukar_kode_mcp(text, text, text, text) to anon, authenticated;
grant execute on function public.segarkan_mcp(text) to anon, authenticated;
grant execute on function public.sesi_mcp(text) to anon, authenticated;
grant execute on function public.simpan_refresh_mcp(text, text) to anon, authenticated;

grant execute on function public.ringkasan_beranda(date) to authenticated;
grant execute on function public.daftar_transaksi(int, date, uuid, text, text, text) to authenticated;
grant execute on function public.daftar_akun() to authenticated;
grant execute on function public.daftar_kategori(text) to authenticated;
grant execute on function public.catat_transaksi(bigint, text, uuid, uuid, date, text, text, text, text) to authenticated;
grant execute on function public.ubah_transaksi(uuid, bigint, text, uuid, uuid, date, text, text) to authenticated;
grant execute on function public.hapus_transaksi(uuid) to authenticated;
grant execute on function public.tambah_akun(text, text) to authenticated;
grant execute on function public.buku_saya() to authenticated;
