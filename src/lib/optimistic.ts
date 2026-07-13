import { type QueryClient, type QueryKey } from "@tanstack/react-query";

export async function optimisticUpdate<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  updater: (old: T | undefined) => T | undefined,
): Promise<{ previous: T | undefined }> {
  await queryClient.cancelQueries({ queryKey });
  const previous = queryClient.getQueryData<T>(queryKey);
  queryClient.setQueryData(queryKey, updater(previous));
  return { previous };
}
