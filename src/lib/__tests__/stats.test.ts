import { describe, expect, it } from "vitest";
import { PAGE_SIZE, charCount, currentStreak, filterEntries, groupByMonth, pageNumbers, paginate, sortEntries, toMarkdown } from "../stats";
import type { Entry } from "../types";

const mk = (id: string, entryDate: string, body = "", mood: Entry["mood"] = null, createdAt = `${entryDate}T09:00:00Z`): Entry => ({
  id,
  entryDate,
  title: "",
  body,
  mood,
  categoryId: null,
  favorite: false,
  createdAt,
  updatedAt: createdAt,
});

describe("stats", () => {
  it("counts the current streak including yesterday fallback", () => {
    const entries = [mk("a", "2026-10-16"), mk("b", "2026-10-15"), mk("c", "2026-10-14"), mk("d", "2026-10-10")];
    expect(currentStreak(entries, "2026-10-16")).toBe(3);
    expect(currentStreak(entries, "2026-10-17")).toBe(3);
    expect(currentStreak(entries, "2026-10-18")).toBe(0);
    expect(currentStreak([], "2026-10-16")).toBe(0);
  });
  it("counts characters without whitespace", () => {
    expect(charCount("今日は いい天気\nでした")).toBe(10);
    expect(charCount("🙂 🙂")).toBe(2);
  });
  it("filters by query and month", () => {
    const entries = [mk("a", "2026-10-16", "散歩した"), mk("b", "2026-09-01", "雨が降った")];
    expect(filterEntries(entries, { query: "散歩" }).map((e) => e.id)).toEqual(["a"]);
    expect(filterEntries(entries, { query: "海" })).toHaveLength(0);
    const withCat = [{ ...entries[0], categoryId: "poem" }, entries[1]];
    expect(filterEntries(withCat, { categoryId: "poem" }).map((e) => e.id)).toEqual(["a"]);
    expect(filterEntries(withCat, { categoryId: null }).map((e) => e.id)).toEqual(["a", "b"]);
    expect(filterEntries(entries, { month: "2026-09" }).map((e) => e.id)).toEqual(["b"]);
  });
  it("filters favorites", () => {
    const entries = [{ ...mk("a", "2026-10-16"), favorite: true }, mk("b", "2026-10-15")];
    expect(filterEntries(entries, { favorite: true }).map((e) => e.id)).toEqual(["a"]);
    expect(filterEntries(entries, { favorite: false }).map((e) => e.id)).toEqual(["a", "b"]);
    expect(filterEntries(entries, {}).map((e) => e.id)).toEqual(["a", "b"]);
  });
  it("sorts newest first and groups by month", () => {
    const entries = [mk("old", "2026-09-30"), mk("a", "2026-10-16", "", null, "2026-10-16T08:00:00Z"), mk("b", "2026-10-16", "", null, "2026-10-16T10:00:00Z")];
    expect(sortEntries(entries).map((e) => e.id)).toEqual(["b", "a", "old"]);
    expect(groupByMonth(entries).map((g) => [g.month, g.entries.length])).toEqual([
      ["2026-10", 2],
      ["2026-09", 1],
    ]);
  });
  it("exports markdown", () => {
    const md = toMarkdown([{ ...mk("a", "2026-10-16", "本文"), title: "題" }]);
    expect(md).toBe("## 2026-10-16 題\n\n本文\n");
    const cats = [{ id: "poem", name: "詩", color: "lavender" as const, sortOrder: 0, createdAt: "" }];
    expect(toMarkdown([{ ...mk("a", "2026-10-16", "本文"), categoryId: "poem" }], cats)).toBe("## 2026-10-16 [詩]\n\n本文\n");
    expect(toMarkdown([{ ...mk("a", "2026-10-16", "本文"), favorite: true }])).toBe("## 2026-10-16 ★\n\n本文\n");
  });
  it("paginates 10 per page and clamps the page number", () => {
    const items = Array.from({ length: 11 }, (_, i) => i + 1);
    expect(PAGE_SIZE).toBe(10);
    const p1 = paginate(items, 1);
    expect(p1.items).toHaveLength(10);
    expect([p1.page, p1.pageCount, p1.total, p1.from, p1.to]).toEqual([1, 2, 11, 1, 10]);
    const p2 = paginate(items, 2);
    expect(p2.items).toEqual([11]);
    expect([p2.from, p2.to]).toEqual([11, 11]);
    expect(paginate(items, 99).page).toBe(2);
    expect(paginate(items, 0).page).toBe(1);
    // 10 件ちょうどなら 1 ページに収まる
    expect(paginate(items.slice(0, 10), 1).pageCount).toBe(1);
    const empty = paginate([], 1);
    expect([empty.pageCount, empty.from, empty.to]).toEqual([1, 0, 0]);
  });
  it("lists page numbers with gaps", () => {
    expect(pageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageNumbers(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
    expect(pageNumbers(1, 10)).toEqual([1, 2, null, 10]);
    expect(pageNumbers(3, 10)).toEqual([1, 2, 3, 4, null, 10]);
    expect(pageNumbers(10, 10)).toEqual([1, null, 9, 10]);
  });
});
