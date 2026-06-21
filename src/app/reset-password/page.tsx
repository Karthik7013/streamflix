"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ChevronLeft, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/schemas";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [pageError, setPageError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get("token") || p.get("error");
    queueMicrotask(() => {
      if (t && !t.startsWith("INVALID")) setToken(t);
      else if (t?.startsWith("INVALID")) setPageError("This reset link is invalid or expired. Please request a new one.");
    });
  }, []);

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: data.password,
        token,
      });
      if (resetError) {
        toast.error(resetError.message || "Failed to reset password.");
      } else {
        setSuccess(true);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
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

          {pageError && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{pageError}</div>
          )}

          <form onSubmit={handleSubmit(handleResetPassword)} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="New password"
                {...register("password")}
                className="w-full h-12 bg-muted/50 border-input pl-10 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-ring"
              />
              {errors.password && (
                <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Confirm new password"
                {...register("confirmPassword")}
                className="w-full h-12 bg-muted/50 border-input pl-10 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-ring"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || !token}
              className="w-full h-12 rounded-full font-semibold"
            >
              {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : "Reset password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
