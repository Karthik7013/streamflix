import { AppLayout } from "@/components/app-layout";
import { FetchAuth } from "@/components/fetch-auth";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FetchAuth>
      <AppLayout>
        {children}
      </AppLayout>
    </FetchAuth>
  )
}
