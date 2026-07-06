import { api } from "@/lib/api/client";
import type { Tag } from "@/types";

export const tagsApi = {
  list: (params?: URLSearchParams) =>
    api<Tag[]>(`/api/tags?${params ?? ""}`),
};
