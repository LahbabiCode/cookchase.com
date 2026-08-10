import type { Metadata } from "next";
import { getAllTools, getCommentsByToolMap, getViewsByToolMap } from "@/lib/queries";
import AccountClient from "./AccountClient";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    title: "My Account",
    description:
      "Manage your CookChase account: synced favorites, password, signed-in devices and account deletion.",
    robots: { index: false, follow: false }
  };
}

export default function AccountPage() {
  const tools = getAllTools();
  const commentCounts = getCommentsByToolMap();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          Your account
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
          My Account
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-500">
          Favorites, security and the devices you&apos;re signed in on — all in one place.
        </p>
      </div>
      <AccountClient
        tools={tools}
        commentCounts={commentCounts}
        viewsCounts={getViewsByToolMap()}
      />
    </div>
  );
}
