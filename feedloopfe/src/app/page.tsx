"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";

export default function DashboardPage() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            router.replace("/signin");
        }
    }, [router]);

    return (
        <PageShell>
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <span className="mb-6 text-6xl">👋</span>
                <h1 className="text-[34px] font-extrabold leading-tight text-[#090d1f]">Welcome to FeedLoop</h1>
                <p className="mt-3 max-w-md text-base text-slate-500">
                    Select a module from the sidebar to get started.
                </p>
            </div>
        </PageShell>
    );
}
