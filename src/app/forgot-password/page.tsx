"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/schemas";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const handleResetRequest = async (data: ForgotPasswordFormData) => {
    try {
      const { error: forgotError } = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (forgotError) {
        toast.error(forgotError.message || "Unable to send reset email.");
      } else {
        setSent(true);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

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
              Reset your password
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="rounded-full bg-primary/10 size-12 mx-auto flex items-center justify-center">
                <Mail className="size-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                If an account with that email exists, we&apos;ve sent a reset link.
                Check your inbox.
              </p>
              <Link
                href="/login"
                className="inline-block text-sm text-primary underline hover:text-primary/80"
              >
                Return to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(handleResetRequest)} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  {...register("email")}
                  className="w-full h-12 bg-muted/50 border-input pl-10 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-ring"
                />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-full font-semibold"
              >
                {isSubmitting ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  "Send reset link"
                )}
              </Button>
              <div className="text-center">
                <Link
                  href="/login"
                  className="text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Remember your password? Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
