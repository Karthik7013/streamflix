# Admin Panel: Trending Management & Activity Log

## Overview

Add two new admin features to the sidebar: **Trending Management** (control which content appears in trending sections) and **Activity Log** (audit trail of admin actions).

---

## Feature 1: Trending Management

### Background
The `/trending` page currently shows `ShortsFeed` and the home page's "Trending Now · Top 10" is driven by `useTop10Movies` (favorite count). There is no admin way to pin or curate trending content.

### Scope
Create a `trending` table + admin CRUD page so admins can pin specific movies, series, or shorts to the trending section and control their display order.

### Database
- New table `trending` in `src/db/schema.ts`:
  - `id` (serial PK)
  - `contentType` (enum: `movie`, `series`, `short`)
  - `contentId` (integer, FK to the respective table)
  - `title` (string, denormalized for display)
  - `thumbnailUrl` (string, denormalized)
  - `displayOrder` (integer, defaults to 0)
  - `createdAt` / `updatedAt` (timestamps)
  - Unique constraint on `(contentType, contentId)` to prevent duplicates

### API Routes
- `GET /api/admin/trending` — list trending items ordered by `displayOrder`
- `POST /api/admin/trending` — add a new trending item (validate content exists)
- `PATCH /api/admin/trending/[id]` — update display order or fields
- `DELETE /api/admin/trending/[id]` — remove trending item

### Service Layer
- New `src/services/trending.ts` following the same pattern as `featured-base.ts`
- Uses `cacheGetOrSet` with a short TTL (e.g., 2 min) for the public list
- Batch-loads content details (movie/series/short) for each trending item

### Admin Page
- `src/app/admin/trending/page.tsx` — follows the same CRUD pattern as Movies/Series pages
- Table columns: Content (thumbnail + title), Type, Display Order, Actions (edit order, delete)
- Dialog to add trending item — search/modal to pick content by type

### Sidebar
- Add `{ label: "Trending", icon: Flame, href: "/admin/trending" }` to `navItems` in `admin-layout.tsx`
- Import `Flame` from `lucide-react`

### API Client
- Add `trending` to `adminApi` in `src/lib/api/admin.ts`

### Public Endpoint (optional)
- `GET /api/home/trending` — return trending items for the main app to consume (if the main app trending page is updated to use it)

---

## Feature 2: Activity Log / Audit

### Background
There is currently no way to track what admin actions occur (movies added, reports resolved, users banned, etc.). An audit log is essential for accountability.

### Scope
Create an `activity_logs` table to record admin actions, and an admin page to browse the log.

### Database
- New table `activity_logs` in `src/db/schema.ts`:
  - `id` (serial PK)
  - `action` (string, e.g., `movie.created`, `movie.updated`, `report.resolved`, `user.banned`)
  - `entityType` (string, e.g., `movie`, `series`, `user`, `report`, `request`)
  - `entityId` (integer, nullable — the affected record ID)
  - `actorId` (integer, FK to `user.id` — the admin who performed the action)
  - `actorName` (string, denormalized)
  - `details` (text/jsonb, nullable — additional context)
  - `ipAddress` (string, nullable)
  - `createdAt` (timestamp, defaults now)

### Service Layer
- New `src/services/activity-logs.ts`
- Single function `logActivity(params)` that inserts a record
  - Params: `action`, `entityType`, `entityId`, `actorId`, `actorName`, `details?`
  - Uses `cacheGetOrSet` is NOT appropriate here — logs are append-only and must be written immediately

### Middleware / Hook for Logging
- Add logging to existing admin CRUD operations in services:
  - `movies-admin.ts` — log on create, update, delete
  - `series-admin.ts` — log on create, update, delete
  - `reports` service — log on resolve
  - `requests` service — log on approve/reject
  - `featured` services — log on create/delete
- Create a utility `src/lib/audit.ts` with a `logAdminAction()` helper to avoid duplication

### API Routes
- `GET /api/admin/activity-logs` — paginated list of activity logs
  - Accepts `page`, `limit`, `action`, `entityType` filters
  - Returns `{ data: ActivityLogEntry[]; total: number; hasMore: boolean }`

### Admin Page
- `src/app/admin/activity-logs/page.tsx`
- Table columns: Timestamp, Action, Entity Type, Entity ID, Actor (admin), Details
- Filterable by action type and entity type
- Follows the same table/pagination pattern as existing admin pages

### Sidebar
- Add `{ label: "Activity Log", icon: Clock, href: "/admin/activity-logs" }` to `navItems`

### API Client
- Add `activityLogs` to `adminApi` in `src/lib/api/admin.ts`

---

## Files to Modify

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add `trending` and `activity_logs` tables |
| `src/lib/api/admin.ts` | Add `trending` and `activityLogs` API methods |
| `src/components/admin-layout.tsx` | Add 2 new nav items |
| `src/components/providers.tsx` | Add `trending` to queryClient `refetchOnMount` scope if needed |

## New Files

| File | Purpose |
|------|---------|
| `src/db/migrations/XXXX_add_trending_activity_logs.sql` | Schema migration |
| `src/services/trending.ts` | Trending CRUD service |
| `src/services/activity-logs.ts` | Activity log write service |
| `src/lib/audit.ts` | `logAdminAction()` helper |
| `src/app/admin/trending/page.tsx` | Trending management UI |
| `src/app/admin/activity-logs/page.tsx` | Activity log UI |
| `src/app/api/admin/trending/route.ts` | Trending API |
| `src/app/api/admin/trending/[id]/route.ts` | Trending single-item API |
| `src/app/api/admin/activity-logs/route.ts` | Activity logs API |
| `src/app/api/admin/activity-logs/[id]/route.ts` | Activity log single-item API |
| `src/hooks/use-trending.ts` | React Query hook for trending |
| `src/hooks/use-activity-logs.ts` | React Query hook for activity logs |

## Open Questions
1. Should the trending page support reordering via drag-and-drop, or just numeric `displayOrder` field?
2. Should activity logs be exposed to non-admin users (e.g., in settings)?
3. Should `activity_logs` have a TTL/retention policy (e.g., auto-purge after 90 days)?
4. Should the public `/api/home/trending` endpoint be created now, or deferred to when the main app trending page is updated?
