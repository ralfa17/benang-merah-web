-- Jalankan di Supabase SQL Editor.
-- 1) Role dual Shima
-- 2) RLS: anon tidak bisa baca data pasien; hanya akun terautentikasi yang punya baris di profiles.

update public.profiles
set role = 'admin_terapis'
where lower(coalesce(full_name, '')) like '%shima%'
   or lower(coalesce(full_name, '')) like '%salsabil%';

alter table public.profiles enable row level security;
alter table public.appointments enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "appointments_team_all" on public.appointments;
create policy "appointments_team_all"
on public.appointments
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'it_admin', 'admin_terapis', 'psikolog', 'terapis')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'it_admin', 'admin_terapis', 'psikolog', 'terapis')
  )
);

-- Di dashboard Supabase: Authentication > Providers > Email
-- matikan "Allow new users to sign up".

-- ============================================================
-- 3) TABEL LAPORAN SHIFT ADMIN (ADMIN SHIFT HANDOVER & ATTENDANCE)
-- ============================================================
create table if not exists public.admin_shift_reports (
  id uuid default gen_random_uuid() primary key,
  admin_name text not null,
  admin_role text default 'admin',
  shift_date date not null,
  shift_label text,
  check_in_time text,
  check_out_time text,
  operational_summary text,
  patients_handled text[] default '{}',
  payment_summary jsonb default '{}',
  total_patients integer default 0,
  total_transactions integer default 0,
  created_at timestamptz default now()
);

alter table public.admin_shift_reports enable row level security;

-- Policy Select: Seluruh role internal tim dapat melihat rekap/laporan shift
drop policy if exists "shift_reports_select_team" on public.admin_shift_reports;
create policy "shift_reports_select_team"
on public.admin_shift_reports
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'it_admin', 'admin_terapis', 'psikolog', 'terapis')
  )
);

-- Policy Insert & Update: Hanya Admin & Master yang dapat mengisi dan memperbarui laporan shift
drop policy if exists "shift_reports_modify_admin" on public.admin_shift_reports;
create policy "shift_reports_modify_admin"
on public.admin_shift_reports
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'it_admin', 'admin_terapis')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'it_admin', 'admin_terapis')
  )
);

