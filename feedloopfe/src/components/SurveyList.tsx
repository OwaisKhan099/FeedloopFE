"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type QuestionType = "open_ended" | "multiple_choice" | "rating";

type SurveyQuestion = {
    id: number;
    key: string;
    question: string;
    question_type: QuestionType;
    options: string[] | null;
};

type Survey = {
    id: number;
    key: string;
    title: string;
    description: string;
    questions: SurveyQuestion[];
    response_count: number | null;
    created_at: string;
    updated_at: string | null;
};

type SurveysResponse = {
    surveys: Survey[];
    total_count: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const TYPE_LABELS: Record<QuestionType, string> = {
    open_ended: "Open Ended",
    multiple_choice: "Multiple Choice",
    rating: "Rating",
};

const TYPE_COLORS: Record<QuestionType, string> = {
    open_ended: "bg-blue-50 text-blue-600 border-blue-100",
    multiple_choice: "bg-purple-50 text-purple-600 border-purple-100",
    rating: "bg-pink-50 text-pink-600 border-pink-100",
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SurveyList() {
    const router = useRouter();

    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null); // holds the survey key that was just copied

    useEffect(() => {
        const accessToken = localStorage.getItem("access_token");
        const tokenType = localStorage.getItem("token_type");

        if (!accessToken) {
            router.replace("/signin");
            return;
        }

        fetch("/api/surveys/company", {
            method: "GET",
            headers: {
                Authorization: `${tokenType} ${accessToken}`,
            },
        })
            .then(async (res) => {
                if (res.status === 401) {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("token_type");
                    router.replace("/signin");
                    return;
                }
                const data = await res.json();
                if (!res.ok) throw new Error(data?.message ?? "Failed to load surveys");
                const body = data as SurveysResponse;
                setSurveys(body.surveys ?? []);
                setTotalCount(body.total_count ?? 0);
            })
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : "Something went wrong");
            })
            .finally(() => setLoading(false));
    }, [router]);

    function copySurveyLink(key: string) {
        const link = `${window.location.origin}/survey/${key}`;
        navigator.clipboard.writeText(link).then(() => {
            setCopied(key);
            setTimeout(() => setCopied(null), 2000);
        });
    }

    // ---- Loading ------------------------------------------------------------
    if (loading) {
        return (
            <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="rounded-3xl border border-slate-100 bg-white h-[120px] animate-pulse"
                        style={{ opacity: 1 - i * 0.2 }}
                    />
                ))}
            </div>
        );
    }

    // ---- Error --------------------------------------------------------------
    if (error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
                {error}
            </div>
        );
    }

    // ---- Empty state --------------------------------------------------------
    if (surveys.length === 0) {
        return (
            <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_18px_48px_rgba(28,31,55,.08)] overflow-hidden">
                <div className="h-2 w-full bg-gradient-to-r from-[#ff6f97] to-[#8c7cff]" />
                <div className="flex flex-col items-center text-center px-8 py-14">
                    <span className="text-5xl mb-4">📋</span>
                    <h3 className="text-lg font-extrabold text-[#090d1f]">No surveys yet</h3>
                    <p className="mt-2 text-sm text-slate-500 max-w-xs leading-relaxed">
                        You haven&apos;t created any surveys. Create your first one and share it with your users.
                    </p>
                    <Link
                        href="/survey/create"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6f97] to-[#8c7cff] px-6 py-2.5 text-sm font-extrabold text-white hover:opacity-90 transition"
                    >
                        + Create Survey
                    </Link>
                </div>
            </div>
        );
    }

    // ---- List ---------------------------------------------------------------
    return (
        <div className="flex flex-col gap-4">
            {/* Summary row */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                    Showing <span className="font-extrabold text-[#090d1f]">{surveys.length}</span> of{" "}
                    <span className="font-extrabold text-[#090d1f]">{totalCount}</span> survey{totalCount !== 1 ? "s" : ""}
                </p>
                <Link
                    href="/survey/create"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6f97] to-[#8c7cff] px-4 py-2 text-xs font-extrabold text-white hover:opacity-90 transition"
                >
                    + Create Survey
                </Link>
            </div>

            {/* Survey cards */}
            {surveys.map((survey) => (
                <div
                    key={survey.key}
                    className="rounded-3xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(28,31,55,.06)] overflow-hidden"
                >
                    <div className="h-1.5 w-full bg-gradient-to-r from-[#ff6f97] to-[#8c7cff]" />
                    <div className="p-6 sm:p-7">

                        {/* Top row: title + response count */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="min-w-0">
                                <h3 className="text-[17px] font-extrabold text-[#090d1f] leading-snug truncate">
                                    {survey.title}
                                </h3>
                                {survey.description && (
                                    <p className="mt-0.5 text-sm text-slate-500 line-clamp-2 leading-relaxed">
                                        {survey.description}
                                    </p>
                                )}
                            </div>

                            {/* Response count badge */}
                            <Link
                                href={{
                                    pathname: `/survey/${String(survey.id ?? survey.key)}/responses`,
                                    query: {
                                        id: String(survey.id),
                                        key: survey.key,
                                        responseCount: String(survey.response_count ?? 0),
                                        title: survey.title,
                                        description: survey.description ?? "",
                                    },
                                }}
                                className="shrink-0 flex flex-col items-center rounded-2xl bg-gradient-to-br from-[#ff6f97]/10 to-[#8c7cff]/10 border border-[#8c7cff]/20 px-4 py-2.5 text-center hover:from-[#ff6f97]/20 hover:to-[#8c7cff]/20 transition"
                                title="View all responses"
                            >
                                <span className="text-xl font-extrabold text-[#090d1f]">
                                    {survey.response_count ?? 0}
                                </span>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 leading-none mt-0.5">
                                    {(survey.response_count ?? 0) === 1 ? "Response" : "Responses"}
                                </span>
                            </Link>
                        </div>

                        {/* Meta: questions + date */}
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="text-xs text-slate-400 font-medium">
                                📅 {formatDate(survey.created_at)}
                            </span>
                            <span className="text-slate-200">•</span>
                            <span className="text-xs text-slate-400 font-medium">
                                {survey.questions.length} question{survey.questions.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {/* Question type chips */}
                        <div className="flex flex-wrap gap-1.5 mb-5">
                            {survey.questions.map((q) => (
                                <span
                                    key={q.key}
                                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${TYPE_COLORS[q.question_type]}`}
                                >
                                    {TYPE_LABELS[q.question_type]}
                                </span>
                            ))}
                        </div>

                        {/* Actions: survey link + copy button */}
                        <div className="flex items-center gap-3 rounded-xl bg-[#f7f8fc] border border-slate-100 px-4 py-2.5">
                            <span className="flex-1 text-xs font-mono text-slate-500 truncate">
                                {typeof window !== "undefined"
                                    ? `${window.location.origin}/survey/${survey.key}`
                                    : `/survey/${survey.key}`}
                            </span>
                            <button
                                type="button"
                                onClick={() => copySurveyLink(survey.key)}
                                className="shrink-0 rounded-lg bg-gradient-to-r from-[#ff6f97] to-[#8c7cff] px-3 py-1.5 text-[11px] font-extrabold text-white hover:opacity-90 transition"
                            >
                                {copied === survey.key ? "Copied!" : "Copy Link"}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
