"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type SurveyResponse = {
    id?: number | string;
    question_id?: number | string;
    question?: string;
    answer?: unknown;
    [key: string]: unknown;
};

type ResponsesApiBody = {
    responses?: SurveyResponse[];
    total_count?: number;
    survey_title?: string;
    survey_description?: string;
    message?: string;
    detail?: string;
    attempted_identifiers?: string[];
    backend?: unknown;
    [key: string]: unknown;
};

function getAnswerValue(answer: unknown): string {
    const value = answer && typeof answer === "object" && "value" in answer
        ? answer.value
        : answer;

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    return "No answer provided";
}

export default function SurveyResponses({ surveyId }: { surveyId: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fallbackSurveyId = searchParams.get("id") ?? searchParams.get("key");
    const expectedResponseCount = Number(searchParams.get("responseCount") ?? "0");
    const titleFromQuery = searchParams.get("title");
    const descriptionFromQuery = searchParams.get("description");

    const [responses, setResponses] = useState<SurveyResponse[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [surveyTitle, setSurveyTitle] = useState<string | null>(null);
    const [surveyDescription, setSurveyDescription] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const accessToken = localStorage.getItem("access_token");
        const tokenType = localStorage.getItem("token_type");

        if (!accessToken) {
            router.replace("/signin");
            return;
        }

        async function loadResponses() {
            const query = fallbackSurveyId
                ? `?fallbackId=${encodeURIComponent(fallbackSurveyId)}`
                : "";

            const res = await fetch(`/api/surveys/my-survey-responses/${surveyId}${query}`, {
                method: "GET",
                headers: { Authorization: `${tokenType ?? "bearer"} ${accessToken}` },
            });

            const data = (await res.json()) as ResponsesApiBody | SurveyResponse[];

            if (res.status === 401) {
                localStorage.removeItem("access_token");
                localStorage.removeItem("token_type");
                router.replace("/signin");
                return;
            }

            if (res.status === 404) {
                if (expectedResponseCount > 0) {
                    const attempted = Array.isArray((data as ResponsesApiBody).attempted_identifiers)
                        ? (data as ResponsesApiBody).attempted_identifiers?.join(", ")
                        : "unknown";
                    setError(
                        `Unable to load responses for this survey. Tried identifiers: ${attempted}.`
                    );
                    return;
                }

                setResponses([]);
                setTotalCount(0);
                if (titleFromQuery) {
                    setSurveyTitle(titleFromQuery);
                }
                if (descriptionFromQuery) {
                    setSurveyDescription(descriptionFromQuery);
                }
                return;
            }

            if (!res.ok) {
                throw new Error(
                    (data as ResponsesApiBody)?.message ??
                    (data as ResponsesApiBody)?.detail ??
                    "Failed to load responses"
                );
            }

            if (Array.isArray(data)) {
                setResponses(data);
                setTotalCount(data.length);
                return;
            }

            const items = Array.isArray(data.responses) ? data.responses : [];
            setResponses(items);
            setTotalCount(typeof data.total_count === "number" ? data.total_count : items.length);
            if (typeof data.survey_title === "string" && data.survey_title.trim()) {
                setSurveyTitle(data.survey_title);
            }
            if (typeof data.survey_description === "string" && data.survey_description.trim()) {
                setSurveyDescription(data.survey_description);
            }
        }

        loadResponses()
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : "Something went wrong");
            })
            .finally(() => setLoading(false));
    }, [descriptionFromQuery, expectedResponseCount, fallbackSurveyId, router, surveyId, titleFromQuery]);

    const title = useMemo(
        () => surveyTitle ?? titleFromQuery ?? `Survey #${surveyId}`,
        [surveyId, surveyTitle, titleFromQuery]
    );
    const description = useMemo(
        () => surveyDescription ?? descriptionFromQuery,
        [surveyDescription, descriptionFromQuery]
    );
    const groupedResponses = useMemo(() => {
        const groups = new Map<string, {
            question: string;
            answers: { key: string; value: string }[];
        }>();

        responses.forEach((response, index) => {
            const question = response.question?.trim() || `Question ${index + 1}`;
            const groupKey = response.question_id !== undefined
                ? `id:${response.question_id}`
                : `text:${question.toLowerCase()}`;
            let group = groups.get(groupKey);

            if (!group) {
                group = { question, answers: [] };
                groups.set(groupKey, group);
            }

            group.answers.push({
                key: `${response.id ?? index}-${index}`,
                value: getAnswerValue(response.answer),
            });
        });

        return Array.from(groups, ([key, group]) => ({ key, ...group }));
    }, [responses]);

    if (loading) {
        return (
            <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="rounded-3xl border border-slate-100 bg-white h-[100px] animate-pulse"
                        style={{ opacity: 1 - i * 0.2 }}
                    />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(28,31,55,.06)]">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Survey Responses</p>
                <h1 className="mt-1 text-2xl font-extrabold text-[#090d1f]">{title}</h1>
                {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
                <p className="mt-2 text-sm text-slate-500">
                    <span className="font-extrabold text-[#090d1f]">{totalCount}</span> total response{totalCount !== 1 ? "s" : ""}
                </p>
            </div>

            {responses.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white px-8 py-14 text-center shadow-[0_8px_24px_rgba(28,31,55,.06)]">
                    <p className="text-base font-bold text-slate-700">No responses yet</p>
                    <p className="mt-1 text-sm text-slate-500">Responses submitted by users will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {groupedResponses.map((group) => (
                        <div
                            key={group.key}
                            className="rounded-3xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(28,31,55,.06)] overflow-hidden"
                        >
                            <div className="h-1.5 w-full bg-gradient-to-r from-[#ff6f97] to-[#8c7cff]" />
                            <div className="p-5 sm:p-6">
                                <h2 className="text-sm font-semibold text-slate-700">{group.question}</h2>
                                <div className="mt-2 space-y-2">
                                    {group.answers.map((answer) => (
                                        <p key={answer.key} className="whitespace-pre-wrap text-sm text-slate-500">
                                            {answer.value}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}