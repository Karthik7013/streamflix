# Admin AI Assistant — Design Spec

Date: 2026-10-14
Status: Approved (Option A)
Scope: Dedicated agentic admin chat at `/admin/ai` reusing the public AI tab stack.

## 1. Background

The public AI tab (`src/app/(main)/ai/page.tsx` + `POST /api/chat`) is built on
`ai-elements/` (`Conversation`, `Message`, `PromptInput`, `Suggestion`,
`ToolResultCards`), `chat-parts.tsx` (`ToolCallIndicator`), `chat-errors.ts`
(`getFriendlyError`, `CHAT_SUGGESTIONS`), and a Kilo-gateway `streamText` route
with read-only catalog/docs tools. The admin dashboard (`src/app/admin/*` under
`AdminLayout` sidebar) has no AI entry. Admins want moderation triage, content
enrichment, and analytics Q&A in one agentic assistant with write powers.

## 2. Goals

- Dedicated `/admin/ai` page inside the admin shell reusing AI tab components verbatim (no forks of `ai-elements/`).
- New admin-only `POST /api/admin/chat/route.ts` guarded by `withAdminAuth` with an admin `ToolSet` wrapping existing `services/` functions.
- Agentic writes allowlisted to: resolve reports, fulfill requests, assign tags, import TMDB movies. No deletes, no user role changes.
- Tool results render as rich cards with Apply affordances that call typed `adminApi` methods and invalidate React Query keys.

## 3. Non-goals

- No new DB tables or migrations.
- No hand-edits to shared `ai-elements/` primitives beyond additive `ToolResultCards` branches.
- No changes to the public `/api/chat` route or its tools.
- No inline AI widgets in tables in this phase (page-first; inline buttons are a follow-up).

## 4. Architecture

```
app/admin/ai/page.tsx ("use client", export default)
  -> hooks/use-admin-chat.ts (useChat -> POST /api/admin/chat)
  -> ai-elements/Conversation, Message, PromptInput, Suggestion (reuse)
  -> admin-chat-parts.tsx (ToolCallIndicator reuse pattern + admin suggestions)
  -> components/ai-elements/tool-result-cards.tsx (additive admin branches)

app/api/admin/chat/route.ts (withAdminAuth, rateLimit, streamText via Kilo)
  -> services/stats, services/reports, services/requests, services/movies,
     services/tags, TMDB service (same functions the admin REST routes use)
  -> lib/schemas.ts (new admin chat zod schemas)
```

Nav: one entry in `navItems` in `components/layout/admin-layout.tsx`
(Sparkles icon, `/admin/ai`).

## 5. Backend: `POST /api/admin/chat/route.ts`

- Guard: `withAdminAuth`. Validation: zod object `{ messages, model? }` mirroring `chatApiSchema`; errors return `{ error: { message, code } }` shape.
- Rate limit: `rateLimit('admin-chat:{adminUserId}', RATE_LIMITS.adminChat)` with `rateLimitResponse()` on denial. Add `adminChat` preset to `RATE_LIMITS` if absent.
- Model: same Kilo `createOpenAICompatible` gateway as public chat; `maxDuration = 30`; `stopWhen: [stepCountIs(3)]` to allow read-then-write chains.
- `toolFailure(tool, err)` helper mirrors public route: `logger.error("admin-chat", ...)` and returns a safe message. No silent catches.
- `CACHE_CONTROL.PRIVATE` semantics: no cacheable GET; streaming POST response.

### 5.1 Read tools (execute immediately, no invalidation)

| Tool | Input schema | Service mapping |
|---|---|---|
| `getDashboardStats` | empty | `services/stats` (same shape as `adminApi.stats`) |
| `listPendingReports` | `{ limit?: number }` default 10, max 25 | `services/reports` pending list, explicit select |
| `listPendingRequests` | `{ limit?: number }` default 10, max 25 | `services/requests` pending list |
| `searchCatalog` | `{ query: string, limit?: number }` | `services/movies.searchMovies` (title/keyword) |
| `suggestTags` | `{ movieId: number }` | movie row + `getAllTags`; returns all tags plus the movie's current tags and overview so the model ranks suggestions with reasons (no local heuristic — ranking is the model's job) |
| `tmdbLookup` | `{ query: string }` | TMDB search service (same as `/api/admin/tmdb/search`) |
| `getRecentSignups` | `{ limit?: number }` | recent-signups service |
| `getMostFavorited` | `{ limit?: number }` | most-favorited service |

### 5.2 Write tools (allowlisted, audited)

| Tool | Input schema | Behavior |
|---|---|---|
| `resolveReport` | `{ id: number, status: "pending" \| "resolved" }` | Calls report-resolve service, `invalidateCache` report keys, `logger` with admin user ID, returns `{ ok, invalidatedKeys: ["admin-reports"] }` |
| `fulfillRequest` | `{ id: number }` | Calls request-fulfill service, invalidates `["admin-requests"]` |
| `assignTags` | `{ movieId: number, tagIds: number[] }` | Calls movie-tags assignment service, invalidates `["admin-movies", "admin-tags"]` |
| `importTmdbMovie` | `{ tmdbId: number }` | Calls TMDB import service, invalidates `["admin-movies", "admin-stats"]` |

