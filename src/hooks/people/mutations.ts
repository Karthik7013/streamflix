"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client/admin";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/query-keys";

export function usePersonMutations() {
  const queryClient = useQueryClient();

  const invalidatePeople = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.adminPeople() });
    queryClient.invalidateQueries({ queryKey: queryKeys.people });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (body: {
      name: string;
      tmdbId?: number | null;
      profileUrl?: string | null;
      biography?: string | null;
      birthday?: string | null;
      deathday?: string | null;
      gender?: number | null;
      knownForDepartment?: string | null;
      popularity?: number | null;
    }) => adminApi.people.create(body),
    onSuccess: () => toast.success("Person created."),
    onError: (err) => { logger.error("people", "Failed to create person", err); toast.error("Unable to create person."); },
    onSettled: invalidatePeople,
  });

  const editMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: {
      name?: string;
      tmdbId?: number | null;
      profileUrl?: string | null;
      biography?: string | null;
      birthday?: string | null;
      deathday?: string | null;
      gender?: number | null;
      knownForDepartment?: string | null;
      popularity?: number | null;
    } }) => adminApi.people.update(id, body),
    onSuccess: () => toast.success("Person updated."),
    onError: (err) => { logger.error("people", "Failed to update person", err); toast.error("Unable to update person."); },
    onSettled: invalidatePeople,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.people.delete(id),
    onSuccess: () => toast.success("Person deleted."),
    onError: (err) => { logger.error("people", "Failed to delete person", err); toast.error("Unable to delete person."); },
    onSettled: invalidatePeople,
  });

  return { createMutation, editMutation, deleteMutation, invalidatePeople };
}

export function useMovieCreditMutations() {
  const queryClient = useQueryClient();

  const invalidateCredits = useCallback((movieId: number | null) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.movieCredits(movieId ?? 0) });
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.movieCredits.delete(id),
    onSuccess: (_result, id) => {
      toast.success("Credit removed.");
    },
    onError: (err) => { logger.error("movie-credits", "Failed to delete credit", err); toast.error("Unable to remove credit."); },
    onSettled: (_result, _error, id) => {
      // Invalidate all movie credit queries since we don't know which movie
      queryClient.invalidateQueries({ queryKey: queryKeys.movieCredits(0) });
    },
  });

  return { deleteMutation, invalidateCredits };
}

export function useBackfillCast() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (body: { movieId?: number; limit?: number }) => adminApi.backfill.cast(body),
    onSuccess: () => toast.success("Cast backfill complete."),
    onError: (err) => { logger.error("backfill", "Failed to backfill cast", err); toast.error("Backfill failed."); },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminPeople() });
      queryClient.invalidateQueries({ queryKey: queryKeys.movieCredits(0) });
    },
  });

  return { backfillMutation: mutation };
}
