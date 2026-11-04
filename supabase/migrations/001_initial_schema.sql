create extension if not exists pgcrypto;
create table if not exists public.profiles(id uuid primary key references auth.users(id) on delete cascade,full_name text not null default '',role text not null default 'petugas' check(role in('admin','petugas')),created_at timestamptz not null default now());
create table if not exists public.books(id uuid primary key default gen_random_uuid(),title text not null,author text not null default '',category text not null default 'Lainnya',description text not null default '',stock integer not null default 0 check(stock>=0),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.profiles enable row level security; alter table public.books enable row level security;
create policy "Public read books" on public.books for select to anon,authenticated using(true);
create policy "Staff insert books" on public.books for insert to authenticated with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('admin','petugas')));
create policy "Staff update books" on public.books for update to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('admin','petugas'))) with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('admin','petugas')));
create policy "Staff delete books" on public.books for delete to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('admin','petugas')));
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin'); $$;
grant execute on function public.is_admin() to authenticated;
create policy "Read own profile or admin reads all" on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,full_name,role) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','Petugas'),'petugas'); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users; create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
-- Setelah akun admin pertama dibuat di Authentication > Users, jalankan:
-- update public.profiles set role='admin' where id='UUID_AKUN_ADMIN';
