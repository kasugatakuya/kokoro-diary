import { addDays, todayKey } from "./dates";
import type { Category, Entry } from "./types";

/** 今日（または昨日）から遡って連続で書いている日数 */
export function currentStreak(entries: Pick<Entry, "entryDate">[], today = todayKey()): number {
  const days = new Set(entries.map((e) => e.entryDate));
  let cursor = days.has(today) ? today : addDays(today, -1);
  if (!days.has(cursor)) return 0;
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function charCount(text: string): number {
  return Array.from(text.replace(/\s+/g, "")).length;
}

export function filterEntries(
  entries: Entry[],
  { query, month, categoryId, favorite }: { query?: string; month?: string | null; categoryId?: string | null; favorite?: boolean },
): Entry[] {
  const q = query?.trim().toLowerCase();
  return entries.filter((e) => {
    if (favorite && !e.favorite) return false;
    if (categoryId && e.categoryId !== categoryId) return false;
    if (month && !e.entryDate.startsWith(month)) return false;
    if (q && !`${e.title}\n${e.body}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

/** 新しい日付・新しい作成順に並べる */
export function sortEntries(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => (a.entryDate === b.entryDate ? b.createdAt.localeCompare(a.createdAt) : b.entryDate.localeCompare(a.entryDate)));
}

/** 一覧の 1 ページあたりの件数。これを超えるとページ送りになる */
export const PAGE_SIZE = 10;

export interface Page<T> {
  items: T[];
  /** 1 始まり。範囲外を渡しても 1..pageCount に丸める */
  page: number;
  pageCount: number;
  total: number;
  /** 表示している範囲（1 始まり、両端を含む）。items が空なら 0 */
  from: number;
  to: number;
}

/** 配列を pageSize 件ずつに区切り、page 番目（1 始まり）を返す */
export function paginate<T>(items: T[], page: number, pageSize = PAGE_SIZE): Page<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (current - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return { items: slice, page: current, pageCount, total, from: slice.length ? start + 1 : 0, to: start + slice.length };
}

/**
 * ページ番号ボタンに並べる番号。多いときは先頭・末尾・現在の前後だけ残し、間は null（…）にする
 * 例: 10 ページ中 5 ページ目 → [1, null, 4, 5, 6, null, 10]
 */
export function pageNumbers(page: number, pageCount: number, around = 1): (number | null)[] {
  if (pageCount <= 2 * around + 5) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const keep = new Set<number>([1, pageCount]);
  for (let i = page - around; i <= page + around; i++) if (i >= 1 && i <= pageCount) keep.add(i);
  const out: (number | null)[] = [];
  let prev = 0;
  for (const n of [...keep].sort((a, b) => a - b)) {
    if (n - prev === 2) out.push(prev + 1);
    else if (n - prev > 2) out.push(null);
    out.push(n);
    prev = n;
  }
  return out;
}

export function groupByMonth(entries: Entry[]): { month: string; entries: Entry[] }[] {
  const map = new Map<string, Entry[]>();
  for (const e of sortEntries(entries)) {
    const m = e.entryDate.slice(0, 7);
    if (!map.has(m)) map.set(m, []);
    map.get(m)!.push(e);
  }
  return Array.from(map, ([month, list]) => ({ month, entries: list }));
}

export function toMarkdown(entries: Entry[], categories: Category[] = []): string {
  const names = new Map(categories.map((c) => [c.id, c.name]));
  return sortEntries(entries)
    .map((e) => {
      const title = e.title ? ` ${e.title}` : "";
      const cat = e.categoryId && names.get(e.categoryId) ? ` [${names.get(e.categoryId)}]` : "";
      const star = e.favorite ? " ★" : "";
      return `## ${e.entryDate}${title}${cat}${star}\n\n${e.body}\n`;
    })
    .join("\n");
}
