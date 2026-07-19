"use client";

import { useState, useRef } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { PlusIcon, PencilIcon, Trash2Icon, ChevronDown, ChevronRight, ImportIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

const EPISODE_SKELETONS_3 = Array.from({ length: 3 }, (_, i) => i);
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/error-state"
import { adminApi } from "@/lib/api/admin"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog"
import dynamic from "next/dynamic"
import { type Season } from "@/components/season-dialog"
import type { Episode } from "@/types"
import { EpisodeRow } from "@/app/admin/series/[id]/episode-row"
import { ImportSeasonDialog } from "@/app/admin/series/[id]/import-season-dialog"

const SeasonDialog = dynamic(() => import("@/components/season-dialog").then((m) => ({ default: m.SeasonDialog })), { ssr: false, loading: () => <Skeleton className="h-96 rounded-lg" /> })
const EpisodeDialog = dynamic(() => import("@/components/episode-dialog").then((m) => ({ default: m.EpisodeDialog })), { ssr: false, loading: () => <Skeleton className="h-96 rounded-lg" /> })

export default function AdminSeriesDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null)
  const [seasonDialogOpen, setSeasonDialogOpen] = useState(false)
  const [episodeDialogOpen, setEpisodeDialogOpen] = useState(false)
  const [editingSeason, setEditingSeason] = useState<Season | null>(null)
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null)
  const [activeSeasonId, setActiveSeasonId] = useState<number | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const episodesCache = useRef<Record<number, Episode[]>>({})

  const { data: series, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-series-detail", id],
    queryFn: async () => {
      const { data } = await adminApi.series.getById(Number(id));
      return data;
    },
  })

  const { data: seasons, refetch: refetchSeasons } = useQuery({
    queryKey: ["admin-series-seasons", id],
    queryFn: async () => {
      const { data } = await adminApi.seasons.list(Number(id));
      return data;
    },
  })

  const { data: episodes, isLoading: episodesLoading } = useQuery({
    queryKey: ["admin-season-episodes", expandedSeason],
    queryFn: async () => {
      if (!expandedSeason) return [];
      const { data } = await adminApi.episodes.list(Number(id), expandedSeason);
      episodesCache.current[expandedSeason] = data;
      return data;
    },
    enabled: !!expandedSeason,
  })

  const saveSeasonMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (editingSeason) {
        await adminApi.seasons.update(Number(id), editingSeason.id, data);
      } else {
        await adminApi.seasons.create(Number(id), data);
      }
    },
    onSuccess: () => {
      toast.success(editingSeason ? "Season updated." : "Season created.")
      setSeasonDialogOpen(false)
      setEditingSeason(null)
      refetchSeasons()
    },
    onError: () => toast.error("Unable to save season."),
  })

  const deleteSeasonMutation = useMutation({
    mutationFn: async (seasonId: number) => {
      await adminApi.seasons.delete(Number(id), seasonId);
    },
    onSuccess: () => {
      toast.success("Season deleted.")
      delete episodesCache.current[activeSeasonId ?? 0]
      refetchSeasons()
    },
    onError: () => toast.error("Unable to delete season."),
  })

  const saveEpisodeMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const seasonId = activeSeasonId!
      if (editingEpisode) {
        await adminApi.episodes.update(Number(id), seasonId, editingEpisode.id, data);
      } else {
        await adminApi.episodes.create(Number(id), seasonId, data);
      }
    },
    onSuccess: () => {
      toast.success(editingEpisode ? "Episode updated." : "Episode created.")
      setEpisodeDialogOpen(false)
      setEditingEpisode(null)
      if (expandedSeason) {
        delete episodesCache.current[expandedSeason]
        refetchEpisodes()
      }
    },
    onError: () => toast.error("Unable to save episode."),
  })

  const deleteEpisodeMutation = useMutation({
    mutationFn: async (episodeId: number) => {
      if (!expandedSeason) return
      await adminApi.episodes.delete(Number(id), expandedSeason, episodeId);
    },
    onSuccess: () => {
      toast.success("Episode deleted.")
      if (expandedSeason) {
        delete episodesCache.current[expandedSeason]
        refetchEpisodes()
      }
    },
    onError: () => toast.error("Unable to delete episode."),
  })

  const importSeasonMutation = useMutation({
    mutationFn: async ({ seasonNumber, tmdbId: manualTmdbId }: { seasonNumber: number; tmdbId?: number }) => {
      const tmdbId = manualTmdbId || series?.tmdbId;
      if (!tmdbId) throw new Error("TMDB ID is required. Import the series metadata first or enter a TMDB ID.");
      return adminApi.tmdb.importSeason(tmdbId, Number(id), seasonNumber);
    },
    onSuccess: (result) => {
      toast.success(`Imported ${result.imported} episodes from TMDB.${result.failed > 0 ? ` ${result.failed} failed.` : ""}`)
      setImportDialogOpen(false)
      refetchSeasons()
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to import season.");
    },
  })

  function refetchEpisodes() {
    if (expandedSeason) {
      adminApi.episodes.list(Number(id), expandedSeason).then(({ data }) => {
        episodesCache.current[expandedSeason] = data;
      });
    }
  }

  if (isLoading) return <Skeleton className="h-96 rounded-lg" />
  if (isError) return <ErrorState message="Unable to load series." onRetry={refetch} />

  const seasonList = seasons ?? []
  const episodeList = episodes ?? episodesCache.current[expandedSeason ?? 0] ?? []

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/series")}>
          <ChevronRight className="size-4 rotate-180" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{series?.title}</h1>
          <p className="text-muted-foreground mt-1">Manage seasons and episodes.</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Seasons</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
            <ImportIcon className="size-4" /> Import from TMDB
          </Button>
          <Button onClick={() => { setEditingSeason(null); setSeasonDialogOpen(true) }} size="sm">
            <PlusIcon className="size-4" /> Add Season
          </Button>
        </div>
      </div>

      {seasonList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No seasons yet. Add one or import from TMDB to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {seasonList.map((season) => (
            <Card key={season.id}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setExpandedSeason(expandedSeason === season.id ? null : season.id)}
                    className="flex items-center gap-2 text-left flex-1"
                  >
                    {expandedSeason === season.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    <span className="font-semibold">Season {season.seasonNumber}</span>
                    {season.title && (
                      <span className="text-muted-foreground font-normal">— {season.title}</span>
                    )}
                    <Badge variant="secondary" className="ml-2">
                      {season.episodeCount ?? 0} episodes
                    </Badge>
                  </button>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => {
                      setActiveSeasonId(season.id)
                      setEditingEpisode(null)
                      setEpisodeDialogOpen(true)
                    }}>
                      <PlusIcon className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => {
                      setEditingSeason(season)
                      setSeasonDialogOpen(true)
                    }}>
                      <PencilIcon className="size-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="size-7 text-rose-500"><Trash2Icon className="size-3.5" /></Button>} />
                      <AlertDialogContent>
                        <AlertDialogTitle>Delete Season {season.seasonNumber}</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete Season {season.seasonNumber} and all its episodes? This cannot be undone.
                        </AlertDialogDescription>
                        <AlertDialogClose render={<Button variant="outline">Cancel</Button>} />
                        <AlertDialogClose render={<Button variant="destructive" onClick={() => deleteSeasonMutation.mutate(season.id)}>Delete</Button>} />
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              {expandedSeason === season.id && (
                <CardContent className="px-4 pb-4 pt-0 border-t">
                  {episodesLoading ? (
                    <div className="space-y-2 py-4">
                      {EPISODE_SKELETONS_3.map((i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : episodeList.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No episodes yet.</p>
                  ) : (
                    <div className="divide-y">
                      {episodeList.map((ep) => (
                        <EpisodeRow
                          key={ep.id}
                          episode={ep}
                          onEdit={(episode) => { setActiveSeasonId(season.id); setEditingEpisode(episode); setEpisodeDialogOpen(true) }}
                          onDelete={(episodeId) => deleteEpisodeMutation.mutate(episodeId)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {seasonDialogOpen && (
        <SeasonDialog
          open={seasonDialogOpen}
          onOpenChange={setSeasonDialogOpen}
          editingSeason={editingSeason}
          onSave={(data) => saveSeasonMutation.mutate(data)}
          saving={saveSeasonMutation.isPending}
        />
      )}

      {episodeDialogOpen && (
        <EpisodeDialog
          open={episodeDialogOpen}
          onOpenChange={setEpisodeDialogOpen}
          editingEpisode={editingEpisode}
          onSave={(data) => saveEpisodeMutation.mutate(data)}
          saving={saveEpisodeMutation.isPending}
          seriesSlug={series?.slug}
        />
      )}

      <ImportSeasonDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        seriesTmdbId={series?.tmdbId}
        onImport={(seasonNumber, tmdbId) => importSeasonMutation.mutate({ seasonNumber, tmdbId })}
        isPending={importSeasonMutation.isPending}
      />

    </div>
  )
}
