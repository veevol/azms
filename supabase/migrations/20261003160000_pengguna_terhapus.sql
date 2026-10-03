alter table public.transaksi drop constraint if exists transaksi_dibuat_oleh_fkey;

alter table public.transaksi
  add constraint transaksi_dibuat_oleh_fkey
  foreign key (dibuat_oleh) references auth.users (id) on delete cascade;
