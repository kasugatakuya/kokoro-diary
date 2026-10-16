import type { Metadata } from "next";
import { Settings } from "@/components/Settings";

export const metadata: Metadata = { title: "設定" };

export default function Page() {
  return <Settings />;
}
