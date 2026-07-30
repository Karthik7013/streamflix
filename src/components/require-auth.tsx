"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/hooks/use-session";
import { ErrorState } from "@/components/error-state";
import { AuthLoading } from "@/components/auth-loading";

export function RequireAuth({ children, redirectTo }: { children: React.ReactNode; redirectTo?: string }) {
    const { data: session, loading, isError, retry } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !session && !isError && redirectTo) {
            router.replace(redirectTo);
        }
    }, [session, loading, isError, router, redirectTo]);

    if (isError) {
        return (
            <div className="flex h-screen items-center justify-center">
                <ErrorState message="Unable to verify your session." onRetry={retry} />
            </div>
        );
    }
    if (loading) {
        return <AuthLoading />;
    }
    if (!session) return null;
    return <>{children}</>;
}
