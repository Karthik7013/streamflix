"use client";

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { PlusIcon, PencilIcon, Trash2Icon, ChevronDown, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { formatDuration } from "@/lib/format"
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
import { type Season } from "@/components/season-dialog"
import { type Episode } from "@/components/episode-dialog"

const SeasonDialog = dynamic(() => import("@/components/season-dialog").then((m) => ({ default: m.SeasonDialog })), { ssr: false })
const EpisodeDialog = dynamic(() => import("@/components/episode-dialog").then((m) => ({ default: m.EpisodeDialog })), { ssr: false })

export default function AdminSeriesDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null)
  const [seasonDialogOpen, setSeasonDialogOpen] = useState(false)
  const [episodeDialogOpen, setEpisodeDialogOpen] = useState(false)
  const [editingSeason, setEditingSeason] = useState<Season | null>(null)
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null)
  const [activeSeasonId, setActiveSeasonId] = useState<number | null>(null)

  const { data: series, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-series-detail", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/series/${id}`)
      if (!res.ok) throw new Error("Failed to fetch series")
      return res.json()
    },
  })

  const { data: seasonsData, refetch: refetchSeasons } = useQuery({
    queryKey: ["admin-series-seasons", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/series/${id}/seasons`)
      if (!res.ok) throw new Error("Failed to fetch seasons")
      return res.json() as Promise<{ seasons: Season[] }>
    },
  })

  const { data: episodesData, refetch: refetchEpisodes } = useQuery({
    queryKey: ["admin-season-episodes", expandedSeason],
    queryFn: async () => {
      if (!expandedSeason) return { episodes: [] }
      const res = await fetch(`/api/admin/series/${id}/seasons/${expandedSeason}/episodes`)
      if (!res.ok) throw new Error("Failed to fetch episodes")
      return res.json() as Promise<{ episodes: Episode[] }>
    },
    enabled: !!expandedSeason,
  })

  const saveSeasonMutation = useMutation({
    mutationFn: async (data: { seasonNumber?: number; title?: string }) => {
      if (editingSeason) {
        const res = await fetch(`/api/admin/series/${id}/seasons/${editingSeason.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error("Update failed")
      } else {
        const res = await fetch(`/api/admin/series/${id}/seasons`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error("Create failed")
      }
    },
    onSuccess: () => {
      toast.success(editingSeason ? "Season updated" : "Season created")
      setSeasonDialogOpen(false)
      setEditingSeason(null)
      refetchSeasons()
    },
    onError: () => toast.error("Failed to save season"),
  })

  const deleteSeasonMutation = useMutation({
    mutationFn: async (seasonId: number) => {
      const res = await fetch(`/api/admin/series/${id}/seasons/${seasonId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
    },
    onSuccess: () => {
      toast.success("Season deleted")
      refetchSeasons()
    },
    onError: () => toast.error("Failed to delete season"),
  })

  const saveEpisodeMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (data: any) => {
      const seasonId = activeSeasonId!
      if (editingEpisode) {
        const res = await fetch(`/api/admin/series/${id}/seasons/${seasonId}/episodes/${editingEpisode.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error("Update failed")
      } else {
        const res = await fetch(`/api/admin/series/${id}/seasons/${seasonId}/episodes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error("Create failed")
      }
    },
    onSuccess: () => {
      toast.success(editingEpisode ? "Episode updated" : "Episode created")
      setEpisodeDialogOpen(false)
      setEditingEpisode(null)
      if (expandedSeason) refetchEpisodes()
    },
    onError: () => toast.error("Failed to save episode"),
  })

  const deleteEpisodeMutation = useMutation({
    mutationFn: async (episodeId: number) => {
      if (!expandedSeason) return
      const res = await fetch(`/api/admin/series/${id}/seasons/${expandedSeason}/episodes/${episodeId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
    },
    onSuccess: () => {
      toast.success("Episode deleted")
      if (expandedSeason) refetchEpisodes()
    },
    onError: () => toast.error("Failed to delete episode"),
  })

  if (isLoading) return <Skeleton className="h-96 rounded-lg" />
  if (isError) return <ErrorState message="Failed to load series." onRetry={refetch} />

  const seasons = seasonsData?.seasons || []
  const episodes = episodesData?.episodes || []

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
        <Button onClick={() => { setEditingSeason(null); setSeasonDialogOpen(true) }} size="sm">
          <PlusIcon className="size-4" /> Add Season
        </Button>
      </div>

      {seasons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No seasons yet. Add one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {seasons.map((season) => (
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
                  {episodes.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No episodes yet.</p>
                  ) : (
                    <div className="divide-y">
                      {episodes.map((ep) => (
                        <div key={ep.id} className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-sm font-medium text-muted-foreground w-8 shrink-0">
                              {ep.episodeNumber}.
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{ep.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {ep.durationSeconds ? formatDuration(ep.durationSeconds) : "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="size-7" onClick={() => {
                              setActiveSeasonId(season.id)
                              setEditingEpisode(ep)
                              setEpisodeDialogOpen(true)
                            }}>
                              <PencilIcon className="size-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="size-7 text-rose-500"><Trash2Icon className="size-3.5" /></Button>} />
                              <AlertDialogContent>
                                <AlertDialogTitle>Delete Episode</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {'\u201C'}{ep.title}{'\u201D'}? This cannot be undone.
                                </AlertDialogDescription>
                                <AlertDialogClose render={<Button variant="outline">Cancel</Button>} />
                                <AlertDialogClose render={<Button variant="destructive" onClick={() => deleteEpisodeMutation.mutate(ep.id)}>Delete</Button>} />
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <SeasonDialog
        open={seasonDialogOpen}
        onOpenChange={setSeasonDialogOpen}
        editingSeason={editingSeason}
        onSave={(data) => saveSeasonMutation.mutate(data)}
        saving={saveSeasonMutation.isPending}
      />

      <EpisodeDialog
        open={episodeDialogOpen}
        onOpenChange={setEpisodeDialogOpen}
        editingEpisode={editingEpisode}
        onSave={(data) => saveEpisodeMutation.mutate(data)}
        saving={saveEpisodeMutation.isPending}
      />
    </div>
  )
}


