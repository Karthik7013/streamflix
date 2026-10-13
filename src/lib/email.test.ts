import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
});

describe("email module", () => {
  it("does not throw at import time when email env vars are missing", async () => {
    delete process.env.EMAIL;
    delete process.env.APP_PASSWORD;

    await expect(import("@/lib/email")).resolves.toBeTruthy();
  });

  it("sendEmail fails with an informative error instead of crashing the process", async () => {
    delete process.env.EMAIL;
    delete process.env.APP_PASSWORD;

    const { sendEmail } = await import("@/lib/email");
    await expect(
      sendEmail({ to: "a@b.c", subject: "s", html: "<p>h</p>" })
    ).rejects.toThrow();
  });
});
