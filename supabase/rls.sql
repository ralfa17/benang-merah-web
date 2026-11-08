-- ============================================================
-- BENANG MERAH - SUPABASE RLS & ROLE ASSIGNMENT SCRIPT
-- Jalankan query ini di Supabase SQL Editor untuk mengatur
-- hak akses (Row Level Security) & kepastian role anggota tim.
-- ============================================================

-- ------------------------------------------------------------
-- 1) UPDATE ROLE PROFIL ANGGOTA TIM (STRICT ROLE ASSIGNMENT)
-- ------------------------------------------------------------

-- A. Set role Shima Adinda Salsabil murni sebagai 'terapis'
update public.profiles
set role = 'terapis'
where lower(coalesce(full_name, '')) like '%shima%'
   or lower(coalesce(full_name, '')) like '%salsabil%';

-- B. Pastikan role Fauzan Hamdani tetap 'admin'
update public.profiles
set role = 'admin'
where lower(coalesce(full_name, '')) like '%fauzan%'
   or lower(coalesce(full_name, '')) like '%hamdani%';

-- C. Pastikan role Ridho Al Fattaah tetap 'master'
update public.profiles
set role = 'master'
where lower(coalesce(full_name, '')) like '%ridho%'
   or lower(coalesce(full_name, '')) like '%fattaah%';

-- ------------------------------------------------------------
-- 2) AKTIFKAN ROW LEVEL SECURITY (RLS) PADA TABEL UTAMA
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.appointments enable row level security;

-- Policy Profiles: Pengguna terautentikasi dapat membaca data profiles tim
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

-- Policy Appointments: Seluruh anggota tim internal resmi dapat mengakses data appointments
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
      and p.role in ('admin', 'master', 'it_admin', 'psikolog', 'terapis')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'master', 'it_admin', 'psikolog', 'terapis')
  )
);

-- ------------------------------------------------------------
-- 3) TABEL LAPORAN SHIFT ADMIN (ADMIN SHIFT HANDOVER & ATTENDANCE)
-- ------------------------------------------------------------
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
      and p.role in ('admin', 'master', 'it_admin', 'psikolog', 'terapis')
  )
);

-- Policy Insert & Update: Khusus Role Admin & Master yang dapat mengisi dan memperbarui laporan shift
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
      and p.role in ('admin', 'master', 'it_admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'master', 'it_admin')
  )
);
