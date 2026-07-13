"use client"

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/hooks/use-session";

export function CtaBtn() {
    const { data: session } = useSession();

    return <div className="flex flex-col w-full sm:w-auto gap-4 font-medium sm:flex-row mt-4">

        <Button
            nativeButton={false}
            className="rounded-full font-bold text-sm sm:text-base h-12 px-8 shadow-lg"
            render={<Link href={session ? "/home" : "/login"} />}
        >
            {session ? "Continue watching" : "Get started"}
            <ArrowRight className="size-4" />
        </Button>
    </div>
}