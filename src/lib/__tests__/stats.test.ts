import { describe, expect, it } from "vitest";
import { charCount, currentStreak, filterEntries, groupByMonth, sortEntries, toMarkdown } from "../stats";
import type { Entry } from "../types";

const mk = (id: string, entryDate: string, body = "", mood: Entry["mood"] = null, createdAt = `${entryDate}T09:00:00Z`): Entry => ({
  id,
  entryDate,
  title: "",
  body,
  mood,
  categoryId: null,
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
  });
});
