import type { Metadata } from "next";
import { DiaryHome } from "@/components/DiaryHome";

export const metadata: Metadata = { title: "心 日記", alternates: { canonical: "/" } };

export default function Page() {
  return <DiaryHome />;
}
