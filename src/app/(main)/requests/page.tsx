import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { RequestForm } from "./request-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Request a Movie",
}

export default async function RequestsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role === "admin") {
    redirect("/home")
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Request a Movie</h1>
        <p className="text-muted-foreground mt-2">
          Can't find what you're looking for? Submit a request and we'll consider adding it.
        </p>
      </div>
      <RequestForm />
    </div>
  )
}
