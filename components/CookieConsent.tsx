"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cookchase_cookie_consent");
      if (!stored) {
        const t = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {
      /* private mode */
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem("cookchase_cookie_consent", "accepted");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  const decline = () => {
    try {
      localStorage.setItem("cookchase_cookie_consent", "declined");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-4 rounded-xl border border-ink-200 bg-white p-5 shadow-lift sm:flex-row sm:items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Cookie className="h-5 w-5" />
        </div>
        <div className="flex-1 text-sm text-ink-600">
          <p className="font-semibold text-ink-900">We value your privacy</p>
          <p className="mt-1">
            We use cookies to improve your experience and to show personalized ads.
            See our{" "}
            <Link href="/privacy" className="text-brand-600 underline underline-offset-2">
              Privacy Policy
            </Link>{" "}
            for details.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={decline}
            className="rounded-md border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-100"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
