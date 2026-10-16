-- 心 日記: 自分で決めるカテゴリ（例: 思い / 詩 / 歌詞）
-- 0001 を実行済みのプロジェクトで、このファイルを SQL Editor に貼り付けて実行してください。

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default 'rose',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists categories_user_idx on public.categories (user_id, sort_order, created_at);

alter table public.categories enable row level security;

drop policy if exists "categories: select own" on public.categories;
create policy "categories: select own" on public.categories
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "categories: insert own" on public.categories;
create policy "categories: insert own" on public.categories
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "categories: update own" on public.categories;
create policy "categories: update own" on public.categories
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "categories: delete own" on public.categories;
create policy "categories: delete own" on public.categories
  for delete to authenticated using (auth.uid() = user_id);

-- 日記にカテゴリを紐づける。カテゴリを削除しても日記は残り、「カテゴリなし」になる
alter table public.entries
  add column if not exists category_id uuid references public.categories (id) on delete set null;

create index if not exists entries_category_idx on public.entries (user_id, category_id);
