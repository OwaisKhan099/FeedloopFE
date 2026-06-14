"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type QuestionType = "open_ended" | "multiple_choice" | "rating";

type Question = {
    id: string; // local-only key for React list rendering
    question: string;
    question_type: QuestionType;
    options: string[] | null;
};

type CreatedSurvey = {
    id: number;
    key: string;
    title: string;
    description: string;
    questions: {
        id: number;
        key: string;
        question: string;
        question_type: QuestionType;
        options: string[] | null;
    }[];
    created_at: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeId() {
    return Math.random().toString(36).slice(2);
}

function emptyQuestion(): Question {
    return { id: makeId(), question: "", question_type: "open_ended", options: null };
}

const TYPE_LABELS: Record<QuestionType, string> = {
    open_ended: "Open Ended",
    multiple_choice: "Multiple Choice",
    rating: "Rating",
};

const TYPE_DESCRIPTIONS: Record<QuestionType, string> = {
    open_ended: "Free-text answer from respondent",
    multiple_choice: "Respondent picks from a list of options",
    rating: "Respondent gives a numeric star rating",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CreateSurvey() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [created, setCreated] = useState<CreatedSurvey | null>(null);
    const [copied, setCopied] = useState(false);

    // ---- Question helpers --------------------------------------------------

    function updateQuestion(id: string, patch: Partial<Question>) {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.id !== id) return q;
                const updated = { ...q, ...patch };
                // When type changes away from multiple_choice, clear options
                if (patch.question_type && patch.question_type !== "multiple_choice") {
                    updated.options = null;
                }
                // When type changes to multiple_choice, seed one empty option
                if (patch.question_type === "multiple_choice" && !updated.options) {
                    updated.options = [""];
                }
                return updated;
            })
        );
    }

    function addQuestion() {
        setQuestions((prev) => [...prev, emptyQuestion()]);
    }

    function removeQuestion(id: string) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
    }

    function addOption(questionId: string) {
        setQuestions((prev) =>
            prev.map((q) =>
                q.id === questionId
                    ? { ...q, options: [...(q.options ?? []), ""] }
                    : q
            )
        );
    }

    function updateOption(questionId: string, index: number, value: string) {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.id !== questionId || !q.options) return q;
                const opts = [...q.options];
                opts[index] = value;
                return { ...q, options: opts };
            })
        );
    }

    function removeOption(questionId: string, index: number) {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.id !== questionId || !q.options) return q;
                const opts = q.options.filter((_, i) => i !== index);
                return { ...q, options: opts.length > 0 ? opts : [""] };
            })
        );
    }

    // ---- Submit ------------------------------------------------------------

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        // Basic validation
        if (!title.trim()) {
            setError("Survey title is required.");
            return;
        }
        if (questions.length === 0) {
            setError("Add at least one question.");
            return;
        }
        for (const q of questions) {
            if (!q.question.trim()) {
                setError("All questions must have text.");
                return;
            }
            if (q.question_type === "multiple_choice") {
                const filled = (q.options ?? []).filter((o) => o.trim());
                if (filled.length < 2) {
                    setError("Multiple-choice questions need at least 2 options.");
                    return;
                }
            }
        }

        const accessToken = localStorage.getItem("access_token");
        const tokenType = localStorage.getItem("token_type");
        if (!accessToken) {
            router.replace("/signin");
            return;
        }

        const payload = {
            title: title.trim(),
            description: description.trim(),
            questions: questions.map(({ question, question_type, options }) => ({
                question,
                question_type,
                // Only send non-empty options for multiple_choice; otherwise null
                options:
                    question_type === "multiple_choice"
                        ? (options ?? []).filter((o) => o.trim())
                        : null,
            })),
        };

        setSubmitting(true);
        try {
            const res = await fetch("/api/surveys/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `${tokenType} ${accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.status === 401) {
                localStorage.removeItem("access_token");
                localStorage.removeItem("token_type");
                router.replace("/signin");
                return;
            }

            if (!res.ok) {
                throw new Error(data?.message ?? "Failed to create survey.");
            }

            setCreated(data as CreatedSurvey);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setSubmitting(false);
        }
    }

    // ---- Copy link ---------------------------------------------------------

    function handleCopy(link: string) {
        navigator.clipboard.writeText(link).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    // ---- Success state -----------------------------------------------------
    if (created) {
        const surveyLink = `${typeof window !== "undefined" ? window.location.origin : ""}/survey/${created.key}`;
        return (
            <div className="max-w-2xl mx-auto">
                <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_18px_48px_rgba(28,31,55,.08)] p-8">
                    {/* Success header */}
                    <div className="flex flex-col items-center text-center mb-8">
                        <span className="text-5xl mb-4">🎉</span>
                        <h2 className="text-2xl font-extrabold text-[#090d1f]">Survey Created!</h2>
                        <p className="mt-2 text-slate-500 text-sm">
                            Your survey <span className="font-bold text-[#090d1f]">{created.title}</span> is ready.
                            Share the link below with your users.
                        </p>
                    </div>

                    {/* Shareable link */}
                    <div className="rounded-2xl bg-[#f7f8fc] border border-slate-200 p-4 mb-6">
                        <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                            Survey Link
                        </p>
                        <div className="flex items-center gap-3">
                            <span className="flex-1 text-sm font-mono text-[#090d1f] break-all">
                                {surveyLink}
                            </span>
                            <button
                                onClick={() => handleCopy(surveyLink)}
                                className="shrink-0 rounded-xl bg-gradient-to-r from-[#ff6f97] to-[#8c7cff] px-4 py-2 text-xs font-extrabold text-white hover:opacity-90 transition"
                            >
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="mb-6">
                        <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                            Questions ({created.questions.length})
                        </p>
                        <div className="flex flex-col gap-2">
                            {created.questions.map((q, i) => (
                                <div key={q.id} className="flex items-start gap-3 rounded-xl bg-[#f7f8fc] border border-slate-100 px-4 py-3">
                                    <span className="mt-0.5 text-xs font-extrabold text-slate-400 shrink-0">
                                        Q{i + 1}
                                    </span>
                                    <span className="flex-1 text-sm text-[#090d1f]">{q.question}</span>
                                    <span className="shrink-0 rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-500">
                                        {TYPE_LABELS[q.question_type]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setCreated(null);
                                setTitle("");
                                setDescription("");
                                setQuestions([emptyQuestion()]);
                            }}
                            className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-extrabold text-[#090d1f] hover:bg-[#f7f8fc] transition"
                        >
                            Create Another
                        </button>
                        <button
                            onClick={() => router.push("/survey")}
                            className="flex-1 rounded-2xl bg-gradient-to-r from-[#ff6f97] to-[#8c7cff] py-3 text-sm font-extrabold text-white hover:opacity-90 transition"
                        >
                            All Surveys
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ---- Form --------------------------------------------------------------
    return (
        <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                {/* Survey details card */}
                <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_18px_48px_rgba(28,31,55,.08)] overflow-hidden">
                    <div className="h-2 w-full bg-gradient-to-r from-[#ff6f97] to-[#8c7cff]" />
                    <div className="p-7 flex flex-col gap-5">
                        <div>
                            <h2 className="text-xl font-extrabold text-[#090d1f]">Survey Details</h2>
                            <p className="mt-1 text-sm text-slate-500">Give your survey a title and optional description.</p>
                        </div>

                        {/* Title */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                Title <span className="text-[#ff6f97]">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Customer Feedback Survey"
                                className="rounded-xl border border-slate-200 bg-[#f7f8fc] px-4 py-3 text-sm text-[#090d1f] outline-none focus:border-[#8c7cff] focus:ring-2 focus:ring-[#8c7cff]/20 transition"
                            />
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g. Please share your experience with us"
                                rows={3}
                                className="rounded-xl border border-slate-200 bg-[#f7f8fc] px-4 py-3 text-sm text-[#090d1f] outline-none resize-none focus:border-[#8c7cff] focus:ring-2 focus:ring-[#8c7cff]/20 transition"
                            />
                        </div>
                    </div>
                </div>

                {/* Questions */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-extrabold text-[#090d1f]">
                            Questions <span className="text-slate-400 font-semibold text-base">({questions.length})</span>
                        </h2>
                        <button
                            type="button"
                            onClick={addQuestion}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6f97] to-[#8c7cff] px-4 py-2 text-xs font-extrabold text-white hover:opacity-90 transition"
                        >
                            <span className="text-base leading-none">+</span> Add Question
                        </button>
                    </div>

                    {questions.map((q, index) => (
                        <QuestionCard
                            key={q.id}
                            question={q}
                            index={index}
                            canRemove={questions.length > 1}
                            onUpdate={(patch) => updateQuestion(q.id, patch)}
                            onRemove={() => removeQuestion(q.id)}
                            onAddOption={() => addOption(q.id)}
                            onUpdateOption={(i, v) => updateOption(q.id, i, v)}
                            onRemoveOption={(i) => removeOption(q.id, i)}
                        />
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                        {error}
                    </p>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-2xl bg-gradient-to-r from-[#ff6f97] to-[#8c7cff] py-4 text-sm font-extrabold text-white hover:opacity-90 disabled:opacity-60 transition"
                >
                    {submitting ? "Creating Survey…" : "Create Survey"}
                </button>
            </form>
        </div>
    );
}

// ---------------------------------------------------------------------------
// QuestionCard sub-component
// ---------------------------------------------------------------------------
type QuestionCardProps = {
    question: Question;
    index: number;
    canRemove: boolean;
    onUpdate: (patch: Partial<Question>) => void;
    onRemove: () => void;
    onAddOption: () => void;
    onUpdateOption: (index: number, value: string) => void;
    onRemoveOption: (index: number) => void;
};

function QuestionCard({
    question,
    index,
    canRemove,
    onUpdate,
    onRemove,
    onAddOption,
    onUpdateOption,
    onRemoveOption,
}: QuestionCardProps) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(28,31,55,.06)] overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#ff6f97]/40 to-[#8c7cff]/40" />
            <div className="p-6 flex flex-col gap-4">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Question {index + 1}
                    </span>
                    {canRemove && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="text-xs font-extrabold text-red-400 hover:text-red-600 transition"
                        >
                            Remove
                        </button>
                    )}
                </div>

                {/* Question text */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                        Question Text <span className="text-[#ff6f97]">*</span>
                    </label>
                    <input
                        type="text"
                        value={question.question}
                        onChange={(e) => onUpdate({ question: e.target.value })}
                        placeholder="Enter your question…"
                        className="rounded-xl border border-slate-200 bg-[#f7f8fc] px-4 py-3 text-sm text-[#090d1f] outline-none focus:border-[#8c7cff] focus:ring-2 focus:ring-[#8c7cff]/20 transition"
                    />
                </div>

                {/* Type selector */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                        Question Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {(Object.keys(TYPE_LABELS) as QuestionType[]).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => onUpdate({ question_type: type })}
                                className={`
                                    rounded-xl border px-3 py-3 text-left transition
                                    ${question.question_type === type
                                        ? "border-[#8c7cff] bg-gradient-to-br from-[#ff6f97]/10 to-[#8c7cff]/10 shadow-sm"
                                        : "border-slate-200 bg-[#f7f8fc] hover:border-slate-300"
                                    }
                                `}
                            >
                                <p className={`text-xs font-extrabold ${question.question_type === type ? "text-[#8c7cff]" : "text-[#090d1f]"}`}>
                                    {TYPE_LABELS[type]}
                                </p>
                                <p className="mt-0.5 text-[10px] text-slate-400 leading-tight">
                                    {TYPE_DESCRIPTIONS[type]}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* MCQ options */}
                {question.question_type === "multiple_choice" && (
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                            Options <span className="text-[#ff6f97]">*</span>
                        </label>
                        <div className="flex flex-col gap-2">
                            {(question.options ?? []).map((opt, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-xs font-extrabold text-slate-400 w-5 text-right shrink-0">
                                        {String.fromCharCode(65 + i)}.
                                    </span>
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => onUpdateOption(i, e.target.value)}
                                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                        className="flex-1 rounded-xl border border-slate-200 bg-[#f7f8fc] px-3 py-2.5 text-sm text-[#090d1f] outline-none focus:border-[#8c7cff] focus:ring-2 focus:ring-[#8c7cff]/20 transition"
                                    />
                                    {(question.options ?? []).length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => onRemoveOption(i)}
                                            className="text-slate-300 hover:text-red-400 transition text-lg leading-none"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={onAddOption}
                            className="mt-1 self-start rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-extrabold text-slate-400 hover:border-[#8c7cff] hover:text-[#8c7cff] transition"
                        >
                            + Add Option
                        </button>
                    </div>
                )}

                {/* Rating preview */}
                {question.question_type === "rating" && (
                    <div className="rounded-xl bg-[#f7f8fc] border border-slate-100 px-4 py-3">
                        <p className="text-xs text-slate-400 mb-2">Preview — respondents will see:</p>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className="text-2xl text-slate-300">★</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Open ended preview */}
                {question.question_type === "open_ended" && (
                    <div className="rounded-xl bg-[#f7f8fc] border border-slate-100 px-4 py-3">
                        <p className="text-xs text-slate-400 mb-2">Preview — respondents will see:</p>
                        <div className="h-12 rounded-lg border border-dashed border-slate-200 bg-white" />
                    </div>
                )}
            </div>
        </div>
    );
}
