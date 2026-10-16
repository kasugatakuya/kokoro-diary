"use client";

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LocalRepo, SupabaseRepo, type EntryRepo } from "@/lib/repo";
import { SUPABASE_CONFIGURED, getSupabase } from "@/lib/supabase";
import type { Category, CategoryInput, Entry, EntryInput } from "@/lib/types";

export type Mode = "supabase" | "local";

export interface AppUser {
  id: string;
  email: string | null;
}

export interface AppState {
  mode: Mode;
  /** 認証状態の判定が終わったか */
  ready: boolean;
  user: AppUser | null;
  entries: Entry[];
  entriesLoaded: boolean;
  categories: Category[];
  error: string | null;
  refresh: () => Promise<void>;
  createEntry: (input: EntryInput) => Promise<Entry>;
  updateEntry: (id: string, input: EntryInput) => Promise<Entry>;
  deleteEntry: (id: string) => Promise<void>;
  createCategory: (input: CategoryInput) => Promise<Category>;
  updateCategory: (id: string, input: CategoryInput) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  clearLocalData: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

const LOCAL_USER: AppUser = { id: "local", email: null };

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "メールアドレスまたはパスワードが違います。";
  if (m.includes("email not confirmed")) return "メールアドレスの確認が済んでいません。届いたメールのリンクを開いてください。";
  if (m.includes("user already registered")) return "このメールアドレスはすでに登録されています。";
  if (m.includes("password should be at least")) return "パスワードは 6 文字以上にしてください。";
  if (m.includes("rate limit") || m.includes("too many")) return "リクエストが多すぎます。少し待ってからお試しください。";
  if (m.includes("invalid email") || m.includes("unable to validate email")) return "メールアドレスの形式が正しくありません。";
  if (m.includes("same password") || m.includes("different from the old")) return "以前と同じパスワードは使えません。";
  return message;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const mode: Mode = SUPABASE_CONFIGURED ? "supabase" : "local";
  const supabase = useMemo<SupabaseClient | null>(() => (mode === "supabase" ? getSupabase() : null), [mode]);

  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(mode === "local");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entriesLoaded, setEntriesLoaded] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  const user: AppUser | null = useMemo(() => {
    if (mode === "local") return LOCAL_USER;
    if (!session) return null;
    return { id: session.user.id, email: session.user.email ?? null };
  }, [mode, session]);

  const repo = useMemo<EntryRepo | null>(() => {
    if (mode === "local") return new LocalRepo();
    if (supabase && user) return new SupabaseRepo(supabase, user.id);
    return null;
  }, [mode, supabase, user]);

  // 認証状態の監視
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const refresh = useCallback(async () => {
    if (!repo) return;
    try {
      const [list, cats] = await Promise.all([repo.listAll(), repo.listCategories()]);
      setEntries(list);
      setCategories(cats);
      setEntriesLoaded(true);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [repo]);

  // ログイン状態が変わったら読み直す
  useEffect(() => {
    let active = true;
    if (!repo) {
      // ログアウト時は非同期で空にする
      const id = setTimeout(() => {
        setEntries([]);
        setCategories([]);
        setEntriesLoaded(false);
      }, 0);
      return () => clearTimeout(id);
    }
    Promise.all([repo.listAll(), repo.listCategories()])
      .then(([list, cats]) => {
        if (!active) return;
        setEntries(list);
        setCategories(cats);
        setEntriesLoaded(true);
        setError(null);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      active = false;
    };
  }, [repo]);

  const createEntry = useCallback(async (input: EntryInput) => {
    if (!repo) throw new Error("ログインが必要です。");
    const entry = await repo.create(input);
    setEntries((prev) => [entry, ...prev]);
    return entry;
  }, [repo]);

  const updateEntry = useCallback(async (id: string, input: EntryInput) => {
    if (!repo) throw new Error("ログインが必要です。");
    const entry = await repo.update(id, input);
    setEntries((prev) => prev.map((e) => (e.id === id ? entry : e)));
    return entry;
  }, [repo]);

  const deleteEntry = useCallback(async (id: string) => {
    if (!repo) throw new Error("ログインが必要です。");
    await repo.remove(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, [repo]);

  const createCategory = useCallback(
    async (input: CategoryInput) => {
      if (!repo) throw new Error("ログインが必要です。");
      const name = input.name.trim();
      if (!name) throw new Error("カテゴリ名を入力してください。");
      if (categories.some((c) => c.name === name)) throw new Error("同じ名前のカテゴリがあります。");
      const category = await repo.createCategory({ ...input, name, sortOrder: input.sortOrder ?? categories.length });
      setCategories((prev) => [...prev, category]);
      return category;
    },
    [repo, categories],
  );

  const updateCategory = useCallback(
    async (id: string, input: CategoryInput) => {
      if (!repo) throw new Error("ログインが必要です。");
      const name = input.name.trim();
      if (!name) throw new Error("カテゴリ名を入力してください。");
      if (categories.some((c) => c.id !== id && c.name === name)) throw new Error("同じ名前のカテゴリがあります。");
      const category = await repo.updateCategory(id, { ...input, name });
      setCategories((prev) => prev.map((c) => (c.id === id ? category : c)));
      return category;
    },
    [repo, categories],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      if (!repo) throw new Error("ログインが必要です。");
      await repo.removeCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setEntries((prev) => prev.map((e) => (e.categoryId === id ? { ...e, categoryId: null } : e)));
    },
    [repo],
  );

  const requireSupabase = () => {
    if (!supabase) throw new Error("ローカルモードではアカウント機能は使えません。");
    return supabase;
  };

  const signIn = useCallback(async (email: string, password: string) => {
    const { error: err } = await requireSupabase().auth.signInWithPassword({ email, password });
    if (err) throw new Error(translateAuthError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error: err } = await requireSupabase().auth.signUp({ email, password });
    if (err) throw new Error(translateAuthError(err.message));
    return { needsConfirmation: !data.session };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const signOut = useCallback(async () => {
    await requireSupabase().auth.signOut();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const sendPasswordReset = useCallback(async (email: string) => {
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error: err } = await requireSupabase().auth.resetPasswordForEmail(email, { redirectTo });
    if (err) throw new Error(translateAuthError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const updatePassword = useCallback(async (password: string) => {
    const { error: err } = await requireSupabase().auth.updateUser({ password });
    if (err) throw new Error(translateAuthError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const clearLocalData = useCallback(async () => {
    if (mode !== "local") return;
    localStorage.removeItem("kokoro-diary:entries");
    localStorage.removeItem("kokoro-diary:categories");
    setEntries([]);
    setCategories([]);
  }, [mode]);

  const value: AppState = {
    mode,
    ready,
    user,
    entries,
    entriesLoaded,
    categories,
    error,
    refresh,
    createEntry,
    updateEntry,
    deleteEntry,
    createCategory,
    updateCategory,
    deleteCategory,
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    updatePassword,
    clearLocalData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
