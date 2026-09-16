import { RequestForm } from "@/app/(main)/requests/request-form"
import { ClipboardList } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Request a Movie",
}

export default function RequestsPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted mx-auto">
          <ClipboardList className="size-7 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Request a Movie</h1>
        <p className="text-muted-foreground mt-2">
          Can&apos;t find what you&apos;re looking for? Submit a request and we&apos;ll consider adding it.
        </p>
      </div>
      <RequestForm />
    </div>
  )
}
