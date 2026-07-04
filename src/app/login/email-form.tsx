"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import type { UseFormRegister, FieldErrors } from "react-hook-form";

type AuthMethod = "google" | "github" | "email" | null;

interface EmailFormData {
  name?: string;
  email: string;
  password: string;
}

interface EmailFormProps {
  mode: "signIn" | "signUp";
  loadingMethod: AuthMethod;
  register: UseFormRegister<EmailFormData>;
  errors: FieldErrors<EmailFormData>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}

export function EmailForm({ mode, loadingMethod, register, errors, onSubmit }: EmailFormProps) {
  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "signUp" && (
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              {...register("name")}
              type="text"
              placeholder="Name"
              className="w-full h-12 bg-muted/50 border-input pl-10 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-ring"
            />
            {errors.name?.message && (
              <p className="text-xs text-destructive mt-1">{String(errors.name.message)}</p>
            )}
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            {...register("email")}
            type="email"
            placeholder="Email"
            className="w-full h-12 bg-muted/50 border-input pl-10 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-ring"
          />
          {errors.email?.message && (
            <p className="text-xs text-destructive mt-1">{String(errors.email.message)}</p>
          )}
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            {...register("password")}
            type="password"
            placeholder="Password"
            className="w-full h-12 bg-muted/50 border-input pl-10 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-ring"
          />
          {errors.password?.message && (
            <p className="text-xs text-destructive mt-1">{String(errors.password.message)}</p>
          )}
        </div>

        <div className="relative">
          <Button
            variant="default"
            type="submit"
            disabled={loadingMethod !== null}
            className="w-full h-12 rounded-full font-semibold transition-all active:scale-95"
          >
            {loadingMethod === "email" ? (
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
    </>
  );
}
