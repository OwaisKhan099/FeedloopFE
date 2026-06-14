"use client";

import { useEffect, useState } from "react";

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

type SurveyData = {
    id: number;
    key: string;
    title: string;
    description: string;
    questions: SurveyQuestion[];
    response_count: number | null;
    created_at: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const MAX_WORDS = 1500;

function countWords(text: string): number {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function SurveyRespond({ surveyKey }: { surveyKey: string }) {
    const [survey, setSurvey] = useState<SurveyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // answers: { [question_key]: answer_string }
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    // ---- Fetch survey on mount -----------------------------------------------
    useEffect(() => {
        fetch(`/api/surveys/${surveyKey}`)
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data?.message ?? "Survey not found");
                }
                const s = data as SurveyData;
                setSurvey(s);
                // Pre-init rating answers to "3"
                const init: Record<string, string> = {};
                s.questions.forEach((q) => {
                    if (q.question_type === "rating") init[q.key] = "3";
                });
                setAnswers(init);
            })
            .catch((err: unknown) => {
                setFetchError(err instanceof Error ? err.message : "Failed to load survey");
            })
            .finally(() => setLoading(false));
    }, [surveyKey]);

    // ---- Answer helpers -----------------------------------------------------
    function setAnswer(questionKey: string, value: string) {
        setAnswers((prev) => ({ ...prev, [questionKey]: value }));
    }

    // ---- Submit -------------------------------------------------------------
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitError(null);
        if (!survey) return;

        // Validate every question is answered
        for (const q of survey.questions) {
            if (!answers[q.key]?.trim()) {
                setSubmitError("Please answer all questions before submitting.");
                document.getElementById(`q-${q.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                return;
            }
        }

        const payload = {
            answers: survey.questions.map((q) => ({
                question_key: q.key,
                answer: answers[q.key],
            })),
        };

        setSubmitting(true);
        try {
            const res = await fetch(`/api/surveys/${surveyKey}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.message ?? "Failed to submit survey");
            }
            setSubmitted(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err: unknown) {
            setSubmitError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    }

    // ---- Loading ------------------------------------------------------------
    if (loading) {
        return (
            <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 rounded-full border-4 border-[#8c7cff] border-t-transparent animate-spin" />
                    <p className="text-sm text-slate-400 font-medium">Loading survey…</p>
                </div>
            </div>
        );
    }

    // ---- Error --------------------------------------------------------------
    if (fetchError || !survey) {
        return (
            <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center p-6">
                <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white shadow-[0_18px_48px_rgba(28,31,55,.08)] overflow-hidden text-center">
                    <div className="h-2 w-full bg-gradient-to-r from-[#ff6f97] to-[#8c7cff]" />
                    <div className="p-10">
                        <span className="text-5xl">😕</span>
                        <h1 className="mt-4 text-xl font-extrabold text-[#090d1f]">Survey Not Found</h1>
                        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                            {fetchError ?? "This survey link may be invalid or has expired."}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ---- Submitted ----------------------------------------------------------
    if (submitted) {
        return (
            <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center p-6">
                <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white shadow-[0_18px_48px_rgba(28,31,55,.08)] overflow-hidden text-center">
                    <div className="h-2 w-full bg-gradient-to-r from-[#ff6f97] to-[#8c7cff]" />
                    <div className="p-10">
                        <span className="text-5xl">🎉</span>
                        <h1 className="mt-4 text-xl font-extrabold text-[#090d1f]">Thank You!</h1>
                        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                            Your responses have been submitted successfully.
                            <br />
                            We appreciate your feedback!
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ---- Progress -----------------------------------------------------------
    const answeredCount = survey.questions.filter((q) => answers[q.key]?.trim()).length;
    const progressPct = survey.questions.length > 0
        ? Math.round((answeredCount / survey.questions.length) * 100)
        : 0;

    // ---- Form ---------------------------------------------------------------
    return (
        <div className="min-h-screen bg-[#f7f8fc] font-[Inter,Arial,sans-serif]">

            {/* Branding header */}
            <header className="sticky top-0 z-10 flex h-[58px] items-center justify-center border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
                <span className="flex items-center gap-2 text-[18px] font-black tracking-tight text-[#090d1f]">
                    <span className="relative block h-[24px] w-[24px] -rotate-6 rounded-[6px_6px_12px_6px] bg-gradient-to-br from-[#ff6f97] to-[#8c7cff]">
                        <span className="absolute -right-1.5 -top-1.5 rotate-[28deg] text-[14px] text-[#111229]">▲</span>
                    </span>
                    FEED<span className="text-[#ff6f97]">LOOP</span>
                </span>
            </header>

            <main className="mx-auto max-w-2xl px-4 py-10 pb-20">

                {/* Survey header card */}
                <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_18px_48px_rgba(28,31,55,.08)] overflow-hidden mb-6">
                    <div className="h-2 w-full bg-gradient-to-r from-[#ff6f97] to-[#8c7cff]" />
                    <div className="p-7">
                        <h1 className="text-2xl font-extrabold text-[#090d1f]">{survey.title}</h1>
                        {survey.description && (
                            <p className="mt-2 text-sm text-slate-500 leading-relaxed">{survey.description}</p>
                        )}

                        {/* Progress bar */}
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                    Your Progress
                                </span>
                                <span className="text-xs font-extrabold text-[#8c7cff]">
                                    {answeredCount} / {survey.questions.length} answered
                                </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#ff6f97] to-[#8c7cff] transition-all duration-500"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Questions form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {survey.questions.map((q, idx) => (
                        <div
                            key={q.key}
                            id={`q-${q.key}`}
                            className="rounded-3xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(28,31,55,.06)] overflow-hidden scroll-mt-20"
                        >
                            <div className="h-1.5 w-full bg-gradient-to-r from-[#ff6f97]/30 to-[#8c7cff]/30" />
                            <div className="p-6 sm:p-7">

                                {/* Question header */}
                                <div className="flex items-start gap-3 mb-5">
                                    <span className="mt-0.5 shrink-0 h-6 w-6 rounded-full bg-gradient-to-br from-[#ff6f97] to-[#8c7cff] text-white text-[11px] font-extrabold flex items-center justify-center">
                                        {idx + 1}
                                    </span>
                                    <p className="text-[15px] font-bold text-[#090d1f] leading-snug">{q.question}</p>
                                </div>

                                {/* Question input */}
                                {q.question_type === "open_ended" && (
                                    <OpenEndedInput
                                        value={answers[q.key] ?? ""}
                                        onChange={(v) => setAnswer(q.key, v)}
                                    />
                                )}
                                {q.question_type === "multiple_choice" && (
                                    <MCQInput
                                        options={q.options ?? []}
                                        value={answers[q.key] ?? ""}
                                        onChange={(v) => setAnswer(q.key, v)}
                                    />
                                )}
                                {q.question_type === "rating" && (
                                    <RatingInput
                                        value={answers[q.key] ?? "3"}
                                        onChange={(v) => setAnswer(q.key, v)}
                                    />
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Submit error */}
                    {submitError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                            {submitError}
                        </div>
                    )}

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-2xl bg-gradient-to-r from-[#ff6f97] to-[#8c7cff] py-4 text-sm font-extrabold text-white hover:opacity-90 disabled:opacity-60 transition shadow-[0_8px_24px_rgba(140,124,255,.3)]"
                    >
                        {submitting ? "Submitting…" : "Submit Survey"}
                    </button>
                </form>
            </main>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Open-ended input
// ---------------------------------------------------------------------------
function OpenEndedInput({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    const wordCount = countWords(value);
    const isOverLimit = wordCount > MAX_WORDS;

    return (
        <div className="flex flex-col gap-2">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Type your answer here…"
                rows={6}
                className="w-full rounded-xl border border-slate-200 bg-[#f7f8fc] px-4 py-3 text-sm text-[#090d1f] leading-relaxed outline-none resize-y focus:border-[#8c7cff] focus:ring-2 focus:ring-[#8c7cff]/20 transition placeholder:text-slate-400"
            />
            <div className="flex justify-end">
                <span className={`text-xs font-semibold transition ${isOverLimit ? "text-red-500" : "text-slate-400"}`}>
                    {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()} words
                </span>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Multiple-choice input
// ---------------------------------------------------------------------------
function MCQInput({
    options,
    value,
    onChange,
}: {
    options: string[];
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex flex-col gap-2.5">
            {options.map((opt, i) => {
                const selected = value === opt;
                return (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        className={`
                            flex items-center gap-3 w-full rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition
                            ${selected
                                ? "border-[#8c7cff] bg-gradient-to-r from-[#ff6f97]/10 to-[#8c7cff]/10 text-[#090d1f] shadow-sm"
                                : "border-slate-200 bg-[#f7f8fc] text-slate-600 hover:border-slate-300 hover:bg-white"
                            }
                        `}
                    >
                        {/* Radio dot */}
                        <span
                            className={`shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center transition
                                ${selected ? "border-[#8c7cff]" : "border-slate-300"}`}
                        >
                            {selected && <span className="h-2 w-2 rounded-full bg-[#8c7cff]" />}
                        </span>
                        {/* Option letter */}
                        <span className={`text-xs font-extrabold shrink-0 ${selected ? "text-[#8c7cff]" : "text-slate-400"}`}>
                            {String.fromCharCode(65 + i)}.
                        </span>
                        {opt}
                    </button>
                );
            })}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Rating input — drag slider (1–5) + clickable stars
// ---------------------------------------------------------------------------
function RatingInput({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    const rating = Math.min(5, Math.max(1, parseInt(value, 10) || 3));

    const LABELS: Record<number, string> = {
        1: "Poor",
        2: "Fair",
        3: "Good",
        4: "Very Good",
        5: "Excellent",
    };

    return (
        <div className="flex flex-col gap-5">

            {/* Stars (clickable) */}
            <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => onChange(String(star))}
                            className="text-3xl transition-transform hover:scale-110 focus:outline-none"
                            aria-label={`Rate ${star} out of 5`}
                        >
                            <span className={`transition ${star <= rating ? "text-[#ff6f97]" : "text-slate-200"}`}>
                                ★
                            </span>
                        </button>
                    ))}
                </div>
                <span className="ml-2 text-sm font-extrabold text-[#090d1f]">
                    {rating}/5
                    <span className="ml-1.5 text-xs font-semibold text-slate-400">{LABELS[rating]}</span>
                </span>
            </div>

            {/* Range slider */}
            <div className="px-1">
                <div className="relative flex items-center h-6">
                    {/* Track background */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-slate-100 pointer-events-none" />
                    {/* Filled track */}
                    <div
                        className="absolute top-1/2 left-0 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r from-[#ff6f97] to-[#8c7cff] pointer-events-none transition-all duration-200"
                        style={{ width: `${((rating - 1) / 4) * 100}%` }}
                    />
                    {/* Input */}
                    <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={rating}
                        onChange={(e) => onChange(e.target.value)}
                        className="relative w-full h-6 appearance-none bg-transparent cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:h-5
                            [&::-webkit-slider-thumb]:w-5
                            [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:bg-white
                            [&::-webkit-slider-thumb]:border-2
                            [&::-webkit-slider-thumb]:border-[#8c7cff]
                            [&::-webkit-slider-thumb]:shadow-md
                            [&::-moz-range-thumb]:h-5
                            [&::-moz-range-thumb]:w-5
                            [&::-moz-range-thumb]:rounded-full
                            [&::-moz-range-thumb]:bg-white
                            [&::-moz-range-thumb]:border-2
                            [&::-moz-range-thumb]:border-[#8c7cff]
                            [&::-moz-range-thumb]:shadow-md
                            [&::-moz-range-track]:bg-transparent"
                    />
                </div>

                {/* Tick labels */}
                <div className="flex justify-between mt-1.5 px-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                        <span
                            key={n}
                            className={`text-[11px] font-extrabold transition ${rating === n ? "text-[#8c7cff]" : "text-slate-300"}`}
                        >
                            {n}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
