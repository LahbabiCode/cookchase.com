import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false }
};

export default function AdminLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  if (!isAdminAuthed()) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-ink-50">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">{children}</div>
      </div>
    </div>
  );
}
