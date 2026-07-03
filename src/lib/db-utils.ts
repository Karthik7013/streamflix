/**
 * Groups rows by a derived key. Used to attach related child rows (e.g. tags
 * fetched in a separate query) back onto their parent rows without hand
 * writing the same `if (!map.has(key)) map.set(key, [])` loop in every
 * service function.
 *
 * Example:
 *   const tagsByMovieId = groupBy(tagRows, (row) => row.movieId);
 *   movies.map((m) => ({ ...m, tags: tagsByMovieId.get(m.id) ?? [] }));
 */
export function groupBy<T, K>(rows: T[], keyFn: (row: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const row of rows) {
    const key = keyFn(row);
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(row);
    } else {
      map.set(key, [row]);
    }
  }
  return map;
}

/**
 * Returns a shallow copy of `data` containing only the keys whose value is
 * not `undefined`. Used to build Drizzle `.set(...)` payloads for partial
 * updates (PATCH/PUT-style "only touch the fields that were actually sent")
 * instead of a repeated
 *   if (x !== undefined) updateData.x = x;
 * block per field per entity.
 *
 * Deliberately does NOT add `updatedAt` itself — callers decide whether an
 * update is happening at all (an empty result usually means "skip the
 * UPDATE query entirely" rather than "run an update that only touches
 * updatedAt").
 */
export function pickDefined<T extends Record<string, unknown>>(data: Partial<T>): Partial<T> {
  const result = {} as Partial<T>;
  for (const key of Object.keys(data) as (keyof T)[]) {
    const value = data[key];
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}
