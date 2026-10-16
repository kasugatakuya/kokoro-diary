import type { SupabaseClient } from "@supabase/supabase-js";
import { isCategoryColor, type Category, type CategoryInput, type Entry, type EntryInput, type Mood } from "./types";

export interface EntryRepo {
  listAll(): Promise<Entry[]>;
  create(input: EntryInput): Promise<Entry>;
  update(id: string, input: EntryInput): Promise<Entry>;
  remove(id: string): Promise<void>;
  listCategories(): Promise<Category[]>;
  createCategory(input: CategoryInput): Promise<Category>;
  updateCategory(id: string, input: CategoryInput): Promise<Category>;
  removeCategory(id: string): Promise<void>;
}

/* ---------- ローカルモード（localStorage） ---------- */

const LOCAL_KEY = "kokoro-diary:entries";
const LOCAL_CATEGORIES_KEY = "kokoro-diary:categories";

function readJson<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export class LocalRepo implements EntryRepo {
  private read(): Entry[] {
    return readJson<Entry>(LOCAL_KEY).map((e) => ({ ...e, categoryId: e.categoryId ?? null }));
  }
  private write(entries: Entry[]) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
  }
  private readCategories(): Category[] {
    return readJson<Category>(LOCAL_CATEGORIES_KEY);
  }
  private writeCategories(categories: Category[]) {
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(categories));
  }
  async listAll() {
    return this.read();
  }
  async create(input: EntryInput) {
    const now = new Date().toISOString();
    const entry: Entry = { id: crypto.randomUUID(), ...input, createdAt: now, updatedAt: now };
    this.write([entry, ...this.read()]);
    return entry;
  }
  async update(id: string, input: EntryInput) {
    const entries = this.read();
    const idx = entries.findIndex((e) => e.id === id);
    if (idx < 0) throw new Error("日記が見つかりません。");
    const updated: Entry = { ...entries[idx], ...input, updatedAt: new Date().toISOString() };
    entries[idx] = updated;
    this.write(entries);
    return updated;
  }
  async remove(id: string) {
    this.write(this.read().filter((e) => e.id !== id));
  }
  async listCategories() {
    return this.readCategories().sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
  }
  async createCategory(input: CategoryInput) {
    const list = this.readCategories();
    const category: Category = {
      id: crypto.randomUUID(),
      name: input.name,
      color: input.color,
      sortOrder: input.sortOrder ?? list.length,
      createdAt: new Date().toISOString(),
    };
    this.writeCategories([...list, category]);
    return category;
  }
  async updateCategory(id: string, input: CategoryInput) {
    const list = this.readCategories();
    const idx = list.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error("カテゴリが見つかりません。");
    list[idx] = { ...list[idx], name: input.name, color: input.color, sortOrder: input.sortOrder ?? list[idx].sortOrder };
    this.writeCategories(list);
    return list[idx];
  }
  async removeCategory(id: string) {
    this.writeCategories(this.readCategories().filter((c) => c.id !== id));
    this.write(this.read().map((e) => (e.categoryId === id ? { ...e, categoryId: null } : e)));
  }
}

/* ---------- Supabase ---------- */

interface Row {
  id: string;
  entry_date: string;
  title: string;
  body: string;
  mood: number | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CategoryRow {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
}

function fromRow(r: Row): Entry {
  return {
    id: r.id,
    entryDate: r.entry_date,
    title: r.title ?? "",
    body: r.body ?? "",
    mood: (r.mood as Mood | null) ?? null,
    categoryId: r.category_id ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toRow(input: EntryInput) {
  return { entry_date: input.entryDate, title: input.title, body: input.body, mood: input.mood, category_id: input.categoryId };
}

function fromCategoryRow(r: CategoryRow): Category {
  return { id: r.id, name: r.name, color: isCategoryColor(r.color) ? r.color : "rose", sortOrder: r.sort_order, createdAt: r.created_at };
}

const COLUMNS = "id, entry_date, title, body, mood, category_id, created_at, updated_at";
const CATEGORY_COLUMNS = "id, name, color, sort_order, created_at";

export class SupabaseRepo implements EntryRepo {
  constructor(
    private client: SupabaseClient,
    private userId: string,
  ) {}
  async listAll() {
    const { data, error } = await this.client
      .from("entries")
      .select(COLUMNS)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as Row[]).map(fromRow);
  }
  async create(input: EntryInput) {
    const { data, error } = await this.client
      .from("entries")
      .insert({ ...toRow(input), user_id: this.userId })
      .select(COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return fromRow(data as Row);
  }
  async update(id: string, input: EntryInput) {
    const { data, error } = await this.client.from("entries").update(toRow(input)).eq("id", id).select(COLUMNS).single();
    if (error) throw new Error(error.message);
    return fromRow(data as Row);
  }
  async remove(id: string) {
    const { error } = await this.client.from("entries").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
  async listCategories() {
    const { data, error } = await this.client
      .from("categories")
      .select(CATEGORY_COLUMNS)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as CategoryRow[]).map(fromCategoryRow);
  }
  async createCategory(input: CategoryInput) {
    const { data, error } = await this.client
      .from("categories")
      .insert({ name: input.name, color: input.color, sort_order: input.sortOrder ?? 0, user_id: this.userId })
      .select(CATEGORY_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return fromCategoryRow(data as CategoryRow);
  }
  async updateCategory(id: string, input: CategoryInput) {
    const patch: Record<string, unknown> = { name: input.name, color: input.color };
    if (input.sortOrder != null) patch.sort_order = input.sortOrder;
    const { data, error } = await this.client.from("categories").update(patch).eq("id", id).select(CATEGORY_COLUMNS).single();
    if (error) throw new Error(error.message);
    return fromCategoryRow(data as CategoryRow);
  }
  async removeCategory(id: string) {
    const { error } = await this.client.from("categories").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}
