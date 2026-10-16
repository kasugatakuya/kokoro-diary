import type { Metadata } from "next";
import { Login } from "@/components/Login";

export const metadata: Metadata = { title: "ログイン", alternates: { canonical: "/login" } };

export default function Page() {
  return <Login />;
}
