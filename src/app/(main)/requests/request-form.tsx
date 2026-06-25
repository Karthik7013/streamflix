"use client";

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2Icon } from "lucide-react"
import { requestFormSchema, type RequestFormData } from "@/lib/schemas"

export function RequestForm() {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: { title: "", description: "", externalLink: "" },
  })

  const { mutate: handleSubmitRequest, isPending: submitting } = useMutation({
    mutationFn: async (data: RequestFormData) => {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title.trim(),
          description: data.description?.trim() || undefined,
          externalLink: data.externalLink?.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to submit")
      }
    },
    onSuccess: () => {
      toast.success("Request submitted! We'll review it and get back to you.")
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] })
      reset()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return (
    <form onSubmit={handleSubmit((data) => handleSubmitRequest(data))} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Movie Title <span className="text-destructive">*</span>
        </label>
        <Input
          id="title"
          {...register("title")}
          placeholder="e.g. The Shawshank Redemption"
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Description <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
        <textarea
          id="description"
          {...register("description")}
          placeholder="Briefly describe the movie..."
          className="flex h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 resize-y min-h-[100px]"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="link" className="text-sm font-medium">
          External Link <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
        <Input
          id="link"
          type="url"
          {...register("externalLink")}
          placeholder="https://www.imdb.com/..."
        />
        {errors.externalLink && (
          <p className="text-xs text-destructive">{errors.externalLink.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting && <Loader2Icon className="size-4 animate-spin" />}
        Submit Request
      </Button>
    </form>
  )
}
