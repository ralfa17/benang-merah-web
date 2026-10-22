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
