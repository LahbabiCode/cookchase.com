import type { Metadata } from "next";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    title: "Forgot Password",
    description:
      "Request a password reset link for your CookChase account.",
    robots: { index: false, follow: false }
  };
}

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          Account recovery
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Reset your password
        </h1>
        <p className="mx-auto mt-3 max-w-md text-ink-500">
          Enter the email on your account and we&apos;ll send you a secure,
          single-use link to choose a new password.
        </p>
      </div>
      <div className="mt-8 rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
        <ForgotPasswordClient />
      </div>
    </div>
  );
}
