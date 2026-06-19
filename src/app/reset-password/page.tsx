"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ChevronLeft, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get("token") || p.get("error");
    queueMicrotask(() => {
      if (t && !t.startsWith("INVALID")) setToken(t);
      else if (t?.startsWith("INVALID")) setError("This reset link is invalid or expired. Please request a new one.");
    });
  }, []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (resetError) {
        setError(resetError.message || "Failed to reset password.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground flex items-center justify-center font-sans">
        <div className="relative z-10 w-full max-w-md px-6">
          <div className="bg-card/40 backdrop-blur-2xl border border-border p-8 rounded-3xl shadow-2xl ring-1 ring-white/10 text-center">
            <div className="rounded-full bg-primary/10 size-12 mx-auto flex items-center justify-center mb-4">
              <CheckCircle className="size-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Password reset</h1>
            <p className="text-muted-foreground text-sm mb-6">Your password has been reset successfully.</p>
            <Button
              onClick={() => router.push("/login")}
              className="w-full h-12 rounded-full font-semibold"
            >
              Sign in
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground flex items-center justify-center font-sans">
      <Link
        href="/login"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium group"
      >
        <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        Back to login
      </Link>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-card/40 backdrop-blur-2xl border border-border p-8 rounded-3xl shadow-2xl ring-1 ring-white/10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-2">Set new password</h1>
            <p className="text-muted-foreground text-sm">Enter your new password below.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full h-12 bg-muted/50 border-input pl-10 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-ring"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full h-12 bg-muted/50 border-input pl-10 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-ring"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !token}
              className="w-full h-12 rounded-full font-semibold"
            >
              {isLoading ? <Loader2 className="size-5 animate-spin" /> : "Reset password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
