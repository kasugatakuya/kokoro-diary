export type Mood = 1 | 2 | 3 | 4 | 5;

export const CATEGORY_COLORS = ["rose", "amber", "leaf", "sky", "lavender", "slate", "peach", "mint"] as const;
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export interface Category {
  id: string;
  name: string;
  color: CategoryColor;
  sortOrder: number;
  createdAt: string;
}

export interface CategoryInput {
  name: string;
  color: CategoryColor;
  sortOrder?: number;
}

export interface Entry {
  id: string;
  /** YYYY-MM-DD（端末のローカル日付） */
  entryDate: string;
  title: string;
  body: string;
  /** 以前の気分機能の名残。現在の UI では使わず、常に null で保存する（DB の列は残している） */
  mood: Mood | null;
  categoryId: string | null;
  /** お気に入り（星マーク）。書く画面では触らず、星ボタンだけで切り替える */
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EntryInput {
  entryDate: string;
  title: string;
  body: string;
  mood: Mood | null;
  categoryId: string | null;
}

/** 最初に提案するカテゴリ */
export const SUGGESTED_CATEGORIES: { name: string; color: CategoryColor }[] = [
  { name: "思い", color: "rose" },
  { name: "詩", color: "lavender" },
  { name: "歌詞", color: "amber" },
];

export function isCategoryColor(v: unknown): v is CategoryColor {
  return typeof v === "string" && (CATEGORY_COLORS as readonly string[]).includes(v);
}
