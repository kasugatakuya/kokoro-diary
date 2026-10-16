import type { Metadata } from "next";
import { Login } from "@/components/Login";

export const metadata: Metadata = { title: "ログイン" };

export default function Page() {
  return <Login />;
}
