import type { Metadata } from "next";
import { DiaryHome } from "@/components/DiaryHome";

export const metadata: Metadata = { title: "心 日記" };

export default function Page() {
  return <DiaryHome />;
}
