import { AppLayout } from "@/components/app-layout";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  )
}
