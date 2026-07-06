"use client";

import { authClient } from "@/lib/auth-client";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { z } from "zod";
import { OAuthButtons } from "./oauth-buttons";
import { EmailForm } from "./email-form";

type Mode = "signIn" | "signUp";
type AuthMethod = "google" | "github" | "email" | null;

const emailLoginSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type EmailLoginFormData = z.infer<typeof emailLoginSchema>;

function getLastMethod(): AuthMethod {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("lastAuthMethod") as AuthMethod;
}

function setLastMethod(method: AuthMethod) {
  if (typeof window === "undefined") return;
  if (method) localStorage.setItem("lastAuthMethod", method);
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signIn");
  const [loadingMethod, setLoadingMethod] = useState<AuthMethod>(null);
  const [lastMethod] = useState<AuthMethod>(getLastMethod);

  const { register, handleSubmit, reset, formState: { errors }, setError, clearErrors } = useForm<EmailLoginFormData>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const { data: session, isPending } = authClient.useSession();
  const [justLoggedOut] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("loggedOut") === "1"
  );
  const [sessionExpired, setSessionExpired] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("sessionExpired") === "1"
  );

  const bgGrid = useMemo(() => (
    <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] origin-center transform rotate-x-[35deg] rotate-z-[20deg] skew-x-[-10deg] blur-sm">
      <div className="flex flex-col gap-8 p-4 animate-scroll-bg opacity-50">
        {[...Array(12)].map((_, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-4 sm:grid-cols-8 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[2/3] w-full rounded-xl bg-card/50 border border-border" />
            ))}
          </div>
        ))}
      </div>
    </div>
  ), []);

  useEffect(() => {
    if (sessionExpired) {
      toast.error("Your session has expired. Please sign in again.");
      setSessionExpired(false);
      router.replace("/login", { scroll: false });
    }
  }, [sessionExpired, router]);

  useEffect(() => {
    if (session && !isPending && !justLoggedOut && !sessionExpired) {
      router.replace("/home");
    }
  }, [session, isPending, justLoggedOut, sessionExpired, router]);

  if (session && !justLoggedOut) return null;

  const handleGoogleLogin = async () => {
    setLastMethod("google");
    setLoadingMethod("google");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/home",
      });
    } catch {
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
        callbackURL: "/home",
      });
    } catch {
      toast.error("GitHub sign-in failed. Please try again.");
      setLoadingMethod(null);
    }
  };

  const handleEmailSignIn = async (data: EmailLoginFormData) => {
    setLoadingMethod("email");
    clearErrors();
    try {
      const { error: signInError } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: "/home",
      });
      if (signInError) {
        if (signInError.status === 403) {
          toast.error("Email not verified. Check your inbox for a verification link.");
        } else {
          toast.error(signInError.message || signInError.statusText || "Invalid email or password.");
        }
      } else {
        setLastMethod("email");
        router.replace("/home");
      }
    } catch {
      toast.error("Sign-in failed. Please try again.");
    } finally {
      setLoadingMethod(null);
    }
  };

  const handleEmailSignUp = async (data: EmailLoginFormData) => {
    if (!data.name || data.name.length < 2) {
      setError("name", { message: "Name must be at least 2 characters." });
      return;
    }
    setLoadingMethod("email");
    clearErrors();
    try {
      const { error: signUpError } = await authClient.signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        callbackURL: "/home",
      });
      if (signUpError) {
        if (signUpError.status === 422) {
          toast.error("An account with this email already exists.");
        } else {
          toast.error(signUpError.message || signUpError.statusText || "Unable to create your account.");
        }
      } else {
        toast.success("Account created. Check your email for the verification link.");
        setMode("signIn");
        reset({ name: "", email: data.email, password: "" });
      }
    } catch {
      toast.error("Unable to create your account. Please try again.");
    } finally {
      setLoadingMethod(null);
    }
  };

  const onSubmit = mode === "signIn" ? handleEmailSignIn : handleEmailSignUp;

  const switchMode = () => {
    setMode(mode === "signIn" ? "signUp" : "signIn");
    clearErrors();
  };

  if (isPending && !justLoggedOut) {
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
        {/* logo section */}
        <div className="bg-card/40 backdrop-blur-2xl border border-border p-8 rounded-3xl shadow-2xl ring-1 ring-white/10">
          <div className="mx-auto mb-4 w-fit">
            <Image
              src="/favicon.svg"
              alt="StreamFlix Logo"
              width={42}
              height={42}
              className="text-primary"
            />
          </div>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              {mode === "signIn" ? "Welcome back." : "Join StreamFlix"}
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
            <Link href="#" className="underline hover:text-foreground">Terms of Service</Link> and{" "}
            <Link href="#" className="underline hover:text-foreground">Privacy Policy</Link>.
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
