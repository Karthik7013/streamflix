import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendEmail } from "./email";

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
        html: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reset your password</title></head><body style="margin:0;padding:0;background-color:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="480" cellpadding="0" cellspacing="0"><tr><td style="text-align:center;padding:0 0 32px"><span style="font-size:20px;font-weight:700;color:#10b981;letter-spacing:-0.3px">StreamFlix</span></td></tr><tr><td style="background-color:#1a1b2e;border-radius:12px;padding:48px 40px;text-align:center"><h1 style="font-size:22px;font-weight:600;color:#f0f1f5;margin:0 0 12px">Reset your password</h1><p style="font-size:15px;color:#9494b8;line-height:1.6;margin:0 0 32px">We received a request to reset the password for your StreamFlix account. Click the button below to choose a new one. This link expires in 1 hour.</p><table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td style="background-color:#10b981;border-radius:8px;padding:14px 36px"><a href="${url}" style="color:#0f0f14;font-size:15px;font-weight:600;text-decoration:none;display:inline-block">Reset password</a></td></tr></table></td></tr><tr><td style="text-align:center;padding:24px 0 0"><p style="font-size:13px;color:#7171a0;margin:0 0 4px">If you didn't request this, you can safely ignore this email.</p><p style="font-size:12px;color:#4a4a6a;margin:0">StreamFlix · Bollywood Farm · India</p></td></tr></table></td></tr></table></body></html>`,
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
        html: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Verify your email</title></head><body style="margin:0;padding:0;background-color:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="480" cellpadding="0" cellspacing="0"><tr><td style="text-align:center;padding:0 0 32px"><span style="font-size:20px;font-weight:700;color:#10b981;letter-spacing:-0.3px">StreamFlix</span></td></tr><tr><td style="background-color:#1a1b2e;border-radius:12px;padding:48px 40px;text-align:center"><h1 style="font-size:22px;font-weight:600;color:#f0f1f5;margin:0 0 12px">Verify your email</h1><p style="font-size:15px;color:#9494b8;line-height:1.6;margin:0 0 32px">Thanks for creating an account! Click the button below to verify your email address and start streaming movies and shows on StreamFlix.</p><table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td style="background-color:#10b981;border-radius:8px;padding:14px 36px"><a href="${url}" style="color:#0f0f14;font-size:15px;font-weight:600;text-decoration:none;display:inline-block">Verify email</a></td></tr></table></td></tr><tr><td style="text-align:center;padding:24px 0 0"><p style="font-size:13px;color:#7171a0;margin:0 0 4px">If you didn't create this account, you can safely ignore this email.</p><p style="font-size:12px;color:#4a4a6a;margin:0">StreamFlix · Bollywood Farm · India</p></td></tr></table></td></tr></table></body></html>`,
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
