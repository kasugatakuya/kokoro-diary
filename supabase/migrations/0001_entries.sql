-- 心 日記: 日記エントリ
-- Supabase ダッシュボードの SQL Editor に貼り付けて実行してください。

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  title text not null default '',
  body text not null default '',
  mood smallint check (mood between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists entries_user_date_idx on public.entries (user_id, entry_date desc, created_at desc);

-- updated_at を自動更新
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists entries_set_updated_at on public.entries;
create trigger entries_set_updated_at
  before update on public.entries
  for each row execute function public.set_updated_at();

-- 行レベルセキュリティ: 自分の行しか読めない・書けない（公開機能は存在しない）
alter table public.entries enable row level security;

drop policy if exists "entries: select own" on public.entries;
create policy "entries: select own" on public.entries
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "entries: insert own" on public.entries;
create policy "entries: insert own" on public.entries
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "entries: update own" on public.entries;
create policy "entries: update own" on public.entries
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "entries: delete own" on public.entries;
create policy "entries: delete own" on public.entries
  for delete to authenticated using (auth.uid() = user_id);
