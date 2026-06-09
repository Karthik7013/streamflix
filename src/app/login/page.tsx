"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Loader2, Mail, Lock, User, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Mode = "signIn" | "signUp";
type AuthMethod = "google" | "github" | "email" | null;

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lastMethod] = useState<AuthMethod>(getLastMethod);

  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session && !isPending) {
      router.replace("/home");
    }
  }, [session, isPending, router]);

  if (session) return null;

  const handleGoogleLogin = async () => {
    setLastMethod("google");
    setIsLoading(true);
    try {
      setError(null);
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/home",
      });
    } catch (err) {
      console.error("Login failed:", err);
      setError("Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setLastMethod("github");
    setIsLoading(true);
    try {
      setError(null);
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/home",
      });
    } catch (err) {
      console.error("Login failed:", err);
      setError("Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/home",
      });
      if (signInError) {
        if (signInError.status === 403) {
          setError("Email not verified. Check your inbox for the verification link.");
        } else {
          setError(signInError.message || signInError.statusText || "Invalid email or password.");
        }
      } else {
        setLastMethod("email");
      }
    } catch (err) {
      console.error("Sign in failed:", err);
      setError("Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { error: signUpError } = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: "/home",
      });
      if (signUpError) {
        if (signUpError.status === 422) {
          setError("An account with this email already exists.");
        } else {
          setError(signUpError.message || signUpError.statusText || "Failed to create account.");
        }
      } else {
        setSuccess("Account created! Check your email for the verification link.");
        setMode("signIn");
        setName("");
        setPassword("");
      }
    } catch (err) {
      console.error("Sign up failed:", err);
      setError("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "signIn" ? "signUp" : "signIn");
    setError(null);
    setSuccess(null);
  };

  if (isPending) {
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
        <div className="absolute inset-0 bg-radial-at-c from-transparent to-background" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="flex flex-col items-center mb-8">
          <Link href="/">
            <span className="text-xl font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity">StreamFlix</span>
          </Link>
        </div>

        <div className="bg-card/40 backdrop-blur-2xl border border-border p-8 rounded-3xl shadow-2xl ring-1 ring-white/10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              {mode === "signIn" ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {mode === "signIn"
                ? "Sign in to access your library and continue your cinematic journey."
                : "Sign up to start building your library."}
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="success" className="mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <div className="relative">
              {lastMethod === "google" && (
                <span className="absolute -top-2 right-0 z-10 flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-medium text-primary-foreground shadow-sm">
                  <Clock className="size-3" />
                  Last used
                </span>
              )}
              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                variant={lastMethod === "google" ? "default" : "secondary"}
                className="w-full h-12 rounded-full font-semibold transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <svg className="size-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>
            </div>

            <div className="relative">
              {lastMethod === "github" && (
                <span className="absolute -top-2 right-0 z-10 flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-medium text-primary-foreground shadow-sm">
                  <Clock className="size-3" />
                  Last used
                </span>
              )}
              <Button
                onClick={handleGitHubLogin}
                disabled={isLoading}
                variant={lastMethod === "github" ? "default" : "secondary"}
                className="w-full h-12 rounded-full font-semibold transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    Continue with GitHub
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card/40 px-3 text-muted-foreground">or continue with email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={mode === "signIn" ? handleEmailSignIn : handleEmailSignUp} className="space-y-4">
            {mode === "signUp" && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full h-12 bg-muted/50 border-input pl-10 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-ring"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 bg-muted/50 border-input pl-10 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-ring"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full h-12 bg-muted/50 border-input pl-10 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-ring"
              />
            </div>

            <div className="relative">
              {mode === "signIn" && lastMethod === "email" && (
                <span className="absolute -top-2 right-0 z-10 flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-medium text-primary-foreground shadow-sm">
                  <Clock className="size-3" />
                  Last used
                </span>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-full font-semibold transition-all active:scale-95"
              >
                {isLoading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  mode === "signIn" ? "Sign in" : "Create account"
                )}
              </Button>
              {mode === "signIn" && (
                <Link
                  href="/forgot-password"
                  className="mt-2 block text-center text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Forgot password?
                </Link>
              )}
            </div>
          </form>

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
