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
