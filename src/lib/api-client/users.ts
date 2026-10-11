import { api } from "@/lib/api-client/client";

export const usersApi = {
  deleteAccount: () =>
    api<{ data: { success: boolean } }>("/api/users/account", { method: "DELETE" }),
};