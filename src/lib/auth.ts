import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { createEmailTemplate } from "@/lib/email-template";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  cookieCache: {
    enabled: true,
    maxAge: 5 * 60,
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
  ],
  secret: requireEnv("BETTER_AUTH_SECRET"),
  baseURL: requireEnv("BETTER_AUTH_URL"),
  trustedOrigins: [requireEnv("BETTER_AUTH_URL")],
  account: {
    accountLinking: {
      enabled: true,
      requireLocalEmailVerified: false,
      updateUserInfoOnLink: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your StreamFlix password",
        html: createEmailTemplate({
          title: "Reset your password",
          header: "Reset your password",
          body: "We received a request to reset the password for your StreamFlix account. Click the button below to choose a new one. This link expires in 1 hour.",
          buttonText: "Reset password",
          buttonUrl: url,
          footerText: "If you didn't request this, you can safely ignore this email.",
        }),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email for StreamFlix",
        html: createEmailTemplate({
          title: "Verify your email",
          header: "Verify your email",
          body: "Thanks for creating an account! Click the button below to verify your email address and start streaming movies and shows on StreamFlix.",
          buttonText: "Verify email",
          buttonUrl: url,
          footerText: "If you didn't create this account, you can safely ignore this email.",
        }),
      });
    },
  },
  socialProviders: {
    google: {
      clientId: requireEnv("GOOGLE_CLIENT_ID"),
      clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
    },
    github: {
      clientId: requireEnv("GITHUB_CLIENT_ID"),
      clientSecret: requireEnv("GITHUB_CLIENT_SECRET"),
    },
  },
});