Explicitly out of scope for tools: delete movie/report/request/tag/user, update user roles, flush cache, upload files.

### 5.3 System prompt

Admin-aware variant of the public prompt: concise and operational, acknowledge tool cards naturally, never emit markdown images, always cite report/request/movie IDs, ask for confirmation phrasing on overwrites (tag replacement, duplicate import).

## 6. Frontend

### 6.1 `app/admin/ai/page.tsx` (new, `export default`)

Mirrors `(main)/ai/page.tsx` layout (`h-[calc(100dvh-4rem)]`-style constrained height adapted to admin inset padding), `Conversation` + `ConversationContent` + `ConversationScrollButton`, empty state with Streamflix Studio branding, `Suggestions` from admin list, `PromptInput` submit wiring, submitted/streaming thinking indicator, error banner via `getFriendlyError` with dismiss, retry via `regenerate()`.

### 6.2 `app/admin/ai/admin-chat-parts.tsx` (new, named exports)

- Reuse `ToolCallIndicator` pattern (running/done/error + expandable input/output).
- `ADMIN_CHAT_SUGGESTIONS`: "Summarize pending reports", "What requests need review?", "Signups this week?", "Suggest tags for Dune", "Look up Dune on TMDB".

### 6.3 `hooks/use-admin-chat.ts` (new)

Wraps `useChat` with endpoint `/api/admin/chat`, surfaces `{ messages, sendMessage, status, regenerate, error }`, centralizes input/error-dismissed state so the page stays thin. Card Apply-actions use React Query mutations with optimistic rollback per the AGENTS.md mutation pattern (cancel, snapshot, rollback on error, invalidate on settled).

### 6.4 `tool-result-cards.tsx` (additive branches only)

Existing movie/genre/docs branches untouched. New branches:

- `ReportTriageCard`: pending report rows (id, reason, movie, reporter, age) + per-row Resolve button calling `adminApi.reports.resolve` then invalidating `["admin-reports"]` with optimistic rollback per AGENTS.md mutation pattern.
- `RequestQueueCard`: request rows + Fulfill button (`adminApi.requests.fulfill`, invalidate `["admin-requests"]`).
- `StatsSummaryCard`: renders `getDashboardStats` output (type/value/subtitle/percent) reusing stat card styling.
- `TagSuggestionCard`: suggested tags with reasons + Apply button (`adminApi.movies.update` or tags create+assign), invalidates `["admin-movies", "admin-tags"]`.

All buttons use `useCallback` handlers where passed to `memo()` children; lists use stable keys (IDs, never index).

## 7. API layer compliance (AGENTS.md)

- Zero raw `fetch` in pages; chat transport via `useChat` (exception: AI SDK transport, not data fetching), all apply-actions via typed `adminApi`.
- Error shape `{ error: { message, code } }` on non-stream errors; `api` utility parsing on card actions.
- No server actions; mutations through API routes or the chat route's service calls.
- Named exports everywhere except `page.tsx` (`export default`).

## 8. Caching and invalidation

- Chat POST is uncached (`CACHE_CONTROL.PRIVATE` semantics).
- Read tools may use `cacheGetOrSet` with existing `CACHE_TTL` tiers (stats/growth cached; queues fresh).
- Every write tool calls `invalidateCache` server-side and returns `invalidatedKeys`; the client invalidates the same React Query keys and rolls back optimistically on error.

## 9. Error handling and observability

- Every `catch` logs via `logger.error("admin-chat", msg, err)`.
- Tool failures return user-safe strings, never stack traces.
- UI surfaces `getFriendlyError` mapping (429/503/500/timeout/auth).
- Admin user ID attached to all write-tool log lines for audit.

## 10. Testing

- `npm run typecheck` clean.
- Manual: triage flow (ask → cards → Resolve → reports table reflects), enrichment flow (suggest → Apply → movie tags updated), analytics flow (stats question matches dashboard numbers), TMDB lookup flow.
- Auth: non-admin POST returns 401; unauthenticated returns 401/403, never streams.
- Rate limit: forced 429 shows friendly banner.
- Unit: zod schema parse tests for new admin chat schemas (mirror existing schema test style).

## 11. Risks

- Write-tool misuse: mitigated by allowlist, enum-constrained schemas, audit logs, no deletes.
- Stale analytics answers: mitigated by fresh queue reads + cached stats with TTL.
- Token cost: mitigated by `stepCountIs(3)` cap, `maxDuration = 30`, admin-only rate limit.
- Card/UI drift: mitigated by reusing `ai-elements` verbatim and additive-only card branches.
