-- こころ日記: お気に入り（星マーク）
-- 0001, 0002 を実行済みのプロジェクトで、このファイルを SQL Editor に貼り付けて実行してください。

alter table public.entries
  add column if not exists favorite boolean not null default false;

-- お気に入りだけを絞り込むときに使う
create index if not exists entries_favorite_idx on public.entries (user_id, favorite) where favorite;
