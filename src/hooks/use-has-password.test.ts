import { describe, it, expect } from "vitest";
import { derivePasswordState, formatProviderNames, resolveSignedInProvider } from "@/hooks/use-has-password";

describe("derivePasswordState", () => {
  it("reports no password for a Google-only account", () => {
    const state = derivePasswordState([{ providerId: "google" }]);

    expect(state.hasPassword).toBe(false);
    expect(state.providerNames).toEqual(["Google"]);
  });

  it("reports every linked social provider, not just the first row", () => {
    const state = derivePasswordState([
      { providerId: "github" },
      { providerId: "google" },
    ]);

    expect(state.hasPassword).toBe(false);
    expect(state.providerNames).toEqual(["GitHub", "Google"]);
  });

  it("reports a password when a credential is linked", () => {
    const state = derivePasswordState([
      { providerId: "google" },
      { providerId: "credential" },
    ]);

    expect(state.hasPassword).toBe(true);
  });

  it("reports a password for email-only accounts", () => {
    const state = derivePasswordState([{ providerId: "credential" }]);

    expect(state.hasPassword).toBe(true);
  });

  it("falls back to a generic provider label for unknown providers", () => {
    const state = derivePasswordState([{ providerId: "sso" }]);

    expect(state.hasPassword).toBe(false);
    expect(state.providerNames).toEqual(["your sign-in provider"]);
  });
});

describe("formatProviderNames", () => {
  it("joins two providers with and", () => {
    expect(formatProviderNames(["GitHub", "Google"])).toBe("GitHub and Google");
  });

  it("returns a single provider unchanged", () => {
    expect(formatProviderNames(["Google"])).toBe("Google");
  });
});

describe("resolveSignedInProvider", () => {
  it("returns the last-used provider when it is still linked", () => {
    expect(resolveSignedInProvider("google", ["GitHub", "Google"])).toBe("Google");
  });

  it("returns null when the last-used provider is no longer linked", () => {
    expect(resolveSignedInProvider("github", ["Google"])).toBeNull();
  });

  it("returns null for email last-method on an OAuth-only account", () => {
    expect(resolveSignedInProvider("email", ["Google"])).toBeNull();
  });

  it("returns null when there is no recorded last method", () => {
    expect(resolveSignedInProvider(null, ["GitHub", "Google"])).toBeNull();
  });
});
