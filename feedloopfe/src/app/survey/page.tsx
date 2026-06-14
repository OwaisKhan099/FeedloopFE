"use client";

import Link from "next/link";
import PageShell from "@/components/PageShell";

const SURVEY_ACTIONS = [
    {
        href: "/survey/create",
        title: "Create Survey",
        description: "Build a new survey with open-ended, multiple-choice, or rating questions.",
        icon: "📝",
        gradient: "from-[#ff6f97] to-[#8c7cff]",
    },
    // Future: list surveys, view responses, etc.
];

export default function SurveyHomePage() {
    return (
        <PageShell>
            <div className="mb-10">
                <h1 className="text-[34px] font-extrabold leading-tight text-[#090d1f]">Surveys</h1>
                <p className="mt-1 text-base text-slate-500">
                    Create and manage surveys to collect feedback from your users.
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {SURVEY_ACTIONS.map((action) => (
                    <Link
                        key={action.href}
                        href={action.href}
                        className="group rounded-3xl border border-slate-200 bg-white shadow-[0_18px_48px_rgba(28,31,55,.08)] overflow-hidden hover:shadow-[0_22px_70px_rgba(35,28,72,.14)] transition-shadow"
                    >
                        <div className={`h-2 w-full bg-gradient-to-r ${action.gradient}`} />
                        <div className="p-7">
                            <span className="text-4xl">{action.icon}</span>
                            <h2 className="mt-4 text-xl font-extrabold text-[#090d1f] group-hover:text-[#8c7cff] transition-colors">
                                {action.title}
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-slate-500">
                                {action.description}
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
