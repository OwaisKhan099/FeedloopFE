"use client";

import PageShell from "@/components/PageShell";
import CreateSurvey from "@/components/CreateSurvey";

export default function CreateSurveyPage() {
    return (
        <PageShell>
            <div className="mb-10">
                <h1 className="text-[34px] font-extrabold leading-tight text-[#090d1f]">Create Survey</h1>
                <p className="mt-1 text-base text-slate-500">
                    Build your survey by adding questions. Share the link with your users when you&apos;re done.
                </p>
            </div>

            <CreateSurvey />
        </PageShell>
    );
}
