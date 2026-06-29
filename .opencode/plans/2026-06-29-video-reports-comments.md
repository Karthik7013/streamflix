# Video Issue Reports & Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a video issue reporting system and linear comments section to the movie detail page, with an admin dashboard for managing reports.

**Architecture:** Two new DB tables (`video_reports`, `movie_comments`) with corresponding service modules, API routes, and React components. Admin gets a new Reports page following the existing admin CRUD pattern. Cache scopes added for both entities.

**Tech Stack:** Drizzle ORM / PostgreSQL, Next.js App Router, TanStack React Query, Tailwind CSS v4

---

### Task 1: Database Schema & Migration

**Files:**
- Modify: `src/db/schema.ts`
- Create: `src/db/migrations/` (auto-generated via `drizzle-kit generate`)

- [ ] **Step 1: Add `video_reports` table to `src/db/schema.ts`**

Add this after the existing `movieRequests` table definition (around line 182):

```typescript
export const videoReports = pgTable("video_reports", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("idx_video_reports_movie_id").on(t.movieId),
  index("idx_video_reports_status").on(t.status),
]);
```

- [ ] **Step 2: Add `movie_comments` table to `src/db/schema.ts`**

Add after `videoReports`:

```typescript
export const movieComments = pgTable("movie_comments", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("idx_movie_comments_movie_id").on(t.movieId),
]);
```

- [ ] **Step 3: Add exported types after the table definitions**

```typescript
export type VideoReport = InferSelectModel<typeof videoReports>;
export type VideoReportInsert = InferInsertModel<typeof videoReports>;
export type MovieComment = InferSelectModel<typeof movieComments>;
export type MovieCommentInsert = InferInsertModel<typeof movieComments>;
```

- [ ] **Step 4: Generate and run migration**

Run:
```bash
npm run db:generate
npm run db:migrate
```

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/db/migrations/
git commit -m "feat: add video_reports and movie_comments tables"
```

---

### Task 2: Cache Scopes

**Files:**
- Modify: `src/lib/cache.ts`

- [ ] **Step 1: Add `reports` and `comments` to cache invalidation keys**

In `src/lib/cache.ts`, find the `INVALIDATION_KEYS` object (around line 52) and add:

```typescript
  reports: ["reports:*"],
  comments: ["comments:*"],
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/cache.ts
git commit -m "feat: add reports and comments cache scopes"
```

---

### Task 3: Reports Service

**Files:**
- Create: `src/services/reports.ts`

- [ ] **Step 1: Create `src/services/reports.ts`**

```typescript
import { db } from "@/db";
import { videoReports, user, movies } from "@/db/schema";
import { eq, and, asc, desc, count, ilike } from "drizzle-orm";
import { invalidateCache } from "@/lib/cache";

const reportSortableColumns: Record<string, any> = {
  createdAt: videoReports.createdAt,
  updatedAt: videoReports.updatedAt,
  status: videoReports.status,
};

const reportFilterableColumns: Record<string, any> = {
  description: videoReports.description,
};

export async function createReport(movieId: number, userId: string, description: string) {
  const [report] = await db
    .insert(videoReports)
    .values({ movieId, userId, description })
    .returning();
  invalidateCache("reports");
  return report;
}

