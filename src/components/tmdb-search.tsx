"use client";

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { SearchIcon, Loader2Icon, StarIcon, FilmIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w185"

export interface TmdbImportResult {
  title: string
  overview: string
  releaseDate: string
  originalLanguage: string
  tmdbId: number
  durationSeconds: number | null
  thumbnailUrl: string | null
  backdropUrl: string | null
  trailerUrl: string | null
}

interface TmdbSearchResult {
  id: number
  title: string
  release_date: string
  vote_average: number
  overview: string
  poster_path: string | null
  original_language: string
}

function generateSlug(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

interface TmdbSearchProps {
  onImport: (data: TmdbImportResult) => void
}

export function TmdbSearch({ onImport }: TmdbSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<TmdbSearchResult[]>([])

  const { mutate: search, isPending: searching } = useMutation({
    mutationFn: async (q: string) => {
      const res = await fetch("/api/admin/tmdb/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      })
      if (!res.ok) throw new Error("Search failed")
      const data = await res.json()
      return data.results as TmdbSearchResult[]
    },
    onSuccess: (data) => setResults(data),
  })

  const { mutate: importMovie, isPending: importing } = useMutation({
    mutationFn: async (movie: TmdbSearchResult) => {
      const slug = generateSlug(movie.title)
      const releaseDate = movie.release_date
      const res = await fetch("/api/admin/tmdb/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId: movie.id, slug, releaseDate: releaseDate || undefined }),
      })
      if (!res.ok) throw new Error("Import failed")
      return res.json() as Promise<TmdbImportResult>
    },
    onSuccess: (data) => {
      onImport(data)
    },
  })

  function handleSearch() {
    if (!query.trim()) return
    search(query.trim())
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Search TMDB..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleSearch()
            }
          }}
        />
        <Button onClick={handleSearch} disabled={searching || !query.trim()}>
          {searching ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SearchIcon className="size-4" />
          )}
          Search
        </Button>
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
          {results.map((movie) => (
            <div
              key={movie.id}
              className="flex gap-3 rounded-lg border bg-card p-3"
            >
              {movie.poster_path ? (
                <img
                  src={`${TMDB_IMAGE_BASE}${movie.poster_path}`}
                  alt={movie.title}
                  className="size-16 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex size-16 shrink-0 items-center justify-center rounded bg-muted">
                  <FilmIcon className="size-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{movie.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {movie.release_date?.slice(0, 4) || "N/A"}
                    <span className="mx-1">·</span>
                    <StarIcon className="mr-0.5 inline size-3 text-yellow-500" />
                    {movie.vote_average?.toFixed(1) || "?"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={importing}
                  onClick={() => importMovie(movie)}
                  className="w-full"
                >
                  {importing ? (
                    <Loader2Icon className="size-3 animate-spin" />
                  ) : (
                    "Import"
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!searching && query && results.length === 0 && (
        <p className="text-sm text-muted-foreground">No results found.</p>
      )}
    </div>
  )
}
