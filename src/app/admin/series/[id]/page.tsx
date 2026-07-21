"use client";

import { useRouter } from "next/navigation"
import { PlusIcon, PencilIcon, Trash2Icon, ChevronDown, ChevronRight, ImportIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

const EPISODE_SKELETONS_3 = Array.from({ length: 3 }, (_, i) => i);
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/error-state"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog"
import dynamic from "next/dynamic"
import { EpisodeRow } from "@/app/admin/series/[id]/episode-row"
import { ImportSeasonDialog } from "@/app/admin/series/[id]/import-season-dialog"
import { useAdminSeriesDetail } from "@/hooks/use-admin-series-detail"

const SeasonDialog = dynamic(() => import("@/components/season-dialog").then((m) => ({ default: m.SeasonDialog })), { ssr: false, loading: () => <Skeleton className="h-96 rounded-lg" /> })
const EpisodeDialog = dynamic(() => import("@/components/episode-dialog").then((m) => ({ default: m.EpisodeDialog })), { ssr: false, loading: () => <Skeleton className="h-96 rounded-lg" /> })

export default function AdminSeriesDetailPage() {
  const router = useRouter()
  const {
    series, isLoading, isError, refetch,
    seasons: seasonList,
    episodes: episodeList,
    episodesLoading,
    expandedSeason, setExpandedSeason,
    seasonDialogOpen, setSeasonDialogOpen,
    episodeDialogOpen, setEpisodeDialogOpen,
    editingSeason, setEditingSeason,
    editingEpisode, setEditingEpisode,
    setActiveSeasonId,
    importDialogOpen, setImportDialogOpen,
    saveSeasonMutation,
    deleteSeasonMutation,
    saveEpisodeMutation,
    deleteEpisodeMutation,
    importSeasonMutation,
  } = useAdminSeriesDetail()

  if (isLoading) return <Skeleton className="h-96 rounded-lg" />
  if (isError) return <ErrorState message="Unable to load series." onRetry={refetch} />

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