export async function listAdminReports(args: {
  page: number;
  limit: number;
  status?: string | null;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  columnFilters?: Record<string, string>;
}) {
  const { page, limit, status, search, sortBy, sortDir, columnFilters = {} } = args;
  const offset = (page - 1) * limit;
  const conditions: any[] = [];

  if (status && (status === "pending" || status === "resolved")) {
    conditions.push(eq(videoReports.status, status));
  }
  if (search) conditions.push(ilike(videoReports.description, `%${search}%`));

  for (const [col, val] of Object.entries(columnFilters)) {
    const columnRef = reportFilterableColumns[col];
    if (columnRef && val) {
      conditions.push(ilike(columnRef, `%${val}%`));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const sortColumn = reportSortableColumns[sortBy || ""] || videoReports.createdAt;
  const orderBy = sortDir === "asc" ? asc(sortColumn) : desc(sortColumn);

  const [totalResult, rows] = await Promise.all([
    db.select({ total: count() }).from(videoReports).where(whereClause),
    db
      .select({
        id: videoReports.id,
        movieId: videoReports.movieId,
        userId: videoReports.userId,
        description: videoReports.description,
        status: videoReports.status,
        createdAt: videoReports.createdAt,
        updatedAt: videoReports.updatedAt,
        movieTitle: movies.title,
        movieSlug: movies.slug,
        userName: user.name,
        userEmail: user.email,
      })
      .from(videoReports)
      .innerJoin(movies, eq(videoReports.movieId, movies.id))
      .innerJoin(user, eq(videoReports.userId, user.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
  ]);

  const total = totalResult[0].total;
  const reports = rows.map((r) => ({
    id: r.id,
    movieId: r.movieId,
    userId: r.userId,
    description: r.description,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    movie: { title: r.movieTitle, slug: r.movieSlug },
    user: { name: r.userName, email: r.userEmail },
  }));

  return { reports, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updateReportStatus(reportId: number, status: "pending" | "resolved") {
  const [updated] = await db
    .update(videoReports)
    .set({ status, updatedAt: new Date() })
    .where(eq(videoReports.id, reportId))
    .returning();
  if (!updated) return { error: "Report Not Found" };
  invalidateCache("reports");
  return { report: updated };
}

export async function deleteReport(reportId: number) {
  const [deleted] = await db
    .delete(videoReports)
    .where(eq(videoReports.id, reportId))
    .returning();
  if (!deleted) return false;
  invalidateCache("reports");
  return true;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/reports.ts
git commit -m "feat: add reports service with CRUD and admin list"
```

---

### Task 4: Comments Service

**Files:**
- Create: `src/services/comments.ts`

- [ ] **Step 1: Create `src/services/comments.ts`**

```typescript
import { db } from "@/db";
import { movieComments, user, movies } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { invalidateCache } from "@/lib/cache";

export async function getCommentsByMovieSlug(
  slug: string,
  args: { page: number; limit: number }
) {
  const { page, limit } = args;
  const offset = (page - 1) * limit;

  const [movieResult] = await db
    .select({ id: movies.id })
    .from(movies)
    .where(eq(movies.slug, slug))
    .limit(1);
  if (!movieResult) return { comments: [], total: 0, page, hasMore: false };

  const movieId = movieResult.id;

  const [totalResult, rows] = await Promise.all([
    db.select({ total: count() }).from(movieComments).where(eq(movieComments.movieId, movieId)),
    db
      .select({
        id: movieComments.id,
        content: movieComments.content,
        createdAt: movieComments.createdAt,
        userId: user.id,
        userName: user.name,
        userImage: user.image,
      })
      .from(movieComments)
      .innerJoin(user, eq(movieComments.userId, user.id))
      .where(eq(movieComments.movieId, movieId))
      .orderBy(desc(movieComments.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  const total = totalResult[0].total;
  const comments = rows.map((r) => ({
    id: r.id,
    content: r.content,
    createdAt: r.createdAt,
    user: { id: r.userId, name: r.userName, image: r.userImage },
  }));

  return { comments, total, page, hasMore: page * limit < total };
}

export async function createComment(movieSlug: string, userId: string, content: string) {
  const [movieResult] = await db
    .select({ id: movies.id })
    .from(movies)
    .where(eq(movies.slug, movieSlug))
    .limit(1);
  if (!movieResult) return { error: "Movie Not Found" };

  const [comment] = await db
    .insert(movieComments)
    .values({ movieId: movieResult.id, userId, content })
    .returning();
  invalidateCache("comments");
  return { comment };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/comments.ts
git commit -m "feat: add comments service with list and create"
```

---

### Task 5: User-Facing API Routes

**Files:**
- Create: `src/app/api/movies/[slug]/report/route.ts`
- Create: `src/app/api/movies/[slug]/comments/route.ts`

- [ ] **Step 1: Create `src/app/api/movies/[slug]/report/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { getMovieBySlug } from "@/services/movies";
import { createReport } from "@/services/reports";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const body = await request.json();
    const { description } = body;

    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const movie = await getMovieBySlug(slug);
    if (!movie) {
      return NextResponse.json({ error: "Movie Not Found" }, { status: 404 });
    }

    const report = await createReport(movie.id, session.user.id, description.trim());
    return NextResponse.json({ report }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create `src/app/api/movies/[slug]/comments/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { getCommentsByMovieSlug, createComment } from "@/services/comments";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "20")));

  try {
    const result = await getCommentsByMovieSlug(slug, { page, limit });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, max-age=60, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const result = await createComment(slug, session.user.id, content.trim());
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/movies/*/report/ src/app/api/movies/*/comments/
git commit -m "feat: add report and comments API routes"
```

---

### Task 6: Admin Reports API Routes

**Files:**
- Create: `src/app/api/admin/reports/route.ts`
- Create: `src/app/api/admin/reports/[id]/route.ts`

- [ ] **Step 1: Create `src/app/api/admin/reports/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { listAdminReports } from "@/services/reports";
import { parsePagination, extractColumnFilters } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const { page, limit, search, sortBy, sortDir } = parsePagination(searchParams);
  const status = searchParams.get("status");
  const columnFilters = extractColumnFilters(searchParams, ["status"]);

  try {
    const result = await listAdminReports({ page, limit, status, search, sortBy, sortDir, columnFilters });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, max-age=60, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create `src/app/api/admin/reports/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { updateReportStatus, deleteReport } from "@/services/reports";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const reportId = parseInt(id);
  if (isNaN(reportId)) {
    return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { status } = body;
    if (!status || !["pending", "resolved"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const result = await updateReportStatus(reportId, status);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json(result.report);
  } catch {
    return NextResponse.json({ error: "Update Failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const reportId = parseInt(id);
  if (isNaN(reportId)) {
    return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
  }

  try {
    const deleted = await deleteReport(reportId);
    if (!deleted) {
      return NextResponse.json({ error: "Report Not Found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete Failed" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/reports/
git commit -m "feat: add admin reports API routes"
```

---

### Task 7: Report Section Component

**Files:**
- Create: `src/components/report-section.tsx`

- [ ] **Step 1: Create `src/components/report-section.tsx`**

```typescript
"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ReportSectionProps {
  movieSlug: string;
}

export function ReportSection({ movieSlug }: ReportSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/movies/${movieSlug}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
      setDescription("");
      toast.success("Report submitted. Admins will review it.");
      setTimeout(() => { setSubmitted(false); setIsOpen(false); }, 2000);
    } catch {
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2">
          <AlertTriangle className="size-4" />
          Report an issue
        </span>
        {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>
      {isOpen && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue (e.g., video won't play, audio out of sync, wrong video)..."
            className="w-full min-h-[80px] rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={submitting || submitted}
            maxLength={1000}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{description.length}/1000</span>
            <button
              type="submit"
              disabled={submitting || submitted || !description.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><Loader2 className="size-4 animate-spin" /> Submitting...</>
              ) : submitted ? (
                <><CheckCircle2 className="size-4" /> Submitted</>
              ) : (
                "Submit Report"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/report-section.tsx
git commit -m "feat: add report section component"
```

---

### Task 8: Comments Section Component

**Files:**
- Create: `src/components/comments-section.tsx`

- [ ] **Step 1: Create `src/components/comments-section.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface CommentUser {
  id: string;
  name: string;
  image: string | null;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: CommentUser;
}

interface CommentsSectionProps {
  movieSlug: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function CommentsSection({ movieSlug }: CommentsSectionProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [newComment, setNewComment] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["comments", movieSlug, page],
    queryFn: async () => {
      const res = await fetch(`/api/movies/${movieSlug}/comments?page=${page}&limit=20`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json() as Promise<{
        comments: Comment[];
        total: number;
        page: number;
        hasMore: boolean;
      }>;
    },
    staleTime: 30 * 1000,
  });

  const postMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/movies/${movieSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      setNewComment("");
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ["comments", movieSlug] });
      toast.success("Comment posted!");
    },
    onError: () => {
      toast.error("Failed to post comment. Try again.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || postMutation.isPending) return;
    postMutation.mutate(newComment.trim());
  }

  const comments = data?.comments ?? [];
  const total = data?.total ?? 0;
  const hasMore = data?.hasMore ?? false;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="size-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Comments</h2>
        {total > 0 && (
          <span className="text-sm text-muted-foreground">({total})</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none min-h-[44px] max-h-32 focus:outline-none focus:ring-2 focus:ring-primary/50"
          maxLength={500}
          rows={1}
          disabled={postMutation.isPending}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || postMutation.isPending}
          className="self-end rounded-lg bg-primary p-2.5 text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {postMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </button>
      </form>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Failed to load comments.
        </p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="size-8 rounded-full bg-muted overflow-hidden shrink-0">
                {comment.user.image ? (
                  <Image
                    src={comment.user.image}
                    alt={comment.user.name}
                    width={32}
                    height={32}
                    className="object-cover size-full"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center text-xs font-medium text-muted-foreground bg-muted">
                    {comment.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{comment.user.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{timeAgo(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-foreground/90 mt-0.5">{comment.content}</p>
              </div>
            </div>
          ))}
          {hasMore && (
            <div className="text-center pt-2">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="text-sm text-primary hover:underline"
              >
                Load more comments
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/comments-section.tsx
git commit -m "feat: add comments section component"
```

---

### Task 9: Update Movie Detail Page

**Files:**
- Modify: `src/app/(main)/movies/[slug]/movie-detail-client.tsx`

- [ ] **Step 1: Add imports for ReportSection and CommentsSection**

At the top of `movie-detail-client.tsx`, after the existing imports:

```typescript
import { ReportSection } from "@/components/report-section";
import { CommentsSection } from "@/components/comments-section";
```

- [ ] **Step 2: Add the report and comments sections below RelatedMovies**

Find the closing div structure around the RelatedMovies usage (lines 303-306):

```tsx
          <RelatedMovies related={relatedMovies ?? []} />
        </div>
      </div>
    </div>
```

Replace with:

```tsx
          <RelatedMovies related={relatedMovies ?? []} />
          <div className="space-y-6 pt-4 border-t border-border">
            <ReportSection movieSlug={slug} />
            <CommentsSection movieSlug={slug} />
          </div>
        </div>
      </div>
    </div>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/movies/*/movie-detail-client.tsx
git commit -m "feat: add report and comments sections to movie detail page"
```

---

### Task 10: Admin Reports Page

**Files:**
- Create: `src/app/admin/reports/page.tsx`

- [ ] **Step 1: Create `src/app/admin/reports/page.tsx`**

```typescript
"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { type SortingState } from "@tanstack/react-table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2Icon, Flag } from "lucide-react";
import SearchInput from "../search-input";
import Pagination from "../pagination";

interface ReportMovie {
  title: string;
  slug: string;
}

interface ReportUser {
  name: string;
  email: string;
}

interface VideoReport {
  id: number;
  movieId: number;
  userId: string;
  description: string;
  status: "pending" | "resolved";
  createdAt: string;
  updatedAt: string;
  movie: ReportMovie;
  user: ReportUser;
}

interface PaginatedResponse {
  reports: VideoReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminReportsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteTarget, setDeleteTarget] = useState<VideoReport | null>(null);

  const limit = 20;
  const queryClient = useQueryClient();

  const sortBy = sorting[0]?.id;
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-reports", page, statusFilter, search, sortBy, sortDir],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortDir) params.set("sortDir", sortDir);
      const res = await fetch(`/api/admin/reports?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<PaginatedResponse>;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  const reports = data?.reports ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const resolveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/reports/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSettled: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
  });

  useEffect(() => {
    queueMicrotask(() => setPage(1));
  }, [statusFilter, search]);

  function handleToggleStatus(report: VideoReport) {
    const newStatus = report.status === "pending" ? "resolved" : "pending";
    resolveMutation.mutate({ id: report.id, status: newStatus });
  }

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Video Issue Reports</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage user-submitted video issue reports.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search reports..."
        />
        {["", "pending", "resolved"].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden flex-1 flex flex-col min-h-0">
        <CardHeader className="border-b bg-muted/10 py-4">
          <CardTitle>
            {statusFilter
              ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Reports`
              : "All Reports"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-auto flex-1 min-h-0">
          {isError ? (
            <ErrorState
              message="Failed to load reports."
              onRetry={refetch}
              className="py-8"
            />
          ) : isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-none" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Flag className="size-12 mb-3 opacity-30" />
              <p className="text-sm">No reports found.</p>
            </div>
          ) : (
            <div className="divide-y">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {report.movie.title}
                      </span>
                      <Badge
                        variant={
                          report.status === "pending" ? "default" : "secondary"
                        }
                        className="shrink-0 text-xs"
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {report.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        by {report.user.name} ({report.user.email})
                      </span>
                      <span>&middot;</span>
                      <span>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(report)}
                      disabled={resolveMutation.isPending}
                    >
                      {report.status === "pending" ? "Mark Resolved" : "Reopen"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget(report)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        label={`Showing ${startItem}–${endItem} of ${total} reports`}
      />

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Delete Report</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this report? This action cannot be
            undone.
          </DialogDescription>
          <div className="flex justify-end gap-2 mt-6">
            <DialogClose
              render={<Button variant="outline">Cancel</Button>}
              onClick={() => setDeleteTarget(null)}
            />
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/reports/page.tsx
git commit -m "feat: add admin reports management page"
```

---

### Task 11: Update Admin Sidebar

**Files:**
- Modify: `src/components/admin-layout.tsx`

- [ ] **Step 1: Add Reports nav item**

Import `Flag` at the top alongside existing icons:

```typescript
import { LayoutDashboard, Film, Tags, Users, ChevronLeft, Star, ListChecks, Tv, Flag } from "lucide-react";
```

Add to the `navItems` array between "Requests" and "Tags":

```typescript
  { label: "Reports", icon: Flag, href: "/admin/reports" },
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin-layout.tsx
git commit -m "feat: add reports nav item to admin sidebar"
```

---

### Task 12: Self-Review & Verification

**Files:**
- Run lint

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

Fix any lint errors.

- [ ] **Step 2: Final review against spec**

Check that all spec requirements are covered:
- [x] DB schema for `video_reports` and `movie_comments`
- [x] Cache scopes
- [x] User API: POST report, GET/POST comments
- [x] Admin API: GET/PATCH/DELETE reports
- [x] Reports and comments services
- [x] Report section component
- [x] Comments section component
- [x] Integration into movie detail page
- [x] Admin reports page with status filters, search, pagination
- [x] Admin sidebar nav item

- [ ] **Step 3: Final commit if lint fixes were applied**

```bash
git add -A
git commit -m "chore: fix lint issues"
```
