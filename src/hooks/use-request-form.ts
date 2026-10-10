"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { requestsApi } from "@/lib/api/requests";
import { logger } from "@/lib/logger";
import type { RequestFormData } from "@/lib/schemas";
import { queryKeys } from "@/lib/query-keys";

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
      queryClient.invalidateQueries({ queryKey: queryKeys.adminRequests });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
      reset();
    },
    onError: (error) => {
      logger.error("request-form", "Submit failed", error);
      toast.error(error.message);
    },
  });
}
