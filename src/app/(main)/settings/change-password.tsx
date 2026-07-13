"use client";

import { authClient } from "@/lib/auth-client";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { changePasswordSchema, type ChangePasswordFormData } from "@/lib/schemas";

export function ChangePassword({ loading }: { loading: boolean }) {

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  const handlePasswordChange = async (data: ChangePasswordFormData) => {
    const { error } = await authClient.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      revokeOtherSessions: true,
    });

    if (error) {
      toast.error(error.message || "Unable to update password.");
    } else {
      toast.success("Password updated.");
      reset();
    }
  };

  if (loading) {
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
