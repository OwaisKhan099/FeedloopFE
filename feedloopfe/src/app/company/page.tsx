"use client";

import Link from "next/link";
import PageShell from "@/components/PageShell";

const modules = [
    {
        href: "/company/info",
        title: "Company Info",
        description: "View and manage your company details, plan, and contact information.",
        icon: "🏢",
        gradient: "from-[#ff6f97] to-[#8c7cff]",
    },
    // Add more modules here as the app grows
];

export default function CompanyHomePage() {
    return (
        <PageShell>
            <div className="mb-10">
                <h1 className="text-[34px] font-extrabold leading-tight text-[#090d1f]">Dashboard</h1>
                <p className="mt-1 text-base text-slate-500">Welcome back. Select a module to get started.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {modules.map((mod) => (
                    <Link
                        key={mod.href}
                        href={mod.href}
                        className="group rounded-3xl border border-slate-200 bg-white shadow-[0_18px_48px_rgba(28,31,55,.08)] overflow-hidden hover:shadow-[0_22px_70px_rgba(35,28,72,.14)] transition-shadow"
                    >
                        {/* Card top bar */}
                        <div className={`h-2 w-full bg-gradient-to-r ${mod.gradient}`} />

                        <div className="p-7">
                            <span className="text-4xl">{mod.icon}</span>
                            <h2 className="mt-4 text-xl font-extrabold text-[#090d1f] group-hover:text-[#8c7cff] transition-colors">
                                {mod.title}
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-slate-500">
                                {mod.description}
                            </p>
                            <span className="mt-5 inline-flex items-center gap-1 text-xs font-extrabold text-[#8c7cff]">
                                Open →
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </PageShell>
    );
}
