const pad = (n: number) => String(n).padStart(2, "0");

/** ローカル日付を YYYY-MM-DD に */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey(now = new Date()): string {
  return toDateKey(now);
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isValidDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const d = parseDateKey(key);
  return toDateKey(d) === key;
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function formatDateJa(key: string, withWeekday = true): string {
  const d = parseDateKey(key);
  const base = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  return withWeekday ? `${base}（${WEEKDAYS[d.getDay()]}）` : base;
}

export function formatMonthJa(year: number, month: number): string {
  return `${year}年${month}月`;
}

export function monthKey(key: string): string {
  return key.slice(0, 7);
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function relativeDays(key: string, today = todayKey()): string {
  const diff = Math.round((parseDateKey(key).getTime() - parseDateKey(today).getTime()) / 86_400_000);
  if (diff === 0) return "今日";
  if (diff === -1) return "昨日";
  if (diff === 1) return "明日";
  if (diff < 0 && diff > -7) return `${-diff}日前`;
  return "";
}

export interface CalendarCell {
  key: string | null;
  day: number | null;
  inMonth: boolean;
}

/** 日曜始まりの 6 週分のグリッド */
export function monthGrid(year: number, month: number): CalendarCell[][] {
  const first = new Date(year, month - 1, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];
  for (let i = 0; i < startOffset; i++) cells.push({ key: null, day: null, inMonth: false });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ key: `${year}-${pad(month)}-${pad(d)}`, day: d, inMonth: true });
  }
  while (cells.length % 7 !== 0) cells.push({ key: null, day: null, inMonth: false });
  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}
