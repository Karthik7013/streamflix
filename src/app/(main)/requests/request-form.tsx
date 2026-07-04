"use client";

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2Icon } from "lucide-react"
import { requestFormSchema, type RequestFormData } from "@/lib/schemas"
import { api } from "@/lib/api/client"

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
      await api("/api/requests", {
        method: "POST",
        body: JSON.stringify({
          title: data.title.trim(),
          description: data.description?.trim() || undefined,
          externalLink: data.externalLink?.trim() || undefined,
        }),
      })
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
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Briefly describe the movie..."
          className="min-h-[100px]"
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
