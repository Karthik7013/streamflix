import { RequireAdmin } from "@/components/admin/require-admin";
import { AdminLayout } from "@/components/layout/admin-layout";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAdmin>
      <AdminLayout>{children}</AdminLayout>
    </RequireAdmin>
  );
}