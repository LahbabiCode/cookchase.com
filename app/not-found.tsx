import Link from "next/link";
import { ChefHat, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <ChefHat className="h-8 w-8" />
      </span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-brand-600">
        404 error
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink-900">
        This page has been over-cooked
      </h1>
      <p className="mt-3 max-w-md text-ink-500">
        The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get
        you back to the kitchen.
      </p>
      <Link
        href="/tools"
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        Browse cooking tools <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
