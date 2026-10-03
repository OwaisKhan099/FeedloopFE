"use client";

import PageShell from "@/components/PageShell";
import SurveyList from "@/components/SurveyList";

export default function SurveyHomePage() {
    return (
        <PageShell>
            <div className="mb-10">
                <h1 className="text-[34px] font-extrabold leading-tight text-[#090d1f]">Surveys</h1>
                <p className="mt-1 text-base text-slate-500">
                    Create and manage surveys to collect feedback from your users.
                </p>
            </div>

            <SurveyList />
        </PageShell>
    );
}

