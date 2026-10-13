"use client";

import { useState } from "react";
import { Lock, MailCheck, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { changePasswordSchema, type ChangePasswordFormData } from "@/lib/schemas";
import { useChangePassword } from "@/hooks/use-change-password";
import { useHasPassword, formatProviderNames } from "@/hooks/use-has-password";
import { authClient } from "@/lib/auth-client";
import { logger } from "@/lib/logger";

export function ChangePassword({ loading, email }: { loading: boolean; email?: string }) {
  const { changePassword, isSubmitting } = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  const handlePasswordChange = async (data: ChangePasswordFormData) => {
    const success = await changePassword(data);
    if (success) reset();
  };

  const passwordState = useHasPassword();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const sendSetPasswordLink = async () => {
    if (!email) return;
    setSending(true);
    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message || "Unable to send set-password email.");
      } else {
        toast.success("Check your inbox for the set-password link.");
        setSent(true);
      }
    } catch (err) {
      logger.error("settings", "Set-password email failed", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (loading || (passwordState.hasPassword === null && passwordState.loading)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="w-16 h-6" /></CardTitle>
          <CardDescription><Skeleton className="w-56 h-6" /></CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="flex w-full flex-col gap-2">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (passwordState.hasPassword === false && email) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            You signed in with {passwordState.signedInWith ?? formatProviderNames(passwordState.providerNames)} — no password set yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <MailCheck className="size-5 text-primary shrink-0" />
              <p>Set-password link sent. Check your inbox to add email sign-in.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Set a password to also sign in with your email address.
              </p>
              <Button onClick={sendSetPasswordLink} disabled={sending}>
                <Send className="size-4 mr-2" />
                {sending ? "Sending..." : "Send set-password email"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Change your account password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit(handlePasswordChange)}>
          <div>
            <Input
              type="password"
              placeholder="Current password"
              {...register("currentPassword")}
            />
            {errors.currentPassword && (
              <p className="text-xs text-destructive mt-1">{errors.currentPassword.message}</p>
            )}
          </div>
          <div>
            <Input
              type="password"
              placeholder="New password (8+ characters)"
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p className="text-xs text-destructive mt-1">{errors.newPassword.message}</p>
            )}
          </div>
          <div>
            <Input
              type="password"
              placeholder="Confirm new password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            <Lock className="size-4 mr-2" />
            {isSubmitting ? "Changing..." : "Change Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
