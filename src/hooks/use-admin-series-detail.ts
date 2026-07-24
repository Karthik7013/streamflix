"use client";

import { useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { adminApi } from "@/lib/api/admin"
import { logger } from "@/lib/logger"
import { type Season } from "@/components/season-dialog"
import type { Episode } from "@/types"

export function useAdminSeriesDetail() {
  const { id } = useParams<{ id: string }>()
  const seriesId = Number(id)

  const [expandedSeason, setExpandedSeason] = useState<number | null>(null)
  const [seasonDialogOpen, setSeasonDialogOpen] = useState(false)
  const [episodeDialogOpen, setEpisodeDialogOpen] = useState(false)
  const [editingSeason, setEditingSeason] = useState<Season | null>(null)
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null)
  const [activeSeasonId, setActiveSeasonId] = useState<number | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [episodesCache, setEpisodesCache] = useState<Record<number, Episode[]>>({})

  const { data: series, isLoading: loading, isError, refetch: retry } = useQuery({
    queryKey: ["admin-series-detail", id],
    queryFn: async () => {
      const { data } = await adminApi.series.getById(seriesId);
      return data;
    },
  })

  const { data: seasons, isLoading: seasonsLoading, isError: seasonsError, refetch: retrySeasons } = useQuery({
    queryKey: ["admin-series-seasons", id],
    queryFn: async () => {
      const { data } = await adminApi.seasons.list(seriesId);
      return data;
    },
  })

  const { data: episodes, isLoading: episodesLoading, isError: episodesError, refetch: retryEpisodes } = useQuery({
    queryKey: ["admin-season-episodes", expandedSeason],
    queryFn: async () => {
      if (!expandedSeason) return [];
      const { data } = await adminApi.episodes.list(seriesId, expandedSeason);
      setEpisodesCache((prev) => ({ ...prev, [expandedSeason]: data }));
      return data;
    },
    enabled: !!expandedSeason,
  })

  const saveSeasonMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (editingSeason) {
        await adminApi.seasons.update(seriesId, editingSeason.id, data);
      } else {
        await adminApi.seasons.create(seriesId, data);
      }
    },
    onSuccess: () => {
      toast.success(editingSeason ? "Season updated." : "Season created.")
      setSeasonDialogOpen(false)
      setEditingSeason(null)
      retrySeasons()
    },
    onError: () => toast.error("Unable to save season."),
  })

  const deleteSeasonMutation = useMutation({
    mutationFn: async (seasonId: number) => {
      await adminApi.seasons.delete(seriesId, seasonId);
    },
    onSuccess: () => {
      toast.success("Season deleted.")
      if (expandedSeason) {
        setEpisodesCache((prev) => {
          const next = { ...prev };
          delete next[expandedSeason];
          return next;
        });
      }
      retrySeasons()
    },
    onError: () => toast.error("Unable to delete season."),
  })

  const saveEpisodeMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const seasonId = activeSeasonId!
      if (editingEpisode) {
        await adminApi.episodes.update(seriesId, seasonId, editingEpisode.id, data);
      } else {
        await adminApi.episodes.create(seriesId, seasonId, data);
      }
    },
    onSuccess: () => {
      toast.success(editingEpisode ? "Episode updated." : "Episode created.")
      setEpisodeDialogOpen(false)
      setEditingEpisode(null)
      if (expandedSeason) {
        setEpisodesCache((prev) => {
          const next = { ...prev };
          delete next[expandedSeason];
          return next;
        });
        refetchEpisodes()
      }
    },
    onError: () => toast.error("Unable to save episode."),
  })

  const deleteEpisodeMutation = useMutation({
    mutationFn: async (episodeId: number) => {
      if (!expandedSeason) return
      await adminApi.episodes.delete(seriesId, expandedSeason, episodeId);
    },
    onSuccess: () => {
      toast.success("Episode deleted.")
      if (expandedSeason) {
        setEpisodesCache((prev) => {
          const next = { ...prev };
          delete next[expandedSeason];
          return next;
        });
        refetchEpisodes()
      }
    },
    onError: () => toast.error("Unable to delete episode."),
  })

  const importSeasonMutation = useMutation({
    mutationFn: async ({ seasonNumber, tmdbId: manualTmdbId }: { seasonNumber: number; tmdbId?: number }) => {
      const tmdbId = manualTmdbId || series?.tmdbId;
      if (!tmdbId) throw new Error("TMDB ID is required. Import the series metadata first or enter a TMDB ID.");
      return adminApi.tmdb.importSeason(tmdbId, seriesId, seasonNumber);
    },
    onSuccess: (result) => {
      toast.success(`Imported ${result.imported} episodes from TMDB.${result.failed > 0 ? ` ${result.failed} failed.` : ""}`)
      setImportDialogOpen(false)
      retrySeasons()
    },
    onError: (err) => {
      logger.error("series-detail", "Failed to import season", err);
      toast.error(err instanceof Error ? err.message : "Failed to import season.");
    },
  })

  const refetchEpisodes = useCallback(() => {
    if (expandedSeason) {
      adminApi.episodes.list(seriesId, expandedSeason).then(({ data }) => {
        setEpisodesCache((prev) => ({ ...prev, [expandedSeason]: data }));
      });
    }
  }, [seriesId, expandedSeason]);

  const seasonList = seasons ?? []
  const episodeList = episodes ?? episodesCache[expandedSeason ?? 0] ?? []

  return {
    series, loading, isError, retry,
    seasons: seasonList,
    seasonsLoading,
    seasonsError,
    episodes: episodeList,
    episodesLoading,
    episodesError,
    expandedSeason, setExpandedSeason,
    seasonDialogOpen, setSeasonDialogOpen,
    episodeDialogOpen, setEpisodeDialogOpen,
    editingSeason, setEditingSeason,
    editingEpisode, setEditingEpisode,
    activeSeasonId, setActiveSeasonId,
    importDialogOpen, setImportDialogOpen,
    saveSeasonMutation,
    deleteSeasonMutation,
    saveEpisodeMutation,
    deleteEpisodeMutation,
    importSeasonMutation,
    retrySeasons,
    retryEpisodes,
  }
}
