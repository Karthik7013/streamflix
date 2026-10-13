"use client";

import { ChevronLeft, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { OAuthButtons } from "@/app/login/oauth-buttons";
import { EmailForm } from "@/app/login/email-form";
import { LoginBgGrid } from "@/app/login/login-bg-grid";
import { useLoginAuth } from "@/hooks/use-login-auth";
import { loginFormSchema, type LoginFormValues } from "@/lib/schemas";

type Mode = "signIn" | "signUp";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signIn");
  const [sessionExpired, setSessionExpired] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("sessionExpired") === "1"
  );

  const { register, handleSubmit, reset, formState: { errors }, setError, clearErrors } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const {
    loadingMethod,
    lastMethod,
    session,
    sessionLoading,
    justLoggedOut,
    handleGoogleLogin,
    handleGitHubLogin,
    handleEmailSignIn,
    handleEmailSignUp,
  } = useLoginAuth({ setError, clearErrors, reset });

  const bgGrid = useMemo(() => <LoginBgGrid />, []);

  useEffect(() => {
    if (sessionExpired) {
      toast.error("Your session has expired. Please sign in again.");
      const url = new URL(window.location.href);
      url.searchParams.delete("sessionExpired");
      window.history.replaceState({}, "", url.toString());
      const timer = setTimeout(() => setSessionExpired(false), 100);
      return () => clearTimeout(timer);
    }
  }, [sessionExpired]);

  if (session && !justLoggedOut) return null;

  const onSubmit = async (data: LoginFormValues) => {
    if (mode === "signIn") {
      await handleEmailSignIn(data);
    } else {
      const created = await handleEmailSignUp(data);
      if (created) setMode("signIn");
    }
  };

  const switchMode = () => {
    setMode(mode === "signIn" ? "signUp" : "signIn");
    clearErrors();
  };

  if (sessionLoading && !justLoggedOut) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground flex items-center justify-center font-sans">
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium group"
      >
        <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        Back
      </Link>

      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-20 perspective-[1200px]">
        {bgGrid}
        <div className="absolute inset-0 bg-radial-at-c from-transparent to-background" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className=" backdrop-blur-2xl p-4 rounded-3xl shadow-2xl">
          <div className="mx-auto mb-4 w-fit">
            <Image
              src="/favicon.svg"
               alt="Streamflix Studio Logo"
              width={42}
              height={42}
              className="text-primary"
            />
          </div>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-2">
               {mode === "signIn" ? "Welcome back." : "Join Streamflix Studio"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {mode === "signIn"
                ? "Sign in to pick up where you left off."
                : "Create your account and start watching."}
            </p>
          </div>

          <OAuthButtons
            lastMethod={lastMethod}
            loadingMethod={loadingMethod}
            onGoogleLogin={handleGoogleLogin}
            onGitHubLogin={handleGitHubLogin}
          />

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card/40 px-3 text-muted-foreground">or continue with email</span>
            </div>
          </div>

          <EmailForm
            mode={mode}
            loadingMethod={loadingMethod}
            register={register}
            errors={errors}
            onSubmit={handleSubmit(onSubmit)}
          />

          <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
            By continuing, you agree to our <br />
            <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link> and{" "}
            <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm">
            {mode === "signIn" ? (
              <>
                Don&apos;t have an account?{" "}
                <button onClick={switchMode} className="text-foreground underline hover:text-muted-foreground cursor-pointer">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={switchMode} className="text-foreground underline hover:text-muted-foreground cursor-pointer">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>

    </div>
  );
}
