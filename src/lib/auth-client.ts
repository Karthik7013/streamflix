import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import type { Auth } from "@/lib/auth";

export const authClient = createAuthClient({
  plugins: [adminClient(), inferAdditionalFields<Auth>()],
  sessionOptions: {
    refetchOnWindowFocus: false,
  },
});
