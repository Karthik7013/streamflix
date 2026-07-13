# Code Guidelines

## Architecture

- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS with `cn()` utility (`@/lib/utils`)
- **State/Data**: React Query (`@tanstack/react-query`) for all server state
- **Auth**: Better Auth for authentication
- **No server actions are used** — all data mutations go through API routes

## Project Structure

```
src/
  app/              — Next.js App Router pages + API routes
    (main)/         — Client-facing pages (home, movies, series, etc.)
    admin/          — Admin panel pages
    api/            — API route handlers (mirror the data layer)
  components/       — Shared React components
    streamflix-player/  — Video player components
    ui/             — Generic UI primitives (button, card, skeleton, etc.)
  hooks/            — Custom React hooks (data fetching, etc.)
  lib/              — Shared utilities, API clients, helpers
    api/            — Typed API client modules
  services/         — Server-side business logic (TMDB, DB queries)
  types/            — Shared TypeScript types
```

## Component Rules

### Export Style
- **No `export default` in non-page files**. Use named exports everywhere.
- Exception: `page.tsx` and `layout.tsx` files must use `export default` (Next.js requirement).
- Exception: `loading.tsx`, `error.tsx`, `not-found.tsx` may use default exports.

### Client/Server Boundary
- Add `"use client"` at the top for any component using hooks, state, effects, browser APIs, or event handlers.
- Keep components server-renderable when they don't need interactivity.

### Component Patterns
- Use `memo()` for components rendered in lists (`.map()`) or complex presentational components:
  ```tsx
  const PosterCard = memo(function PosterCard({ url, index, priority }: PosterCardProps) {
    return (...);
  });
  ```
- Extract `useCallback` for event handlers passed as props to memo'd children:
  ```tsx
  const onLoad = useCallback(() => setLoaded(true), []);
  ```
- Avoid inline arrow functions in JSX props when the receiving component is memo'd.
- Inline arrow functions on native elements (`<button onClick={...}>`) are acceptable.

## API Layer

### Typed API Client Pattern
All API calls go through typed modules in `src/lib/api/`. Never use raw `fetch()` or `apiFetch()` directly in components/pages.

```ts
// src/lib/api/admin.ts — Typed admin client
export const adminApi = {
  movies: {
    list: (params?) => apiFetch<...>("/api/admin/movies", { params }),
    get: (id: number) => apiFetch<...>(`/api/admin/movies/${id}`),
    ...
  },
  featured: {
    list: () => apiFetch<FeaturedMovie[]>("/api/admin/featured"),
    delete: (id: number) => apiFetch(`/api/admin/featured/${id}`, { method: "DELETE" }),
    ...
  },
};
```

Existing modules:
- `@/lib/api/admin` — All admin endpoints (movies, series, tags, featured, reports, requests, stats, TMDB, upload)
- `@/lib/api/movies` — Public movie endpoints (list, detail, report, comments)
- `@/lib/api/series` — Public series endpoints (list, detail, featured, top-10)
- `@/lib/api/users` — User account operations
- `@/lib/api/requests` — Public request creation

### Error Shape
All API error responses use this shape consistently:
```ts
// Both services and API routes must return:
{ error: { message: string, code: string } }
```

The `apiFetch` utility automatically parses this. Components check `if (error)` from React Query.

### Admin API Access
- **Zero `apiFetch` calls in admin page files** — always use typed `adminApi` methods.
- Exception: Generic reusable components (`use-admin-crud.ts`, `entity-dialog.tsx`) may use `apiFetch` with dynamic endpoints — these are utilities, not pages.

## Data Fetching (React Query)

### Query Patterns
- **Detail queries**: Unwrap in `queryFn`:
  ```tsx
  queryFn: async () => {
    const { data } = await adminApi.movies.get(id);
    return data;
  },
  ```
- **List queries**: Unwrap with `useMemo`:
  ```tsx
  const { data } = useQuery(...);
  const items = useMemo(() => data ?? [], [data]);
  ```
- **Infinite queries**: Use `getNextPageParam` with `hasMore` flag:
  ```tsx
  getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
  ```

### Mutations
- Use the `optimisticUpdate` utility from `@/lib/optimistic` for optimistic updates:
  ```tsx
  import { optimisticUpdate } from "@/lib/optimistic";

  onMutate: async (id) =>
    optimisticUpdate<T[]>(queryClient, ["query-key"], (prev) =>
      (prev ?? []).filter((item) => item.id !== id)
    ),
  onError: (_err, _id, context) => {
    if (context?.previous !== undefined)
      queryClient.setQueryData(["query-key"], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["query-key"] });
  },
  ```

### Important
- **Never call `notFound()` inside a `queryFn`.** React Query catches thrown errors before Next.js can handle them. Handle errors via React Query's `error` state and render `notFound()` in the component body.
- Use `STALE` from `@/lib/stale-times` for `staleTime`:
  ```tsx
  import { STALE } from "@/lib/stale-times";
  staleTime: STALE.DEFAULT,
  ```

## Error Handling

- Use `logger` from `@/lib/logger` for server-side/logging:
  ```tsx
  import { logger } from "@/lib/logger";
  logger.error("context", "message", optionalError);
  ```
- **No silent catch blocks** — every `catch {}` must log the error:
  ```tsx
  } catch (err) {
    logger.error("feature", "Failed to do X", err);
    return null;  // or throw, or handle gracefully
  }
  ```
- Console.log/error is acceptable in components (dev-facing). `logger.error` is for production logging.

## Types

- Shared types in `@/types` (index file re-exports from domain files)
- Use `interface` over `type` for object shapes (consistent with codebase convention)
- Use `export interface` for shared types
- Prefer `Omit<BaseType, 'field'> & { ... }` for extending

## Code Style

- **No comments** in code unless explaining a non-obvious workaround or business rule
- **Semicolons**: Optional — follow existing file convention
- **Imports**: Group by external → internal, use `@/` path alias (not relative paths)
- **File naming**: Use kebab-case for files, camelCase for functions/variables, PascalCase for components/types

## Performance

- Add `memo()` to components rendered in loops or accepting stable callback props
- Extract inline callbacks with `useCallback()` when passed to memo'd children
- Use `useMemo()` for computed values from query data
- Use proper `key` props in lists (avoid array index as key when possible)

## Large Files

Split large files (>300 lines) into domain-specific modules:
- `movies-admin.ts` + `series-admin.ts` instead of a monolithic admin file
- Each module is self-contained with its own constants/types

## Environment Variables

- Public env vars use `NEXT_PUBLIC_` prefix (e.g., `NEXT_PUBLIC_URL`)
- Server-only env vars have no prefix (e.g., `DATABASE_URL`, `TMDB_API_KEY`)
- Access server env vars via `process.env.VAR_NAME`, public via `process.env.NEXT_PUBLIC_VAR_NAME`
