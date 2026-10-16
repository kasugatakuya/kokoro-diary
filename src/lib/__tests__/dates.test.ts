import { describe, expect, it } from "vitest";
import { addDays, formatDateJa, isValidDateKey, monthGrid, relativeDays, shiftMonth, toDateKey } from "../dates";

describe("dates", () => {
  it("formats local date keys", () => {
    expect(toDateKey(new Date(2026, 9, 16))).toBe("2026-10-16");
    expect(formatDateJa("2026-10-16")).toBe("2026年10月16日（金）");
    expect(formatDateJa("2026-10-16", false)).toBe("2026年10月16日");
  });
  it("validates keys", () => {
    expect(isValidDateKey("2026-02-29")).toBe(false);
    expect(isValidDateKey("2024-02-29")).toBe(true);
    expect(isValidDateKey("2026-1-1")).toBe(false);
  });
  it("adds days across month boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
  it("builds a month grid starting on Sunday", () => {
    const grid = monthGrid(2026, 10);
    expect(grid[0][4]?.day).toBe(1); // 2026-10-01 is Thursday
    expect(grid.flat().filter((c) => c.inMonth)).toHaveLength(31);
    expect(grid.every((w) => w.length === 7)).toBe(true);
  });
  it("shifts months", () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });
  it("relative labels", () => {
    expect(relativeDays("2026-10-16", "2026-10-16")).toBe("今日");
    expect(relativeDays("2026-10-15", "2026-10-16")).toBe("昨日");
    expect(relativeDays("2026-10-10", "2026-10-16")).toBe("6日前");
    expect(relativeDays("2026-09-10", "2026-10-16")).toBe("");
  });
});
