"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { requestsApi } from "@/lib/api/requests";
import { logger } from "@/lib/logger";
import type { RequestFormData } from "@/lib/schemas";

export function useRequestForm(reset: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RequestFormData) => {
      await requestsApi.create({
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        externalLink: data.externalLink?.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Request submitted. We'll review it shortly.");
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      reset();
    },
    onError: (error) => {
      logger.error("request-form", "Submit failed", error);
      toast.error(error.message);
    },
  });
}
