import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false }
};

export default function AdminLoginPage() {
  if (isAdminAuthed()) redirect("/admin");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold text-white">
            CC
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink-900">
            CookChase Admin
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Sign in to manage your cooking tools & content
          </p>
        </div>
        <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-lift">
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-xs text-ink-400">
          Default credentials: admin / admin1234 — change them after first login.
        </p>
      </div>
    </div>
  );
}
