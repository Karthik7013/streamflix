import { api } from "@/lib/api/client";

interface CreateRequestInput {
  title: string;
  description?: string;
  externalLink?: string;
}

export const requestsApi = {
  create: (data: CreateRequestInput) =>
    api<void>("/api/requests", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
