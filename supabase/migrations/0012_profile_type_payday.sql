-- Uangku — Karyawan vs Pengusaha profile split.
-- Karyawan: fixed monthly income on a set payday. Pengusaha/freelancer:
-- irregular income, so Free Cash Flow is computed from a rolling average of
-- recorded income transactions instead of a static monthly number.

alter table public.profiles
  add column if not exists profile_type text,
  add column if not exists payday_day smallint;

alter table public.profiles
  add constraint profiles_profile_type_check
  check (profile_type is null or profile_type in ('karyawan', 'pengusaha'));

alter table public.profiles
  add constraint profiles_payday_day_check
  check (payday_day is null or (payday_day between 1 and 31));
