import type { Metadata } from "next";
import { ResetPassword } from "@/components/ResetPassword";

export const metadata: Metadata = { title: "パスワードの再設定", robots: { index: false, follow: false } };

export default function Page() {
  return <ResetPassword />;
}
