"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { logger } from "@/lib/logger";
import { useSession } from "@/hooks/use-session";
import { type LoginFormValues } from "@/lib/schemas";
import type { UseFormClearErrors, UseFormReset, UseFormSetError } from "react-hook-form";

export type AuthMethod = "google" | "github" | "email" | null;

function getLastMethod(): AuthMethod {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("lastAuthMethod") as AuthMethod;
}

function setLastMethod(method: Exclude<AuthMethod, null>) {
  if (typeof window === "undefined") return;
  localStorage.setItem("lastAuthMethod", method);
}

export function useLoginAuth({
  setError,
  clearErrors,
  reset,
}: {
  setError: UseFormSetError<LoginFormValues>;
  clearErrors: UseFormClearErrors<LoginFormValues>;
  reset: UseFormReset<LoginFormValues>;
}) {
  const router = useRouter();
  const [loadingMethod, setLoadingMethod] = useState<AuthMethod>(null);
  const lastMethod = useMemo(() => getLastMethod(), []);

  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") return "/home";
    const r = new URLSearchParams(window.location.search).get("redirect");
    return r && r.startsWith("/") && !r.startsWith("/login") ? r : "/home";
  }, []);

  const { data: session, loading: isPending } = useSession();
  const justLoggedOut = useMemo(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("loggedOut") === "1",
    []
  );

  useEffect(() => {
    if (session && !isPending && !justLoggedOut) {
      router.replace(redirectTo);
    }
  }, [session, isPending, justLoggedOut, router, redirectTo]);

  const handleGoogleLogin = async () => {
    setLastMethod("google");
    setLoadingMethod("google");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: redirectTo,
      });
    } catch (err) {
      logger.error("login", "Google sign-in failed", err);
      toast.error("Google sign-in failed. Please try again.");
      setLoadingMethod(null);
    }
  };

  const handleGitHubLogin = async () => {
    setLastMethod("github");
    setLoadingMethod("github");
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: redirectTo,
      });
    } catch (err) {
      logger.error("login", "GitHub sign-in failed", err);
      toast.error("GitHub sign-in failed. Please try again.");
      setLoadingMethod(null);
    }
  };

  const handleEmailSignIn = async (data: LoginFormValues) => {
    setLoadingMethod("email");
    clearErrors();
    try {
      const { error: signInError } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: redirectTo,
      });
      if (signInError) {
        if (signInError.status === 403) {
          toast.error("Email not verified. Check your inbox for a verification link.");
        } else {
          toast.error(signInError.message || signInError.statusText || "Invalid email or password.");
        }
      } else {
        setLastMethod("email");
        router.replace(redirectTo);
      }
    } catch (err) {
      logger.error("login", "Email sign-in failed", err);
      toast.error("Sign-in failed. Please try again.");
    } finally {
      setLoadingMethod(null);
    }
  };

  const handleEmailSignUp = async (data: LoginFormValues) => {
    if (!data.name || data.name.length < 2) {
      setError("name", { message: "Name must be at least 2 characters." });
      return false;
    }
    setLoadingMethod("email");
    clearErrors();
    try {
      const { error: signUpError } = await authClient.signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        callbackURL: redirectTo,
      });
      if (signUpError) {
        if (signUpError.status === 422) {
          toast.error("An account with this email already exists.");
        } else {
          toast.error(signUpError.message || signUpError.statusText || "Unable to create your account.");
        }
        return false;
      }
      toast.success("Account created. Check your email for the verification link.");
      reset({ name: "", email: data.email, password: "" });
      return true;
    } catch (err) {
      logger.error("login", "Email sign-up failed", err);
      toast.error("Unable to create your account.");
      return false;
    } finally {
      setLoadingMethod(null);
    }
  };

  return {
    loadingMethod,
    lastMethod,
    session,
    sessionLoading: isPending,
    justLoggedOut,
    handleGoogleLogin,
    handleGitHubLogin,
    handleEmailSignIn,
    handleEmailSignUp,
  };
}
