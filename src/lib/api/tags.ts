import { api } from "./client";
import type { Tag } from "@/types";

export const tagsApi = {
  list: (params?: URLSearchParams) =>
    api<{ items: Tag[] }>(`/api/tags?${params ?? ""}`),
};
